import httpx
from ..config import settings
G = "https://graph.facebook.com/v21.0"

def sync_profile_and_media(limit: int = 30):
    """Reads (never writes) from the Instagram Graph API. Requires META_ACCESS_TOKEN + META_IG_USER_ID."""
    if not settings.meta_configured:
        raise RuntimeError("Instagram not configured: set META_ACCESS_TOKEN and META_IG_USER_ID")
    p = {"access_token": settings.meta_access_token}
    with httpx.Client(timeout=30) as c:
        prof = c.get(f"{G}/{settings.meta_ig_user_id}", params={**p, "fields": "username,followers_count,follows_count,media_count"})
        prof.raise_for_status()
        media = c.get(f"{G}/{settings.meta_ig_user_id}/media", params={**p, "limit": limit,
              "fields": "id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink"})
        media.raise_for_status()
        posts = []
        for m in media.json().get("data", []):
            ins = {}
            try:
                metric = "reach,saved,shares,views" if m.get("media_product_type") == "REELS" else "reach,saved,shares"
                r = c.get(f"{G}/{m['id']}/insights", params={**p, "metric": metric})
                if r.status_code == 200:
                    ins = {i["name"]: i["values"][0]["value"] for i in r.json().get("data", [])}
            except Exception:
                pass
            posts.append({"date": m["timestamp"][:10], "hour": int(m["timestamp"][11:13]),
                "type": "Reel" if m.get("media_product_type") == "REELS" else m.get("media_type", "Post").title(),
                "caption": m.get("caption", ""), "hook": (m.get("caption") or "").split("\n")[0][:120],
                "reach": ins.get("reach", 0), "likes": m.get("like_count", 0), "comments": m.get("comments_count", 0),
                "shares": ins.get("shares", 0), "saves": ins.get("saved", 0), "views": ins.get("views", 0), "permalink": m.get("permalink")})
        return {"profile": prof.json(), "posts": posts}
