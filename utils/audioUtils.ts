export const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicInterval: number | null = null;
let musicState: 'MENU' | 'ACTION' | 'BOSS' | 'NONE' = 'NONE';

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Global volume
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// --- PROCEDURAL MUSIC SYSTEM ---

const playNote = (freq: number, type: OscillatorType, duration: number, volume: number, delay: number = 0) => {
  if (!audioCtx || !masterGain) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
  
  osc.connect(gain);
  gain.connect(masterGain);
  
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration);
};

export const setMusicState = (state: 'MENU' | 'ACTION' | 'BOSS' | 'NONE') => {
  if (state === musicState) return;
  musicState = state;
  
  if (musicInterval) {
    window.clearInterval(musicInterval);
    musicInterval = null;
  }

  if (!audioCtx) return;

  // Pattern Sequencer
  let step = 0;
  
  if (state === 'MENU') {
    // Ambient, Slow
    const sequence = [220, 261, 329, 392]; // Am7 Arpeggio
    musicInterval = window.setInterval(() => {
      if (audioCtx?.state === 'running') {
         playNote(sequence[step % 4] / 2, 'sine', 2.0, 0.1);
         step++;
      }
    }, 2000);
    playNote(110, 'sine', 8.0, 0.15); // Drone
  } 
  else if (state === 'ACTION') {
    // Driving Bass
    musicInterval = window.setInterval(() => {
       if (audioCtx?.state === 'running') {
         const root = 110; // A2
         const note = step % 4 === 0 ? root : root * 2;
         playNote(note, 'sawtooth', 0.2, 0.1);
         
         // Hi-hat simulation
         if (step % 2 === 1) playNote(8000, 'square', 0.05, 0.05);
         step++;
       }
    }, 250); // 240 BPM eighth notes
  } 
  else if (state === 'BOSS') {
    // Fast, Urgent
    const sequence = [110, 116, 110, 123]; // Phrygian dark vibe
    musicInterval = window.setInterval(() => {
       if (audioCtx?.state === 'running') {
         playNote(sequence[step % 4], 'sawtooth', 0.1, 0.15);
         playNote(sequence[step % 4] * 2, 'square', 0.1, 0.05, 0.1);
         step++;
       }
    }, 150); 
  }
};

// --- SFX ---

export const playShootSound = () => {
  if (!audioCtx || !masterGain) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  
  // Randomize pitch slightly for variation
  const startFreq = 800 + Math.random() * 200;
  
  osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(masterGain);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
};

export const playExplosionSound = (isBoss: boolean = false) => {
  if (!audioCtx || !masterGain) return;
  
  const duration = isBoss ? 1.0 : 0.3;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const gain = audioCtx.createGain();
  // Filter for that muffled explosion sound
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
  filter.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + duration);

  gain.gain.setValueAtTime(isBoss ? 0.6 : 0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  
  noise.start();
};

export const playDamageSound = () => {
  playNote(150, 'sawtooth', 0.2, 0.2);
};

export const playCollectSound = () => {
    if (!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1800, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
};