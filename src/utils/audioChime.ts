/**
 * Generate audio cues using the Web Audio API.
 * No external files needed — pure synthesized tones.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, volume: number = 0.3) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playGreenChime() {
  playTone(523.25, 0.3, 0.25); // C5
  setTimeout(() => playTone(659.25, 0.3, 0.25), 150); // E5
}

export function playYellowChime() {
  playTone(440, 0.4, 0.3); // A4
  setTimeout(() => playTone(440, 0.4, 0.3), 200); // A4 again
}

export function playRedChime() {
  playTone(349.23, 0.5, 0.35); // F4
  setTimeout(() => playTone(293.66, 0.5, 0.35), 200); // D4
  setTimeout(() => playTone(261.63, 0.6, 0.35), 400); // C4
}
