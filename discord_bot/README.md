# 🥊 Tekken 8 Discord Tournament Voice & Chat Caller Bot

An automated Discord bot tailored for **Tekken 8** tournaments and brackets. It announces match callouts and match results simultaneously in **Discord Text Channels** (via styled Tekken 8 cards) and **Discord Voice Channels** (via neural commentator Text-to-Speech).

---

## ⚡ Features

- 🔊 **Voice Channel Announcer (TTS)**:
  - Joins your Tekken 8 Voice Channel and verbally calls matches:
    > *"Attention competitors. Match called on Station 1: Arslan Ash versus Knee, Winners Finals. Get ready for the next battle!"*
  - Verbally announces verified match scores upon completion:
    > *"Match complete in Winners Finals! Arslan Ash defeats Knee, 3 to 2. Result confirmed."*
  - Powered by **Edge-TTS Neural Voices** (sounds like a real broadcast commentator) with automatic fallbacks.
  - Safe **audio queueing** so multiple simultaneous match calls never overlap or clip.

- 💬 **Discord Chat Cards**:
  - Automatically posts crimson-bordered Tekken 8 cards for match calls with player tags, characters, station numbers, and round info.
  - Posts gold/emerald celebration result cards with final score tallies as matches conclude.
  - Supports all Tekken 8 characters (Jin, Kazuya, Reina, Heihachi, King, Dragunov, Paul, etc.) with character emojis and color accents.

- 🔗 **Direct FightBracket Pro Integration**:
  - Runs an embedded HTTP webhook server (`http://localhost:5050/announce`).
  - When the Tournament Organizer calls a match or logs scores in FightBracket Pro, the bot automatically announces it in Discord text & voice in real time!

- 🎮 **Discord Slash Commands**:
  - `/call` — Call any match to a station with optional Tekken 8 characters.
  - `/score` — Report final scores and announce the winner.
  - `/join` — Connect the bot to a voice channel.
  - `/leave` — Disconnect the bot from voice.
  - `/setchat` — Choose which text channel receives match feeds.
  - `/voiceannounce` — Speak custom TO announcements into the voice channel.
  - `/status` — View active voice channel, text channel, and queue status.
  - `/test` — Run a live test call and score report.

---

## 🛠️ Step 1: Discord Developer Portal Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**, name it **Tekken 8 Match Caller** (or your preference), and save.
3. In the left menu, click **Bot**:
   - Click **Reset Token** to copy your **Bot Token** (save this for `.env`).
   - Under **Privileged Gateway Intents**, turn ON:
     - ✅ **Message Content Intent**
     - ✅ **Server Members Intent**
4. In the left menu, click **OAuth2 → URL Generator**:
   - Under **Scopes**, select:
     - `bot`
     - `applications.commands`
   - Under **Bot Permissions**, select:
     - `Send Messages`
     - `Embed Links`
     - `Attach Files`
     - `Connect` (Voice)
     - `Speak` (Voice)
     - `Use Voice Activity`
5. Copy the generated URL at the bottom, paste it into your browser, and invite the bot to your Discord server.

---

## 💻 Step 2: Install Dependencies & FFmpeg

### Python Dependencies:
From the project root:
```bash
pip install -r discord_bot/requirements.txt
```

### FFmpeg (Required for Discord Voice Audio):
Discord requires FFmpeg to transmit voice audio into voice channels.
- **Windows (Quick via winget)**:
  ```powershell
  winget install Gyan.FFmpeg
  ```
  *(Or download `ffmpeg.exe` from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) and place it in your `PATH` or in the `discord_bot/` folder).*
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get install ffmpeg
  ```
- **macOS**:
  ```bash
  brew install ffmpeg
  ```

---

## ⚙️ Step 3: Configure `.env`

Copy `discord_bot/.env.example` to `discord_bot/.env`:
```bash
cp discord_bot/.env.example discord_bot/.env
```

Edit `discord_bot/.env`:
```env
# Paste your token from the Discord Developer Portal
DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"

# (Optional) Your Discord Server ID for instant slash command registration
DISCORD_GUILD_ID="123456789012345678"

# Channel names (or IDs) to automatically use
DEFAULT_VOICE_CHANNEL="Tekken 8 Voice"
DEFAULT_TEXT_CHANNEL="tekken-matches"

# Webhook server for FightBracket Pro
WEBHOOK_HOST=0.0.0.0
WEBHOOK_PORT=5050

# Voice Announcer
ANNOUNCER_VOICE="en-US-ChristopherNeural"
ENABLE_VOICE_TTS=true
AUTO_JOIN_VOICE=true
```

---

## 🚀 Step 4: Run the Bot

Run the bot script:
```bash
python -m discord_bot.bot
```
Or:
```bash
python discord_bot/bot.py
```

When connected, you will see:
```text
==================================================
🥊 Tekken 8 Discord Tournament Bot Online: TekkenBot#1234
Connected Guilds: ['My FGC Server']
==================================================
[Voice] Auto-connected to voice channel 'Tekken 8 Voice'
[Webhook] FightBracket Pro Webhook Server listening at http://0.0.0.0:5050/announce
```

---

## 🏆 Step 5: Connecting with FightBracket Pro

FightBracket Pro natively dispatches match calls and score results whenever matches are assigned to stations or completed.

1. In FightBracket Pro, open **Settings → Integrations → Discord**.
2. Enter your bot's announcement URL as the webhook:
   ```text
   http://localhost:5050/announce
   ```
   *(If FightBracket Pro is deployed on the cloud/Vercel, expose your bot with a tool like [ngrok](https://ngrok.com/) or Cloudflare Tunnel: e.g. `https://xyz.ngrok-free.app/announce`).*
3. Save your settings!
4. When you click **Call Match** on any station in FightBracket Pro:
   - The bot immediately sends a Tekken 8 match card in the Discord chat channel.
   - The bot announces the call verbally in your Discord Voice Channel.
5. When you confirm scores in FightBracket Pro:
   - The bot posts a result card with the winner, loser, and score in Discord chat.
   - The bot announces the score verbally in Discord voice.

---

## 🎮 Slash Commands Reference

| Command | Arguments | Description |
|---|---|---|
| `/call` | `player1`, `player2`, `[station]`, `[round_name]`, `[player1_character]`, `[player2_character]` | Announces match in chat & speaks in voice |
| `/score` | `winner`, `loser`, `score`, `[round_name]`, `[station]`, `[winner_character]`, `[loser_character]` | Posts final score card & announces in voice |
| `/join` | `[channel]` | Bot joins specified or your current voice channel |
| `/leave` | — | Bot disconnects from voice channel |
| `/setchat` | `channel` | Sets the channel for match embeds |
| `/voiceannounce` | `message` | Speaks custom message into voice |
| `/test` | — | Runs test match call & score announcement |
| `/status` | — | Shows voice, chat, and queue connection details |
