import { useCallback, useRef } from 'react';
import shineSfx from '@/assets/sfx/shine.mp3';

export const useSoundEffects = () => {
  const lastPlayMs = useRef<number>(0);

  const playShine = useCallback(() => {
    try {
      const now = Date.now();
      if (now - lastPlayMs.current < 100) return;
      lastPlayMs.current = now;

      const audio = new Audio(shineSfx);
      audio.volume = 0.75;
      void audio.play();
    } catch (e) {
      console.warn('Could not play sound', e);
    }
  }, []);

  return {
    playDPCollect: playShine,
    playLevelUp: playShine,
    playQuestComplete: playShine,
  };
};
