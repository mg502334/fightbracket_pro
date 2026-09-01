import os
import sys
import jwt
from fastapi.testclient import TestClient

# Ensure fightbracket_pro is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set test environment
os.environ["ENV"] = "test"
os.environ["VERCEL_ENV"] = "test"

from api.index import app, is_safe_url

client = TestClient(app)

def test_unverified_jwt_rejected():
    fake_token = jwt.encode({"sub": "victim-user-123"}, "attacker-bogus-secret", algorithm="HS256")
    resp = client.get("/api/user/profile", headers={"Authorization": f"Bearer {fake_token}"})
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"
    print("[PASS] Forged / unverified JWT is rejected with 401")

def test_missing_auth_header_rejected():
    resp = client.get("/api/user/profile")
    assert resp.status_code == 401
    print("[PASS] Missing authorization header is rejected with 401")

def test_privileged_endpoints_require_auth():
    # /api/sms/send
    resp = client.post("/api/sms/send", json={"phone_numbers": ["123"], "message": "hi"})
    assert resp.status_code == 401, f"SMS endpoint expected 401, got {resp.status_code}"
    
    # /api/state
    resp = client.get("/api/state")
    assert resp.status_code == 401, f"State endpoint expected 401, got {resp.status_code}"
    
    # /api/checkin
    resp = client.post("/api/checkin", json={"player_id": "1", "checked_in": True})
    assert resp.status_code == 401, f"Checkin endpoint expected 401, got {resp.status_code}"
    
    print("[PASS] All privileged endpoints strictly enforce authentication")

def test_ssrf_safety_filter():
    # Safe public domains
    assert is_safe_url("https://www.google.com") == True
    assert is_safe_url("https://start.gg") == True
    
    # Unsafe / internal IPs and URLs
    assert is_safe_url("http://127.0.0.1:8000") == False
    assert is_safe_url("http://localhost:5000") == False
    assert is_safe_url("http://169.254.169.254/latest/meta-data") == False
    assert is_safe_url("http://10.0.0.1") == False
    assert is_safe_url("http://192.168.1.1") == False
    assert is_safe_url("ftp://example.com") == False
    assert is_safe_url("javascript:alert(1)") == False
    
    print("[PASS] SSRF protection correctly blocks internal and loopback destinations")

def test_cors_origin_filtering():
    # Allowed origin
    resp = client.options("/api/health", headers={
        "Origin": "https://fightbracketpro.com",
        "Access-Control-Request-Method": "GET"
    })
    assert resp.headers.get("access-control-allow-origin") == "https://fightbracketpro.com"
    
    # Disallowed origin
    resp = client.options("/api/health", headers={
        "Origin": "https://attacker-malicious-site.com",
        "Access-Control-Request-Method": "GET"
    })
    assert resp.headers.get("access-control-allow-origin") != "https://attacker-malicious-site.com"
    print("[PASS] CORS blocks unauthorized external origins")

if __name__ == "__main__":
    test_unverified_jwt_rejected()
    test_missing_auth_header_rejected()
    test_privileged_endpoints_require_auth()
    test_ssrf_safety_filter()
    test_cors_origin_filtering()
    print("\n[SUCCESS] ALL SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY!")
