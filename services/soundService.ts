
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmOsc: OscillatorNode | null = null;
let bgmGain: GainNode | null = null;
let isMuted = false;
const DEFAULT_VOLUME = 0.25;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMuted ? 0 : DEFAULT_VOLUME; // Main Volume
    masterGain.connect(audioCtx.destination);
  }
  return { ctx: audioCtx, master: masterGain };
};

export const initAudio = () => {
  const { ctx } = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  startBackgroundMusic();
};

export const startBackgroundMusic = () => {
  const { ctx, master } = getCtx();
  if (!ctx || !master || bgmOsc) return;

  // Create a low frequency drone
  bgmOsc = ctx.createOscillator();
  bgmGain = ctx.createGain();

  bgmOsc.type = 'sawtooth';
  bgmOsc.frequency.value = 50; // Low bass drone

  // LFO to modulate filter/volume for "breathing" effect
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.2; // Slow pulse
  
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.05;

  bgmGain.gain.value = 0.05; // Quiet background volume

  lfo.connect(lfoGain);
  lfoGain.connect(bgmGain.gain);
  
  bgmOsc.connect(bgmGain);
  bgmGain.connect(master);
  
  bgmOsc.start();
  lfo.start();
};

export const stopBackgroundMusic = () => {
  if (bgmOsc) {
    try {
      bgmOsc.stop();
      bgmOsc.disconnect();
    } catch (e) {}
    bgmOsc = null;
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (masterGain) {
    // If muted, set gain to 0, otherwise restore default
    masterGain.gain.setValueAtTime(isMuted ? 0 : DEFAULT_VOLUME, audioCtx?.currentTime || 0);
  }
  return isMuted;
};

export const getMuteStatus = () => isMuted;

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 1.0) => {
  const { ctx, master } = getCtx();
  if (!ctx || !master) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(master);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
  
  return { osc, gain };
};

export const playPlayerShoot = () => {
  const { ctx, master } = getCtx();
  if (!ctx || !master) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  // Slide frequency down for a "pew" sound
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime); // Slightly lower volume
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(master);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
};

export const playEnemyShoot = () => {
  createOscillator('sawtooth', 200, 0.2, 0.2);
};

export const playExplosion = () => {
  const { ctx, master } = getCtx();
  if (!ctx || !master) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(master);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playPowerUpCollect = () => {
  const { ctx, master } = getCtx();
  if (!ctx || !master) return;
  
  const now = ctx.currentTime;
  
  // Arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.05);
    
    gain.gain.setValueAtTime(0.3, now + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
    
    osc.connect(gain);
    gain.connect(master);
    
    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 0.1);
  });
};

export const playShieldHit = () => {
  const { ctx, master } = getCtx();
  if (!ctx || !master) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(master);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

export const playStartGame = () => {
  const { ctx, master } = getCtx();
  if (!ctx || !master) return;
  
  const now = ctx.currentTime;
  // Simple melody
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.4, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);
    
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.12);
  });
};

export const playGameOver = () => {
  const { ctx, master } = getCtx();
  if (!ctx || !master) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 1);
  
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
  
  osc.connect(gain);
  gain.connect(master);
  
  osc.start();
  osc.stop(ctx.currentTime + 1);
};
