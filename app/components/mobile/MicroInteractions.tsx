'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { HeartIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { hapticFeedback } from '@/app/lib/utils';

// Like Button with Heart Animation
interface LikeButtonProps {
  isLiked: boolean;
  onToggle: () => void;
}

export function LikeButton({ isLiked, onToggle }: LikeButtonProps) {
  const controls = useAnimation();

  const handleClick = async () => {
    hapticFeedback('medium');
    onToggle();

    if (!isLiked) {
      await controls.start({
        scale: [1, 1.3, 0.9, 1.1, 1],
        rotate: [0, -10, 10, -5, 0],
        transition: { duration: 0.5 },
      });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      className="touch-manipulation p-2"
    >
      <motion.div animate={controls}>
        <HeartIcon
          className={`w-7 h-7 transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-300'
          }`}
        />
      </motion.div>
    </motion.button>
  );
}

// Rating Stars with Animation
interface RatingStarsProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export function RatingStars({ rating, onRate, readonly = false }: RatingStarsProps) {
  const handleRate = (starRating: number) => {
    if (!readonly && onRate) {
      hapticFeedback('light');
      onRate(starRating);
    }
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          onClick={() => handleRate(star)}
          whileTap={!readonly ? { scale: 1.2 } : {}}
          whileHover={!readonly ? { scale: 1.1 } : {}}
          disabled={readonly}
          className={`touch-manipulation ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: star * 0.05, type: 'spring' }}
          >
            <StarIcon
              className={`w-6 h-6 ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          </motion.div>
        </motion.button>
      ))}
    </div>
  );
}

// Success Checkmark Animation
interface SuccessCheckmarkProps {
  show: boolean;
  onComplete?: () => void;
}

export function SuccessCheckmark({ show, onComplete }: SuccessCheckmarkProps) {
  useEffect(() => {
    if (show) {
      hapticFeedback('heavy');
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-full p-6 shadow-2xl"
      >
        <CheckCircleIcon className="w-20 h-20 text-green-500" />
      </motion.div>
    </motion.div>
  );
}

// Floating Action Button
interface FABProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function FloatingActionButton({
  icon,
  onClick,
  position = 'bottom-right',
}: FABProps) {
  const positions = {
    'bottom-right': 'bottom-20 right-6',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-20 left-6',
  };

  const handleClick = () => {
    hapticFeedback('medium');
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`fixed ${positions[position]} z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation`}
    >
      {icon}
    </motion.button>
  );
}

// Badge with Pulse Animation
interface PulseBadgeProps {
  count: number;
  color?: 'red' | 'blue' | 'green';
}

export function PulseBadge({ count, color = 'red' }: PulseBadgeProps) {
  if (count === 0) return null;

  const colors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  return (
    <div className="relative">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -top-2 -right-2 ${colors[color]} text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg`}
      >
        {count > 99 ? '99+' : count}
      </motion.div>
    </div>
  );
}

// Shimmer Loading Effect
export function ShimmerCard() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm overflow-hidden relative">
      <div className="space-y-3">
        <div className="h-40 bg-gray-200 rounded-lg overflow-hidden relative">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 overflow-hidden relative">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.1,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2 overflow-hidden relative">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.2,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
