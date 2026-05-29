let audioCtx = null;
let enabled = localStorage.getItem("arkham_sound_enabled") === "true";

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export const toggleSound = (val) => {
  enabled = val;
  localStorage.setItem("arkham_sound_enabled", String(val));
  if (enabled) {
    initAudio();
  }
};

export const isSoundEnabled = () => enabled;

export const playHover = () => {
  if (!enabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, audioCtx.currentTime); // Low mystery drone
    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio failed", e);
  }
};

export const playClick = () => {
  if (!enabled) return;
  try {
    initAudio();
    // Short stone block tap
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio failed", e);
  }
};

export const playSuccess = () => {
  if (!enabled) return;
  try {
    initAudio();
    // A mysterious chime chord (Em9)
    const now = audioCtx.currentTime;
    const freqs = [329.63, 392.00, 493.88, 587.33, 659.25]; // E4, G4, B4, D5, E5
    freqs.forEach((f, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + index * 0.03);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + index * 0.03 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + index * 0.03);
      osc.stop(now + 0.7);
    });
  } catch (e) {
    console.warn("Audio failed", e);
  }
};

export const playFailure = () => {
  if (!enabled) return;
  try {
    initAudio();
    // Dramatic descending horror tone
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "sine";
    
    osc1.frequency.setValueAtTime(90, now);
    osc1.frequency.linearRampToValueAtTime(45, now + 0.5);
    
    osc2.frequency.setValueAtTime(91, now);
    osc2.frequency.linearRampToValueAtTime(45.5, now + 0.5);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.5);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn("Audio failed", e);
  }
};

export const playTransition = () => {
  if (!enabled) return;
  try {
    initAudio();
    // Ghostly spectral drift
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn("Audio failed", e);
  }
};
