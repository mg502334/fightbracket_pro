from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import requests
import os
import uuid
import urllib.parse

# Load dotenv if running locally
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from api.db import get_db, DBPlayer, DBStation, DBSMSLog

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SMSRequest(BaseModel):
    phone_numbers: list[str]
    message: str
    match_id: str | None = None
    enable_real_sms: bool = False

class CheckInRequest(BaseModel):
    player_id: str
    checked_in: bool

class StationAssignRequest(BaseModel):
    station_id: int
    match_id: str | None

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/state")
def get_state(user_id: str, db: Session = Depends(get_db)):
    players = db.query(DBPlayer).filter(DBPlayer.user_id == user_id).all()
    stations = db.query(DBStation).filter(DBStation.user_id == user_id).all()
    sms_logs = db.query(DBSMSLog).filter(DBSMSLog.user_id == user_id).all()
    
    return {
        "players": [{"id": p.id, "checked_in": p.checked_in, "sms_notified": p.sms_notified} for p in players],
        "stations": [{"id": s.id, "match_id": s.match_id, "active": s.active} for s in stations],
        "sms_logs": [{"id": log.id, "player_id": log.player_id, "message": log.message, "status": log.status, "match_id": log.match_id} for log in sms_logs]
    }

@app.post("/api/checkin")
def update_checkin(req: CheckInRequest, user_id: str, db: Session = Depends(get_db)):
    player = db.query(DBPlayer).filter(DBPlayer.id == req.player_id, DBPlayer.user_id == user_id).first()
    if not player:
        player = DBPlayer(id=req.player_id, user_id=user_id, checked_in=req.checked_in)
        db.add(player)
    else:
        player.checked_in = req.checked_in
    db.commit()
    return {"status": "success"}

@app.post("/api/station/assign")
def assign_station(req: StationAssignRequest, user_id: str, db: Session = Depends(get_db)):
    station = db.query(DBStation).filter(DBStation.id == req.station_id, DBStation.user_id == user_id).first()
    if not station:
        station = DBStation(id=req.station_id, user_id=user_id, match_id=req.match_id, active=True)
        db.add(station)
    else:
        station.match_id = req.match_id
    db.commit()
    return {"status": "success"}

@app.post("/api/sms/send")
def send_sms_endpoint(req: SMSRequest, user_id: str, db: Session = Depends(get_db)):
    TEXTBELT_URL = "https://textbelt.com/text"
    TEXTBELT_KEY = os.environ.get("TEXTBELT_API_KEY", "textbelt")

    results = []
    for phone in req.phone_numbers:
        if not phone:
            continue
            
        status = "failed"
        response_data = None
        
        if not req.enable_real_sms:
            status = "demo_sent"
        else:
            try:
                resp = requests.post(TEXTBELT_URL, data={
                    "phone": phone,
                    "message": req.message,
                    "key": TEXTBELT_KEY,
                })
                response_data = resp.json()
                status = "success" if response_data.get("success") else "failed"
            except Exception as e:
                status = "error"

        results.append({"phone": phone, "status": status, "response": response_data})
        
        # We don't have the player_id mapping easily here from phone, 
        # so for demo purposes we assume we log it anyway. In a real app we'd map phone -> player_id.
        log = DBSMSLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            player_id=phone, # Just storing phone as player_id for now
            message=req.message,
            status=status,
            match_id=req.match_id
        )
        db.add(log)
        
    db.commit()
    return {"status": "completed", "results": results}

@app.delete("/api/user/data")
def clear_user_data(user_id: str, db: Session = Depends(get_db)):
    db.query(DBPlayer).filter(DBPlayer.user_id == user_id).delete()
    db.query(DBStation).filter(DBStation.user_id == user_id).delete()
    db.query(DBSMSLog).filter(DBSMSLog.user_id == user_id).delete()
    db.commit()
    return {"status": "success"}

