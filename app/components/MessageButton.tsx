'use client';

import React, { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import MessagingSystem from './MessagingSystem';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'PARENT' | 'PROVIDER' | 'ADMIN';
}

interface MessageButtonProps {
  currentUser: User;
  targetUserId: string;
  daycareId?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

const MessageButton: React.FC<MessageButtonProps> = ({
  currentUser,
  targetUserId,
  daycareId,
  className = '',
  children,
  variant = 'button',
  size = 'md'
}) => {
  const [showMessaging, setShowMessaging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    // Check if user is authenticated
    if (!currentUser || !currentUser.id) {
      alert('Please log in to send messages');
      return;
    }

    // Check if target user ID is provided
    if (!targetUserId) {
      alert('Provider information not available for messaging');
      return;
    }

    setLoading(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 200));
      setShowMessaging(true);
    } catch (error) {
      console.error('Failed to open messaging:', error);
      alert('Failed to open messaging. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
      button: 'bg-blue-600 text-white hover:bg-blue-700',
      icon: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    };

    return `${baseClasses} ${sizeClasses[size]} ${className} ${variantClasses[variant]}`;
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'md': return 'h-4 w-4';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={getButtonClasses()}
        title="Send message"
      >
        {loading ? (
          <Loader2 className={`${getIconSize()} animate-spin`} />
        ) : (
          <MessageCircle className={getIconSize()} />
        )}
        {children && <span>{children}</span>}
      </button>

      {showMessaging && (
        <MessagingSystem
          currentUser={currentUser}
          onClose={() => setShowMessaging(false)}
          initialParticipantId={targetUserId}
          initialDaycareId={daycareId}
        />
      )}
    </>
  );
};

export default MessageButton;