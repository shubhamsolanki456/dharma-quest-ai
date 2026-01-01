import { useCallback, useRef } from 'react';

// NOTE:
// Pixabay direct links can be access-controlled for server-side downloads, but they typically
// play fine in the browser. If you want the sound bundled in the app, upload the MP3 and
// we will import it as a local asset.
const SHINE_SFX_URL = 'https://cdn.pixabay.com/audio/2024/11/26/audio_2207908c69.mp3';

export const useSoundEffects = () => {
  const lastPlayMs = useRef<number>(0);

  const playShine = useCallback(() => {
    try {
      const now = Date.now();
      if (now - lastPlayMs.current < 100) return;
      lastPlayMs.current = now;

      const audio = new Audio(SHINE_SFX_URL);
      audio.preload = 'auto';
      audio.volume = 0.75;
      // Best-effort play; browsers may block if not triggered by a user gesture.
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
