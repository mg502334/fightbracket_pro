import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ.get("POSTGRES_URL", "")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

try:
    with engine.begin() as conn:
        print("Adding tekken_id to users...")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS tekken_id VARCHAR;"))
    print("Successfully added tekken_id to users table.")
except Exception as e:
    print("Error:", e)
