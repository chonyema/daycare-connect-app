'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Bell, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageNotification {
  conversationId: string;
  from: {
    id: string;
    name: string;
    userType: string;
  };
  daycare?: {
    id: string;
    name: string;
  };
  latestMessage: {
    content: string;
    messageType: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
    };
  } | null;
  unreadCount: number;
}

interface MessageNotificationsProps {
  onOpenMessaging?: (conversationId?: string) => void;
  className?: string;
}

const MessageNotifications: React.FC<MessageNotificationsProps> = ({
  onOpenMessaging,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch unread message notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages/unread-count', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotalUnreadCount(data.totalUnreadCount || 0);
      } else {
        console.warn('Failed to fetch notifications:', response.status, response.statusText);
        // If authentication failed, reset notifications
        if (response.status === 401) {
          setNotifications([]);
          setTotalUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and set up periodic refresh
  useEffect(() => {
    fetchNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (conversationId: string) => {
    setShowDropdown(false);
    if (onOpenMessaging) {
      onOpenMessaging(conversationId);
    }
  };

  const getMessagePreview = (message: MessageNotification['latestMessage']) => {
    if (!message) return 'No messages';

    if (message.messageType === 'IMAGE') {
      return '📷 Image';
    } else if (message.messageType === 'FILE') {
      return '📎 File';
    } else {
      return message.content.length > 50
        ? message.content.substring(0, 50) + '...'
        : message.content;
    }
  };

  if (totalUnreadCount === 0) {
    return (
      <button
        onClick={() => onOpenMessaging?.()}
        className={`relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ${className}`}
        title="Messages"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title={`${totalUnreadCount} unread message${totalUnreadCount > 1 ? 's' : ''}`}
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-gray-900">New Messages</h3>
                <span className="text-sm text-gray-500">({totalUnreadCount})</span>
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full mx-auto mb-2"></div>
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No new messages
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.conversationId}
                    onClick={() => handleNotificationClick(notification.conversationId)}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {notification.from.name}
                          </p>
                          {notification.from.userType === 'PROVIDER' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Provider
                            </span>
                          )}
                        </div>

                        {notification.daycare && (
                          <p className="text-xs text-gray-500 mb-1">
                            {notification.daycare.name}
                          </p>
                        )}

                        <p className="text-sm text-gray-600 truncate mb-1">
                          {getMessagePreview(notification.latestMessage)}
                        </p>

                        {notification.latestMessage && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(notification.latestMessage.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notification.unreadCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onOpenMessaging?.();
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Messages
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageNotifications;