export type SoundType = 'feed' | 'happy' | 'splash';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      throw new Error('AudioContext non supportato');
    }
    audioCtx = new Ctor();
  }
  return audioCtx;
}

export function resumeAudioContext(): void {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  } catch (error) {
    console.warn('Impossibile riprendere AudioContext', error);
  }
}

export function playSound(type: SoundType): void {
  let ctx: AudioContext;
  try {
    ctx = getContext();
  } catch {
    return;
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);

  if (type === 'feed') {
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
  } else if (type === 'happy') {
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  } else if (type === 'splash') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
  }

  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}
