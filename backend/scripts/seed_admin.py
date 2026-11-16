"""Create or update a login user in MongoDB.

Usage (values come from the environment so nothing secret is stored in files):
  MONGO_DB_URI=... SEED_EMAIL=you@example.com SEED_PASSWORD=... python scripts/seed_admin.py
"""
import os, sys
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.mongo import get_db
from app.utils.security import hash_password

email, pw = os.environ["SEED_EMAIL"].strip().lower(), os.environ["SEED_PASSWORD"]
now = datetime.now(timezone.utc)
get_db()["users"].update_one(
    {"_id": email},
    {"$set": {"password_hash": hash_password(pw), "role": "admin", "updated_at": now},
     "$setOnInsert": {"created_at": now}},
    upsert=True)
print(f"seeded admin user: {email}")
