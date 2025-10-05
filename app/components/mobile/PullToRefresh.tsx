'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);

  const PULL_THRESHOLD = 80; // Distance to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  // Transform pull distance to rotation for the refresh icon
  const iconRotation = useTransform(
    pullDistance,
    [0, PULL_THRESHOLD],
    [0, 180]
  );

  // Transform pull distance to opacity
  const iconOpacity = useTransform(
    pullDistance,
    [0, PULL_THRESHOLD / 2, PULL_THRESHOLD],
    [0, 0.5, 1]
  );

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start if scrolled to top
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0 && distance <= MAX_PULL) {
        // Prevent default scroll when pulling
        e.preventDefault();
        pullDistance.set(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;

      const distance = pullDistance.get();

      if (distance >= PULL_THRESHOLD) {
        // Trigger refresh
        setIsRefreshing(true);
        pullDistance.set(PULL_THRESHOLD);

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          pullDistance.set(0);
        }
      } else {
        // Reset if didn't reach threshold
        pullDistance.set(0);
      }

      setIsPulling(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, disabled, pullDistance, onRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        style={{
          height: pullDistance,
          opacity: iconOpacity,
        }}
        className="absolute top-0 left-0 right-0 flex items-end justify-center pb-2 z-10 bg-gradient-to-b from-gray-50 to-transparent"
      >
        <motion.div
          style={{ rotate: iconRotation }}
          className="relative"
        >
          <ArrowPathIcon
            className={`w-6 h-6 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: pullDistance }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
