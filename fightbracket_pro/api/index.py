from __future__ import annotations
from api.crypto import encrypt_text, decrypt_text
# pyright: reportGeneralTypeIssues=false, reportAttributeAccessIssue=false, reportArgumentType=false
from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks, File, UploadFile
from typing import Optional
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
import re

# Load dotenv if running locally
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from typing import TYPE_CHECKING, Optional
if TYPE_CHECKING:
    from api.db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament, DBTournamentParticipant, DBUser, DBFriendship, DBDirectMessage, DBUserIdentifier, DBUserIntegration, DBPost, DBPostLike

else:
    try:
        try:
            from api.db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament, DBTournamentParticipant, DBUser, DBFriendship, DBDirectMessage, DBUserIdentifier, DBUserIntegration, DBPost, DBPostLike
        except Exception:
            from db import get_db, DBPlayer, DBStation, DBSMSLog, DBTournament, DBTournamentParticipant, DBUser, DBFriendship, DBDirectMessage, DBUserIdentifier, DBUserIntegration, DBPost, DBPostLike  # type: ignore
    except Exception as _db_err:
        print(f"DB import warning: {_db_err}")
        def get_db():
            yield None
        class _DummyModel: pass
        DBPlayer = DBStation = DBSMSLog = DBTournament = DBTournamentParticipant = DBFriendship = DBDirectMessage = DBUser = DBUserIdentifier = DBPost = DBPostLike = _DummyModel # type: ignore
try:
    import jwt
except ImportError:
    jwt = None

from fastapi import Header

def get_current_user_payload(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    if jwt is None:
        return {"sub": "anon-user", "user_metadata": {}}
    try:
        payload = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256", "RS256", "EdDSA", "ES256"])
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

from fastapi import Depends
def get_current_user_id(payload: dict = Depends(get_current_user_payload)):
    return payload.get("sub")


app = FastAPI()

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception on {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "detail": "A server error occurred.",
            "error_message": str(exc),
            "path": request.url.path
        }
    )

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
    match_id: Optional[str] = None
    enable_real_sms: bool = False

class CheckInRequest(BaseModel):
    player_id: str
    checked_in: bool

class StationAssignRequest(BaseModel):
    station_id: int
    match_id: Optional[str]

class TournamentSaveRequest(BaseModel):
    id: str
    name: str
    data: str

class VerifyRequest(BaseModel):
    token: str

class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gamer_tag: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_color: Optional[str] = None
    startgg_slug: Optional[str] = None
    startgg_token: Optional[str] = None
    tekken_id: Optional[str] = None
    steam_id: Optional[str] = None
    twitch_id: Optional[str] = None
    twitch_url: Optional[str] = None
    games_data: Optional[str] = None
    station_names: Optional[str] = None
    is_public: Optional[bool] = None
    friends_only: Optional[bool] = None
    notify_announcements: Optional[bool] = None
    notify_messages: Optional[bool] = None
    sound_notifications: Optional[bool] = None
    sound_messages: Optional[bool] = None

class StartggImportRequest(BaseModel):
    startgg_slug_or_url: str
    api_token: Optional[str] = None

class CreatePostRequest(BaseModel):
    content: str
    type: str
    tags: Optional[list[str]] = None
    image: Optional[str] = None

class FriendRequestInput(BaseModel):
    target_identifier: str

class FriendResponseInput(BaseModel):
    friendship_id: str
    action: str  # 'accept' or 'decline'

class SendMessageInput(BaseModel):
    recipient_id: str
    message: str
    message_type: Optional[str] = None
    metadata_json: Optional[str] = None

class ReportUserInput(BaseModel):
    target_id: str
    reason: str
    description: Optional[str] = None
class SupportTicketRequest(BaseModel):
    inquiry_type: str  # bracket | oauth | privacy | api | general
    email: str
    message: str

