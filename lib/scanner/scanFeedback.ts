/**
 * Lightweight scan feedback (Web Audio + vibration). No external assets.
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  const t0 = ctx.currentTime;
  const dur = durationMs / 1000;
  osc.start(t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.stop(t0 + dur + 0.02);
}

export function playScanSuccessSound(): void {
  playTone(880, 70, 'sine', 0.1);
  setTimeout(() => playTone(1320, 100, 'sine', 0.07), 55);
}

export function playScanErrorSound(): void {
  playTone(200, 220, 'square', 0.055);
}

export function playScanDuplicateSound(): void {
  playTone(420, 90, 'triangle', 0.065);
}

export function playFinisherChime(): void {
  playTone(660, 60, 'sine', 0.09);
  setTimeout(() => playTone(990, 140, 'sine', 0.06), 70);
}

export function hapticSuccess(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(60);
  }
}

export function hapticError(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([30, 50, 30]);
  }
}

export function hapticDuplicate(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([20, 40, 20]);
  }
}

const SOUND_KEY = 'scanner.soundEnabled';
const HAPTIC_KEY = 'scanner.hapticsEnabled';

export function getScannerSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(SOUND_KEY);
  return v === null || v === 'true';
}

export function setScannerSoundEnabled(on: boolean): void {
  localStorage.setItem(SOUND_KEY, on ? 'true' : 'false');
}

export function getScannerHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(HAPTIC_KEY);
  return v === null || v === 'true';
}

export function setScannerHapticsEnabled(on: boolean): void {
  localStorage.setItem(HAPTIC_KEY, on ? 'true' : 'false');
}
