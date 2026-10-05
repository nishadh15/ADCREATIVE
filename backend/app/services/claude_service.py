import json, re, logging
from anthropic import Anthropic
from ..config import settings
log = logging.getLogger("claude")

def _client():
    if not settings.claude_api_key:
        raise RuntimeError("CLAUDE_API_KEY is not set on the backend")
    return Anthropic(api_key=settings.claude_api_key, timeout=120)

def ask(system: str, user, search: bool = False, max_tokens: int = 4000) -> str:
    msgs = [{"role": "user", "content": user}]
    kw = dict(model=settings.claude_model, max_tokens=max_tokens, system=system, messages=msgs)
    if search:
        try:
            r = _client().messages.create(**kw, tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}])
            return "".join(b.text for b in r.content if getattr(b, "type", "") == "text")
        except Exception as e:  # web search unavailable -> fall back, caller is told via data_notes
            log.warning("web search failed: %s", e)
    r = _client().messages.create(**kw)
    return "".join(b.text for b in r.content if getattr(b, "type", "") == "text")

def chat(system: str, messages: list, max_tokens: int = 2000) -> str:
    r = _client().messages.create(model=settings.claude_model, max_tokens=max_tokens, system=system, messages=messages)
    return "".join(b.text for b in r.content if getattr(b, "type", "") == "text")

def parse_json(text: str):
    t = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    try:
        return json.loads(t)
    except Exception:
        m = re.search(r"\{.*\}", t, re.S)
        if not m:
            raise ValueError("Model did not return JSON")
        return json.loads(m.group(0))
