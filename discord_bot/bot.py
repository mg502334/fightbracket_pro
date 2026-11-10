"""
Tekken 8 Discord Tournament Bot
- Announces match callouts & results in Discord Text Channels with Tekken 8 themed embeds.
- Joins Discord Voice Channels to verbally call matches and scores using Neural TTS.
- Embedded aiohttp Webhook Server to receive automatic triggers from FightBracket Pro.
"""

import os
import sys
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import discord
from discord import app_commands
from discord.ext import commands
from aiohttp import web

# Ensure parent and local directory are in sys.path for direct execution
_current_dir = os.path.dirname(os.path.abspath(__file__))
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

try:
    from . import config
    from .tekken_data import resolve_character, ANNOUNCER_CUES
    from .tts_engine import VoiceQueueManager
except (ImportError, ValueError):
    import config
    from tekken_data import resolve_character, ANNOUNCER_CUES
    from tts_engine import VoiceQueueManager

# ─── Bot Initialization ────────────────────────────────────────────────────────

intents = discord.Intents.default()
intents.guilds = True
intents.voice_states = True

class TekkenTournamentBot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix="!t8 ", intents=intents)
        self.voice_manager: Optional[VoiceQueueManager] = None
        self.active_text_channel: Optional[discord.TextChannel] = None
        self.active_voice_channel: Optional[discord.VoiceChannel] = None
        self.webhook_runner: Optional[web.AppRunner] = None
        self.live_stream_messages: Dict[int, discord.Message] = {}
        self.latest_bracket_state: Dict[str, Any] = {}

    async def setup_hook(self):
        self.voice_manager = VoiceQueueManager(self)
        self.voice_manager.start()

        # Start background aiohttp webhook server for FightBracket Pro
        await self.start_webhook_server()

        # Sync application slash commands
        if config.DISCORD_GUILD_ID:
            guild_obj = discord.Object(id=int(config.DISCORD_GUILD_ID))
            self.tree.copy_global_to(guild=guild_obj)
            await self.tree.sync(guild=guild_obj)
            print(f"[Bot] Synced slash commands to Guild ID: {config.DISCORD_GUILD_ID}")
        else:
            await self.tree.sync()
            print("[Bot] Synced slash commands globally.")

    async def handle_webhook_announce(self, request: web.Request) -> web.Response:
        return await handle_webhook_announce(request)

    async def handle_webhook_health(self, request: web.Request) -> web.Response:
        return await handle_webhook_health(request)

    async def start_webhook_server(self):
        """Starts the embedded HTTP webhook server to receive events from FightBracket Pro."""
        app = web.Application()
        app.router.add_post("/announce", self.handle_webhook_announce)
        app.router.add_post("/webhook", self.handle_webhook_announce)
        app.router.add_get("/health", self.handle_webhook_health)

        self.webhook_runner = web.AppRunner(app)
        await self.webhook_runner.setup()
        site = web.TCPSite(self.webhook_runner, config.WEBHOOK_HOST, config.WEBHOOK_PORT)
        await site.start()
        print(f"[Webhook] FightBracket Pro Webhook Server listening at http://{config.WEBHOOK_HOST}:{config.WEBHOOK_PORT}/announce")

    async def close(self):
        if self.webhook_runner:
            await self.webhook_runner.cleanup()
        await super().close()

bot = TekkenTournamentBot()

# ─── Helper Functions ──────────────────────────────────────────────────────────

def find_channel_by_name_or_id(guild: discord.Guild, target: str, is_voice: bool = False):
    """Finds a channel in the guild by numeric ID or matching name."""
    if not target:
        return None
    target_clean = target.strip().lower().lstrip("#")
    channels = guild.voice_channels if is_voice else guild.text_channels
    for ch in channels:
        if str(ch.id) == target_clean or ch.name.lower() == target_clean:
            return ch
    return None

