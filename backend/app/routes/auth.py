import hmac, time
from fastapi import APIRouter, HTTPException, Header, Depends
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from ..config import settings

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
    if not (settings.jwt_secret and settings.admin_email and settings.admin_password):
        raise HTTPException(503, "Auth not configured: set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD")
    ok = hmac.compare_digest(body.email.lower(), settings.admin_email.lower()) and \
         hmac.compare_digest(body.password, settings.admin_password)
    if not ok:
        raise HTTPException(401, "Wrong email or password")
    return {"access_token": make_token(body.email), "token_type": "bearer"}

@router.get("/me")
def me(user: str = Depends(current_user)):
    return {"user": user}
