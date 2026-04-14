let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// A soft organic "pop" sound for completing tasks
export const playPop = () => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio errors silently (e.g. autoplay policies)
  }
};

// A deep, very subtle "tick" for changing energy modes or settings
export const playTick = () => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Ignore audio errors silently
  }
};

// A magical soft chime when Gemini completes planning
export const playChime = () => {
  try {
    const ctx = initAudio();
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + (index * 0.08);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  } catch (e) {
    // Ignore audio errors silently
  }
};
