import httpx
from fastapi import APIRouter, Depends, HTTPException
from ..config import settings
from ..services import meta_service
from .auth import current_user

# every route requires a logged-in user
router = APIRouter(prefix="/api/instagram", tags=["Instagram"], dependencies=[Depends(current_user)])

GRAPH_API_URL = "https://graph.facebook.com/v21.0"

def get_credentials():
    if not settings.meta_configured:
        raise HTTPException(503, "Instagram not configured: set META_ACCESS_TOKEN and META_IG_USER_ID on the backend")
    return settings.meta_access_token, settings.ig_user_id

def _get(client: httpx.Client, url: str, params: dict):
    res = client.get(url, params=params, timeout=30)
    if res.status_code != 200:
        raise HTTPException(res.status_code if res.status_code < 500 else 502, res.json())
    return res.json()

@router.get("/overview")
def get_instagram_overview():
    token, acc = get_credentials()
    with httpx.Client() as c:
        return _get(c, f"{GRAPH_API_URL}/{acc}", {"fields": "username,name,followers_count,media_count,profile_picture_url", "access_token": token})

@router.get("/insights")
def get_instagram_insights():
    token, acc = get_credentials()
    with httpx.Client() as c:
        reach = c.get(f"{GRAPH_API_URL}/{acc}/insights", params={"metric": "reach", "period": "day", "metric_type": "time_series", "access_token": token}, timeout=30).json()
        eng = c.get(f"{GRAPH_API_URL}/{acc}/insights", params={"metric": "accounts_engaged,profile_views", "period": "day", "metric_type": "total_value", "access_token": token}, timeout=30).json()
    return {"reach": reach.get("data", []), "engagement": eng.get("data", [])}

@router.get("/posts")
def get_instagram_posts():
    token, acc = get_credentials()
    with httpx.Client() as c:
        return _get(c, f"{GRAPH_API_URL}/{acc}/media", {"fields": "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count", "access_token": token})

@router.get("/sync")
def sync_instagram(limit: int = 30):
    """Profile + recent posts with per-post reach/saves/shares/views, in the shape the Analytics page expects."""
    get_credentials()
    try:
        return meta_service.sync_profile_and_media(min(max(limit, 1), 50))
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Instagram API error {e.response.status_code}: {e.response.text[:200]}")
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Instagram API unreachable: {type(e).__name__}")
