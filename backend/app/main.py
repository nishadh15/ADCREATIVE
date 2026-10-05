import logging, time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import auth

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("blank-hanger")

# Disable redirect slashes so POST requests don't redirect and fail with 404
app = FastAPI(title="Blank Hanger AI Marketing Manager", redirect_slashes=False)

origins = {
    settings.frontend_url,
    "https://adcreative-sooty.vercel.app",
    "http://localhost:3000"
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_log(request: Request, call_next):
    t = time.time()
    resp = await call_next(request)
    log.info("%s %s %s %.0fms", request.method, request.url.path, resp.status_code, (time.time() - t) * 1000)
    return resp

app.include_router(auth.router)

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/integrations/status")
def integrations_status():
    return {
        "instagram": "connected" if settings.meta_configured else "not_configured",
        "claude": "configured" if settings.claude_configured else "not_configured",
        "data_mode": "real" if settings.meta_configured else "demo_or_upload",
    }

@app.get("/")
def read_root():
    return {"message": "Blank Hanger AI Backend API is running"}