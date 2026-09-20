import re

file_path = "c:/projects/fightbracket_pro_extended/fightbracket_pro/api/index.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add necessary imports if not there
if "from api.db import DBUserIntegration" not in content:
    content = content.replace("from api.db import get_db, DBUser, DBDirectMessage", "from api.db import get_db, DBUser, DBDirectMessage, DBUserIntegration")
    content = content.replace("from api.db import get_db, DBUser, DBFriendship, DBDirectMessage", "from api.db import get_db, DBUser, DBFriendship, DBDirectMessage, DBUserIntegration")

if "from api.crypto import" not in content:
    content = "from api.crypto import encrypt_text, decrypt_text\n" + content

# 2. Modify GET /api/user/profile to return "SECURE_HIDDEN" if token exists
# Find: "startgg_token": getattr(user, 'startgg_token', '') or "",
old_get_token = "\"startgg_token\": getattr(user, 'startgg_token', '') or \"\","
new_get_token = """            "startgg_token": "SECURE_HIDDEN" if (getattr(user, 'startgg_token', '') or db.query(DBUserIntegration).filter(DBUserIntegration.user_id == user.id, DBUserIntegration.integration_type == 'startgg').first()) else "", """
content = content.replace(old_get_token, new_get_token, 1) # Only replace the first one (in GET)

# 3. Modify PUT /api/user/profile to save to DBUserIntegration
# It currently has:
#    if req.startgg_token is not None:
#        user.startgg_token = req.startgg_token.strip() # type: ignore
put_start_idx = content.find("if req.startgg_token is not None:")
if put_start_idx != -1:
    old_put = """    if req.startgg_token is not None:
        user.startgg_token = req.startgg_token.strip() # type: ignore"""
    new_put = """    if req.startgg_token is not None:
        token_clean = req.startgg_token.strip()
        if token_clean and token_clean != "SECURE_HIDDEN":
            # Encrypt and save to user_integrations
            enc_token = encrypt_text(token_clean)
            integration = db.query(DBUserIntegration).filter(DBUserIntegration.user_id == user_id, DBUserIntegration.integration_type == 'startgg').first()
            if integration:
                integration.encrypted_api_key = enc_token
            else:
                db.add(DBUserIntegration(user_id=user_id, integration_type='startgg', encrypted_api_key=enc_token))
            user.startgg_token = "" # Clear from public table
        elif token_clean == "":
            # Delete integration
            db.query(DBUserIntegration).filter(DBUserIntegration.user_id == user_id, DBUserIntegration.integration_type == 'startgg').delete()
            user.startgg_token = ""
"""
    content = content.replace(old_put, new_put)

# 4. Modify PUT return value as well
# The second replace of old_get_token
content = content.replace(old_get_token, new_get_token, 1)

# 5. Add Proxy Endpoint
proxy_code = """
class StartggProxyRequest(BaseModel):
    query: str
    variables: dict = {}

@app.post("/api/startgg/proxy")
def proxy_startgg(req: StartggProxyRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    integration = db.query(DBUserIntegration).filter(
        DBUserIntegration.user_id == user_id, 
        DBUserIntegration.integration_type == "startgg"
    ).first()
    
    token = None
    if integration:
        token = decrypt_text(integration.encrypted_api_key)
    else:
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if user and getattr(user, 'startgg_token', None):
            token = getattr(user, 'startgg_token')
            
    if not token:
        raise HTTPException(status_code=404, detail="Start.gg integration not found. Please set your token in settings.")

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
"""

if "/api/startgg/proxy" not in content:
    content = content + "\n" + proxy_code

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Backend secured.")
