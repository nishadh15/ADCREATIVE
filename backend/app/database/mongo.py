"""MongoDB access (pymongo). The client is created lazily and shared; connecting
happens on first use, so the app boots (and /health works) even if the DB is down."""
from functools import lru_cache
from pymongo import MongoClient
from pymongo.database import Database
from ..config import settings

@lru_cache(maxsize=1)
def _client() -> MongoClient:
    return MongoClient(settings.mongodb_uri or "mongodb://localhost:27017",
                       serverSelectionTimeoutMS=5000, tz_aware=True)

def get_db() -> Database:
    return _client()[settings.mongodb_db]
