"""LLM service backed by Groq (OpenAI-compatible API).

Resilience, in two layers:
  * MODEL chain (GROQ_MODELS): if a model is rate-limited on every key, too large, or
    unavailable, the next model is tried.
  * KEY pool (GROQ_API_KEYS, up to 10): round-robin start; a failing key is skipped for a
    cooldown. Free-tier limits are per model, so cooldowns are tracked per (key, model).
The module keeps its old name/interface (ask, chat, parse_json) so routes don't change.
"""
import json, re, logging, time, itertools, threading
import httpx
from ..config import settings

log = logging.getLogger("groq")
URL = "https://api.groq.com/openai/v1/chat/completions"

_lock = threading.Lock()
_cooldown: dict[tuple[str, str], float] = {}   # (key, model) -> unix time until skipped
_rr = itertools.count()

def _key_order(model: str) -> list[str]:
    keys = settings.groq_keys
    if not keys:
        if settings.groq_keys_invalid:
            raise RuntimeError("Groq API keys contain invalid (non-ASCII) characters; re-paste GROQ_API_KEYS on the backend")
        raise RuntimeError("No Groq API keys set (GROQ_API_KEYS or GROQ_API_KEY_1..10)")
    with _lock:
        start = next(_rr) % len(keys)
        rotated = keys[start:] + keys[:start]
        now = time.time()
        return [k for k in rotated if _cooldown.get((k, model), 0) <= now]

def _mark(key: str, model: str, seconds: float):
    with _lock:
        _cooldown[(key, model)] = time.time() + seconds

def _to_content(user):
    """Convert Anthropic-style content blocks to OpenAI/Groq format."""
    if isinstance(user, str):
        return user, False
    parts, has_img = [], False
    for b in user:
        if b.get("type") == "image":
            s = b["source"]
            parts.append({"type": "image_url", "image_url": {"url": f"data:{s['media_type']};base64,{s['data']}"}})
            has_img = True
        else:
            parts.append({"type": "text", "text": b.get("text", "")})
    return parts, has_img

def _errmsg(model: str, r) -> str:
    try:
        return f"{model}: " + str(r.json().get("error", {}).get("message", r.text))[:240]
    except Exception:
        return f"{model}: {str(r.text)[:240]}"

def complete(system: str, messages: list, max_tokens: int, json_mode: bool = False) -> tuple[str, str]:
    """Returns (text, model_used)."""
    msgs = [{"role": "system", "content": system}]
    vision = False
    for m in messages:
        c, img = _to_content(m["content"])
        vision = vision or img
        msgs.append({"role": m["role"], "content": c})
    if vision:
        if not settings.groq_vision_model:
            raise RuntimeError("Image input needs a vision model: set GROQ_VISION_MODEL on the backend")
        models = [settings.groq_vision_model]
    else:
        models = settings.groq_model_list or ["openai/gpt-oss-20b"]
    max_tokens = min(max_tokens, settings.groq_max_tokens)

    last, bad_request, truncated = "unknown error", None, False
    for model in models:
        payload = {"model": model, "messages": msgs, "max_tokens": max_tokens, "temperature": 0.4}
        if model.startswith("openai/gpt-oss"):
            payload["reasoning_effort"] = "low"        # reasoning tokens count against max_tokens; keep them small
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        for key in _key_order(model):
            try:
                r = httpx.post(URL, json=payload, headers={"Authorization": f"Bearer {key}"}, timeout=120)
            except UnicodeError:
                last = f"{model}: key contains invalid characters"
                _mark(key, model, 3600)
                continue
            except httpx.HTTPError as e:
                last = f"{model}: {type(e).__name__}"
                _mark(key, model, 15)
                continue
            if r.status_code == 200:
                ch = r.json()["choices"][0]
                text = ch["message"].get("content") or ""
                if ch.get("finish_reason") == "length" or not text.strip():
                    last = f"{model}: reply cut off or empty"
                    log.warning("groq %s: finish_reason=%s, %d chars", model, ch.get("finish_reason"), len(text))
                    truncated = True
                    break                              # try the next model
                return text, model
            last = f"{model}: HTTP {r.status_code}"
            log.warning("groq %s key ...%s -> %s %s", model, key[-4:], r.status_code, r.text[:160])
            if r.status_code == 429:
                try:
                    wait = float(r.headers.get("retry-after", 30))
                except ValueError:
                    wait = 30
                _mark(key, model, min(max(wait, 5), 300))
            elif r.status_code in (401, 403):
                _mark(key, model, 3600)            # bad/revoked key
            elif r.status_code >= 500:
                _mark(key, model, 15)
            elif r.status_code == 400 and payload.get("response_format"):
                payload.pop("response_format")        # model doesn't support JSON mode: retry without it
                try:
                    r2 = httpx.post(URL, json=payload, headers={"Authorization": f"Bearer {key}"}, timeout=120)
                    if r2.status_code == 200:
                        ch = r2.json()["choices"][0]
                        if ch.get("finish_reason") != "length" and (ch["message"].get("content") or "").strip():
                            return ch["message"]["content"], model
                    else:
                        r = r2                         # the retry's error is the more informative one
                except httpx.HTTPError:
                    pass
                bad_request = _errmsg(model, r)
                break
            elif r.status_code in (400, 404, 413, 422):
                # request/model-level problem: other keys give the same answer, so try the next model
                bad_request = _errmsg(model, r)
                break
            else:
                _mark(key, model, 30)
    if truncated and not bad_request:
        raise ValueError("Model reply was cut off or empty; ask for a shorter output or raise GROQ_MAX_TOKENS")
    if bad_request and last.endswith(("400", "404", "413", "422")):
        raise ValueError(f"Groq rejected the request: {bad_request}")
    raise RuntimeError(f"All Groq keys/models failed or are rate-limited (last: {last}). Try again shortly.")

