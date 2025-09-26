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
  X,
  Paperclip,
  Camera,
  Image,
  File,
  Download,
  Users,
  Baby,
  Phone,
  Mail
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

interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  children: Array<{
    bookingId: string;
    childName: string;
    childAge: string;
    status: string;
    daycare: {
      id: string;
      name: string;
    };
  }>;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
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
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showParentDirectory, setShowParentDirectory] = useState(false);
  const [parents, setParents] = useState<Parent[]>([]);
  const [activeView, setActiveView] = useState<'conversations' | 'parents'>('conversations');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch parents (for providers only)
  const fetchParents = async () => {
    if (currentUser.userType !== 'PROVIDER') return;

    try {
      const response = await fetch('/api/provider/parents');
      if (response.ok) {
        const data = await response.json();
        setParents(data.parents);
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error);
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
  const sendMessage = async (messageData?: {
    content?: string;
    messageType?: 'TEXT' | 'IMAGE' | 'FILE';
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
  }) => {
    if (!selectedConversation) return;

    const data = messageData || { content: newMessage.trim(), messageType: 'TEXT' };

    if (data.messageType === 'TEXT' && !data.content?.trim()) return;
    if ((data.messageType === 'IMAGE' || data.messageType === 'FILE') && !data.fileUrl) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const responseData = await response.json();
        setMessages(prev => [...prev, responseData.message]);
        setNewMessage('');
        setShowAttachmentOptions(false);
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

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';

      sendMessage({
        content: file.name,
        messageType,
        fileName: file.name,
        fileUrl: result,
        fileType: file.type,
        fileSize: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    // For now, just trigger file input with camera
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };

  // Handle file input
  const handleFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*,.pdf,.doc,.docx';
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render message content based on type
  const renderMessageContent = (message: Message, isSender: boolean) => {
    switch (message.messageType) {
      case 'IMAGE':
        return (
          <div>
            {message.fileUrl && (
              <div className="mb-2">
                <img
                  src={message.fileUrl}
                  alt={message.fileName || 'Image'}
                  className="max-w-xs rounded-lg cursor-pointer"
                  onClick={() => window.open(message.fileUrl, '_blank')}
                />
              </div>
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        );

      case 'FILE':
        return (
          <div className={`flex items-center gap-2 p-2 rounded ${
            isSender ? 'bg-blue-500/20' : 'bg-gray-300'
          }`}>
            <File className={`h-6 w-6 ${isSender ? 'text-blue-200' : 'text-blue-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              {message.fileSize && (
                <p className={`text-xs ${isSender ? 'text-blue-200' : 'text-gray-500'}`}>
                  {formatFileSize(message.fileSize)}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (message.fileUrl) {
                  const link = document.createElement('a');
                  link.href = message.fileUrl;
                  link.download = message.fileName || 'download';
                  link.click();
                }
              }}
              className={`p-1 rounded ${isSender ? 'hover:bg-blue-400/30' : 'hover:bg-gray-400'}`}
            >
              <Download className={`h-4 w-4 ${isSender ? 'text-blue-200' : 'text-gray-600'}`} />
            </button>
          </div>
        );

      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.daycare?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Start conversation with parent from directory
  const startConversationWithParent = async (parentId: string, daycareId?: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: parentId, daycareId })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchConversations();

        // Find and select the conversation
        setTimeout(() => {
          const conversation = conversations.find(c => c.id === data.conversation.id);
          if (conversation) {
            setSelectedConversation(conversation);
            setActiveView('conversations');
            setShowConversationList(false);
            fetchMessages(conversation.id);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to start conversation with parent:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    if (currentUser.userType === 'PROVIDER') {
      fetchParents();
    }
  }, [currentUser.userType]);

  useEffect(() => {
    // Handle initial conversation setup
    if (initialConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === initialConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        setShowConversationList(false);
        fetchMessages(conversation.id);
      }
    }
  }, [conversations, initialConversationId]);

  // Separate useEffect for starting new conversation to prevent infinite loop
  useEffect(() => {
    if (initialParticipantId && !initialConversationId) {
      startConversation(initialParticipantId, initialDaycareId);
    }
  }, [initialParticipantId, initialDaycareId, initialConversationId]);

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

            {/* Provider Tabs */}
            {currentUser.userType === 'PROVIDER' && (
              <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('conversations')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'conversations'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageCircle className="h-4 w-4 inline mr-1" />
                  Chats
                </button>
                <button
                  onClick={() => setActiveView('parents')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'parents'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-1" />
                  Parents
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeView === 'conversations' ? "Search conversations..." : "Search parents..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Content Area - Conversations or Parents */}
          <div className="flex-1 overflow-y-auto">
            {activeView === 'conversations' ? (
              // Conversations List
              filteredConversations.length === 0 ? (
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
              )
            ) : (
              // Parents Directory (for providers only)
              parents.filter(parent =>
                parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                parent.children.some(child =>
                  child.childName.toLowerCase().includes(searchQuery.toLowerCase())
                )
              ).length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No parents found</p>
                  <p className="text-sm">Parents with bookings will appear here</p>
                </div>
              ) : (
                parents.filter(parent =>
                  parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  parent.children.some(child =>
                    child.childName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                ).map((parent) => (
                  <div key={parent.id} className="p-4 border-b bg-white hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{parent.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          {parent.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{parent.email}</span>
                            </div>
                          )}
                          {parent.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{parent.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => startConversationWithParent(parent.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Message
                      </button>
                    </div>

                    {/* Children List */}
                    <div className="space-y-1">
                      {parent.children.map((child, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                          <Baby className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-gray-700">{child.childName}</span>
                          <span className="text-gray-500">({child.childAge})</span>
                          <span className="text-xs text-gray-500">• {child.daycare.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            child.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            child.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {child.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )
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
                        {renderMessageContent(message, message.sender.id === currentUser.id)}
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
                {/* Attachment Options */}
                {showAttachmentOptions && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-3">
                      <button
                        onClick={handleCameraCapture}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Camera</span>
                      </button>
                      <button
                        onClick={handleFileInput}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Image className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Photos</span>
                      </button>
                      <button
                        onClick={handleFileInput}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <File className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Documents</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
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