@app.get("/api/bracket/sync")
def sync_startgg_bracket(slug: str = "clash-of-kings-vii"):
    STARTGG_TOKEN = os.environ.get("STARTGG_API_TOKEN")
    if not STARTGG_TOKEN:
        raise HTTPException(status_code=400, detail="STARTGG_API_TOKEN is not set in environment.")

    headers = {
        "Authorization": f"Bearer {STARTGG_TOKEN}",
        "Content-Type": "application/json"
    }

    query = """
    query TournamentQuery($slug: String!) {
      tournament(slug: $slug) {
        id
        name
        events {
          id
          name
          videogame { id name }
          entrants(query: {perPage: 32}) {
            nodes {
              id
              name
              participants {
                id
                gamerTag
                prefix
              }
            }
          }
          sets(page: 1, perPage: 64, sortType: STANDARD) {
            nodes {
              id
              state
              fullRoundText
              round
              slots {
                entrant {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
    """
    
    try:
        resp = requests.post(
            "https://api.start.gg/gql/alpha",
            json={"query": query, "variables": {"slug": slug}},
            headers=headers
        )
        data = resp.json()
        
        # Start.gg may return partial data even if there are GraphQL errors (e.g. for sets).
        # Only throw an error if we didn't get any tournament data at all.
        if "errors" in data and not data.get("data", {}).get("tournament"):
            raise HTTPException(status_code=400, detail=str(data["errors"]))
            
        return {"status": "success", "data": data.get("data")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/oauth/login")
def oauth_login():
    STARTGG_CLIENT_ID = os.environ.get("STARTGG_CLIENT_ID")
    STARTGG_REDIRECT_URI = os.environ.get("STARTGG_REDIRECT_URI", "http://localhost:5173/oauth/callback")
    if not STARTGG_CLIENT_ID:
        raise HTTPException(status_code=500, detail="STARTGG_CLIENT_ID not configured")
        
    scope = "user.identity"
    params = {
        "response_type": "code",
        "client_id": STARTGG_CLIENT_ID,
        "scope": scope,
        "redirect_uri": STARTGG_REDIRECT_URI
    }
    url = f"https://api.start.gg/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)

@app.get("/api/oauth/callback")
def oauth_callback(code: str):
    STARTGG_CLIENT_ID = os.environ.get("STARTGG_CLIENT_ID")
    STARTGG_CLIENT_SECRET = os.environ.get("STARTGG_CLIENT_SECRET")
    STARTGG_REDIRECT_URI = os.environ.get("STARTGG_REDIRECT_URI", "http://localhost:5173/oauth/callback")
    
    if not STARTGG_CLIENT_ID or not STARTGG_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="OAuth credentials not configured")
        
    resp = requests.post("https://api.start.gg/oauth/access_token", json={
        "grant_type": "authorization_code",
        "client_id": STARTGG_CLIENT_ID,
        "client_secret": STARTGG_CLIENT_SECRET,
        "code": code,
        "redirect_uri": STARTGG_REDIRECT_URI
    })
    
    data = resp.json()
    if "access_token" not in data:
        raise HTTPException(status_code=400, detail="Failed to retrieve access token")
        
    access_token = data["access_token"]
    # Redirect to frontend with token in fragment or query. 
    # Query is simpler for the frontend to parse if it's purely a single page load redirect component.
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(f"{frontend_url}/oauth/callback?token={access_token}")

@app.get("/api/user/me")
def get_current_user(token: str):
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    query = """
    query {
      currentUser {
        id
        name
        player {
          id
          gamerTag
        }
      }
    }
    """
    resp = requests.post(
        "https://api.start.gg/gql/alpha",
        json={"query": query},
        headers=headers
    )
    data = resp.json()
    if "errors" in data:
        raise HTTPException(status_code=400, detail=str(data["errors"]))
        
    return {"status": "success", "user": data.get("data", {}).get("currentUser")}