def diagnose() -> dict:
    """Tiny live test of every configured model, so setup problems are visible (no key material returned)."""
    keys = settings.groq_keys
    out = {"keys_configured": len(keys), "keys_invalid_skipped": settings.groq_keys_invalid, "models": []}
    if not keys:
        return out
    for model in settings.groq_model_list:
        payload = {"model": model, "messages": [{"role": "user", "content": "Reply with the single word OK."}], "max_tokens": 200}
        if model.startswith("openai/gpt-oss"):
            payload["reasoning_effort"] = "low"
        try:
            r = httpx.post(URL, json=payload, headers={"Authorization": f"Bearer {keys[0]}"}, timeout=40)
            if r.status_code == 200:
                ch = r.json()["choices"][0]
                out["models"].append({"model": model, "ok": True, "finish_reason": ch.get("finish_reason"),
                                      "reply": (ch["message"].get("content") or "")[:40]})
            else:
                try:
                    msg = r.json().get("error", {}).get("message", r.text)
                except Exception:
                    msg = r.text
                out["models"].append({"model": model, "ok": False, "status": r.status_code, "error": str(msg)[:240]})
        except httpx.HTTPError as e:
            out["models"].append({"model": model, "ok": False, "error": type(e).__name__})
    return out

def _cool(status: int, headers, key: str, model: str):
    """Cooldown policy shared by the streaming path."""
    if status == 429:
        try:
            wait = float(headers.get("retry-after", 30))
        except ValueError:
            wait = 30
        _mark(key, model, min(max(wait, 5), 300))
    elif status in (401, 403):
        _mark(key, model, 3600)
    elif status >= 500:
        _mark(key, model, 15)
    else:
        _mark(key, model, 30)

def stream_chat(system: str, messages: list, max_tokens: int = 1200):
    """Yield reply text as it is generated. Fallback across models/keys happens only BEFORE the first token;
    after that an interruption raises RuntimeError. Raises RuntimeError if no model/key could start."""
    msgs = [{"role": "system", "content": system}] + [{"role": m["role"], "content": m["content"]} for m in messages]
    models = settings.groq_chat_model_list or settings.groq_model_list or ["openai/gpt-oss-20b"]
    max_tokens = min(max_tokens, settings.groq_max_tokens)
    last = "unknown error"
    for model in models:
        payload = {"model": model, "messages": msgs, "max_tokens": max_tokens, "temperature": 0.5, "stream": True}
        if model.startswith("openai/gpt-oss"):
            payload["reasoning_effort"] = "low"
        for key in _key_order(model):
            started = False
            try:
                with httpx.stream("POST", URL, json=payload, headers={"Authorization": f"Bearer {key}"}, timeout=httpx.Timeout(60.0)) as r:
                    if r.status_code != 200:
                        r.read()
                        last = f"{model}: HTTP {r.status_code}"
                        log.warning("groq stream %s key ...%s -> %s", model, key[-4:], r.status_code)
                        _cool(r.status_code, r.headers, key, model)
                        if r.status_code in (400, 404, 413, 422):
                            break                      # model-level problem: next model
                        continue
                    for line in r.iter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if data == "[DONE]":
                            return
                        try:
                            delta = json.loads(data)["choices"][0]["delta"].get("content")
                        except Exception:
                            continue
                        if delta:
                            started = True
                            yield delta
                    if started:
                        return
                    last = f"{model}: empty reply"
                    break
            except UnicodeError:
                _mark(key, model, 3600)
                last = f"{model}: key contains invalid characters"
            except httpx.HTTPError as e:
                if started:
                    raise RuntimeError("The connection to the AI provider was interrupted") from e
                last = f"{model}: {type(e).__name__}"
                _mark(key, model, 15)
    raise RuntimeError(f"All Groq keys/models failed or are rate-limited (last: {last}). Try again shortly.")

def ask(system: str, user, search: bool = False, max_tokens: int = 4000) -> str:
    # Groq has no web_search tool; `search` is accepted but ignored.
    return complete(system, [{"role": "user", "content": user}], max_tokens)[0]

def ask_ex(system: str, user, max_tokens: int = 4000) -> tuple[str, str]:
    """JSON-mode call used by the structured AI modules."""
    return complete(system, [{"role": "user", "content": user}], max_tokens, json_mode=True)

def chat(system: str, messages: list, max_tokens: int = 2000) -> str:
    return complete(system, messages, max_tokens)[0]

def _balanced(t: str):
    """First balanced {...} or [...] block in t, or None."""
    for i, ch in enumerate(t):
        if ch in "{[":
            close, depth, in_str, esc = "}" if ch == "{" else "]", 0, False, False
            for j in range(i, len(t)):
                c = t[j]
                if in_str:
                    if esc: esc = False
                    elif c == "\\": esc = True
                    elif c == '"': in_str = False
                elif c == '"': in_str = True
                elif c == ch: depth += 1
                elif c == close:
                    depth -= 1
                    if depth == 0:
                        return t[i:j + 1]
            return None
    return None

def parse_json(text: str):
    t = re.sub(r"<think>.*?</think>", "", text, flags=re.S).strip()          # some models emit reasoning tags
    t = re.sub(r"^```(?:json)?|```$", "", t, flags=re.M).strip()
    for cand in (t, _balanced(t)):
        if not cand:
            continue
        try:
            v = json.loads(cand)
            return {"items": v} if isinstance(v, list) else v               # bare arrays -> {"items": [...]}
        except Exception:
            pass
    raise ValueError("Model did not return JSON")
