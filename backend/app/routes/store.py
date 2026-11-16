from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pymongo.errors import PyMongoError
from ..database.mongo import get_db
from .auth import current_user

router = APIRouter(prefix="/api/store", tags=["store"])

class Body(BaseModel):
    value: dict

def _col():
    return get_db()["kv_store"]          # documents: {_id: key, value: {...}, updated_at}

@router.get("/{key}")
def read(key: str, _: str = Depends(current_user)):
    try:
        doc = _col().find_one({"_id": key})
    except PyMongoError:
        raise HTTPException(503, "Database unavailable")
    return {"value": doc["value"] if doc else None}

@router.put("/{key}")
def write(key: str, body: Body, _: str = Depends(current_user)):
    try:
        _col().update_one({"_id": key}, {"$set": {"value": body.value, "updated_at": datetime.now(timezone.utc)}}, upsert=True)
    except PyMongoError:
        raise HTTPException(503, "Database unavailable")
    return {"ok": True}
