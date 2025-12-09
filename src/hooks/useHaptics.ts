import { useCallback } from 'react';

export const useHaptics = () => {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!('vibrate' in navigator)) return;
    
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([10, 50, 20]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        case 'error':
          navigator.vibrate([50, 100, 50, 100, 50]);
          break;
      }
    } catch (e) {
      // Haptics not supported
    }
  }, []);

  return { triggerHaptic };
};
