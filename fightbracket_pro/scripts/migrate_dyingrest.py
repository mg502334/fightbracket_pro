import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from sqlalchemy import text
from api.db import _get_engine

engine, SessionLocal = _get_engine()
with SessionLocal() as db:
    # 1. Get the old profile
    old_id = '3216e90c-0555-4717-a2a6-d98003b47e85'
    new_id = 'test-0a795969-bdc6-4286-9e51-f78372e14a35'
    
    from api.db import DBUser
    
    old_user = db.query(DBUser).filter(DBUser.id == old_id).first()
    new_user = db.query(DBUser).filter(DBUser.id == new_id).first()
    
    if not old_user:
        print("Old user not found!")
        sys.exit(1)
        
    if not new_user:
        print("New user not found!")
        sys.exit(1)
        
    # Merge data
    new_user.gamer_tag = old_user.gamer_tag
    new_user.bio = old_user.bio
    new_user.avatar_url = old_user.avatar_url
    new_user.startgg_slug = old_user.startgg_slug
    new_user.startgg_token = old_user.startgg_token
    new_user.startgg_data = old_user.startgg_data
    new_user.tekken_id = old_user.tekken_id
    new_user.steam_id = old_user.steam_id
    new_user.twitch_id = old_user.twitch_id
    new_user.twitch_url = old_user.twitch_url
    new_user.games_data = old_user.games_data
    
    db.commit()
    print("Migration successful! Data copied to the new account.")
