import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from sqlalchemy import text
from api.db import _get_engine

engine, _ = _get_engine()
with engine.connect() as conn:
    result = conn.execute(text("SELECT id, unique_id, gamer_tag, tekken_id, steam_id, startgg_token FROM users"))
    for row in result:
        print(row)
