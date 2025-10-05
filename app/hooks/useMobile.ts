'use client';

import { useState, useEffect } from 'react';
import { isMobile, isTablet, isTouchDevice } from '../lib/utils';

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setMobile(isMobile());
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return mobile;
}

/**
 * Hook to detect if device is tablet
 */
export function useIsTablet() {
  const [tablet, setTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => setTablet(isTablet());
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return tablet;
}

/**
 * Hook to detect if device supports touch
 */
export function useIsTouchDevice() {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  return touch;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return orientation;
}

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let refreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (refreshing) return;
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 100 && window.scrollY === 0) {
        // Trigger refresh
        refreshing = true;
        onRefresh().finally(() => {
          refreshing = false;
          startY = 0;
          currentY = 0;
        });
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [onRefresh]);
}

/**
 * Hook to detect if app is installed as PWA
 */
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsPWA(isInStandaloneMode || isIOSStandalone);
  }, []);

  return isPWA;
}
