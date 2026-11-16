import json, logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ..ai.modules import COMMON, M, CHAT
from ..services import claude_service as cs
from ..utils.ratelimit import check
from .auth import current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])
log = logging.getLogger("ai")

class RunIn(BaseModel):
    module: str
    input: dict = {}
    context: dict = {}
    image: dict | None = None   # {"media_type","data"(base64)}

class ChatIn(BaseModel):
    message: str
    history: list[dict] = []
    context: dict = {}

def _ctx(c: dict) -> str:
    return "DATA CONTEXT (source labels included; 'demo' means fake sample data):\n" + json.dumps(c)[:cs.settings.groq_max_context_chars]

@router.post("/run")
def run(body: RunIn, user: str = Depends(current_user)):
    if body.module not in M:
        raise HTTPException(400, "Unknown module")
    check(user)
    search, spec = M[body.module]
    text = f"{_ctx(body.context)}\n\nINPUT:\n{json.dumps(body.input)}"
    content = text
    if body.image:
        content = [{"type": "image", "source": {"type": "base64", **body.image}}, {"type": "text", "text": text}]
    try:
        for attempt in (1, 2):
            out, used = cs.ask_ex(COMMON + spec, content)
            try:
                return {"module": body.module, "result": cs.parse_json(out), "model": used}
            except ValueError:
                log.warning("unparseable AI output (module=%s, model=%s, attempt=%d): %r", body.module, used, attempt, out[:300])
                if attempt == 2:
                    raise
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except UnicodeError:
        raise HTTPException(503, "A Groq API key contains invalid characters; re-paste GROQ_API_KEYS on the backend")
    except ValueError as e:
        log.warning("ai ValueError: %s", e)
        raise HTTPException(502, f"AI returned an unreadable response: {str(e)[:300]}")
    except Exception as e:
        log.exception("ai error")
        raise HTTPException(502, f"AI provider error: {type(e).__name__}")

@router.get("/diagnose")
def diagnose(user: str = Depends(current_user)):
    """Live per-model test: shows which Groq models/keys actually work."""
    return cs.diagnose()

def _chat_msgs(body: "ChatIn"):
    """Lean prompt: last 6 turns, each capped, plus the (compact) data context on the new question only."""
    hist = [{"role": m["role"], "content": str(m["content"])[:1500]} for m in body.history[-6:]
            if m.get("role") in ("user", "assistant") and m.get("content")]
    hist.append({"role": "user", "content": f"{_ctx(body.context)}\n\nQUESTION: {body.message[:2000]}"})
    return hist

@router.post("/chat")
def chat(body: ChatIn, user: str = Depends(current_user)):
    check(user)
    try:
        return {"reply": cs.chat(CHAT, _chat_msgs(body), max_tokens=1200)}
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        log.exception("ai error")
        raise HTTPException(502, f"AI provider error: {type(e).__name__}")

@router.post("/chat/stream")
def chat_stream(body: ChatIn, user: str = Depends(current_user)):
    """Server-sent events: {"t": "<text chunk>"} ... then {"done": true} or {"error": "..."}."""
    check(user)
    msgs = _chat_msgs(body)

    def events():
        try:
            for t in cs.stream_chat(CHAT, msgs, max_tokens=1200):
                yield f"data: {json.dumps({'t': t})}\n\n"
            yield 'data: {"done": true}\n\n'
        except RuntimeError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        except Exception as e:
            log.exception("ai stream error")
            yield f"data: {json.dumps({'error': 'AI provider error: ' + type(e).__name__})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"})