async def ensure_voice_connection(guild: discord.Guild) -> Optional[discord.VoiceClient]:
    """Ensures the bot is connected to the desired voice channel in the guild."""
    # Check if already connected in this guild
    for vc in bot.voice_clients:
        if vc.guild.id == guild.id and vc.is_connected():
            return vc

    channel = bot.active_voice_channel
    if not channel and config.DEFAULT_VOICE_CHANNEL:
        channel = find_channel_by_name_or_id(guild, config.DEFAULT_VOICE_CHANNEL, is_voice=True)

    if not channel and guild.voice_channels:
        # Fallback to first available voice channel
        channel = guild.voice_channels[0]

    if channel:
        try:
            bot.active_voice_channel = channel
            return await channel.connect()
        except Exception as e:
            print(f"[Voice] Failed to connect to '{channel.name}': {e}")
    return None

# ─── Core Announcement & Score Dispatchers ─────────────────────────────────────

async def announce_match_call(
    guild: discord.Guild,
    player1: str,
    player2: str,
    station: Optional[str] = None,
    round_name: Optional[str] = None,
    p1_char: Optional[str] = None,
    p2_char: Optional[str] = None,
    tournament_name: Optional[str] = None
):
    """Publishes a match call to the active text channel and speaks it into voice."""
    t_name = tournament_name or config.TOURNAMENT_NAME
    station_str = f"Station {station}" if station else "Assigned Station"
    r_name = round_name or "Tournament Bracket"
    
    c1 = resolve_character(p1_char)
    c2 = resolve_character(p2_char)
    p1_display = f"{c1['emoji']} **{player1}** ({c1['name']})" if c1 else f"**{player1}**"
    p2_display = f"{c2['emoji']} **{player2}** ({c2['name']})" if c2 else f"**{player2}**"

    # 1. Post rich embed to Discord text channel
    target_text_channel = bot.active_text_channel or find_channel_by_name_or_id(guild, config.DEFAULT_TEXT_CHANNEL)
    if not target_text_channel and guild.text_channels:
        target_text_channel = guild.text_channels[0]

    embed = discord.Embed(
        title=f"⚔️ MATCH CALLED — {station_str.upper()}",
        description=f"### {p1_display} \n### ⚔️ VS ⚔️\n### {p2_display}",
        color=config.EMBED_COLOR,
        timestamp=datetime.now(timezone.utc)
    )
    embed.add_field(name="🏟️ Station", value=station_str, inline=True)
    embed.add_field(name="🥊 Round", value=r_name, inline=True)
    embed.add_field(name="📢 Notice", value="Please report to your station immediately!", inline=False)
    embed.set_footer(text=f"{t_name} • Tekken 8 Match Caller", icon_url="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/svgs/solid/gamepad.svg")

    if target_text_channel:
        try:
            await target_text_channel.send(content=f"🔔 **{player1}** vs **{player2}** report to **{station_str}**!", embed=embed)
        except Exception as e:
            print(f"[Text] Failed to post match call: {e}")

    # 2. Queue verbal TTS announcement into voice channel
    if config.ENABLE_VOICE_TTS:
        vc = await ensure_voice_connection(guild)
        spoken_call = (
            f"Attention competitors. Match called on {station_str}. "
            f"{player1} versus {player2}. {r_name}. "
            f"Get ready for the next battle!"
        )
        if bot.voice_manager:
            await bot.voice_manager.enqueue(spoken_call, vc)


