"""
Configuration loader for Tekken 8 Discord Tournament Bot
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from discord_bot directory, fightbracket_pro directory, or root
root_dir = Path(__file__).resolve().parent.parent
env_paths = [
    Path(__file__).resolve().parent / ".env",
    root_dir / "fightbracket_pro" / ".env",
    root_dir / ".env",
]

for p in env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p, override=False)

# If discord_bot/.env had placeholder token, override with any real token from fightbracket_pro/.env
token_val = os.getenv("DISCORD_BOT_TOKEN", "").strip()
if not token_val or token_val == "your_discord_bot_token_here":
    fb_env = root_dir / "fightbracket_pro" / ".env"
    if fb_env.exists():
        load_dotenv(dotenv_path=fb_env, override=True)

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip()
DISCORD_GUILD_ID = os.getenv("DISCORD_GUILD_ID", "").strip()

# Target channel names or IDs (bot will resolve by numeric ID or case-insensitive name)
DEFAULT_VOICE_CHANNEL = os.getenv("DEFAULT_VOICE_CHANNEL", "Tekken 8 Voice").strip()
DEFAULT_TEXT_CHANNEL = os.getenv("DEFAULT_TEXT_CHANNEL", "tekken-matches").strip()

# Webhook server configuration for FightBracket Pro integration (respects cloud host $PORT)
WEBHOOK_HOST = os.getenv("WEBHOOK_HOST", "0.0.0.0").strip()
WEBHOOK_PORT = int(os.getenv("PORT", os.getenv("WEBHOOK_PORT", "5050")))

# Voice TTS settings
ANNOUNCER_VOICE = os.getenv("ANNOUNCER_VOICE", "en-US-ChristopherNeural").strip()
TTS_VOLUME = float(os.getenv("TTS_VOLUME", "1.0"))
ENABLE_VOICE_TTS = os.getenv("ENABLE_VOICE_TTS", "true").lower() in ("1", "true", "yes")
AUTO_JOIN_VOICE = os.getenv("AUTO_JOIN_VOICE", "true").lower() in ("1", "true", "yes")

# Tournament branding
TOURNAMENT_NAME = os.getenv("TOURNAMENT_NAME", "Tekken 8 Championship").strip()
EMBED_COLOR = 0xE62020  # Tekken 8 Red
