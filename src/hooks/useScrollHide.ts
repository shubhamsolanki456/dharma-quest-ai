import { useState, useEffect, useRef } from 'react';

export const useScrollHide = () => {
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    // Find the scrollable container (MobileLayout's main content area)
    const scrollable = document.querySelector('.mobile-scroll-container') as HTMLElement;
    
    const handleScroll = () => {
      // Hide while scrolling
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        setIsVisible(false);
      }

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Show after scrolling stops (150ms delay)
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setIsVisible(true);
      }, 150);
    };

    if (scrollable) {
      scrollable.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollable.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    } else {
      // Fallback to window scroll
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, []);

  return isVisible;
};
