"""LLM service backed by Groq (OpenAI-compatible API) with multi-key fallback.

The module keeps its old name/interface (ask, chat, parse_json) so routes don't change.
Keys are tried in round-robin order; a key that fails (rate limit, auth, quota, 5xx,
network) is put on a short cooldown and the next key is tried automatically.
"""
import json, re, logging, time, itertools, threading
import httpx
from ..config import settings

log = logging.getLogger("groq")
URL = "https://api.groq.com/openai/v1/chat/completions"

_lock = threading.Lock()
_cooldown: dict[str, float] = {}   # key -> unix time until which it is skipped
_rr = itertools.count()

def _order() -> list[str]:
    keys = settings.groq_keys
    if not keys:
        raise RuntimeError("No Groq API keys set (GROQ_API_KEYS or GROQ_API_KEY_1..10)")
    with _lock:
        start = next(_rr) % len(keys)
        rotated = keys[start:] + keys[:start]
        now = time.time()
        live = [k for k in rotated if _cooldown.get(k, 0) <= now]
    # if every key is cooling down, still try them all (soonest-to-recover first)
    return live or sorted(rotated, key=lambda k: _cooldown.get(k, 0))

def _mark(key: str, seconds: float):
    with _lock:
        _cooldown[key] = time.time() + seconds

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

def _complete(system: str, messages: list, max_tokens: int, model: str | None = None) -> str:
    msgs = [{"role": "system", "content": system}]
    vision = False
    for m in messages:
        c, img = _to_content(m["content"])
        vision = vision or img
        msgs.append({"role": m["role"], "content": c})
    payload = {"model": model or (settings.groq_vision_model if vision else settings.groq_model),
               "messages": msgs, "max_tokens": max_tokens, "temperature": 0.4}
    last = "unknown error"
    for key in _order():
        try:
            r = httpx.post(URL, json=payload, headers={"Authorization": f"Bearer {key}"}, timeout=120)
        except httpx.HTTPError as e:
            last = type(e).__name__
            log.warning("groq key ...%s network error: %s", key[-4:], last)
            _mark(key, 15)
            continue
        if r.status_code == 200:
            return r.json()["choices"][0]["message"].get("content") or ""
        last = f"HTTP {r.status_code}"
        log.warning("groq key ...%s failed: %s %s", key[-4:], r.status_code, r.text[:200])
        if r.status_code == 429:
            try:
                wait = float(r.headers.get("retry-after", 30))
            except ValueError:
                wait = 30
            _mark(key, min(max(wait, 5), 300))
        elif r.status_code in (401, 403):
            _mark(key, 3600)        # bad/revoked key
        elif r.status_code >= 500:
            _mark(key, 15)
        elif r.status_code == 400:
            # request itself is bad (model/params/too large); other keys won't help
            raise ValueError(f"Groq rejected the request: {r.text[:200]}")
        else:
            _mark(key, 30)
    raise RuntimeError(f"All Groq API keys failed (last: {last})")

def ask(system: str, user, search: bool = False, max_tokens: int = 4000) -> str:
    # Groq has no Anthropic-style web_search tool; `search` is accepted but ignored.
    return _complete(system, [{"role": "user", "content": user}], max_tokens)

def chat(system: str, messages: list, max_tokens: int = 2000) -> str:
    return _complete(system, messages, max_tokens)

def parse_json(text: str):
    t = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    try:
        return json.loads(t)
    except Exception:
        m = re.search(r"\{.*\}", t, re.S)
        if not m:
            raise ValueError("Model did not return JSON")
        return json.loads(m.group(0))
