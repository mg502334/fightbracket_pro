"""
Asynchronous Text-to-Speech Engine and Voice Channel Queue Manager
"""

import os
import shutil
import asyncio
import tempfile
from pathlib import Path
from typing import Optional, Callable
import discord
try:
    from . import config
except (ImportError, ValueError):
    import config

# Locate ffmpeg: check local folder, imageio_ffmpeg, PATH, or environment
def get_ffmpeg_binary() -> str:
    local_bot_ffmpeg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ffmpeg.exe")
    if os.path.exists(local_bot_ffmpeg):
        return local_bot_ffmpeg
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(exe):
            return exe
    except Exception:
        pass
    return shutil.which("ffmpeg") or os.getenv("FFMPEG_PATH", "ffmpeg")

FFMPEG_EXE = get_ffmpeg_binary()

class VoiceQueueManager:
    """
    Manages queued TTS announcements in a Discord Voice channel so
    concurrent match calls or score reports play smoothly in order.
    """
    def __init__(self, bot: discord.Client):
        self.bot = bot
        self.queue = asyncio.Queue()
        self.is_playing = False
        self._worker_task: Optional[asyncio.Task] = None

    def start(self):
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._process_queue())

    async def enqueue(self, text: str, voice_client: Optional[discord.VoiceClient] = None):
        """Generates TTS audio and queues it for voice playback."""
        if not config.ENABLE_VOICE_TTS:
            return
        
        audio_file = await self.generate_tts(text)
        if audio_file:
            await self.queue.put((text, audio_file, voice_client))

    async def generate_tts(self, text: str) -> Optional[str]:
        """Generates an MP3 file using Edge-TTS or fallback."""
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, f"t8_announcement_{os.getpid()}_{asyncio.get_event_loop().time():.4f}.mp3")
        
        # 1. Try edge-tts (High quality neural voice)
        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, config.ANNOUNCER_VOICE)
            await communicate.save(file_path)
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                return file_path
        except Exception as e:
            print(f"[TTS] Edge-TTS error ({e}), trying fallback...")

        # 2. Try gTTS fallback
        try:
            from gtts import gTTS
            def _run_gtts():
                tts = gTTS(text=text, lang="en", tld="com")
                tts.save(file_path)
            await asyncio.to_thread(_run_gtts)
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                return file_path
        except Exception as e:
            print(f"[TTS] Fallback error ({e}).")

        return None

    async def _process_queue(self):
        """Worker loop that plays queued audio files sequentially."""
        while True:
            try:
                text, file_path, custom_vc = await self.queue.get()
                vc = custom_vc
                
                # If no specific voice client provided, find active one in bot's voice_clients
                if not vc or not vc.is_connected():
                    if self.bot.voice_clients:
                        vc = self.bot.voice_clients[0]

                if vc and vc.is_connected():
                    await self._play_audio(vc, file_path)
                else:
                    print(f"[VoiceQueue] No connected voice channel. (Call: '{text}')")

                # Clean up temporary audio file
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception:
                    pass

                self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[VoiceQueue] Error in queue worker: {e}")
                await asyncio.sleep(1)

    async def _play_audio(self, voice_client: discord.VoiceClient, file_path: str):
        """Plays the audio file via FFmpegPCMAudio and waits until playback completes."""
        try:
            loop = asyncio.get_event_loop()
            finished = loop.create_future()

            def after_playback(error):
                if error:
                    print(f"[VoiceQueue] Playback error: {error}")
                if not finished.done():
                    loop.call_soon_threadsafe(finished.set_result, True)

            # Check if ffmpeg binary exists
            if not shutil.which(FFMPEG_EXE) and not os.path.exists(FFMPEG_EXE):
                print(f"[VoiceQueue] Warning: FFmpeg not found at '{FFMPEG_EXE}'. Audio playback skipped.")
                return

            source = discord.PCMVolumeTransformer(
                discord.FFmpegPCMAudio(file_path, executable=FFMPEG_EXE),
                volume=config.TTS_VOLUME
            )

            # Wait if something is already playing
            while voice_client.is_playing():
                await asyncio.sleep(0.2)

            voice_client.play(source, after=after_playback)
            await finished
            await asyncio.sleep(0.3)  # Brief natural pause between voice calls
        except Exception as e:
            print(f"[VoiceQueue] Playback execution failed: {e}")