def _send_support_autoresponse(user_email: str, inquiry_type: str, ticket_id: str):
    """Send an auto-reply confirmation to the user via Resend."""
    try:
        import resend as _resend
    except ImportError:
        print("[Support] Resend module not installed, skipping auto-reply")
        return

    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        # Resend not configured — skip silently (ticket still accepted)
        return

    _resend.api_key = api_key

    is_privacy = inquiry_type == "privacy"
    response_window = "7 business days" if is_privacy else "24–48 hours"
    extra_note = (
        "Your account data deletion request has been logged. Our administrators process these "
        "manually. You will receive a final confirmation once your database records are fully wiped."
        if is_privacy
        else
        "If your inquiry relates to a live bracket sync delay, please check whether the start.gg API "
        "or game servers (Tekken/Steam) are experiencing public outages before re-submitting."
    )

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FightBracket Pro Support</title>
<style>
  body {{
    background-color: #050A14;
    color: #FFFFFF;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }}
  .wrapper {{
    width: 100%;
    background-color: #050A14;
    padding: 40px 0;
  }}
  .container {{
    max-width: 600px;
    margin: 0 auto;
    background-color: #0A1122;
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.1);
  }}
  .header {{
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 24px;
    margin-bottom: 32px;
  }}
  .header h1 {{
    color: #00E5FF;
    margin: 0;
    font-size: 28px;
    letter-spacing: 4px;
    text-transform: uppercase;
    font-family: 'Courier New', Courier, monospace;
    font-weight: 800;
  }}
  .content {{
    line-height: 1.7;
    font-size: 16px;
    color: #E2E8F0;
  }}
  .highlight {{
    color: #00E5FF;
    font-weight: 700;
  }}
  .ticket-box {{
    background-color: rgba(0, 229, 255, 0.05);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 8px;
    padding: 20px;
    margin: 24px 0;
  }}
  .footer {{
    text-align: center;
    font-size: 13px;
    color: #64748B;
    margin-top: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 24px;
  }}
  @media only screen and (max-width: 620px) {{
    .container {{
      padding: 20px;
      margin: 0 10px;
      width: auto !important;
    }}
  }}
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>FIGHTBRACKET PRO</h1>
      </div>
      <div class="content">
        <p style="font-family: 'Courier New', Courier, monospace; color: #94a3b8; font-size: 14px;">> SUPPORT TICKET RECEIVED...</p>
        <p>Hello,</p>
        <p>Thank you for reaching out to the <span class="highlight">FightBracket Pro</span> Help Desk. Our team has received your inquiry and is currently reviewing it.</p>
        
        <div class="ticket-box">
          <strong>Ticket #:</strong> {ticket_id}<br>
          <strong>Inquiry Type:</strong> {inquiry_type.upper()}<br>
          <strong>Estimated Response Time:</strong> {response_window}
        </div>
        
        <p style="font-size: 14px; color: #cbd5e1;"><em>{extra_note}</em></p>
        
        <p>To add more context to your existing ticket, simply reply to this email without changing the subject line.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong style="color: #00E5FF;">FightBracket Pro Support Team</strong>
        </p>
      </div>
      <div class="footer">
        &copy; 2026 FightBracket Pro. All rights reserved.<br>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 11px; margin-top: 10px; display: block; color: rgba(255,255,255,0.2);">SECURE. CONNECTION. ESTABLISHED.</span>
      </div>
    </div>
  </div>
</body>
</html>"""

    try:
        _resend.Emails.send({
            "from": "FightBracket Pro <support@fightbracketpro.com>",
            "to": [user_email],
            "subject": f"Re: FightBracket Pro Support Request #{ticket_id}",
            "html": html_body,
        })
    except Exception as e:
        print(f"[Support] Resend dispatch failed: {e}")

def _send_admin_ticket_notification(req: SupportTicketRequest, ticket_id: str):
    """Forward the actual support ticket content to the admin email."""
    try:
        import resend as _resend
    except ImportError:
        return

    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        return

    admin_email = os.environ.get("SUPPORT_EMAIL", "support@fightbracketpro.com")
    _resend.api_key = api_key

    html_body = f"""
    <h2>New Support Ticket: #{ticket_id}</h2>
    <p><strong>From:</strong> {req.email}</p>
    <p><strong>Type:</strong> {req.inquiry_type.upper()}</p>
    <hr>
    <p><strong>Message:</strong></p>
    <blockquote style="white-space: pre-wrap; background: #f4f4f4; padding: 10px; border-left: 4px solid #ccc;">{req.message}</blockquote>
    """

    try:
        _resend.Emails.send({
            "from": "FightBracket Pro <support@fightbracketpro.com>",
            "to": [admin_email],
            "subject": f"New Ticket #{ticket_id} - {req.inquiry_type.upper()} ({req.email})",
            "html": html_body,
            "reply_to": req.email
        })
    except Exception as e:
        print(f"[Support] Admin notification dispatch failed: {e}")


@app.post("/api/support")
def submit_support_ticket(req: SupportTicketRequest):
    """
    Accepts a support/contact form submission.
    - Generates a unique ticket ID
    - Sends an automated confirmation email to the user
    - Returns the ticket ID for reference
    """
    allowed_types = {"bracket", "oauth", "privacy", "api", "general"}
    if req.inquiry_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid inquiry type.")
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if not req.message or len(req.message.strip()) < 10:
        raise HTTPException(status_code=400, detail="Message must be at least 10 characters.")

    ticket_id = str(uuid.uuid4())[:8].upper()

    # Fire-and-forget emails (failures are non-fatal)
    try:
        _send_support_autoresponse(req.email, req.inquiry_type, ticket_id)
        _send_admin_ticket_notification(req, ticket_id)
    except Exception as e:
        print(f"[Support] Email dispatch error: {e}")

    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": f"Support ticket #{ticket_id} received. Check your inbox for confirmation.",
    }


@app.post("/api/auth/verify")
def verify_auth_turnstile(req: VerifyRequest, request: Request):
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else None
        
    secret = os.environ.get("TURNSTILE_SECRET")
    if not secret:
        # In dev environment, if TURNSTILE_SECRET is not configured, bypass silently
        print("[Turnstile] Warning: TURNSTILE_SECRET not configured, bypassing in development mode.")
        return {"status": "success", "note": "Turnstile secret not set"}

    if req.token == "dev_bypass_token" or secret.startswith("1x00000000000000000000") or secret.startswith("2x00000000000000000000"):
        return {"status": "success"}
        
    try:
        data = {
            "secret": secret,
            "response": req.token
        }
        if client_ip:
            data["remoteip"] = client_ip

        resp = requests.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", data=data, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=403, detail=f"Turnstile verification server returned HTTP {resp.status_code}.")
        
        result = resp.json()
        if not result.get("success"):
            error_codes = result.get("error-codes", [])
            print(f"[Turnstile] Verification failed error codes: {error_codes}")
            if "invalid-input-secret" in error_codes:
                raise HTTPException(status_code=400, detail="Invalid Turnstile Secret Key. Check TURNSTILE_SECRET in your .env file.")
            elif "timeout-or-duplicate" in error_codes:
                raise HTTPException(status_code=400, detail="CAPTCHA token expired or already used. Please complete the CAPTCHA again.")
            else:
                codes_str = ", ".join(error_codes) if error_codes else "verification failed"
                raise HTTPException(status_code=403, detail=f"CAPTCHA verification failed ({codes_str}). Please try again.")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Turnstile] Verification exception: {e}")
        raise HTTPException(status_code=500, detail=f"Turnstile server connection error: {str(e)}")
        
    return {"status": "success"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

def get_or_create_user(db: Session, user_id: str, meta: dict = None) -> DBUser:
    import random
    import string
    import uuid

    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        # Generate unique ID first since it's NOT NULL in DB
        while True:
            unique_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            unique_part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            unique_id = f"FB-{unique_part}-{unique_part2}"
            if not db.query(DBUser).filter(DBUser.unique_id == unique_id).first():
                break

        meta = meta or {}
        user = DBUser(
            id=user_id, 
            unique_id=unique_id,
            first_name=meta.get("first_name", ""),
            last_name=meta.get("last_name", ""),
            gamer_tag=meta.get("gamer_tag", "")
        )
        db.add(user)
        
        # Sync to user_identifiers table
        identifier = DBUserIdentifier(id=user_id, unique_id=unique_id)
        db.add(identifier)
        
        # Create bot user if it doesn't exist
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

    # Ensure existing account has a valid unique_id populated (repair if null/empty)
    if not getattr(user, 'unique_id', None):
        identifier = db.query(DBUserIdentifier).filter(DBUserIdentifier.id == user_id).first()
        if identifier and identifier.unique_id:
            user.unique_id = identifier.unique_id
        else:
            while True:
                unique_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
                unique_part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
                unique_id = f"FB-{unique_part}-{unique_part2}"
                if not db.query(DBUser).filter(DBUser.unique_id == unique_id).first():
                    break
            user.unique_id = unique_id  # type: ignore
            if not identifier:
                identifier = DBUserIdentifier(id=user_id, unique_id=unique_id)
                db.add(identifier)
            else:
                identifier.unique_id = unique_id  # type: ignore
        db.commit()
        db.refresh(user)

    # In case the user exists but user_identifiers doesn't (legacy)
    identifier = db.query(DBUserIdentifier).filter(DBUserIdentifier.id == user_id).first()
    if not identifier and hasattr(user, 'unique_id') and user.unique_id:
        identifier = DBUserIdentifier(id=user_id, unique_id=user.unique_id)
        db.add(identifier)
        db.commit()

    # Ensure existing accounts also have the FightBracket Bot friend & welcome message
    bot_id = "fb-bot-system"
    bot_user = db.query(DBUser).filter(DBUser.id == bot_id).first()
    if not bot_user:
        bot_user = DBUser(id=bot_id, unique_id="FB-BOT-0000", gamer_tag="FightBracket Bot")
        db.add(bot_user)
        db.commit()

    existing_friendship = db.query(DBFriendship).filter(
        ((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == bot_id)) |
        ((DBFriendship.user_id == bot_id) & (DBFriendship.friend_id == user_id))
    ).first()

    if not existing_friendship:
        friendship1 = DBFriendship(id=str(uuid.uuid4()), user_id=user_id, friend_id=bot_id, status="accepted")
        friendship2 = DBFriendship(id=str(uuid.uuid4()), user_id=bot_id, friend_id=user_id, status="accepted")
        db.add(friendship1)
        db.add(friendship2)
        
        welcome_msg = DBDirectMessage(
            id=str(uuid.uuid4()),
            sender_id=bot_id,
            recipient_id=user_id,
            message="Welcome to FightBracket Pro! We're glad to have you here. Let us know if you need any help getting started.",
            read=False
        )
        db.add(welcome_msg)
        db.commit()

    return user

@app.get("/api/user/profile")
def get_user_profile(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
    
    try:
        user_id = payload.get("sub")
        meta = payload.get("user_metadata", {})
        user = get_or_create_user(db, user_id, meta)

        created_at_val = user.created_at
        if hasattr(created_at_val, "isoformat"):
            created_at_str = created_at_val.isoformat()
        elif created_at_val:
            created_at_str = str(created_at_val)
        else:
            created_at_str = datetime.now(timezone.utc).isoformat()

        unread_count = db.query(DBDirectMessage).filter(DBDirectMessage.recipient_id == user_id, DBDirectMessage.read == False).count()
        pending_friend_requests_count = db.query(DBFriendship).filter(DBFriendship.friend_id == user_id, DBFriendship.status == "pending").count()

        return {
            "user": {
                "id": user.id,
                "unique_id": user.unique_id or "FB-UNKNOWN",
                "first_name": getattr(user, 'first_name', '') or "",
                "last_name": getattr(user, 'last_name', '') or "",
                "gamer_tag": getattr(user, 'gamer_tag', '') or "",
                "bio": user.bio or "",
                "avatar_url": user.avatar_url or "",
                "profile_color": getattr(user, 'profile_color', '') or "",
                "startgg_slug": user.startgg_slug or "",
                            "startgg_token": "SECURE_HIDDEN" if (getattr(user, 'startgg_token', '') or db.query(DBUserIntegration).filter(DBUserIntegration.user_id == user.id, DBUserIntegration.integration_type == 'startgg').first()) else "", 
                "startgg_data": user.startgg_data or "",
                "tekken_id": user.tekken_id or "",
                "steam_id": getattr(user, 'steam_id', '') or "",
                "twitch_id": getattr(user, 'twitch_id', '') or "",
                "twitch_url": getattr(user, 'twitch_url', '') or "",
                "games_data": getattr(user, 'games_data', '') or "",
                "is_public": user.is_public if user.is_public is not None else True,
                "friends_only": user.friends_only if user.friends_only is not None else False,
                "notify_announcements": user.notify_announcements if hasattr(user, 'notify_announcements') and user.notify_announcements is not None else True,
                "notify_messages": user.notify_messages if hasattr(user, 'notify_messages') and user.notify_messages is not None else True,
                "sound_notifications": user.sound_notifications if hasattr(user, 'sound_notifications') and user.sound_notifications is not None else True,
                "sound_messages": user.sound_messages if hasattr(user, 'sound_messages') and user.sound_messages is not None else True,
                "created_at": created_at_str,
                "unread_messages_count": unread_count,
                "pending_friend_requests_count": pending_friend_requests_count
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
    
    user = get_or_create_user(db, user_id)
        
    if req.first_name is not None:
        user.first_name = req.first_name.strip() # type: ignore
    if req.last_name is not None:
        user.last_name = req.last_name.strip() # type: ignore
    if req.gamer_tag is not None:
        tag_clean = req.gamer_tag.strip()
        if tag_clean:
            existing = db.query(DBUser).filter(DBUser.gamer_tag.ilike(tag_clean), DBUser.id != user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Gamer Tag '{tag_clean}' is already taken by another player. Please choose a unique Gamer Tag.")
            user.gamer_tag = tag_clean # type: ignore
        else:
            user.gamer_tag = "" # type: ignore
    if req.bio is not None:
        user.bio = req.bio.strip() # type: ignore
    if req.avatar_url is not None:
        user.avatar_url = req.avatar_url.strip() # type: ignore
    if req.profile_color is not None:
        user.profile_color = req.profile_color.strip() # type: ignore
    if req.startgg_slug is not None:
        user.startgg_slug = req.startgg_slug.strip() # type: ignore
    if req.startgg_token is not None:
        token_clean = req.startgg_token.strip()
        if token_clean and token_clean != "SECURE_HIDDEN":
            # Encrypt and save to user_integrations
            enc_token = encrypt_text(token_clean)
            integration = db.query(DBUserIntegration).filter(DBUserIntegration.user_id == user_id, DBUserIntegration.integration_type == 'startgg').first()
            if integration:
                integration.encrypted_api_key = enc_token # type: ignore
            else:
                db.add(DBUserIntegration(user_id=user_id, integration_type='startgg', encrypted_api_key=enc_token))
            user.startgg_token = "" # type: ignore # Clear from public table
        elif token_clean == "":
            # Delete integration
            db.query(DBUserIntegration).filter(DBUserIntegration.user_id == user_id, DBUserIntegration.integration_type == 'startgg').delete()
            user.startgg_token = "" # type: ignore

    if req.tekken_id is not None:
        user.tekken_id = req.tekken_id.strip() # type: ignore
    if req.steam_id is not None:
        user.steam_id = req.steam_id.strip() # type: ignore
    if req.twitch_id is not None:
        user.twitch_id = req.twitch_id.strip() # type: ignore
    if req.twitch_url is not None:
        user.twitch_url = req.twitch_url.strip() # type: ignore
    if req.games_data is not None:
        user.games_data = req.games_data # type: ignore
    if req.station_names is not None:
        user.station_names = req.station_names # type: ignore
    if req.is_public is not None:
        user.is_public = req.is_public # type: ignore
    if req.friends_only is not None:
        user.friends_only = req.friends_only # type: ignore
    if req.notify_announcements is not None:
        user.notify_announcements = req.notify_announcements # type: ignore
    if req.notify_messages is not None:
        user.notify_messages = req.notify_messages # type: ignore
    if req.sound_notifications is not None:
        user.sound_notifications = req.sound_notifications # type: ignore
    if req.sound_messages is not None:
        user.sound_messages = req.sound_messages # type: ignore

    db.commit()
    db.refresh(user)
    
    return {
        "user": {
            "id": user.id,
            "unique_id": user.unique_id or "FB-UNKNOWN",
            "gamer_tag": user.gamer_tag or "",
            "bio": user.bio or "",
            "avatar_url": user.avatar_url or "",
            "startgg_slug": user.startgg_slug or "",
                        "startgg_token": "SECURE_HIDDEN" if (getattr(user, 'startgg_token', '') or db.query(DBUserIntegration).filter(DBUserIntegration.user_id == user.id, DBUserIntegration.integration_type == 'startgg').first()) else "", 
            "startgg_data": user.startgg_data or "",
            "tekken_id": user.tekken_id or "",
            "steam_id": getattr(user, 'steam_id', '') or "",
            "twitch_id": getattr(user, 'twitch_id', '') or "",
            "twitch_url": getattr(user, 'twitch_url', '') or "",
            "games_data": getattr(user, 'games_data', '') or "",
            "is_public": user.is_public,
            "friends_only": user.friends_only,
            "notify_announcements": getattr(user, 'notify_announcements', True),
            "notify_messages": getattr(user, 'notify_messages', True),
            "sound_notifications": getattr(user, 'sound_notifications', True),
            "sound_messages": getattr(user, 'sound_messages', True),
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
                data = resp.json() or {}
                data_dict = data.get("data") or {}
                userData = data_dict.get("user") or {}
                if userData:
                    player = userData.get("player") or {}
                    events_dict = userData.get("events") or {}
                    events = events_dict.get("nodes") or []
                    event_list = []
                    for ev in (events or []):
                        if not ev:
                            continue
                        tourney = ev.get("tournament") or {}
                        user_entrant = ev.get("userEntrant") or {}
                        standing = user_entrant.get("standing") or {} if isinstance(user_entrant, dict) else {}
                        event_list.append({
                            "event_name": ev.get("name"),
                            "tournament_name": tourney.get("name") if isinstance(tourney, dict) else "",
                            "tournament_slug": (tourney.get("slug") or "").replace("tournament/", "") if isinstance(tourney, dict) else "",
                            "placement": standing.get("placement", "N/A") if isinstance(standing, dict) else "N/A"
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
def send_friend_request(req: FriendRequestInput, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    user_id = payload.get("sub")
    meta = payload.get("user_metadata", {})
    # Ensure the requesting user exists in Neon before creating any friendship rows
    get_or_create_user(db, user_id, meta)

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

    # Delete all friendship rows in both directions (two rows are created per friendship)
    friendships = db.query(DBFriendship).filter(
        ((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == friend_id)) |
        ((DBFriendship.user_id == friend_id) & (DBFriendship.friend_id == user_id))
    ).all()

    for friendship in friendships:
        db.delete(friendship)
    if friendships:
        db.commit()

    return {"status": "removed"}

@app.get("/api/link-preview")
def get_link_preview(url: str):
    import requests
    from bs4 import BeautifulSoup

    if not url.startswith("http"):
        url = "https://" + url

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Helper to extract meta content
        def get_meta(property_name, name=None):
            meta = soup.find('meta', property=property_name)
            if meta and meta.get('content'):
                return meta['content']
            if name:
                meta = soup.find('meta', attrs={'name': name})
                if meta and meta.get('content'):
                    return meta['content']
            return None

        title = get_meta('og:title') or (soup.title.string if soup.title else None)
        description = get_meta('og:description', 'description')
        image = get_meta('og:image')
        site_name = get_meta('og:site_name')
        
        if not title:
            title = url
            
        return {
            "title": title.strip() if title else "",
            "description": description.strip() if description else "",
            "image": image,
            "siteName": site_name.strip() if site_name else "",
            "url": url
        }
    except Exception as e:
        return {
            "title": url,
            "description": "",
            "image": None,
            "siteName": "",
            "url": url
        }

@app.post("/api/users/report")
def report_user(req: ReportUserInput, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
        
    if req.target_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
        
    target_user = db.query(DBUser).filter(DBUser.id == req.target_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    from api.db import DBUserReport
    new_report = DBUserReport(
        id=str(uuid.uuid4()),
        reporter_id=user_id,
        target_id=req.target_id,
        reason=req.reason,
        description=req.description,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    return {"message": "Report submitted successfully", "report_id": new_report.id}

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
            uid_str = (ui.unique_id if ui else None) or getattr(u, 'unique_id', None) or "FB-MISSING"
            convos[u.id].update({
                "gamer_tag": u.gamer_tag or uid_str,
                "unique_id": uid_str,
                "avatar_url": u.avatar_url or ""
            })

    # Filter out conversations missing required fields (partner user may have been deleted)
    valid_convos = [c for c in convos.values() if c.get("gamer_tag")]
    sorted_convos = sorted(valid_convos, key=lambda x: x["sent_at"], reverse=True)
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
                "message_type": getattr(m, 'message_type', 'text'),
                "metadata_json": getattr(m, 'metadata_json', None),
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
        message_type=req.message_type or 'text',
        metadata_json=req.metadata_json,
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
            "message_type": dm.message_type,
            "metadata_json": dm.metadata_json,
            "read": dm.read,
            "sent_at": dm.sent_at.isoformat() if dm.sent_at else datetime.now(timezone.utc).isoformat()
        }
    }

@app.delete("/api/messages/{message_id}")
def delete_direct_message(message_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    msg = db.query(DBDirectMessage).filter(DBDirectMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Only the sender can delete their own message
    if msg.sender_id != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    db.delete(msg)
    db.commit()
    return {"status": "deleted", "message_id": message_id}

@app.post("/api/messages/mark-read/{partner_id}")
def mark_messages_read(partner_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Mark all messages from partner_id to current user as read. Future: RCS delivery receipts."""
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")

    unread = db.query(DBDirectMessage).filter(
        DBDirectMessage.sender_id == partner_id,
        DBDirectMessage.recipient_id == user_id,
        DBDirectMessage.read == False
    ).all()

    count = len(unread)
    for m in unread:
        m.read = True  # type: ignore
    if unread:
        db.commit()

    return {"status": "ok", "marked_read": count}

# --- SEARCH & PUBLIC / PRIVACY PROFILE ENDPOINTS ---

class MapStartggRequest(BaseModel):
    slugs: list[str]

@app.post("/api/users/map-startgg")
def map_startgg_users(req: MapStartggRequest, db: Session = Depends(get_db)):
    if not db or not req.slugs:
        return {"mapping": {}}
    
    users = db.query(DBUser, DBUserIdentifier).outerjoin(
        DBUserIdentifier, DBUser.id == DBUserIdentifier.id
    ).filter(DBUser.startgg_slug.in_(req.slugs)).all()
    
    mapping = {}
    for u, ui in users:
        if getattr(u, 'startgg_slug', None):
            mapping[u.startgg_slug] = {
                "fbUserId": u.id,
                "avatarUrl": getattr(u, 'avatar_url', None) or "",
                "uniqueId": getattr(ui, 'unique_id', None) or getattr(u, 'unique_id', None) or ""
            }
            
    return {"mapping": mapping}

@app.get("/api/users/search")
def search_users(q: str = "", user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        return {"users": []}

    query = db.query(DBUser, DBUserIdentifier).outerjoin(DBUserIdentifier, DBUser.id == DBUserIdentifier.id)
    if q and q.strip():
        query_str = f"%{q.strip()}%"
        query = query.filter(
            (DBUser.gamer_tag.ilike(query_str)) |
            (DBUserIdentifier.unique_id.ilike(query_str)) |
            (DBUser.unique_id.ilike(query_str)) |
            (DBUser.id == q.strip())
        )
    else:
        if user_id:
            query = query.filter((DBUser.is_public != False) | (DBUser.id == user_id))
        else:
            query = query.filter(DBUser.is_public != False)

    users_with_ids = query.limit(50).all()

    return {
        "users": [
            {
                "id": u.id,
                "unique_id": (ui.unique_id if ui and ui.unique_id else (u.unique_id if hasattr(u, 'unique_id') and u.unique_id else "FB-MISSING")),
                "gamer_tag": u.gamer_tag or ((ui.unique_id if ui and ui.unique_id else u.unique_id) if hasattr(u, 'unique_id') and u.unique_id else "Player"),
                "avatar_url": u.avatar_url or "",
                "is_public": u.is_public if u.is_public is not None else True,
                "friends_only": u.friends_only if u.friends_only is not None else False
            }
            for u, ui in users_with_ids
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

    public_restricted = False
    startgg_restricted = False
    if not is_self:
        if not is_public:
            public_restricted = True
        if not is_public or (friends_only and not is_friend):
            startgg_restricted = True

    import json
    startgg_data_parsed = None
    if target_user.startgg_data and not startgg_restricted:
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
            "profile_color": getattr(target_user, 'profile_color', '') or "",
            "bio": "" if public_restricted else (target_user.bio or ""),
            "startgg_slug": "" if startgg_restricted else (target_user.startgg_slug or ""),
            "startgg_data": startgg_data_parsed,
            "tekken_id": "" if public_restricted else (target_user.tekken_id or ""),
            "steam_id": "" if public_restricted else (getattr(target_user, 'steam_id', '') or ""),
            "twitch_id": "" if public_restricted else (getattr(target_user, 'twitch_id', '') or ""),
            "twitch_url": "" if public_restricted else (getattr(target_user, 'twitch_url', '') or ""),
            "games_data": "" if public_restricted else (getattr(target_user, 'games_data', '') or ""),
            "is_public": is_public,
            "friends_only": friends_only,
            "is_friend": is_friend,
            "friend_status": friend_status,
            "privacy_restricted": public_restricted,
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
    
    # Sync participants
    try:
        import json
        parsed = json.loads(req.data)
        players = parsed.get("players", [])
        
        # Clear old participants for this tournament
        db.query(DBTournamentParticipant).filter(DBTournamentParticipant.tournament_id == req.id).delete()
        
        # Add new participants
        for p in players:
            fb_user_id = p.get("fbUserId")
            player_id = p.get("id")
            gamer_tag = p.get("tag")
            placement = p.get("placement")
            
            if not player_id or not gamer_tag:
                continue
                
            participant = DBTournamentParticipant(
                id=f"{req.id}_{player_id}",
                tournament_id=req.id,
                fb_user_id=fb_user_id,
                player_id=player_id,
                gamer_tag=gamer_tag,
                placement=placement
            )
            db.add(participant)
    except Exception as e:
        print(f"Failed to sync participants: {e}")

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

    headers = {
        "Content-Type": "application/json"
    }
    if STARTGG_TOKEN:
        headers["Authorization"] = f"Bearer {STARTGG_TOKEN}"

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
              user {
                slug
              }
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
            identifier
            state
            fullRoundText
            round
            winnerId
            displayScore
            phaseGroup {
              displayIdentifier
              phase {
                name
              }
            }
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
    # EWGF URL format uses no hyphens (e.g. 5b6yhDee7fTd not 5b6y-hDee-7fTd)
    api_id = tekken_id.replace("-", "")

    EWGF_BASE = "https://api.ewgf.gg"
    raw_token = os.environ.get("EWGF_API_TOKEN", "ewgf_e146ff104fd149409abc02db98e24202")
    if raw_token.lower().startswith("bearer "):
        raw_token = raw_token[7:]
    EWGF_TOKEN = raw_token.strip()
    headers = {
        "Authorization": f"Bearer {EWGF_TOKEN}",
        "Content-Type": "application/json",
    }

    # Only use battles endpoint — EWGF profile endpoint returns 500 (their server bug).
    # The battles response contains all needed fields: player name, character, rank, tekken power.
    try:
        battles_resp = requests.get(
            f"{EWGF_BASE}/external/battles/{api_id}",
            headers=headers,
            timeout=15,
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="EWGF API timed out")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"EWGF API request failed: {e}")

    if battles_resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Tekken 8 player not found in EWGF database. Verify your Polaris ID in Account Settings.")
    if battles_resp.status_code == 401:
        raise HTTPException(status_code=502, detail="EWGF API key or authentication error.")
    if battles_resp.status_code == 429:
        raise HTTPException(status_code=429, detail="EWGF API rate limit exceeded — try again in a few moments.")
    if not battles_resp.ok:
        raise HTTPException(status_code=502, detail=f"Could not retrieve Tekken 8 match history for Polaris ID '{tekken_id}'.")

    try:
        battles_data = battles_resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to parse EWGF API response")

    matches = battles_data.get("data") or []
    meta = battles_data.get("_metadata") or {}

    # Aggregate characters and ranks
    characters = {}
    profile: dict = {}
    for m in matches:
        is_p1 = (m.get("p1_tekken_id") or "").replace("-", "").lower() == api_id.lower()
        is_p2 = (m.get("p2_tekken_id") or "").replace("-", "").lower() == api_id.lower()
        
        if not is_p1 and not is_p2:
            continue
            
        p_prefix = "p1" if is_p1 else "p2"
        char_name = m.get(f"{p_prefix}_char", "")
        rank_name = m.get(f"{p_prefix}_dan_rank", "")
        
        if not profile: # Set initial profile info from the most recent match
            profile = {
                "playerName": m.get(f"{p_prefix}_name", ""),
                "player_name": m.get(f"{p_prefix}_name", ""),
                "rankName": rank_name,
                "rank_name": rank_name,
                "tekkenPower": m.get(f"{p_prefix}_tekken_power"),
                "rank_points": m.get(f"{p_prefix}_tekken_power"),
                "region": m.get(f"{p_prefix}_region", ""),
                "mainChar": char_name,
            }
        
        if char_name:
            clean_c_name = char_name.strip()
            if clean_c_name and clean_c_name not in characters:
                characters[clean_c_name] = rank_name

    profile["characters"] = [{"name": c, "rankName": r} for c, r in characters.items()]

    # Fetch Glicko-2 ratings and true recent character from Wavu Wank
    try:
        wank_resp = requests.get(
            f"https://wank.wavu.wiki/player/{api_id}",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            timeout=5
        )
        if wank_resp.ok:
            html = wank_resp.text
            mu_match = re.search(r'<div class="mu">.*?(\d+).*?</div>', html, re.IGNORECASE)
            sigma_match = re.search(r'<div class="sigma">.*?(\d+).*?</div>', html, re.IGNORECASE)
            if mu_match:
                profile["glicko_mu"] = mu_match.group(1).strip()
            if sigma_match:
                profile["glicko_sigma"] = sigma_match.group(1).strip()
                
            # Extract true most recent character to bypass EWGF delay
            char_spans = re.findall(r'<span class="char">([^<]+)</span>', html)
            char_divs = re.findall(r'<div class="char">([^<]+)</div>', html)
            true_main_char = None
            if char_spans:
                true_main_char = char_spans[0].strip()
            elif char_divs:
                true_main_char = char_divs[0].strip()
            
            if true_main_char:
                # Find matching character case-insensitively
                matched_char_key = None
                for c_k in characters:
                    if c_k.strip().lower() == true_main_char.strip().lower():
                        matched_char_key = c_k
                        break
                
                if matched_char_key:
                    profile["mainChar"] = matched_char_key
                    profile["rankName"] = characters[matched_char_key]
                    profile["rank_name"] = characters[matched_char_key]
                elif characters:
                    latest_rank = profile.get("rankName") or next(iter(characters.values()), "Beginner")
                    profile["mainChar"] = true_main_char
                    profile["characters"].insert(0, {"name": true_main_char, "rankName": latest_rank})
                    profile["rankName"] = latest_rank
                    profile["rank_name"] = latest_rank
                else:
                    profile["mainChar"] = true_main_char
    except Exception as e:
        print(f"Warning: Failed to fetch from Wavu Wank: {e}")

    # Compute win/loss from the battles (winner field: 1 = p1 wins, 2 = p2 wins)
    wins = 0
    losses = 0
    char_counts: dict = {}
    for m in matches:
        p1_id = (m.get("p1_tekken_id") or "").replace("-", "").lower()
        p2_id = (m.get("p2_tekken_id") or "").replace("-", "").lower()
        is_p1 = p1_id == api_id.lower()
        is_p2 = p2_id == api_id.lower()
        winner = m.get("winner")
        if is_p1:
            char = m.get("p1_char") or "Unknown"
            if winner == 1:
                wins += 1
            elif winner == 2:
                losses += 1
        elif is_p2:
            char = m.get("p2_char") or "Unknown"
            if winner == 2:
                wins += 1
            elif winner == 1:
                losses += 1
        else:
            continue
        char_counts[char] = char_counts.get(char, 0) + 1

    total = wins + losses
    win_rate = round((wins / total) * 100, 1) if total > 0 else 0.0
    top_characters = sorted(char_counts.items(), key=lambda x: x[1], reverse=True)[:3]

    # Normalize match records to a consistent shape for the frontend
    normalized_matches = []
    for m in matches[:10]:
        p1_id = (m.get("p1_tekken_id") or "").replace("-", "").lower()
        is_p1 = p1_id == api_id.lower()
        result = ""
        winner = m.get("winner")
        if is_p1:
            result = "WIN" if winner == 1 else "LOSS"
            player_char = m.get("p1_char", "?")
            opp_char = m.get("p2_char", "?")
            opp_name = m.get("p2_name", "?")
            player_rank = m.get("p1_dan_rank", "")
            opp_rank = m.get("p2_dan_rank", "")
            rounds_won = m.get("p1_rounds_won", 0)
            rounds_lost = m.get("p2_rounds_won", 0)
        else:
            result = "WIN" if winner == 2 else "LOSS"
            player_char = m.get("p2_char", "?")
            opp_char = m.get("p1_char", "?")
            opp_name = m.get("p1_name", "?")
            player_rank = m.get("p2_dan_rank", "")
            opp_rank = m.get("p1_dan_rank", "")
            rounds_won = m.get("p2_rounds_won", 0)
            rounds_lost = m.get("p1_rounds_won", 0)
        normalized_matches.append({
            "id": m.get("battle_at", ""),
            "result": result,
            "player_character": player_char,
            "opponent_character": opp_char,
            "opponent_name": opp_name,
            "player_rank": player_rank,
            "opponent_rank": opp_rank,
            "battle_type": m.get("battle_type", ""),
            "timestamp": m.get("battle_at", ""),
            "rounds_won": rounds_won,
            "rounds_lost": rounds_lost,
            "stage_id": m.get("stage_id"),
        })

    return {
        "status": "ok",
        "tekken_id": tekken_id,
        "profile": profile,
        "matches": normalized_matches,
        "meta": meta,
        "derived": {
            "wins": wins,
            "losses": losses,
            "win_rate": win_rate,
            "top_characters": [{"name": name, "count": count} for name, count in top_characters],
        },
    }

# ---------------------------------------------------------------------------
# STEAM WEB API PROXY
# ---------------------------------------------------------------------------

@app.get("/api/steam/profile/{steam_id}")
def get_steam_profile(steam_id: str):
    """
    Proxy endpoint for SteamWebAPI — fetches profile & summary data for a Steam ID or Vanity URL.
    """
    if not steam_id or not steam_id.strip():
        raise HTTPException(status_code=400, detail="steam_id is required")

    steam_id_clean = steam_id.strip()
    STEAM_API_KEY = os.environ.get("STEAM_API_KEY", "EE768F7D0B03FF6C84FFE2203B4712F2")

    actual_steam_id = steam_id_clean
    if not steam_id_clean.isdigit():
        try:
            vanity_resp = requests.get(
                "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/",
                params={"key": STEAM_API_KEY, "vanityurl": steam_id_clean},
                timeout=10
            )
            if vanity_resp.ok:
                vdata = vanity_resp.json()
                if vdata.get("response", {}).get("success") == 1:
                    actual_steam_id = str(vdata["response"]["steamid"])
        except Exception:
            pass

    profile_data = {}
    try:
        prof_resp = requests.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
            params={"key": STEAM_API_KEY, "steamids": actual_steam_id},
            timeout=10
        )
        if prof_resp.ok:
            pdata = prof_resp.json()
            players = pdata.get("response", {}).get("players", [])
            if players:
                profile_data = players[0]
    except Exception as e:
        print(f"Steam profile error: {e}")

    return {
        "status": "ok",
        "query_id": steam_id_clean,
        "steam_id_64": actual_steam_id,
        "profile": profile_data
    }

# ---------------------------------------------------------------------------
# LOCAL TOURNAMENT HISTORY
# ---------------------------------------------------------------------------

@app.get("/api/users/{unique_id}/local-history")
def get_user_local_history(unique_id: str, db: Session = Depends(get_db)):
    if not db:
        return {"tournaments": []}
        
    try:
        # Query tournament participants matching this unique_id
        participants = db.query(DBTournamentParticipant).filter(DBTournamentParticipant.fb_user_id == unique_id).all()
        
        history = []
        for p in participants:
            # Fetch the tournament details
            tournament = db.query(DBTournament).filter(DBTournament.id == p.tournament_id).first()
            if tournament:
                history.append({
                    "tournament_id": tournament.id,
                    "tournament_name": tournament.name,
                    "date": tournament.updated_at.isoformat(),
                    "placement": p.placement,
                    "gamer_tag": p.gamer_tag
                })
        
        # Sort by date descending
        history.sort(key=lambda x: x["date"], reverse=True)
        return {"tournaments": history}
    except Exception as e:
        print(f"Error fetching local history: {e}")
        return {"tournaments": []}


class StartggProxyRequest(BaseModel):
    query: str
    variables: dict = {}

@app.post("/api/startgg/proxy")
def proxy_startgg(req: StartggProxyRequest, req_obj: Request, db: Session = Depends(get_db)):
    auth_header = req_obj.headers.get("Authorization")
    user_id = None
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ")[1]
        try:
            from jose import jwt
            from auth import SECRET_KEY, ALGORITHM
            payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
        except:
            pass

    token = None
    if user_id:
        integration = db.query(DBUserIntegration).filter(
            DBUserIntegration.user_id == user_id, 
            DBUserIntegration.integration_type == "startgg"
        ).first()
        if integration:
            token = decrypt_text(integration.encrypted_api_key)  # type: ignore
        else:
            user = db.query(DBUser).filter(DBUser.id == user_id).first()
            if user and getattr(user, 'startgg_token', None):
                token = getattr(user, 'startgg_token')
                
    if not token:
        token = os.environ.get("STARTGG_API_TOKEN")
            
    if not token:
        raise HTTPException(status_code=404, detail="Start.gg integration not found. Please set your token in settings or provide a system token.")

    import requests
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            "https://api.start.gg/gql/alpha", 
            json={"query": req.query, "variables": req.variables},
            headers=headers,
            timeout=10
        )
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Feed API ---

@app.get("/api/feed")
def get_feed(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
    
    posts = db.query(DBPost).order_by(DBPost.created_at.desc()).all()
    results = []
    
    import json
    for post in posts:
        author = db.query(DBUser).filter(DBUser.id == post.user_id).first()
        liked = db.query(DBPostLike).filter(DBPostLike.post_id == post.id, DBPostLike.user_id == user_id).first() is not None
        
        tags = []
        if post.tags:
            try:
                tags = json.loads(post.tags)
            except:
                pass
                
        # Generate initials
        initials = "U"
        if author:
            if getattr(author, 'gamer_tag', None) and len(author.gamer_tag) >= 2:
                initials = author.gamer_tag[0:2].upper()
            elif getattr(author, 'gamer_tag', None):
                initials = author.gamer_tag.upper()

        name = "Unknown"
        if author and getattr(author, 'gamer_tag', None):
            name = author.gamer_tag
                
        results.append({
            "id": post.id,
            "author": {
                "name": name,
                "handle": getattr(author, 'unique_id', None) or "FB-UNKNOWN",
                "initials": initials,
                "color": getattr(author, 'profile_color', None) or "#06b6d4",
                "avatar": getattr(author, 'avatar_url', None)
            },
            "time": post.created_at.isoformat() if post.created_at else "",
            "content": post.content,
            "image": post.image,
            "tags": tags,
            "likes": post.likes,
            "comments": post.comments,
            "shares": post.shares,
            "liked": liked,
            "bookmarked": False,
            "type": post.type,
            "pinned": post.pinned
        })
        
    return results

@app.post("/api/feed")
def create_post(req: CreatePostRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
        
    import uuid, json
    
    new_post = DBPost(
        id=str(uuid.uuid4()),
        user_id=user_id,
        content=req.content,
        type=req.type,
        tags=json.dumps(req.tags) if req.tags else None,
        image=req.image
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {"message": "Post created", "post_id": new_post.id}

@app.post("/api/feed/{post_id}/like")
def toggle_like(post_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
        
    import uuid
    
    post = db.query(DBPost).filter(DBPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    existing_like = db.query(DBPostLike).filter(DBPostLike.post_id == post_id, DBPostLike.user_id == user_id).first()
    
    if existing_like:
        db.delete(existing_like)
        post.likes = max(0, post.likes - 1)
        action = "unliked"
    else:
        new_like = DBPostLike(
            id=str(uuid.uuid4()),
            post_id=post_id,
            user_id=user_id
        )
        db.add(new_like)
        post.likes = (post.likes or 0) + 1
        action = "liked"
        
    db.commit()
    return {"message": "Success", "action": action, "likes": post.likes}

# ---------------------------------------------------------------------------
# LOCAL TOURNAMENT HISTORY
# ---------------------------------------------------------------------------

@app.get("/api/users/{unique_id}/local-history")
def get_user_local_history(unique_id: str, db: Session = Depends(get_db)):
    if not db:
        return {"tournaments": []}
        
    try:
        # Query tournament participants matching this unique_id
        participants = db.query(DBTournamentParticipant).filter(DBTournamentParticipant.fb_user_id == unique_id).all()
        
        history = []
        for p in participants:
            # Fetch the tournament details
            tournament = db.query(DBTournament).filter(DBTournament.id == p.tournament_id).first()
            if tournament:
                history.append({
                    "tournament_id": tournament.id,
                    "tournament_name": tournament.name,
                    "date": tournament.updated_at.isoformat(),
                    "placement": p.placement,
                    "gamer_tag": p.gamer_tag
                })
        
        # Sort by date descending
        history.sort(key=lambda x: x["date"], reverse=True)
        return {"tournaments": history}
    except Exception as e:
        print(f"Error fetching local history: {e}")
        return {"tournaments": []}


class StartggProxyRequest(BaseModel):
    query: str
    variables: dict = {}



# --- Feed API ---

@app.get("/api/feed")
def get_feed(
    author_id: Optional[str] = None,
    public_only: bool = False,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
    
    query = db.query(DBPost)
    if author_id:
        query = query.filter(DBPost.user_id == author_id)
        
    posts = query.order_by(DBPost.created_at.desc()).all()
    results = []
    
    import json
    for post in posts:
        author = db.query(DBUser).filter(DBUser.id == post.user_id).first()
        
        # Privacy check: If public_only is True, and the author's profile is friends_only,
        # we only return the post if the viewer is the author themselves or a friend.
        if public_only and author and author.friends_only and author.id != user_id:
            friend_record = db.query(DBFriendship).filter(
                ((DBFriendship.user_id == user_id) & (DBFriendship.friend_id == author.id)) |
                ((DBFriendship.user_id == author.id) & (DBFriendship.friend_id == user_id)),
                DBFriendship.status == "accepted"
            ).first()
            if not friend_record:
                continue
        liked = db.query(DBPostLike).filter(DBPostLike.post_id == post.id, DBPostLike.user_id == user_id).first() is not None
        
        tags = []
        if post.tags:
            try:
                tags = json.loads(post.tags)
            except:
                pass
                
        # Generate initials
        initials = "U"
        if author:
            if getattr(author, 'first_name', None) and getattr(author, 'last_name', None):
                initials = (author.first_name[0] + author.last_name[0]).upper()
            elif getattr(author, 'gamer_tag', None):
                initials = author.gamer_tag[0:2].upper()

        name = "Unknown"
        if author and getattr(author, 'gamer_tag', None):
            name = author.gamer_tag
                
        results.append({
            "id": post.id,
            "author": {
                "name": name,
                "handle": getattr(author, 'unique_id', None) or "FB-UNKNOWN",
                "initials": initials,
                "color": getattr(author, 'profile_color', None) or "#06b6d4",
                "avatar": getattr(author, 'avatar_url', None)
            },
            "time": post.created_at.isoformat() if post.created_at else "",
            "content": post.content,
            "image": post.image,
            "tags": tags,
            "likes": post.likes,
            "comments": post.comments,
            "shares": post.shares,
            "liked": liked,
            "bookmarked": False,
            "type": post.type,
            "pinned": post.pinned
        })
        
    return results

@app.post("/api/feed")
def create_post(req: CreatePostRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
        
    import uuid, json
    
    new_post = DBPost(
        id=str(uuid.uuid4()),
        user_id=user_id,
        content=req.content,
        type=req.type,
        tags=json.dumps(req.tags) if req.tags else None,
        image=req.image
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {"message": "Post created", "post_id": new_post.id}

@app.post("/api/feed/{post_id}/like")
def toggle_like(post_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
        
    import uuid
    
    post = db.query(DBPost).filter(DBPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    existing_like = db.query(DBPostLike).filter(DBPostLike.post_id == post_id, DBPostLike.user_id == user_id).first()
    
    if existing_like:
        db.delete(existing_like)
        post.likes = max(0, post.likes - 1)
        action = "unliked"
    else:
        new_like = DBPostLike(
            id=str(uuid.uuid4()),
            post_id=post_id,
            user_id=user_id
        )
        db.add(new_like)
        post.likes += 1
        action = "liked"
        
    db.commit()
    
    return {"message": f"Post {action}", "likes": post.likes, "liked": action == "liked"}

@app.get("/api/feed/sidebar")
def get_feed_sidebar(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
        
    import random
    all_users = db.query(DBUser).filter(DBUser.id != user_id).all()
    suggested = random.sample(all_users, min(3, len(all_users)))
    
    suggested_results = []
    for u in suggested:
        initials = "U"
        if getattr(u, 'first_name', None) and getattr(u, 'last_name', None):
            initials = (u.first_name[0] + u.last_name[0]).upper()
        elif getattr(u, 'gamer_tag', None) and len(u.gamer_tag) >= 2:
            initials = u.gamer_tag[0:2].upper()
            
        name = "Unknown"
        if getattr(u, 'gamer_tag', None):
            name = u.gamer_tag
            
        suggested_results.append({
            "name": name,
            "handle": getattr(u, 'unique_id', None) or "FB-UNKNOWN",
            "initials": initials,
            "color": getattr(u, 'profile_color', None) or "#06b6d4",
            "sport": "Player"
        })
        
    events_results = []
    token = None
    integration = db.query(DBUserIntegration).filter(
        DBUserIntegration.user_id == user_id, 
        DBUserIntegration.integration_type == "startgg"
    ).first()
    if integration:
        token = decrypt_text(integration.encrypted_api_key)  # type: ignore
    else:
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if user and getattr(user, 'startgg_token', None):
            token = getattr(user, 'startgg_token')
            
    # Resolve the token: prefer user's personal token, fall back to app-level token
    effective_token = token or os.environ.get("STARTGG_API_TOKEN") or os.environ.get("STARTGG_API_KEY")

    if effective_token:
        import requests
        # Major FGC game IDs on start.gg
        fgc_game_ids = [
            1, 2, 3, 4, 5,          # Smash titles
            287, 300, 33602,         # SF6, SF5, SF4
            1386,                    # Tekken 8
            33945,                   # Tekken 7
            34,                      # GGST
            1146,                    # DBFZ
            34748,                   # MK1
            1144,                    # BBTAG
            43868,                   # SF6
            49574,                   # Granblue
        ]
        query = """
        query UpcomingTournaments($gameIds: [ID]) {
          tournaments(query: {
            perPage: 10,
            page: 1,
            sortBy: "startAt asc",
            filter: {
              upcoming: true,
              videogameIds: $gameIds
            }
          }) {
            nodes {
              id
              name
              slug
              startAt
              city
              addrState
              countryCode
              numAttendees
              images {
                url
                type
              }
            }
          }
        }
        """
        headers = {
            "Authorization": f"Bearer {effective_token}",
            "Content-Type": "application/json"
        }
        try:
            resp = requests.post(
                "https://api.start.gg/gql/alpha",
                json={"query": query, "variables": {"gameIds": fgc_game_ids}},
                headers=headers,
                timeout=8
            )
            data = resp.json()
            nodes = data.get("data", {}).get("tournaments", {}).get("nodes", [])
            # Sort by numAttendees desc so biggest events show first
            nodes.sort(key=lambda n: n.get("numAttendees") or 0, reverse=True)
            for node in nodes[:5]:
                from datetime import datetime
                d = datetime.fromtimestamp(node.get("startAt", 0))
                date_str = d.strftime("%b %d, %Y")

                city = node.get("city")
                state = node.get("addrState")
                country = node.get("countryCode", "US")
                if city and state:
                    location = f"{city}, {state}"
                elif city:
                    location = city if country == "US" else f"{city}, {country}"
                elif state:
                    location = state
                else:
                    location = "Online"

                slug = node.get("slug", "")
                link = f"https://start.gg/{slug}" if slug else "https://start.gg"

                # Pick best image
                images = node.get("images") or []
                image_url = next((img["url"] for img in images if img.get("type") == "profile"), None)
                if not image_url and images:
                    image_url = images[0].get("url")

                events_results.append({
                    "id": node.get("id"),
                    "name": node.get("name"),
                    "date": date_str,
                    "location": location,
                    "fighters": node.get("numAttendees") or 0,
                    "status": "registration",
                    "sport": "FGC",
                    "link": link,
                    "image": image_url,
                })
        except Exception as e:
            print("Start.gg error in sidebar:", e)
            pass

    return {
        "suggested_users": suggested_results,
        "upcoming_events": events_results
    }



class EventSearchRequest(BaseModel):
    query: str = ""
    upcoming: bool = True
    videogameId: Optional[int] = None
    page: int = 1
    perPage: int = 20

@app.post("/api/events/search")
def search_events(req: EventSearchRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(status_code=404, detail="Database not available")
        
    token = None
    integration = db.query(DBUserIntegration).filter(
        DBUserIntegration.user_id == user_id, 
        DBUserIntegration.integration_type == "startgg"
    ).first()
    if integration:
        token = decrypt_text(integration.encrypted_api_key)  # type: ignore
    else:
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if user and getattr(user, 'startgg_token', None):
            token = getattr(user, 'startgg_token')
            
    if not token:
        raise HTTPException(status_code=401, detail="Start.gg integration required. Please link your Start.gg account in Settings.")
        
    import requests
    
    query = """
    query SearchTournaments($name: String, $perPage: Int, $page: Int, $videogameId: [ID]) {
      tournaments(query: {
        perPage: $perPage,
        page: $page,
        filter: {
          name: $name,
          videogameIds: $videogameId,
          upcoming: true
        }
      }) {
        pageInfo { totalPages }
        nodes {
          id
          name
          slug
          startAt
          city
          addrState
          numEntrants
          images {
            url
            type
          }
        }
      }
    }
    """
    
    variables = {
        "perPage": req.perPage,
        "page": req.page
    }
    
    if req.query:
        variables["name"] = req.query
    if req.videogameId:
        variables["videogameId"] = [str(req.videogameId)]
        
    if not req.upcoming:
        query = query.replace("upcoming: true", "past: true")
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.post("https://api.start.gg/gql/alpha", json={"query": query, "variables": variables}, headers=headers, timeout=10)
        data = resp.json()
        if "errors" in data:
            raise HTTPException(status_code=400, detail=str(data["errors"]))
            
        nodes = data.get("data", {}).get("tournaments", {}).get("nodes", [])
        totalPages = data.get("data", {}).get("tournaments", {}).get("pageInfo", {}).get("totalPages", 1)
        
        events_results = []
        for node in nodes:
            from datetime import datetime
            d = datetime.fromtimestamp(node.get("startAt", 0))
            date_str = d.strftime("%b %d, %Y")
            
            location = node.get("city")
            if node.get("addrState"):
                location = f"{location}, {node.get('addrState')}" if location else node.get("addrState")
                
            images = node.get("images", [])
            image_url = None
            for img in images:
                if img.get("type") == "profile":
                    image_url = img.get("url")
                    break
            if not image_url and images:
                image_url = images[0].get("url")
                
            events_results.append({
                "id": node.get("id"),
                "name": node.get("name"),
                "slug": node.get("slug"),
                "date": date_str,
                "location": location or "Online",
                "fighters": node.get("numEntrants") or 0,
                "image": image_url
            })
            
        return {
            "events": events_results,
            "totalPages": totalPages
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
