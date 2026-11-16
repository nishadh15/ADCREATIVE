import hmac, time
from fastapi import APIRouter, HTTPException, Header, Depends
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from pymongo.errors import PyMongoError
from ..config import settings
from ..database.mongo import get_db
from ..utils.security import verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
ALGO = "HS256"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

def make_token(sub: str) -> str:
    return jwt.encode({"sub": sub, "exp": int(time.time()) + 60 * 60 * 12}, settings.jwt_secret, algorithm=ALGO)

def current_user(authorization: str = Header(default="")) -> str:
    try:
        return jwt.decode(authorization.removeprefix("Bearer "), settings.jwt_secret, algorithms=[ALGO])["sub"]
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

@router.post("/login")
def login(body: LoginIn):
    if not settings.jwt_secret:
        raise HTTPException(503, "Auth not configured: set JWT_SECRET")
    email = body.email.lower()
    ok = False
    try:   # 1) users stored in MongoDB (hashed passwords)
        user = get_db()["users"].find_one({"_id": email})
        ok = bool(user) and verify_password(body.password, user.get("password_hash", ""))
    except PyMongoError:
        pass   # DB unreachable -> fall through to the env admin below
    if not ok and settings.admin_email and settings.admin_password:   # 2) optional env admin fallback
        ok = hmac.compare_digest(email, settings.admin_email.lower()) and              hmac.compare_digest(body.password, settings.admin_password)
    if not ok:
        raise HTTPException(401, "Wrong email or password")
    return {"access_token": make_token(email), "token_type": "bearer"}

@router.get("/me")
def me(user: str = Depends(current_user)):
    return {"user": user}
