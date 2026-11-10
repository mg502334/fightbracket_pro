"""
Tekken 8 Data & Announcer Presets for FightBracket Discord Bot
"""

from typing import Dict, Any, Optional

TEKKEN_8_CHARACTERS: Dict[str, Dict[str, Any]] = {
    "jin": {"name": "Jin Kazama", "color": 0xC62828, "emoji": "⚡"},
    "kazuya": {"name": "Kazuya Mishima", "color": 0x4A148C, "emoji": "👁️"},
    "reina": {"name": "Reina", "color": 0x8E24AA, "emoji": "⚡"},
    "jun": {"name": "Jun Kazama", "color": 0xFFF9C4, "emoji": "🕊️"},
    "heihachi": {"name": "Heihachi Mishima", "color": 0xD32F2F, "emoji": "⚡"},
    "paul": {"name": "Paul Phoenix", "color": 0xFBC02D, "emoji": "🥊"},
    "law": {"name": "Marshall Law", "color": 0xF57F17, "emoji": "🐉"},
    "king": {"name": "King", "color": 0xE65100, "emoji": "🐆"},
    "nina": {"name": "Nina Williams", "color": 0x5C6BC0, "emoji": "🔫"},
    "yoshimitsu": {"name": "Yoshimitsu", "color": 0x00897B, "emoji": "🗡️"},
    "bryan": {"name": "Bryan Fury", "color": 0x37474F, "emoji": "💣"},
    "hwoarang": {"name": "Hwoarang", "color": 0xD84315, "emoji": "🥋"},
    "lili": {"name": "Lili", "color": 0xEC407A, "emoji": "🌹"},
    "asuka": {"name": "Asuka Kazama", "color": 0x1E88E5, "emoji": "🚲"},
    "leroy": {"name": "Leroy Smith", "color": 0xFFD54F, "emoji": "🦯"},
    "xiaoyu": {"name": "Ling Xiaoyu", "color": 0xFF80AB, "emoji": "🌸"},
    "claudio": {"name": "Claudio Serafino", "color": 0x42A5F5, "emoji": "✨"},
    "azucena": {"name": "Azucena Ortiz", "color": 0x795548, "emoji": "☕"},
    "victor": {"name": "Victor Chevalier", "color": 0x263238, "emoji": "⚔️"},
    "raven": {"name": "Raven", "color": 0x212121, "emoji": "🥷"},
    "leo": {"name": "Leo Kliesen", "color": 0x29B6F6, "emoji": "🛡️"},
    "steve": {"name": "Steve Fox", "color": 0x0288D1, "emoji": "🥊"},
    "dragunov": {"name": "Sergei Dragunov", "color": 0x455A64, "emoji": "❄️"},
    "feng": {"name": "Feng Wei", "color": 0xBF360C, "emoji": "🔥"},
    "shaheen": {"name": "Shaheen", "color": 0x8D6E63, "emoji": "🦅"},
    "kuma": {"name": "Kuma", "color": 0x4E342E, "emoji": "🐻"},
    "panda": {"name": "Panda", "color": 0xEEEEEE, "emoji": "🐼"},
    "zafina": {"name": "Zafina", "color": 0x6A1B9A, "emoji": "🔮"},
    "lee": {"name": "Lee Chaolan", "color": 0xAB47BC, "emoji": "🌹"},
    "alisa": {"name": "Alisa Bosconovitch", "color": 0xF48FB1, "emoji": "🤖"},
    "devil jin": {"name": "Devil Jin", "color": 0xB71C1C, "emoji": "🪽"},
    "jack-8": {"name": "Jack-8", "color": 0x546E7A, "emoji": "🦾"},
    "lars": {"name": "Lars Alexandersson", "color": 0xF4511E, "emoji": "⚡"},
    "eddy": {"name": "Eddy Gordo", "color": 0x388E3C, "emoji": "🤸"},
    "lidia": {"name": "Lidia Sobieska", "color": 0xC2185B, "emoji": "🥋"},
}

ALIASES = {
    "kaz": "kazuya",
    "dj": "devil jin",
    "hei": "heihachi",
    "ling": "xiaoyu",
    "dragu": "dragunov",
    "sergei": "dragunov",
    "jack": "jack-8",
    "yoshi": "yoshimitsu",
    "hwo": "hwoarang",
}

def resolve_character(query: Optional[str]) -> Optional[Dict[str, Any]]:
    """Resolves character name/alias to canonical Tekken 8 info."""
    if not query:
        return None
    q = query.strip().lower()
    if q in ALIASES:
        q = ALIASES[q]
    if q in TEKKEN_8_CHARACTERS:
        return TEKKEN_8_CHARACTERS[q]
    for key, data in TEKKEN_8_CHARACTERS.items():
        if q in key or q in data["name"].lower():
            return data
    return {"name": query.strip().title(), "color": 0x5865F2, "emoji": "🎮"}

ANNOUNCER_CUES = [
    "Get ready for the next battle!",
    "Fight!",
    "Round 1, Fight!",
    "Match is now live!",
    "All competitors to your stations!",
]
