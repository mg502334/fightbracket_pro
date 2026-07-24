import os
from sqlalchemy import create_engine, Column, String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

Base = declarative_base()

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
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String)
    match_id = Column(String, nullable=True)

class DBTournament(Base):
    __tablename__ = "tournaments"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    name = Column(String)
    data = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
            Base.metadata.create_all(bind=_engine)
        except Exception as e:
            print(f"DB connection failed: {e}")
            _engine = None
            _SessionLocal = None
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
