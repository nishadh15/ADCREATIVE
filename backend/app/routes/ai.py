import json, logging
from fastapi import APIRouter, Depends, HTTPException
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
    return "DATA CONTEXT (source labels included; 'demo' means fake sample data):\n" + json.dumps(c)[:30000]

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
        out = cs.ask(COMMON + spec, content, search=search)
        return {"module": body.module, "result": cs.parse_json(out), "model": cs.settings.claude_model}
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except ValueError:
        raise HTTPException(502, "AI returned an unreadable response, try again")
    except Exception as e:
        log.exception("claude error")
        raise HTTPException(502, f"Claude API error: {type(e).__name__}")

@router.post("/chat")
def chat(body: ChatIn, user: str = Depends(current_user)):
    check(user)
    msgs = [m for m in body.history[-12:] if m.get("role") in ("user", "assistant") and m.get("content")]
    msgs.append({"role": "user", "content": f"{_ctx(body.context)}\n\nQUESTION: {body.message}"})
    try:
        return {"reply": cs.chat(CHAT, msgs)}
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        log.exception("claude error")
        raise HTTPException(502, f"Claude API error: {type(e).__name__}")
