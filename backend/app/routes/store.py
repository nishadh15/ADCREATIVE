from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database.base import get_db
from ..models import KVStore
from .auth import current_user

router = APIRouter(prefix="/api/store", tags=["store"])

class Body(BaseModel):
    value: dict

@router.get("/{key}")
def read(key: str, db: Session = Depends(get_db), _: str = Depends(current_user)):
    row = db.get(KVStore, key)
    return {"value": row.value if row else None}

@router.put("/{key}")
def write(key: str, body: Body, db: Session = Depends(get_db), _: str = Depends(current_user)):
    row = db.get(KVStore, key) or KVStore(key=key)
    row.value, row.updated_at = body.value, datetime.now(timezone.utc)
    db.add(row); db.commit()
    return {"ok": True}