async def announce_match_score(
    guild: discord.Guild,
    winner: str,
    loser: str,
    score: Optional[str] = None,
    round_name: Optional[str] = None,
    station: Optional[str] = None,
    winner_char: Optional[str] = None,
    loser_char: Optional[str] = None,
    tournament_name: Optional[str] = None
):
    """Publishes a completed match score to the text channel and speaks the result in voice."""
    t_name = tournament_name or config.TOURNAMENT_NAME
    r_name = round_name or "Match"
    score_display = f" `{score}`" if score else ""
    is_finals = "grand" in r_name.lower() or "final" in r_name.lower()
    
    wc = resolve_character(winner_char)
    lc = resolve_character(loser_char)
    w_display = f"{wc['emoji']} **{winner}** ({wc['name']})" if wc else f"**{winner}**"
    l_display = f"{lc['emoji']} {loser} ({lc['name']})" if lc else f"{loser}"

    # 1. Post result embed to Discord text channel
    target_text_channel = bot.active_text_channel or find_channel_by_name_or_id(guild, config.DEFAULT_TEXT_CHANNEL)
    if not target_text_channel and guild.text_channels:
        target_text_channel = guild.text_channels[0]

    embed = discord.Embed(
        title=f"🏆 MATCH RESULT — {winner.upper()} WINS! {score_display}",
        description=f"### 👑 Winner: {w_display}\nDefeated: {l_display}\nFinal Score: **{score or 'Confirmed'}**",
        color=0xF59E0B if is_finals else 0x10B981, # Gold for finals, Emerald for standard
        timestamp=datetime.now(timezone.utc)
    )
    embed.add_field(name="🥊 Round", value=r_name, inline=True)
    if station:
        embed.add_field(name="🏟️ Station", value=f"Station {station}", inline=True)
    embed.set_footer(text=f"{t_name} • Match Verified", icon_url="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/svgs/solid/trophy.svg")

    if target_text_channel:
        try:
            await target_text_channel.send(embed=embed)
        except Exception as e:
            print(f"[Text] Failed to post score: {e}")

    # 2. Queue verbal TTS score announcement into voice channel
    if config.ENABLE_VOICE_TTS:
        vc = await ensure_voice_connection(guild)
        spoken_score = (
            f"Match complete in {r_name}. "
            f"{winner} defeats {loser}"
            f"{f' with a final score of {score}' if score else ''}. "
            f"Result confirmed."
        )
        if bot.voice_manager:
            await bot.voice_manager.enqueue(spoken_score, vc)

def build_live_bracket_embed(data: dict) -> discord.Embed:
    """Builds a comprehensive live streaming bracket embed card."""
    t_name = data.get("tournament_name") or config.TOURNAMENT_NAME
    web_url = data.get("bracket_url")
    if not web_url:
        subdomain = data.get("subdomain")
        web_url = f"https://fightbracketpro.com/?sub={subdomain}" if subdomain else "https://fightbracketpro.com"

    embed = discord.Embed(
        title=f"⚡ LIVE BRACKET STREAM — {t_name.upper()}",
        url=web_url,
        description=f"🌐 **Interactive Live Bracket**: [{web_url}]({web_url})\n*Streaming active stations, next up, and live scores in real time.*",
        color=0x00E5FF,  # FightBracket Pro Cyan
        timestamp=datetime.now(timezone.utc)
    )

    # Active matches on stations
    active_matches = data.get("active_matches", [])
    if active_matches:
        lines = []
        for m in active_matches:
            st = m.get("station", "Station")
            p1 = m.get("player1", "TBD")
            p2 = m.get("player2", "TBD")
            rnd = m.get("round", "Match")
            lines.append(f"• **Station {st}**: 🎮 **{p1}** vs **{p2}** (`{rnd}`)")
        embed.add_field(name="🏟️ Live On Stations", value="\n".join(lines), inline=False)
    else:
        embed.add_field(name="🏟️ Live On Stations", value="*No matches currently running.*", inline=False)

    # On Deck matches
    on_deck = data.get("on_deck", [])
    if on_deck:
        lines = []
        for m in on_deck[:3]:
            p1 = m.get("player1", "TBD")
            p2 = m.get("player2", "TBD")
            rnd = m.get("round", "Next Round")
            lines.append(f"• **{p1}** vs **{p2}** (`{rnd}`)")
        embed.add_field(name="⏳ Next Up / On Deck", value="\n".join(lines), inline=False)

    # Recent Results
    recent = data.get("recent_results", [])
    if recent:
        lines = []
        for r in recent[:4]:
            w = r.get("winner", "Winner")
            l = r.get("loser", "Loser")
            sc = r.get("score", "")
            sc_str = f" `{sc}`" if sc else ""
            rnd = r.get("round", "")
            lines.append(f"• 🏆 **{w}** def. {l}{sc_str} (`{rnd}`)")
        embed.add_field(name="✅ Recent Results", value="\n".join(lines), inline=False)

    # Progress stats
    total_matches = data.get("total_matches", 0)
    completed = data.get("completed_matches", 0)
    total_players = data.get("total_players", 0)
    if total_matches > 0:
        pct = int((completed / total_matches) * 100)
        embed.add_field(name="📊 Progress", value=f"**{completed}/{total_matches}** matches completed ({pct}%)\n👥 **{total_players}** competitors", inline=False)

    embed.set_footer(text="FightBracket Pro • Live Bracket Stream", icon_url="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/svgs/solid/gamepad.svg")
    return embed


