from fastapi import APIRouter, Depends, HTTPException
from ..services import meta_service
from .auth import current_user

router = APIRouter(prefix="/api/instagram", tags=["instagram"])

@router.get("/sync")
def sync(_: str = Depends(current_user)):
    try:
        return meta_service.sync_profile_and_media()
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(502, f"Meta API error: {type(e).__name__} (check token permissions/expiry)")
