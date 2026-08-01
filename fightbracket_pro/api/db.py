import os
from sqlalchemy import create_engine, Column, String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone

Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True) # Supabase user ID
    gamer_tag = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    startgg_slug = Column(String, nullable=True)
    startgg_data = Column(Text, nullable=True) # Stored JSON string of Start.gg events & stats
    tekken_id = Column(String, nullable=True) # Tekken 8 / Polaris ID
    is_public = Column(Boolean, default=True) # Publicly viewable vs hidden
    friends_only = Column(Boolean, default=False) # Only friends can view Start.gg stats
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


class DBDirectMessage(Base):
    __tablename__ = "direct_messages"
    id = Column(String, primary_key=True, index=True)
    sender_id = Column(String, index=True, nullable=False)
    recipient_id = Column(String, index=True, nullable=False)
    message = Column(Text, nullable=False)
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
        Base.metadata.create_all(bind=_engine)
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
