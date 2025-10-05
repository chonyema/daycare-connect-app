'use client';

import { useEffect, useRef, RefObject } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe
  preventScroll?: boolean;
}

export function useSwipe(
  ref: RefObject<HTMLElement>,
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, preventScroll = false } = options;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const deltaX = touchEnd.x - touchStart.current.x;
      const deltaY = touchEnd.y - touchStart.current.y;

      // Determine if horizontal or vertical swipe
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left';
          handlers.onSwipe?.(direction);
          if (direction === 'left') handlers.onSwipeLeft?.();
          if (direction === 'right') handlers.onSwipeRight?.();
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          const direction: SwipeDirection = deltaY > 0 ? 'down' : 'up';
          handlers.onSwipe?.(direction);
          if (direction === 'up') handlers.onSwipeUp?.();
          if (direction === 'down') handlers.onSwipeDown?.();
        }
      }

      touchStart.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScroll && touchStart.current) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    if (preventScroll) {
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      if (preventScroll) {
        element.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [ref, handlers, threshold, preventScroll]);
}
