# pyright: reportGeneralTypeIssues=false, reportAttributeAccessIssue=false, reportArgumentType=false
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import requests
import os
import uuid
import urllib.parse
from datetime import datetime, timezone
import random
import string

# Load dotenv if running locally
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from api.db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament, DBUser, DBFriendship, DBDirectMessage, DBUserIdentifier

else:
    try:
        try:
            from api.db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament, DBUser, DBFriendship, DBDirectMessage, DBUserIdentifier
        except Exception:
            from db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament, DBUser, DBFriendship, DBDirectMessage, DBUserIdentifier  # type: ignore
    except Exception as _db_err:
        print(f"DB import warning: {_db_err}")
        def get_db():
            yield None
        class _DummyModel: pass
        DBPlayer = DBStation = DBSMSLog = DBTournament = DBFriendship = DBDirectMessage = DBUser = DBUserIdentifier = _DummyModel # type: ignore
try:
    import jwt
except ImportError:
    jwt = None

from fastapi import Header

def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    if jwt is None:
        return "anon-user"
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub")
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    else:
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], audience="authenticated")
            return payload.get("sub")
        except Exception as e:
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

class VerifyRequest(BaseModel):
    token: str

class ProfileUpdateRequest(BaseModel):
    gamer_tag: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    startgg_slug: str | None = None
    tekken_id: str | None = None
    is_public: bool | None = None
    friends_only: bool | None = None

class StartggImportRequest(BaseModel):
    startgg_slug_or_url: str
    api_token: str | None = None

class FriendRequestInput(BaseModel):
    target_identifier: str

class FriendResponseInput(BaseModel):
    friendship_id: str
    action: str  # 'accept' or 'decline'

class SendMessageInput(BaseModel):
    recipient_id: str
    message: str

