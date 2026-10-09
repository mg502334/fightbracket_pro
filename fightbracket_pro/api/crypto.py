import os
import base64
import logging
from typing import List
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

logger = logging.getLogger(__name__)

PREFIX_GCM_V1 = "v1:gcm:"
LEGACY_DEFAULT_SALT = b"fightbracket_pro_salt"

def _get_salts() -> List[bytes]:
    """Returns a list of candidate salts (custom configured salt first, then legacy default salt)."""
    salt_env = os.environ.get("ENCRYPTION_SALT", "").strip()
    salts: List[bytes] = []
    if salt_env:
        salts.append(salt_env.encode("utf-8"))
    if LEGACY_DEFAULT_SALT not in salts:
        salts.append(LEGACY_DEFAULT_SALT)
    return salts

def _get_secrets() -> List[str]:
    """Returns a list of secrets: primary secret first, followed by any fallback secrets."""
    primary = os.environ.get("ENCRYPTION_SECRET", "").strip()
    if not primary:
        raise ValueError("ENCRYPTION_SECRET environment variable is missing")
    
    fallbacks_str = os.environ.get("ENCRYPTION_SECRET_FALLBACKS", "").strip()
    fallbacks = [s.strip() for s in fallbacks_str.split(",") if s.strip()] if fallbacks_str else []
    
    all_secrets = [primary]
    for fb in fallbacks:
        if fb not in all_secrets:
            all_secrets.append(fb)
    return all_secrets

def _derive_key(secret: str, salt: bytes) -> bytes:
    """Derives a 32-byte (256-bit) key from the given secret and salt using PBKDF2-HMAC-SHA256."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,
    )
    return kdf.derive(secret.encode("utf-8"))

def get_fernet() -> Fernet:
    """Legacy helper returning a Fernet instance for the primary secret."""
    secrets = _get_secrets()
    salts = _get_salts()
    key = _derive_key(secrets[0], salts[0])
    return Fernet(base64.urlsafe_b64encode(key))

def encrypt_text(text: str) -> str:
    """
    Encrypts plaintext using AES-256-GCM with a random 96-bit nonce.
    Returns a self-describing ciphertext string prefixed with 'v1:gcm:'.
    """
    if not text:
        return ""
    
    secrets = _get_secrets()
    primary_secret = secrets[0]
    salts = _get_salts()
    primary_salt = salts[0]
    key = _derive_key(primary_secret, primary_salt)
    
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit standard nonce for GCM
    
    # Encrypt (ciphertext includes 16-byte authentication tag appended)
    encrypted_bytes = aesgcm.encrypt(nonce, text.encode("utf-8"), associated_data=None)
    
    # Package nonce + ciphertext into urlsafe base64
    combined = nonce + encrypted_bytes
    b64_payload = base64.urlsafe_b64encode(combined).decode("utf-8")
    
    return f"{PREFIX_GCM_V1}{b64_payload}"

def decrypt_text(encrypted_text: str) -> str:
    """
    Decrypts ciphertext string.
    Supports:
    1. Modern AES-256-GCM ('v1:gcm:...') with primary/rotated fallback keys & legacy salt fallback.
    2. Legacy Fernet tokens with primary/rotated fallback keys & legacy salt fallback.
    """
    if not encrypted_text:
        return ""
    
    try:
        secrets = _get_secrets()
        salts = _get_salts()
    except Exception as e:
        logger.error(f"Cannot initialize decryption parameters: {e}")
        return ""

    # Case 1: Modern AES-256-GCM format
    if encrypted_text.startswith(PREFIX_GCM_V1):
        raw_b64 = encrypted_text[len(PREFIX_GCM_V1):]
        try:
            combined = base64.urlsafe_b64decode(raw_b64.encode("utf-8"))
            if len(combined) < 12 + 16:  # 12-byte nonce + at least 16-byte auth tag
                logger.error("Corrupt AES-GCM ciphertext: payload too short")
                return ""
            nonce = combined[:12]
            ciphertext = combined[12:]
        except Exception as e:
            logger.error(f"Failed to decode base64 AES-GCM payload: {e}")
            return ""
        
        # Try all combinations of available secrets and candidate salts
        for secret in secrets:
            for salt in salts:
                try:
                    key = _derive_key(secret, salt)
                    aesgcm = AESGCM(key)
                    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, associated_data=None)
                    return decrypted_bytes.decode("utf-8")
                except Exception:
                    continue # Try next secret/salt combination
        
        logger.error("AES-GCM decryption failed: No matching key/salt could authenticate the ciphertext")
        return ""

    # Case 2: Legacy Fernet token fallback
    for secret in secrets:
        for salt in salts:
            try:
                key = _derive_key(secret, salt)
                fernet_key = base64.urlsafe_b64encode(key)
                f = Fernet(fernet_key)
                return f.decrypt(encrypted_text.encode("utf-8")).decode("utf-8")
            except Exception:
                continue # Try next secret/salt combination

    logger.error("Decryption failed: Ciphertext could not be authenticated with any available key")
    return ""
