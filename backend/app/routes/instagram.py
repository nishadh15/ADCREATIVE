import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/instagram", tags=["Instagram"])

GRAPH_API_URL = "https://graph.facebook.com/v26.0"

def get_credentials():
    token = os.getenv("META_ACCESS_TOKEN")
    account_id = os.getenv("INSTAGRAM_ACCOUNT_ID")
    if not token or not account_id:
        raise HTTPException(
            status_code=500, 
            detail="Missing Meta credentials in environment variables"
        )
    return token, account_id

@router.get("/overview")
def get_instagram_overview():
    token, account_id = get_credentials()
    url = f"{GRAPH_API_URL}/{account_id}?fields=username,name,followers_count,media_count,profile_picture_url&access_token={token}"
    with httpx.Client() as client:
        res = client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=res.json())
        return res.json()

@router.get("/insights")
def get_instagram_insights():
    token, account_id = get_credentials()
    
    reach_url = f"{GRAPH_API_URL}/{account_id}/insights?metric=reach&period=day&metric_type=time_series&access_token={token}"
    engagement_url = f"{GRAPH_API_URL}/{account_id}/insights?metric=accounts_engaged,profile_views&period=day&metric_type=total_value&access_token={token}"
    
    with httpx.Client() as client:
        reach_res = client.get(reach_url).json()
        engagement_res = client.get(engagement_url).json()

    return {
        "reach": reach_res.get("data", []),
        "engagement": engagement_res.get("data", [])
    }

@router.get("/posts")
def get_instagram_posts():
    token, account_id = get_credentials()
    url = f"{GRAPH_API_URL}/{account_id}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token={token}"
    with httpx.Client() as client:
        res = client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=res.json())
        return res.json()