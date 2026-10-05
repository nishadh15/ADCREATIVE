import time
from collections import defaultdict, deque
from fastapi import HTTPException
_hits = defaultdict(deque)

def check(key: str, limit: int = 20, per: int = 60):
    now, q = time.time(), _hits[key]
    while q and now - q[0] > per: q.popleft()
    if len(q) >= limit: raise HTTPException(429, "Too many AI requests, wait a minute")
    q.append(now)
