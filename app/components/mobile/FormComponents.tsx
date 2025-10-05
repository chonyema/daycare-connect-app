'use client';

import { motion } from 'framer-motion';
import { cn, hapticFeedback } from '@/app/lib/utils';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Input Field with floating label
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export function Input({ label, error, success, icon, className, ...props }: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    hapticFeedback('light');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    props.onBlur?.(e);
  };

  return (
    <div className="relative mb-6">
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'peer w-full px-4 py-4 text-base bg-white border-2 rounded-2xl',
            'transition-all duration-200 outline-none',
            'placeholder-transparent',
            icon && 'pl-12',
            error && 'border-red-500 focus:border-red-600',
            success && 'border-green-500 focus:border-green-600',
            !error && !success && 'border-gray-200 focus:border-blue-500',
            'text-gray-900',
            className
          )}
          placeholder={label}
        />

        <label
          className={cn(
            'absolute left-4 transition-all duration-200 pointer-events-none',
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2',
            'peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400',
            'top-2 -translate-y-0 text-xs font-medium',
            icon && 'peer-placeholder-shown:left-12 left-4',
            error ? 'text-red-600' : success ? 'text-green-600' : 'text-blue-600',
            (isFocused || hasValue) && 'top-2 text-xs'
          )}
        >
          {label}
        </label>

        {error && (
          <ExclamationCircleIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
        )}
        {success && (
          <CheckCircleIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Button with haptic feedback and loading state
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className,
  onClick,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      hapticFeedback('medium');
      onClick?.(e);
    }
  };

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 active:bg-blue-100',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={loading || disabled}
      type={type}
      className={cn(
        'relative rounded-2xl font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        'touch-manipulation',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {!loading && icon}
      {!loading && children}
    </motion.button>
  );
}

// Checkbox with animation
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  const handleChange = () => {
    if (!disabled) {
      hapticFeedback('light');
      onChange(!checked);
    }
  };

  return (
    <label className="flex items-center gap-3 cursor-pointer select-none touch-manipulation">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />
        <motion.div
          animate={{
            backgroundColor: checked ? '#2563eb' : '#ffffff',
            borderColor: checked ? '#2563eb' : '#d1d5db',
          }}
          className="w-6 h-6 border-2 rounded-lg flex items-center justify-center"
        >
          {checked && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          )}
        </motion.div>
      </div>
      <span className={cn('text-base', disabled && 'opacity-50', 'text-gray-900')}>
        {label}
      </span>
    </label>
  );
}

// Toggle Switch
interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, checked, onChange, disabled }: SwitchProps) {
  const handleToggle = () => {
    if (!disabled) {
      hapticFeedback('medium');
      onChange(!checked);
    }
  };

  return (
    <label className="flex items-center justify-between cursor-pointer select-none touch-manipulation py-2">
      <span className={cn('text-base text-gray-900', disabled && 'opacity-50')}>
        {label}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <motion.span
          animate={{
            x: checked ? 28 : 4,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
        />
      </button>
    </label>
  );
}

import React from 'react';
