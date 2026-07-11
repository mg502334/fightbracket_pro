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

# pyrefly: ignore [missing-import]
# from api.db import get_db, DBPlayer, DBStation, DBSMSLog

# Mock DB for online deployment
def get_db():
    yield None

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
    return {
        "players": [],
        "stations": [],
        "sms_logs": []
    }

@app.post("/api/checkin")
def update_checkin(req: CheckInRequest, user_id: str, db: Session = Depends(get_db)):
    return {"status": "success"}

@app.post("/api/station/assign")
def assign_station(req: StationAssignRequest, user_id: str, db: Session = Depends(get_db)):
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
        pass
        
    return {"status": "completed", "results": results}

@app.delete("/api/user/data")
def clear_user_data(user_id: str, db: Session = Depends(get_db)):
    return {"status": "success"}

@app.get("/api/bracket/sync")
def sync_startgg_bracket(slug: str = "clash-of-kings-vii", token: str = None):
    STARTGG_TOKEN = token or os.environ.get("STARTGG_API_TOKEN")
    if not STARTGG_TOKEN:
        raise HTTPException(status_code=400, detail="Start.gg API token is required. Please login first.")

    headers = {
        "Authorization": f"Bearer {STARTGG_TOKEN}",
        "Content-Type": "application/json"
    }

    query_tourney = """
    query TournamentQuery($slug: String!) {
      tournament(slug: $slug) {
        id
        name
        events {
          id
          name
          videogame { id name }
        }
      }
    }
    """

    query_event = """
    query EventQuery($eventId: ID!) {
      event(id: $eventId) {
        entrants(query: {page: 1, perPage: 150}) {
          nodes {
            id
            name
            participants {
              gamerTag
            }
            seeds {
              seedNum
            }
            standing {
              placement
            }
          }
        }
        sets(page: 1, perPage: 100, sortType: RECENT) {
          nodes {
            id
            state
            fullRoundText
            round
            winnerId
            stream {
              streamName
              streamSource
            }
            slots {
              entrant {
                id
                name
              }
              standing {
                stats {
                  score {
                    value
                  }
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
            json={"query": query_tourney, "variables": {"slug": slug}},
            headers=headers
        )
        data = resp.json()
        
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=data.get("message", f"Start.gg returned HTTP {resp.status_code}"))

        if "errors" in data and not data.get("data", {}).get("tournament"):
            raise HTTPException(status_code=400, detail=str(data["errors"]))
            
        tournament_data = data.get("data", {}).get("tournament")
        if tournament_data:
            events = tournament_data.get("events", [])
            for event in events:
                event_id = event["id"]
                ev_resp = requests.post(
                    "https://api.start.gg/gql/alpha",
                    json={"query": query_event, "variables": {"eventId": event_id}},
                    headers=headers
                )
                ev_data = ev_resp.json()
                if "data" in ev_data and ev_data["data"].get("event"):
                    event_details = ev_data["data"]["event"]
                    event["entrants"] = event_details.get("entrants")
                    event["sets"] = event_details.get("sets")

        return {"status": "success", "data": data.get("data")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/oauth/login")
def oauth_login():
    STARTGG_CLIENT_ID = os.environ.get("STARTGG_CLIENT_ID")
    STARTGG_REDIRECT_URI = os.environ.get("STARTGG_REDIRECT_URI", "http://fightbracketpro.com")
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
    STARTGG_REDIRECT_URI = os.environ.get("STARTGG_REDIRECT_URI", "http://fightbracketpro.com")
    
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
    frontend_url = os.environ.get("FRONTEND_URL", "http://fightbracketpro.com")
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
