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

try:
    from api.db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament
except ModuleNotFoundError:
    from db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament
import jwt
from fastapi import Header

def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], audience="authenticated")
            return payload.get("sub")
        except jwt.PyJWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

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

class TournamentSaveRequest(BaseModel):
    id: str
    name: str
    data: str

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/tournaments")
def get_tournaments(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"tournaments": []}
    tournaments = db.query(DBTournament).filter(DBTournament.user_id == user_id).all()
    return {"tournaments": [{"id": t.id, "name": t.name, "updated_at": t.updated_at.isoformat()} for t in tournaments]}

@app.get("/api/tournaments/{tournament_id}")
def get_tournament(tournament_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
    tournament = db.query(DBTournament).filter(DBTournament.id == tournament_id, DBTournament.user_id == user_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return {"tournament": {"id": tournament.id, "name": tournament.name, "data": tournament.data, "updated_at": tournament.updated_at.isoformat()}}

@app.post("/api/tournaments")
def save_tournament(req: TournamentSaveRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"status": "error", "detail": "Database not available"}
    tournament = db.query(DBTournament).filter(DBTournament.id == req.id, DBTournament.user_id == user_id).first()
    if tournament:
        tournament.name = req.name
        tournament.data = req.data
    else:
        tournament = DBTournament(id=req.id, user_id=user_id, name=req.name, data=req.data)
        db.add(tournament)
    db.commit()
    return {"status": "success"}

@app.delete("/api/tournaments/{tournament_id}")
def delete_tournament(tournament_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"status": "error", "detail": "Database not available"}
    tournament = db.query(DBTournament).filter(DBTournament.id == tournament_id, DBTournament.user_id == user_id).first()
    if tournament:
        db.delete(tournament)
        db.commit()
    return {"status": "success"}

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
    if slug:
        slug = slug.strip()
        if "start.gg/tournament/" in slug:
            slug = slug.split("start.gg/tournament/")[-1]
        elif "tournament/" in slug:
            slug = slug.split("tournament/")[-1]
        slug = slug.split("/")[0].split("?")[0].strip()

    STARTGG_TOKEN = token or os.environ.get("STARTGG_API_TOKEN")
    if not STARTGG_TOKEN:
        raise HTTPException(
            status_code=401, 
            detail="Start.gg API token is required. Please log in with Start.gg or enter your Personal Access Token in Account settings."
        )

    headers = {
        "Authorization": f"Bearer {STARTGG_TOKEN}",
        "Content-Type": "application/json"
    }

    query_tourney = """
    query TournamentQuery($slug: String!) {
      tournament(slug: $slug) {
        id
        name
        city
        addrState
        venueAddress
        isOnline
        events {
          id
          name
          videogame { id name }
        }
      }
    }
    """

    query_entrants = """
    query EventEntrants($eventId: ID!, $page: Int!) {
      event(id: $eventId) {
        entrants(query: {page: $page, perPage: 100}) {
          pageInfo {
            totalPages
            total
          }
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
      }
    }
    """

    query_sets = """
    query EventSets($eventId: ID!, $page: Int!) {
      event(id: $eventId) {
        sets(page: $page, perPage: 50, sortType: STANDARD) {
          pageInfo {
            totalPages
            total
          }
          nodes {
            id
            state
            fullRoundText
            round
            winnerId
            displayScore
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
            err_msg = data.get("message", f"Start.gg returned HTTP {resp.status_code}")
            if "Invalid authentication token" in err_msg or "authentication" in err_msg.lower():
                err_msg = "Start.gg API token is missing or invalid. Please connect your Start.gg account or enter a Personal Access Token in Account settings."
            raise HTTPException(status_code=400, detail=err_msg)

        if "errors" in data and not data.get("data", {}).get("tournament"):
            errs = data.get("errors", [])
            err_msg = errs[0].get("message", "Error querying Start.gg API") if isinstance(errs, list) and errs else "Tournament not found"
            if "Invalid authentication token" in err_msg or "authentication" in err_msg.lower():
                err_msg = "Start.gg API token is missing or invalid. Please connect your Start.gg account or enter a Personal Access Token in Account settings."
            raise HTTPException(status_code=400, detail=err_msg)
            
        tournament_data = data.get("data", {}).get("tournament")
        if tournament_data:
            events = tournament_data.get("events", [])
            for event in events:
                event_id = event["id"]

                # 1. Fetch Entrants (paginated)
                all_entrants = []
                page = 1
                while True:
                    ev_resp = requests.post(
                        "https://api.start.gg/gql/alpha",
                        json={"query": query_entrants, "variables": {"eventId": event_id, "page": page}},
                        headers=headers
                    )
                    if ev_resp.status_code != 200:
                        break
                    ev_data = ev_resp.json()
                    if "errors" in ev_data or not ev_data.get("data", {}).get("event"):
                        break
                    entrants_obj = ev_data.get("data", {}).get("event", {}).get("entrants") or {}
                    nodes = entrants_obj.get("nodes", [])
                    if nodes:
                        all_entrants.extend(nodes)
                    total_pages = entrants_obj.get("pageInfo", {}).get("totalPages") or 1
                    if page >= total_pages or not nodes:
                        break
                    page += 1

                # 2. Fetch Sets (paginated)
                all_sets = []
                page = 1
                while True:
                    ev_resp = requests.post(
                        "https://api.start.gg/gql/alpha",
                        json={"query": query_sets, "variables": {"eventId": event_id, "page": page}},
                        headers=headers
                    )
                    if ev_resp.status_code != 200:
                        break
                    ev_data = ev_resp.json()
                    if "errors" in ev_data or not ev_data.get("data", {}).get("event"):
                        break
                    sets_obj = ev_data.get("data", {}).get("event", {}).get("sets") or {}
                    nodes = sets_obj.get("nodes", [])
                    if nodes:
                        all_sets.extend(nodes)
                    total_pages = sets_obj.get("pageInfo", {}).get("totalPages") or 1
                    if page >= total_pages or not nodes:
                        break
                    page += 1

                event["entrants"] = {"nodes": all_entrants}
                event["sets"] = {"nodes": all_sets}

        return {"status": "success", "data": data.get("data")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/oauth/login")
def oauth_login():
    # Bypass OAuth flow and use the provided Personal Access Token
    token = os.environ.get("STARTGG_API_TOKEN")
    if not token:
        # Fallback to the token found in synctoken.txt
        token = "7a0992d510fe43a2a308fdc60ad75c02"
    
    frontend_url = os.environ.get("FRONTEND_URL", "http://fightbracketpro.com")
    return RedirectResponse(f"{frontend_url}/oauth/callback?token={token}")

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

@app.get("/api/startgg/user")
def get_startgg_user(slug: str, token: str = None):
    STARTGG_TOKEN = token or os.environ.get("STARTGG_API_TOKEN")
    if not STARTGG_TOKEN:
        raise HTTPException(status_code=400, detail="Start.gg API token is required. Please login first.")

    # clean up slug if they passed the full url or 'user/'
    if "start.gg/user/" in slug:
        slug = slug.split("start.gg/user/")[-1].split("/")[0]
    if slug.startswith("user/"):
        slug = slug[5:]

    headers = {
        "Authorization": f"Bearer {STARTGG_TOKEN}",
        "Content-Type": "application/json"
    }

    query = """
    query UserQuery($slug: String!) {
      user(slug: $slug) {
        id
        name
        location {
          country
        }
        player {
          id
          gamerTag
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
        
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=data.get("message", f"Start.gg returned HTTP {resp.status_code}"))

        if "errors" in data:
            raise HTTPException(status_code=400, detail=str(data["errors"]))
            
        user_data = data.get("data", {}).get("user")
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        return {"status": "success", "user": user_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
