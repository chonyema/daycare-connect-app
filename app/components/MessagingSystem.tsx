'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  MoreVertical,
  Search,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'PARENT' | 'PROVIDER' | 'ADMIN';
}

interface Daycare {
  id: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  sender: User;
  receiver: User;
}

interface Conversation {
  id: string;
  participant: User;
  daycare?: Daycare;
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: User;
    isRead: boolean;
  };
  unreadCount: number;
  lastMessageAt: string;
}

interface MessagingSystemProps {
  currentUser: User;
  onClose: () => void;
  initialConversationId?: string;
  initialParticipantId?: string;
  initialDaycareId?: string;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({
  currentUser,
  onClose,
  initialConversationId,
  initialParticipantId,
  initialDaycareId
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        scrollToBottom();

        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Start new conversation
  const startConversation = async (participantId: string, daycareId?: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, daycareId })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchConversations();

        // Find and select the conversation
        const conversation = conversations.find(c => c.id === data.conversation.id);
        if (conversation) {
          setSelectedConversation(conversation);
          setShowConversationList(false);
          fetchMessages(conversation.id);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to start conversation:', errorData);

        if (response.status === 401) {
          alert('Please log in to send messages');
        } else if (response.status === 404) {
          alert('Provider not found. Please try again.');
        } else {
          alert(`Failed to start conversation: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Yesterday ' + format(date, 'HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.daycare?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // Handle initial conversation setup
    if (initialConversationId) {
      const conversation = conversations.find(c => c.id === initialConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        setShowConversationList(false);
        fetchMessages(conversation.id);
      }
    } else if (initialParticipantId) {
      startConversation(initialParticipantId, initialDaycareId);
    }
  }, [conversations, initialConversationId, initialParticipantId, initialDaycareId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] flex overflow-hidden">
        {/* Conversations List */}
        <div className={`w-1/3 border-r bg-gray-50 flex flex-col ${!showConversationList && selectedConversation ? 'hidden md:flex' : ''}`}>
          {/* Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Messages</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start messaging with parents or providers!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setShowConversationList(false);
                    fetchMessages(conversation.id);
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-white transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.participant.name}
                        </h3>
                        {conversation.participant.userType === 'PROVIDER' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Provider
                          </span>
                        )}
                      </div>
                      {conversation.daycare && (
                        <p className="text-xs text-gray-500 mb-1">{conversation.daycare.name}</p>
                      )}
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.sender.id === currentUser.id ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${showConversationList && !selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowConversationList(true)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.participant.name}
                    </h3>
                    {selectedConversation.daycare && (
                      <p className="text-sm text-gray-500">{selectedConversation.daycare.name}</p>
                    )}
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender.id === currentUser.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          message.sender.id === currentUser.id ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
                          {message.sender.id === currentUser.id && (
                            message.isRead ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Welcome to Messages</h3>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;