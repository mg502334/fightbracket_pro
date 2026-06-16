import os
from sqlalchemy import create_engine, Column, String, Boolean, Integer, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# Load URL from environment. Vercel provides POSTGRES_URL.
DATABASE_URL = os.environ.get("POSTGRES_URL", "sqlite:///./test.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
