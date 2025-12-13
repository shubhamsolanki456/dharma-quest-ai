import { useCallback, useRef } from 'react';

// Audio context for generating sound effects
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const useSoundEffects = () => {
  const lastPlayTime = useRef<number>(0);
  
  // Soft, pleasant chime for collecting DP
  const playDPCollect = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Prevent too frequent plays
      if (now - lastPlayTime.current < 0.1) return;
      lastPlayTime.current = now;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.1); // E6
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (e) {
      console.warn('Could not play sound', e);
    }
  }, []);
  
  // Pleasant level up fanfare
  const playLevelUp = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Rising arpeggio (C major: C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now + i * 0.12);
        
        gainNode.gain.setValueAtTime(0, now + i * 0.12);
        gainNode.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.4);
        
        oscillator.start(now + i * 0.12);
        oscillator.stop(now + i * 0.12 + 0.5);
      });
      
      // Add shimmer effect
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(2093, now + 0.5);
      
      shimmerGain.gain.setValueAtTime(0.08, now + 0.5);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 1);
      
      shimmer.start(now + 0.5);
      shimmer.stop(now + 1);
    } catch (e) {
      console.warn('Could not play sound', e);
    }
  }, []);
  
  // Satisfying soft ding for quest complete
  const playQuestComplete = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Soft two-tone ding
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      // Pleasant fifth interval (G5 and D6)
      osc1.frequency.setValueAtTime(783.99, now);
      osc2.frequency.setValueAtTime(1174.66, now + 0.08);
      
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      gain2.gain.setValueAtTime(0.10, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      
      osc1.start(now);
      osc1.stop(now + 0.25);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Could not play sound', e);
    }
  }, []);

  return {
    playDPCollect,
    playLevelUp,
    playQuestComplete
  };
};
