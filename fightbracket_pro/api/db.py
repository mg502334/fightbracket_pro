import os
from sqlalchemy import create_engine, Column, String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone

Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True) # Supabase user ID
    unique_id = Column(String, unique=True, index=True, nullable=False) # FB-XXXX-YYYY
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    gamer_tag = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)  # User's preferred region / city / zip for event suggestions
    avatar_url = Column(String, nullable=True)
    profile_color = Column(String, nullable=True) # Custom color for profile modal
    startgg_slug = Column(String, nullable=True)
    startgg_token = Column(String, nullable=True) # Start.gg API Token
    startgg_data = Column(Text, nullable=True) # Stored JSON string of Start.gg events & stats
    tekken_id = Column(String, nullable=True) # Tekken 8 / Polaris ID
    steam_id = Column(String, nullable=True) # Steam ID 64 or vanity username
    twitch_id = Column(String, nullable=True) # Twitch channel username or ID
    twitch_url = Column(String, nullable=True) # Twitch channel URL
    youtube_url = Column(String, nullable=True) # YouTube channel URL
    tiktok_url = Column(String, nullable=True) # TikTok handle or URL
    spotify_url = Column(String, nullable=True) # Spotify playlist / track URL
    discord_webhook_url = Column(String, nullable=True) # Discord webhook for TO announcements
    discord_server_id = Column(String, nullable=True) # Discord server ID for widget embed
    games_data = Column(Text, nullable=True) # Stored JSON string of main games & characters
    station_names = Column(Text, nullable=True) # Stored JSON list of custom station names
    is_public = Column(Boolean, default=True) # Publicly viewable vs hidden
    friends_only = Column(Boolean, default=False) # Only friends can view Start.gg stats
    notify_announcements = Column(Boolean, default=True)
    notify_messages = Column(Boolean, default=True)
    sound_notifications = Column(Boolean, default=True)
    sound_messages = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DBUserIntegration(Base):
    __tablename__ = "user_integrations"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False) # References users.id
    integration_type = Column(String, nullable=False) # e.g. "startgg"
    encrypted_api_key = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBFriendship(Base):
    __tablename__ = "friendships"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False) # Sender or Requester
    friend_id = Column(String, index=True, nullable=False) # Target user ID
    status = Column(String, default="pending") # pending | accepted | declined
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBUserIdentifier(Base):
    __tablename__ = "user_identifiers"
    id = Column(String, primary_key=True, index=True) # Matches Supabase user ID (stored as 'id' in Neon)
    unique_id = Column(String, unique=True, index=True, nullable=False) # FB-XXXX-YYYY
    created_at = Column(DateTime, nullable=True)

class DBProfileLike(Base):
    __tablename__ = "profile_likes"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False) # Liker ID
    target_user_id = Column(String, index=True, nullable=False) # Target user ID
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBUserFollow(Base):
    __tablename__ = "user_follows"
    id = Column(String, primary_key=True, index=True)
    follower_id = Column(String, index=True, nullable=False) # User following
    following_id = Column(String, index=True, nullable=False) # User being followed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DBDirectMessage(Base):
    __tablename__ = "direct_messages"
    id = Column(String, primary_key=True, index=True)
    sender_id = Column(String, index=True, nullable=False)
    recipient_id = Column(String, index=True, nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String, default="text")
    metadata_json = Column(Text, nullable=True)
    read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBPlayer(Base):
    __tablename__ = "players"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    checked_in = Column(Boolean, default=False)
    sms_notified = Column(Boolean, default=False)

class DBStation(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    match_id = Column(String, nullable=True)
    active = Column(Boolean, default=True)

class DBSMSLog(Base):
    __tablename__ = "sms_logs"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    player_id = Column(String, index=True)
    message = Column(String)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String)
    match_id = Column(String, nullable=True)

class DBTournament(Base):
    __tablename__ = "tournaments"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    name = Column(String)
    data = Column(Text)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class DBTournamentParticipant(Base):
    __tablename__ = "tournament_participants"
    id = Column(String, primary_key=True, index=True) # e.g. tournament_id + "_" + player_id
    tournament_id = Column(String, index=True, nullable=False)
    fb_user_id = Column(String, index=True, nullable=True) # unique_id of the FB user (if linked)
    player_id = Column(String, nullable=False)
    gamer_tag = Column(String, nullable=False)
    placement = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBUserReport(Base):
    __tablename__ = "user_reports"
    id = Column(String, primary_key=True, index=True)
    reporter_id = Column(String, index=True, nullable=False)
    target_id = Column(String, index=True, nullable=False)
    reason = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBPost(Base):
    __tablename__ = "posts"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    image = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    type = Column(String, nullable=False)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBPostLike(Base):
    __tablename__ = "post_likes"
    id = Column(String, primary_key=True, index=True)
    post_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBPostComment(Base):
    __tablename__ = "post_comments"
    id = Column(String, primary_key=True, index=True)
    post_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBPostReaction(Base):
    __tablename__ = "post_reactions"
    id = Column(String, primary_key=True, index=True)
    post_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    emoji = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBPostRepost(Base):
    __tablename__ = "post_reposts"
    id = Column(String, primary_key=True, index=True)
    post_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DBNewsItem(Base):
    __tablename__ = "news_items"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False) # 'update' | 'fix' | 'feature' | 'event' | 'sale'
    body = Column(Text, nullable=False)
    bullets = Column(Text, nullable=True) # JSON list
    badge = Column(String, nullable=True)
    link = Column(String, nullable=True)
    link_label = Column(String, nullable=True)
    game_title = Column(String, nullable=True)
    store_platform = Column(String, nullable=True)
    discount = Column(String, nullable=True)
    original_price = Column(String, nullable=True)
    sale_price = Column(String, nullable=True)
    archived = Column(Boolean, default=False)
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)

class DBSupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(String, primary_key=True, index=True)
    inquiry_type = Column(String, nullable=False) # 'game_request' | 'bracket' | 'oauth' | etc.
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    user_id = Column(String, nullable=True)
    status = Column(String, default="open") # 'open' | 'in_progress' | 'resolved'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Lazy engine — only created when first needed, prevents cold-start crash on Vercel
_engine = None
_SessionLocal = None

def _get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        DATABASE_URL = os.environ.get("POSTGRES_URL", "")
        if not DATABASE_URL:
            return None, None
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        try:
            _engine = create_engine(DATABASE_URL)
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        except Exception as e:
            print(f"DB connection failed: {e}")
            _engine = None
            _SessionLocal = None
            return None, None
    # Always run create_all so new tables are created even if engine was already cached
    try:
        from sqlalchemy import inspect, text
        Base.metadata.create_all(bind=_engine)
        
        # Automatic column migration safety net
        inspector = inspect(_engine)
        with _engine.begin() as conn:
            for table_name, table in Base.metadata.tables.items():
                if inspector.has_table(table_name):
                    existing_columns = {col['name'] for col in inspector.get_columns(table_name)}
                    for column in table.columns:
                        if column.name not in existing_columns:
                            col_type = str(column.type.compile(_engine.dialect))
                            print(f"Safety net: Adding missing column {table_name}.{column.name} ({col_type})")
                            try:
                                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column.name} {col_type};"))
                            except Exception as add_col_err:
                                print(f"Warning: Failed to auto-add column {column.name}: {add_col_err}")
    except Exception as e:
        print(f"DB schema sync warning: {e}")
    return _engine, _SessionLocal

def get_db():
    _, SessionLocal = _get_engine()
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