async def update_live_bracket_stream(guild: discord.Guild, data: dict):
    """Edits the active live stream message or posts a new one if not existing."""
    embed = build_live_bracket_embed(data)
    stream_msg = bot.live_stream_messages.get(guild.id)
    
    if stream_msg:
        try:
            await stream_msg.edit(embed=embed)
            return stream_msg
        except Exception:
            pass  # Message was deleted or channel moved, post new

    target_channel = bot.active_text_channel or find_channel_by_name_or_id(guild, config.DEFAULT_TEXT_CHANNEL)
    if not target_channel and guild.text_channels:
        target_channel = guild.text_channels[0]
        
    if target_channel:
        try:
            new_msg = await target_channel.send(embed=embed)
            bot.live_stream_messages[guild.id] = new_msg
            return new_msg
        except Exception as e:
            print(f"[Stream] Failed to send live bracket stream: {e}")
    return None

# ─── Webhook Endpoints (FightBracket Pro Bridge) ───────────────────────────────

async def handle_webhook_announce(request: web.Request) -> web.Response:
    """Handles incoming match announcements from FightBracket Pro."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    if not bot.guilds:
        return web.json_response({"error": "Bot is not connected to any Discord servers"}, status=503)

    guild = bot.guilds[0] # Default to primary connected server

    msg_type = data.get("message_type")
    match_info = data.get("match_info", {})
    tournament_name = data.get("tournament_name")

    # If incoming payload is standard Discord embed payload
    if "embeds" in data and not msg_type:
        embed_data = data["embeds"][0]
        title = embed_data.get("title", "")
        desc = embed_data.get("description", "")
        
        # Check if match call or result based on description
        target_channel = bot.active_text_channel or find_channel_by_name_or_id(guild, config.DEFAULT_TEXT_CHANNEL)
        if target_channel:
            discord_embed = discord.Embed.from_dict(embed_data)
            await target_channel.send(embed=discord_embed)
        
        # Parse spoken text
        spoken_clean = desc.replace("**", "").replace("`", "").replace("🎮", "").replace("🏆", "")
        vc = await ensure_voice_connection(guild)
        if bot.voice_manager and config.ENABLE_VOICE_TTS:
            await bot.voice_manager.enqueue(spoken_clean, vc)
        return web.json_response({"status": "success", "mode": "embed_forwarded"})

    if msg_type == "match_called":
        p1 = match_info.get("player1", "Player 1")
        p2 = match_info.get("player2", "Player 2")
        station = match_info.get("station")
        round_name = match_info.get("round")
        p1_char = match_info.get("character1")
        p2_char = match_info.get("character2")

        await announce_match_call(
            guild=guild,
            player1=p1,
            player2=p2,
            station=station,
            round_name=round_name,
            p1_char=p1_char,
            p2_char=p2_char,
            tournament_name=tournament_name
        )
        return web.json_response({"status": "success", "event": "match_called"})

    elif msg_type == "result":
        winner = match_info.get("winner", "Winner")
        loser = match_info.get("loser", "Loser")
        score = match_info.get("score")
        round_name = match_info.get("round")
        station = match_info.get("station")
        w_char = match_info.get("winner_char")
        l_char = match_info.get("loser_char")

        await announce_match_score(
            guild=guild,
            winner=winner,
            loser=loser,
            score=score,
            round_name=round_name,
            station=station,
            winner_char=w_char,
            loser_char=l_char,
            tournament_name=tournament_name
        )
        return web.json_response({"status": "success", "event": "result"})

    elif msg_type in ("start", "custom"):
        custom_text = data.get("custom_message") or f"Tournament {tournament_name or 'Tekken 8'} is now underway!"
        target_channel = bot.active_text_channel or find_channel_by_name_or_id(guild, config.DEFAULT_TEXT_CHANNEL)
        if target_channel:
            emb = discord.Embed(title="📢 TOURNAMENT ANNOUNCEMENT", description=custom_text, color=config.EMBED_COLOR)
            await target_channel.send(embed=emb)
        vc = await ensure_voice_connection(guild)
        if bot.voice_manager and config.ENABLE_VOICE_TTS:
            await bot.voice_manager.enqueue(custom_text, vc)
        return web.json_response({"status": "success", "event": msg_type})

    elif msg_type == "bracket_update":
        bracket_data = data.get("bracket_data", {})
        bot.latest_bracket_state = bracket_data
        await update_live_bracket_stream(guild, bracket_data)
        return web.json_response({"status": "success", "event": "bracket_stream_updated"})

    return web.json_response({"error": "Unsupported message_type"}, status=400)


async def handle_webhook_health(request: web.Request) -> web.Response:
    connected_vcs = [vc.channel.name for vc in bot.voice_clients if vc.is_connected()]
    return web.json_response({
        "status": "online",
        "bot_user": str(bot.user) if bot.user else None,
        "guilds": [g.name for g in bot.guilds],
        "active_voice_channels": connected_vcs,
        "active_text_channel": bot.active_text_channel.name if bot.active_text_channel else config.DEFAULT_TEXT_CHANNEL,
        "tts_enabled": config.ENABLE_VOICE_TTS
    })

# ─── Bot Events ────────────────────────────────────────────────────────────────

@bot.event
async def on_ready():
    print(f"==================================================")
    print(f"🥊 Tekken 8 Discord Tournament Bot Online: {bot.user}")
    print(f"Connected Guilds: {[g.name for g in bot.guilds]}")
    print(f"==================================================")

    # Auto join default voice channel if enabled
    if config.AUTO_JOIN_VOICE and bot.guilds:
        for g in bot.guilds:
            vc = await ensure_voice_connection(g)
            if vc:
                print(f"[Voice] Auto-connected to voice channel '{vc.channel.name}' in '{g.name}'")
                if bot.voice_manager and config.ENABLE_VOICE_TTS:
                    await bot.voice_manager.enqueue("Tekken 8 Tournament Match Caller is now online in voice.", vc)
                break

# ─── Slash Commands ────────────────────────────────────────────────────────────

@bot.tree.command(name="call", description="Call a Tekken 8 match into voice and chat.")
@app_commands.describe(
    player1="First player tag",
    player2="Second player tag",
    station="Station number or name (e.g. 1, 2, Stream)",
    round_name="Tournament round (e.g. Winners Round 1, Top 8)",
    player1_character="Tekken 8 character for Player 1 (e.g. Jin, Kazuya, Reina)",
    player2_character="Tekken 8 character for Player 2 (e.g. King, Dragunov, Paul)"
)
async def slash_call(
    interaction: discord.Interaction,
    player1: str,
    player2: str,
    station: Optional[str] = "1",
    round_name: Optional[str] = "Round 1",
    player1_character: Optional[str] = None,
    player2_character: Optional[str] = None
):
    await interaction.response.defer(ephemeral=False)
    await announce_match_call(
        guild=interaction.guild,
        player1=player1,
        player2=player2,
        station=station,
        round_name=round_name,
        p1_char=player1_character,
        p2_char=player2_character
    )
    await interaction.followup.send(f"✅ Called **{player1}** vs **{player2}** on Station {station}!")


@bot.tree.command(name="score", description="Report completed match score to voice and chat.")
@app_commands.describe(
    winner="Winning player tag",
    loser="Losing player tag",
    score="Final score (e.g. 2-0, 3-2)",
    round_name="Tournament round (e.g. Winners Finals, Grand Finals)",
    station="Station number (optional)",
    winner_character="Winner's character (optional)",
    loser_character="Loser's character (optional)"
)
async def slash_score(
    interaction: discord.Interaction,
    winner: str,
    loser: str,
    score: str,
    round_name: Optional[str] = "Match",
    station: Optional[str] = None,
    winner_character: Optional[str] = None,
    loser_character: Optional[str] = None
):
    await interaction.response.defer(ephemeral=False)
    await announce_match_score(
        guild=interaction.guild,
        winner=winner,
        loser=loser,
        score=score,
        round_name=round_name,
        station=station,
        winner_char=winner_character,
        loser_char=loser_character
    )
    await interaction.followup.send(f"🏆 Score recorded: **{winner}** defeated **{loser}** ({score})!")


@bot.tree.command(name="join", description="Join a specified or default voice channel.")
@app_commands.describe(channel="Voice channel to join")
async def slash_join(interaction: discord.Interaction, channel: Optional[discord.VoiceChannel] = None):
    target = channel
    if not target and interaction.user and hasattr(interaction.user, "voice") and interaction.user.voice:
        target = interaction.user.voice.channel

    if not target:
        target = find_channel_by_name_or_id(interaction.guild, config.DEFAULT_VOICE_CHANNEL, is_voice=True)

    if not target:
        await interaction.response.send_message("❌ Please join a voice channel or specify one to join.", ephemeral=True)
        return

    # Disconnect if connected elsewhere in this guild
    for vc in bot.voice_clients:
        if vc.guild.id == interaction.guild.id:
            await vc.move_to(target)
            bot.active_voice_channel = target
            await interaction.response.send_message(f"🔊 Moved to **{target.name}**!")
            return

    vc = await target.connect()
    bot.active_voice_channel = target
    await interaction.response.send_message(f"🔊 Connected to **{target.name}**! Voice announcements active.")


@bot.tree.command(name="leave", description="Disconnect the bot from the current voice channel.")
async def slash_leave(interaction: discord.Interaction):
    for vc in bot.voice_clients:
        if vc.guild.id == interaction.guild.id:
            await vc.disconnect()
            bot.active_voice_channel = None
            await interaction.response.send_message("👋 Disconnected from voice channel.")
            return
    await interaction.response.send_message("The bot is not currently connected to voice.", ephemeral=True)


@bot.tree.command(name="setchat", description="Set the text channel where match cards & scores will be posted.")
@app_commands.describe(channel="Target text channel")
async def slash_setchat(interaction: discord.Interaction, channel: discord.TextChannel):
    bot.active_text_channel = channel
    await interaction.response.send_message(f"📝 Match announcements and scores will now be posted in {channel.mention}.")


@bot.tree.command(name="voiceannounce", description="Broadcast a custom spoken announcement into the voice channel.")
@app_commands.describe(message="The message to speak into voice")
async def slash_voiceannounce(interaction: discord.Interaction, message: str):
    await interaction.response.defer(ephemeral=True)
    vc = await ensure_voice_connection(interaction.guild)
    if bot.voice_manager and config.ENABLE_VOICE_TTS:
        await bot.voice_manager.enqueue(f"Tournament announcement: {message}", vc)
        await interaction.followup.send(f"📢 Voice broadcast dispatched: *'{message}'*")
    else:
        await interaction.followup.send("Voice TTS is disabled or unavailable.")


@bot.tree.command(name="stream", description="Stream the live tournament bracket into this channel.")
@app_commands.describe(subdomain="Subdomain of the tournament (optional, e.g. 'fb-abc123')")
async def slash_stream(interaction: discord.Interaction, subdomain: Optional[str] = None):
    await interaction.response.defer(ephemeral=False)
    
    state = dict(bot.latest_bracket_state)
    if subdomain:
        state["subdomain"] = subdomain
    if not state.get("tournament_name"):
        state["tournament_name"] = config.TOURNAMENT_NAME

    bot.active_text_channel = interaction.channel
    msg = await update_live_bracket_stream(interaction.guild, state)
    bot.live_stream_messages[interaction.guild.id] = msg
    
    await interaction.followup.send("🔴 **Live Bracket Stream Active!** This card will update automatically as matches conclude.")


@bot.tree.command(name="bracket", description="Show the active tournament bracket and live station status.")
async def slash_bracket(interaction: discord.Interaction):
    state = dict(bot.latest_bracket_state)
    if not state.get("tournament_name"):
        state["tournament_name"] = config.TOURNAMENT_NAME
    embed = build_live_bracket_embed(state)
    await interaction.response.send_message(embed=embed)


@bot.tree.command(name="test", description="Run an instant demo match call and score reporting.")
async def slash_test(interaction: discord.Interaction):
    await interaction.response.send_message("⚡ Running Tekken 8 match call and score test...", ephemeral=True)
    
    # 1. Trigger call
    await announce_match_call(
        guild=interaction.guild,
        player1="Arslan Ash",
        player2="Knee",
        station="1 (Main Stream)",
        round_name="Winners Finals",
        p1_char="Nina",
        p2_char="Bryan"
    )

    # 2. Trigger score 4 seconds later
    await asyncio.sleep(4)
    await announce_match_score(
        guild=interaction.guild,
        winner="Arslan Ash",
        loser="Knee",
        score="3 - 2",
        round_name="Winners Finals",
        station="1",
        winner_char="Nina",
        loser_char="Bryan"
    )


@bot.tree.command(name="status", description="Show tournament bot connection status.")
async def slash_status(interaction: discord.Interaction):
    connected_vcs = [vc.channel.name for vc in bot.voice_clients if vc.is_connected() and vc.guild.id == interaction.guild.id]
    chat_ch = bot.active_text_channel.name if bot.active_text_channel else config.DEFAULT_TEXT_CHANNEL
    q_size = bot.voice_manager.queue.qsize() if bot.voice_manager else 0

    embed = discord.Embed(
        title="🎮 Tekken 8 Tournament Bot Status",
        color=config.EMBED_COLOR,
        timestamp=datetime.now(timezone.utc)
    )
    embed.add_field(name="🔊 Voice Channel", value=", ".join(connected_vcs) if connected_vcs else "Not Connected", inline=True)
    embed.add_field(name="📝 Chat Channel", value=f"#{chat_ch}", inline=True)
    embed.add_field(name="🎙️ TTS Engine", value="Active (Edge-TTS)" if config.ENABLE_VOICE_TTS else "Disabled", inline=True)
    embed.add_field(name="📬 Voice Queue Size", value=f"{q_size} call(s) waiting", inline=True)
    embed.add_field(name="🔗 Webhook Port", value=f"{config.WEBHOOK_PORT} (/announce)", inline=True)
    embed.add_field(name="🏆 Tournament", value=config.TOURNAMENT_NAME, inline=True)
    embed.set_footer(text="FightBracket Pro Integration Active")

    await interaction.response.send_message(embed=embed)

# ─── Main Entry Point ──────────────────────────────────────────────────────────

def main():
    if not config.DISCORD_BOT_TOKEN:
        print("[ERROR] DISCORD_BOT_TOKEN is missing! Please configure discord_bot/.env with your Bot Token.")
        print("See discord_bot/README.md for setup instructions.")
        sys.exit(1)
    
    bot.run(config.DISCORD_BOT_TOKEN)

if __name__ == "__main__":
    main()
