// Tournament Audio Synthesizer & Speech Announcer (Zero external MP3 dependencies)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays an authentic esports arcade / tournament announcement chime
 * Creates a clean, harmonic 4-tone arpeggio fanfare with soft decay
 */
export function playTournamentChime(volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Frequencies: A4 (440), C#5 (554.37), E5 (659.25), A5 (880)
    const tones = [
      { freq: 440.0, start: 0, duration: 0.18 },
      { freq: 554.37, start: 0.14, duration: 0.22 },
      { freq: 659.25, start: 0.28, duration: 0.26 },
      { freq: 880.0, start: 0.44, duration: 0.55 },
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.6, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (e) {
    console.warn('Unable to play tournament chime', e);
  }
}

/**
 * Text-to-Speech vocal announcement using the browser's Web Speech API
 */
export function speakMatchCall(player1: string, player2: string, stationId: number | string, gameName?: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Cancel any currently speaking utterance
    window.speechSynthesis.cancel();

    const p1Clean = player1.replace(/\[.*?\]|\(.*?\)/g, '').trim() || 'Player 1';
    const p2Clean = player2.replace(/\[.*?\]|\(.*?\)/g, '').trim() || 'Player 2';
    const gameContext = gameName ? `${gameName}. ` : '';

    const text = `Attention! ${gameContext}${p1Clean}, versus ${p2Clean}. Please report to Station ${stationId}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha')));
    if (enVoice) {
      utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis callout failed', e);
  }
}