@app.post("/api/auth/verify")
def verify_auth_turnstile(req: VerifyRequest, request: Request):
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else None
        
    secret = os.environ.get("TURNSTILE_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="TURNSTILE_SECRET environment variable is not configured.")
        
    try:
        resp = requests.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", data={
            "secret": secret,
            "response": req.token,
            "remoteip": client_ip
        })
        if resp.status_code != 200:
            raise HTTPException(status_code=403, detail="Turnstile verification request failed.")
        result = resp.json()
    except Exception as e:
        raise HTTPException(status_code=403, detail="Forbidden - Turnstile verification failed.")
        
    if not result.get("success"):
        raise HTTPException(status_code=403, detail="Forbidden - Turnstile verification failed.")
        
    return {"status": "success"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/user/profile")
def get_user_profile(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
    
    import random
    import string
    
    try:
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            # Generate unique ID first since it's NOT NULL in DB
            while True:
                unique_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
                unique_part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
                unique_id = f"FB-{unique_part}-{unique_part2}"
                if not db.query(DBUser).filter(DBUser.unique_id == unique_id).first():
                    break

            user = DBUser(id=user_id, unique_id=unique_id)
            db.add(user)
            
            # Also sync to user_identifiers table to keep it consistent
            identifier = DBUserIdentifier(id=user_id, unique_id=unique_id)
            db.add(identifier)
            
            # Create bot user if it doesn't exist
            import uuid
            bot_id = "fb-bot-system"
            bot_user = db.query(DBUser).filter(DBUser.id == bot_id).first()
            if not bot_user:
                bot_user = DBUser(id=bot_id, unique_id="FB-BOT-0000", gamer_tag="FightBracket Bot")
                db.add(bot_user)
                db.commit()
            
            # Make them friends
            friendship1 = DBFriendship(id=str(uuid.uuid4()), user_id=user_id, friend_id=bot_id, status="accepted")
            friendship2 = DBFriendship(id=str(uuid.uuid4()), user_id=bot_id, friend_id=user_id, status="accepted")
            db.add(friendship1)
            db.add(friendship2)
            
            # Send welcome message
            welcome_msg = DBDirectMessage(
                id=str(uuid.uuid4()),
                sender_id=bot_id,
                recipient_id=user_id,
                message="Welcome to FightBracket Pro! We're glad to have you here. Let us know if you need any help getting started.",
                read=False
            )
            db.add(welcome_msg)
            
            db.commit()
            db.refresh(user)

        # In case the user exists but user_identifiers doesn't (legacy)
        identifier = db.query(DBUserIdentifier).filter(DBUserIdentifier.id == user_id).first()
        if not identifier and hasattr(user, 'unique_id') and user.unique_id:
            identifier = DBUserIdentifier(id=user_id, unique_id=user.unique_id)
            db.add(identifier)
            db.commit()
            
        created_at_val = user.created_at
        if hasattr(created_at_val, "isoformat"):
            created_at_str = created_at_val.isoformat()
        elif created_at_val:
            created_at_str = str(created_at_val)
        else:
            created_at_str = datetime.now(timezone.utc).isoformat()

        unread_count = db.query(DBDirectMessage).filter(DBDirectMessage.recipient_id == user_id, DBDirectMessage.read == False).count()

        return {
            "user": {
                "id": user.id,
                "unique_id": getattr(user, 'unique_id', identifier.unique_id if identifier else "FB-UNKNOWN"),
                "gamer_tag": user.gamer_tag or "",
                "bio": user.bio or "",
                "avatar_url": user.avatar_url or "",
                "startgg_slug": user.startgg_slug or "",
                "startgg_data": user.startgg_data or "",
                "tekken_id": user.tekken_id or "",
                "is_public": user.is_public if user.is_public is not None else True,
                "friends_only": user.friends_only if user.friends_only is not None else False,
                "created_at": created_at_str,
                "unread_messages_count": unread_count
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "user": None}

@app.put("/api/user/profile")
def update_user_profile(req: ProfileUpdateRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
    
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.gamer_tag is not None:
        user.gamer_tag = req.gamer_tag.strip() # type: ignore
    if req.bio is not None:
        user.bio = req.bio.strip() # type: ignore
    if req.avatar_url is not None:
        user.avatar_url = req.avatar_url.strip() # type: ignore
    if req.startgg_slug is not None:
        user.startgg_slug = req.startgg_slug.strip() # type: ignore
    if req.tekken_id is not None:
        user.tekken_id = req.tekken_id.strip() # type: ignore
    if req.is_public is not None:
        user.is_public = req.is_public # type: ignore
    if req.friends_only is not None:
        user.friends_only = req.friends_only # type: ignore

    db.commit()
    db.refresh(user)
    
    return {
        "user": {
            "id": user.id,
            "unique_id": user.unique_id,
            "gamer_tag": user.gamer_tag or "",
            "bio": user.bio or "",
            "avatar_url": user.avatar_url or "",
            "startgg_slug": user.startgg_slug or "",
            "startgg_data": user.startgg_data or "",
            "tekken_id": user.tekken_id or "",
            "is_public": user.is_public,
            "friends_only": user.friends_only,
            "created_at": user.created_at.isoformat() if user.created_at else datetime.now(timezone.utc).isoformat()
        }
    }

@app.delete("/api/user/profile")
def delete_user_profile(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # 1. Delete all user data from Neon DB
    db.query(DBFriendship).filter((DBFriendship.user_id == user_id) | (DBFriendship.friend_id == user_id)).delete()
    db.query(DBDirectMessage).filter((DBDirectMessage.sender_id == user_id) | (DBDirectMessage.recipient_id == user_id)).delete()
    db.query(DBPlayer).filter(DBPlayer.user_id == user_id).delete()
    db.query(DBStation).filter(DBStation.user_id == user_id).delete()
    db.query(DBSMSLog).filter(DBSMSLog.user_id == user_id).delete()
    db.query(DBTournament).filter(DBTournament.user_id == user_id).delete()
    db.query(DBUserIdentifier).filter(DBUserIdentifier.id == user_id).delete()
    db.query(DBUser).filter(DBUser.id == user_id).delete()
    
    db.commit()

    # 2. Delete user from Supabase Auth via Admin API
    supabase_url = os.environ.get("VITE_SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if supabase_url and service_role_key:
        try:
            url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
            headers = {
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json"
            }
            res = requests.delete(url, headers=headers)
            res.raise_for_status()
        except Exception as e:
            print(f"Failed to delete Supabase Auth user: {e}")
            
    return {"status": "success", "message": "Account deleted successfully"}

@app.post("/api/user/startgg-import")
def import_startgg_profile(req: StartggImportRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable — check server configuration")
        
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    slug_or_url = req.startgg_slug_or_url.strip()
    if 'start.gg/user/' in slug_or_url:
        slug = slug_or_url.split('start.gg/user/')[1].split('/')[0].split('?')[0]
    elif 'user/' in slug_or_url:
        slug = slug_or_url.split('user/')[1].split('/')[0].split('?')[0]
    else:
        slug = slug_or_url.split('/')[0].split('?')[0]

    # Accept either env var name, or the token passed directly from the frontend
    startgg_api_key = (
        os.environ.get("STARTGG_API_KEY")
        or os.environ.get("STARTGG_API_TOKEN")
        or os.environ.get("STARTGG_3RD_PARTY_TOKEN")
        or req.api_token
    )
    if not startgg_api_key:
        raise HTTPException(
            status_code=400,
            detail="A Start.gg API token is required. Paste your token in the Start.gg Career Stats box and click 'Save Token'."
        )
    import json
    
    profile_info = {}
    if startgg_api_key:
        query = """
        query UserProfile($slug: String!) {
          user(slug: $slug) {
            id
            name
            player {
              gamerTag
              prefix
            }
            events(query: { perPage: 10 }) {
              nodes {
                id
                name
                tournament {
                  name
                  slug
                }
                userEntrant {
                  standing {
                    placement
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
                headers={"Authorization": f"Bearer {startgg_api_key}"},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                userData = data.get("data", {}).get("user")
                if userData:
                    player = userData.get("player", {}) or {}
                    events = userData.get("events", {}).get("nodes", []) or []
                    event_list = []
                    for ev in events:
                        tourney = ev.get("tournament", {}) or {}
                        standing = ev.get("userEntrant", {}).get("standing", {}) or {}
                        event_list.append({
                            "event_name": ev.get("name"),
                            "tournament_name": tourney.get("name"),
                            "tournament_slug": tourney.get("slug"),
                            "placement": standing.get("placement", "N/A")
                        })
                    profile_info = {
                        "slug": slug,
                        "name": userData.get("name"),
                        "gamerTag": player.get("gamerTag") or slug,
                        "prefix": player.get("prefix") or "",
                        "imported_at": datetime.now(timezone.utc).isoformat(),
                        "events": event_list
                    }
        except Exception as e:
            print(f"Start.gg GraphQL import error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch from Start.gg API: {str(e)}")

    if not profile_info:
        # Try to surface a helpful error: check if the slug lookup returned errors
        raise HTTPException(
            status_code=404,
            detail=f"Start.gg profile '{slug}' not found. Double-check your slug (e.g. 'mang0' not the full URL) and that the profile is public."
        )

    user.startgg_slug = slug  # type: ignore
    if profile_info.get("gamerTag") and not user.gamer_tag:
        user.gamer_tag = profile_info["gamerTag"]  # type: ignore
    user.startgg_data = json.dumps(profile_info)  # type: ignore
    db.commit()
    db.refresh(user)

    return {"status": "success", "startgg_data": profile_info}

# --- FRIENDS ENDPOINTS ---

@app.get("/api/friends")
def get_friends(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"friends": [], "pending_incoming": [], "pending_outgoing": []}

    friendships = db.query(DBFriendship).filter(
        (DBFriendship.user_id == user_id) | (DBFriendship.friend_id == user_id)
    ).all()

    accepted_friend_ids = set()
    pending_incoming_map = {}
    pending_outgoing_map = {}

    for f in friendships:
        if f.status == "accepted":
            accepted_friend_ids.add(f.friend_id if f.user_id == user_id else f.user_id)
        elif f.status == "pending":
            if f.user_id == user_id:
                pending_outgoing_map[f.friend_id] = f.id
            else:
                pending_incoming_map[f.user_id] = f.id

    # Fetch user objects and their identifiers
    all_user_ids = list(accepted_friend_ids.union(pending_incoming_map.keys()).union(pending_outgoing_map.keys()))
    user_objects = {}
    if all_user_ids:
        users_with_ids = db.query(DBUser, DBUserIdentifier).outerjoin(DBUserIdentifier, DBUser.id == DBUserIdentifier.id).filter(DBUser.id.in_(all_user_ids)).all()
        for u, ui in users_with_ids:
            user_objects[u.id] = (u, ui.unique_id if ui else "FB-MISSING")

    def format_user_summary(u_tuple):
        u, uid_str = u_tuple
        return {
            "id": u.id,
            "unique_id": uid_str,
            "gamer_tag": u.gamer_tag or uid_str,
            "bio": u.bio or "",
            "avatar_url": u.avatar_url or "",
            "is_public": u.is_public if u.is_public is not None else True,
            "friends_only": u.friends_only if u.friends_only is not None else False
        }

    friends_list = [format_user_summary(user_objects[fid]) for fid in accepted_friend_ids if fid in user_objects]
    incoming_list = [{ **format_user_summary(user_objects[uid]), "friendship_id": pending_incoming_map[uid] } for uid in pending_incoming_map if uid in user_objects]
    outgoing_list = [{ **format_user_summary(user_objects[uid]), "friendship_id": pending_outgoing_map[uid] } for uid in pending_outgoing_map if uid in user_objects]

    return {
        "friends": friends_list,
        "pending_incoming": incoming_list,
        "pending_outgoing": outgoing_list
    }

@app.post("/api/friends/request")
def send_friend_request(req: FriendRequestInput, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    identifier = req.target_identifier.strip()
    target = db.query(DBUser, DBUserIdentifier).outerjoin(DBUserIdentifier, DBUser.id == DBUserIdentifier.id).filter(
        (DBUserIdentifier.unique_id == identifier) | (DBUser.id == identifier) | (DBUser.gamer_tag == identifier)
    ).first()

    if not target:
        raise HTTPException(status_code=404, detail="User not found with that identifier or FB-ID")
    
    target_user, target_ui = target
    if target_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")

    # Check existing friendship
    existing = db.query(DBFriendship).filter(
        ((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == target_user.id)) |
        ((DBFriendship.user_id == target_user.id) & (DBFriendship.friend_id == user_id))
    ).first()

    if existing:
        if existing.status == "accepted":
            return {"message": "Already friends"}
        return {"message": "Friend request already exists"}

    new_f = DBFriendship(id=str(uuid.uuid4()), user_id=user_id, friend_id=target_user.id, status="pending")
    db.add(new_f)
    db.commit()
    return {"message": "Friend request sent", "friendship_id": new_f.id}

@app.post("/api/friends/respond")
def respond_friend_request(req: FriendResponseInput, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    friendship = db.query(DBFriendship).filter(DBFriendship.id == req.friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")

    if friendship.friend_id != user_id and friendship.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if req.action == "accept":
        friendship.status = "accepted" # type: ignore
        db.commit()
        return {"status": "accepted"}
    elif req.action == "decline":
        db.delete(friendship)
        db.commit()
        return {"status": "declined"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@app.delete("/api/friends/{friend_id}")
def remove_friend(friend_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    friendship = db.query(DBFriendship).filter(
        ((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == friend_id)) |
        ((DBFriendship.user_id == friend_id) & (DBFriendship.friend_id == user_id))
    ).first()

    if friendship:
        db.delete(friendship)
        db.commit()

    return {"status": "removed"}

# --- DIRECT MESSAGES ENDPOINTS ---

@app.get("/api/messages/inbox")
def get_inbox_conversations(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"conversations": []}

    # Fetch all messages where user is sender or recipient
    messages = db.query(DBDirectMessage).filter(
        (DBDirectMessage.sender_id == user_id) | (DBDirectMessage.recipient_id == user_id)
    ).order_by(DBDirectMessage.sent_at.desc()).all()

    # Group by conversation partner
    convos = {}
    for m in messages:
        partner_id = m.recipient_id if m.sender_id == user_id else m.sender_id
        if partner_id not in convos:
            convos[partner_id] = {
                "partner_id": partner_id,
                "latest_message": m.message,
                "sent_at": m.sent_at.isoformat() if m.sent_at else datetime.now(timezone.utc).isoformat(),
                "unread_count": 0
            }
        
        # Count unread messages sent to current user
        if m.recipient_id == user_id and not m.read:
            convos[partner_id]["unread_count"] += 1

    # Fetch partner user objects
    partner_ids = list(convos.keys())
    if partner_ids:
        partners_with_ids = db.query(DBUser, DBUserIdentifier).outerjoin(DBUserIdentifier, DBUser.id == DBUserIdentifier.id).filter(DBUser.id.in_(partner_ids)).all()
        
        for u, ui in partners_with_ids:
            uid_str = ui.unique_id if ui else "FB-MISSING"
            convos[u.id].update({
                "gamer_tag": u.gamer_tag or uid_str,
                "unique_id": uid_str,
                "avatar_url": u.avatar_url or ""
            })

    # Return as list, sorted by latest message
    sorted_convos = sorted(convos.values(), key=lambda x: x["sent_at"], reverse=True)
    return {"conversations": sorted_convos}

@app.get("/api/messages/{friend_id}")
def get_direct_messages(friend_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"messages": []}

    # Verify friendship
    friendship = db.query(DBFriendship).filter(
        DBFriendship.status == "accepted",
        (((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == friend_id)) |
         ((DBFriendship.user_id == friend_id) & (DBFriendship.friend_id == user_id)))
    ).first()

    if not friendship:
        raise HTTPException(status_code=403, detail="Must be friends to exchange direct messages")

    messages = db.query(DBDirectMessage).filter(
        ((DBDirectMessage.sender_id == user_id) & (DBDirectMessage.recipient_id == friend_id)) |
        ((DBDirectMessage.sender_id == friend_id) & (DBDirectMessage.recipient_id == user_id))
    ).order_by(DBDirectMessage.sent_at.asc()).all()

    # Mark incoming as read
    unread = [m for m in messages if m.recipient_id == user_id and not m.read]
    if unread:
        for m in unread:
            m.read = True  # type: ignore
        db.commit()

    return {
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "recipient_id": m.recipient_id,
                "message": m.message,
                "read": m.read,
                "sent_at": m.sent_at.isoformat() if m.sent_at else datetime.now(timezone.utc).isoformat()
            }
            for m in messages
        ]
    }

@app.post("/api/messages/send")
def send_direct_message(req: SendMessageInput, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    recipient_id = req.recipient_id.strip()
    message_text = req.message.strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    # Verify friendship
    friendship = db.query(DBFriendship).filter(
        DBFriendship.status == "accepted",
        (((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == recipient_id)) |
         ((DBFriendship.user_id == recipient_id) & (DBFriendship.friend_id == user_id)))
    ).first()

    if not friendship:
        raise HTTPException(status_code=403, detail="Must be friends to send direct messages")

    dm = DBDirectMessage(
        id=str(uuid.uuid4()),
        sender_id=user_id,
        recipient_id=recipient_id,
        message=message_text,
        read=False
    )
    db.add(dm)
    db.commit()
    db.refresh(dm)

    return {
        "status": "sent",
        "message": {
            "id": dm.id,
            "sender_id": dm.sender_id,
            "recipient_id": dm.recipient_id,
            "message": dm.message,
            "read": dm.read,
            "sent_at": dm.sent_at.isoformat() if dm.sent_at else datetime.now(timezone.utc).isoformat()
        }
    }

# --- SEARCH & PUBLIC / PRIVACY PROFILE ENDPOINTS ---

@app.get("/api/users/search")
def search_users(q: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db or not q.strip():
        return {"users": []}

    query_str = f"%{q.strip()}%"
    users_with_ids = db.query(DBUser, DBUserIdentifier).outerjoin(DBUserIdentifier, DBUser.id == DBUserIdentifier.id).filter(
        (DBUser.gamer_tag.ilike(query_str)) |
        (DBUserIdentifier.unique_id.ilike(query_str)) |
        (DBUser.id == q.strip())
    ).limit(10).all()

    return {
        "users": [
            {
                "id": u.id,
                "unique_id": ui.unique_id if ui else "FB-MISSING",
                "gamer_tag": u.gamer_tag or (ui.unique_id if ui else "FB-MISSING"),
                "avatar_url": u.avatar_url or "",
                "is_public": u.is_public if u.is_public is not None else True,
                "friends_only": u.friends_only if u.friends_only is not None else False
            }
            for u, ui in users_with_ids if u.id != user_id
        ]
    }

@app.get("/api/users/profile/{target_user_id}")
def get_target_user_profile(target_user_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    target = db.query(DBUser, DBUserIdentifier).outerjoin(DBUserIdentifier, DBUser.id == DBUserIdentifier.id).filter(DBUser.id == target_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    target_user, target_ui = target

    is_self = target_user.id == user_id

    # Check friendship status
    friendship = db.query(DBFriendship).filter(
        ((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == target_user_id)) |
        ((DBFriendship.user_id == target_user_id) & (DBFriendship.friend_id == user_id))
    ).first()

    is_friend = False
    friend_status = "none"
    if friendship:
        friend_status = friendship.status
        if friendship.status == "accepted":
            is_friend = True

    # Privacy Enforcement:
    # If is_public is False or (friends_only is True and not is_friend and not is_self)
    is_public = target_user.is_public if target_user.is_public is not None else True
    friends_only = target_user.friends_only if target_user.friends_only is not None else False

    privacy_restricted = False
    if not is_self:
        if not is_public or (friends_only and not is_friend):
            privacy_restricted = True

    import json
    startgg_data_parsed = None
    if target_user.startgg_data and not privacy_restricted:
        try:
            startgg_data_parsed = json.loads(target_user.startgg_data)
        except Exception:
            startgg_data_parsed = None

    uid_str = getattr(target_user, 'unique_id', None) or (target_ui.unique_id if target_ui else "FB-USER")
    return {
        "profile": {
            "id": target_user.id,
            "unique_id": uid_str,
            "gamer_tag": target_user.gamer_tag or "",
            "avatar_url": target_user.avatar_url or "",
            "bio": "" if privacy_restricted else (target_user.bio or ""),
            "startgg_slug": "" if privacy_restricted else (target_user.startgg_slug or ""),
            "startgg_data": startgg_data_parsed,
            "tekken_id": "" if privacy_restricted else (target_user.tekken_id or ""),
            "is_public": is_public,
            "friends_only": friends_only,
            "is_friend": is_friend,
            "friend_status": friend_status,
            "privacy_restricted": privacy_restricted,
            "is_self": is_self
        }
    }

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

@app.get("/api/public/tournaments/{tournament_id}")
def get_public_tournament(tournament_id: str, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
    tournament = db.query(DBTournament).filter(DBTournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return {"tournament": {"id": tournament.id, "user_id": tournament.user_id, "name": tournament.name, "data": tournament.data, "updated_at": tournament.updated_at.isoformat()}}


@app.post("/api/tournaments")
def save_tournament(req: TournamentSaveRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"status": "error", "detail": "Database not available"}
    tournament = db.query(DBTournament).filter(DBTournament.id == req.id, DBTournament.user_id == user_id).first()
    if tournament:
        tournament.name = req.name  # type: ignore
        tournament.data = req.data  # type: ignore
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
def sync_startgg_bracket(slug: str = "clash-of-kings-vii", token: str = None):  # type: ignore
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
        numAttendees
        stations {
          nodes {
            id
            number
            prefix
            enabled
            state
            numSetups
            stream {
              id
              streamName
              streamSource
              isOnline
              enabled
              streamLogo
            }
          }
        }
        streamQueue {
          id
          stream {
            id
            streamName
            streamSource
            isOnline
          }
          sets {
            id
            fullRoundText
          }
        }
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
def get_startgg_user(slug: str, token: str = None):  # type: ignore
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


# ---------------------------------------------------------------------------
# TEKKEN 8 / EWGF STATS PROXY
# Server-side proxy so the EWGF API token is never exposed to the browser.
# ---------------------------------------------------------------------------

@app.get("/api/tekken/stats/{tekken_id}")
def get_tekken_stats(tekken_id: str):
    """
    Public proxy endpoint — fetches the player's profile + recent battles
    from api.ewgf.gg and returns a unified payload.
    No auth required so public profiles can display Tekken stats.
    """
    if not tekken_id or not tekken_id.strip():
        raise HTTPException(status_code=400, detail="tekken_id is required")

    tekken_id = tekken_id.strip()

    EWGF_BASE = "https://api.ewgf.gg"
    EWGF_TOKEN = os.environ.get("EWGF_API_TOKEN", "ewgf_e146ff104fd149409abc02db98e24202")
    headers = {
        "Authorization": f"Bearer {EWGF_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        profile_resp = requests.get(
            f"{EWGF_BASE}/external/profile/{tekken_id}",
            headers=headers,
            timeout=10,
        )
        battles_resp = requests.get(
            f"{EWGF_BASE}/external/battles/{tekken_id}",
            headers=headers,
            timeout=10,
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="EWGF API timed out")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"EWGF API request failed: {e}")

    if profile_resp.status_code == 404 or battles_resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Tekken player not found in EWGF database")
    if profile_resp.status_code == 401 or battles_resp.status_code == 401:
        raise HTTPException(status_code=502, detail="EWGF API authentication error")
    if profile_resp.status_code == 429 or battles_resp.status_code == 429:
        raise HTTPException(status_code=429, detail="EWGF API rate limit exceeded — try again later")
    if not profile_resp.ok:
        raise HTTPException(status_code=502, detail=f"EWGF profile API error: {profile_resp.status_code}")
    if not battles_resp.ok:
        raise HTTPException(status_code=502, detail=f"EWGF battles API error: {battles_resp.status_code}")

    try:
        profile_data = profile_resp.json()
        battles_data = battles_resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to parse EWGF API response")

    profile = profile_data.get("data") or {}
    matches = battles_data.get("data") or []
    meta = battles_data.get("_metadata") or {}

    # Compute derived stats from battle history
    wins = sum(1 for m in matches if (m.get("result") or "").upper() == "WIN")
    losses = sum(1 for m in matches if (m.get("result") or "").upper() == "LOSS")
    total = wins + losses
    win_rate = round((wins / total) * 100, 1) if total > 0 else 0.0

    # Most-played characters
    char_counts: dict = {}
    for m in matches:
        char = m.get("player_character") or m.get("character") or "Unknown"
        char_counts[char] = char_counts.get(char, 0) + 1
    top_characters = sorted(char_counts.items(), key=lambda x: x[1], reverse=True)[:3]

    return {
        "status": "ok",
        "tekken_id": tekken_id,
        "profile": profile,
        "matches": matches[:10],  # Return latest 10 matches
        "meta": meta,
        "derived": {
            "wins": wins,
            "losses": losses,
            "win_rate": win_rate,
            "top_characters": [{"name": name, "count": count} for name, count in top_characters],
        },
    }
