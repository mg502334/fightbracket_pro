import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def get_fernet():
    secret = os.environ.get("ENCRYPTION_SECRET")
    if not secret:
        raise ValueError("ENCRYPTION_SECRET environment variable is missing")
    
    salt_env = os.environ.get("ENCRYPTION_SALT")
    salt = salt_env.encode() if salt_env else b"fightbracket_pro_salt"

    # We need a 32-byte url-safe base64-encoded key for Fernet.
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return Fernet(key)

def encrypt_text(text: str) -> str:
    if not text:
        return ""
    f = get_fernet()
    return f.encrypt(text.encode()).decode()

def decrypt_text(encrypted_text: str) -> str:
    if not encrypted_text:
        return ""
    try:
        f = get_fernet()
        return f.decrypt(encrypted_text.encode()).decode()
    except Exception as e:
        print(f"Decryption failed: {e}")
        return ""
