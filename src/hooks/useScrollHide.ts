import { useState, useEffect, useRef } from 'react';

export const useScrollHide = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the scrollable container (MobileLayout's main content area)
    const scrollable = document.querySelector('.mobile-scroll-container') as HTMLElement;
    if (!scrollable) {
      // Fallback to window scroll
      const handleWindowScroll = () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          setIsVisible(true);
        }
        
        lastScrollY.current = currentScrollY;
      };

      window.addEventListener('scroll', handleWindowScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleWindowScroll);
    }

    scrollableRef.current = scrollable;

    const handleScroll = () => {
      const currentScrollY = scrollable.scrollTop;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    scrollable.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollable.removeEventListener('scroll', handleScroll);
  }, []);

  return isVisible;
};
