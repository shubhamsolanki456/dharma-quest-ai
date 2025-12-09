import { useCallback, useRef } from 'react';

// Create sounds using Web Audio API (no external files needed)
const createAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Coin/DP collection sound - short pleasant chime
  const playDPCollect = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // E6
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log('Sound not available');
    }
  }, [getAudioContext]);

  // Level up sound - triumphant fanfare
  const playLevelUp = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      // C major arpeggio rising
      playNote(523.25, now, 0.15);        // C5
      playNote(659.25, now + 0.1, 0.15);  // E5
      playNote(783.99, now + 0.2, 0.15);  // G5
      playNote(1046.50, now + 0.3, 0.4);  // C6 (longer)
      
      // Add a subtle shimmer
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(2093, now + 0.35);
      shimmerGain.gain.setValueAtTime(0.1, now + 0.35);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      shimmer.start(now + 0.35);
      shimmer.stop(now + 0.7);
    } catch (e) {
      console.log('Sound not available');
    }
  }, [getAudioContext]);

  // Quest complete sound - satisfying ding
  const playQuestComplete = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Sound not available');
    }
  }, [getAudioContext]);

  return { playDPCollect, playLevelUp, playQuestComplete };
};
