/**
 * AudioService.js
 * Synthesized UI sounds for Misu OS using Web Audio API.
 * Sounds adapt their pitch and resonance based on currentEnergy.
 */

let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

/**
 * Play a synthesized UI sound
 * @param {string} type - 'click', 'complete', 'popup', 'switch'
 * @param {number} energy - Current OS energy level (1-5)
 */
export const playUISound = (type, energy = 3) => {
  try {
    initAudio();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // Map energy (1-5) to frequency multiplier (e.g. 0.7 to 1.5)
    // Map energy (1-5) to decay speed
    const energyMult = 0.5 + (energy * 0.2); 
    const now = audioCtx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 * energyMult, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
        
      case 'complete':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440 * energyMult, now);
        osc.frequency.exponentialRampToValueAtTime(880 * energyMult, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
        
      case 'popup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 * energyMult, now);
        osc.frequency.exponentialRampToValueAtTime(600 * energyMult, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'switch':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 / energyMult, now);
        osc.frequency.exponentialRampToValueAtTime(100 / energyMult, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
        
      default:
        break;
    }
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
};
