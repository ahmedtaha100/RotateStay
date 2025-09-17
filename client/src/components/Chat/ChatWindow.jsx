import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }

  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${base}${fileUrl}`;
};

const ChatWindow = ({ conversationId, otherUser }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const isTypingRef = useRef(false);
  const conversationIdRef = useRef(conversationId);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const markMessagesAsRead = useCallback(() => {
    const activeConversationId = conversationIdRef.current;
    if (activeConversationId && socketRef.current) {
      socketRef.current.emit('mark-as-read', { conversationId: activeConversationId });
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !token) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data);
      markMessagesAsRead();
      requestAnimationFrame(scrollToBottom);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, token, markMessagesAsRead, scrollToBottom]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    setOtherUserTyping(false);
    setNewMessage('');
  }, [conversationId]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-conversations');
      markMessagesAsRead();
    });

    socket.on('new-message', (payload) => {
      if (payload.conversationId === conversationIdRef.current) {
        setMessages((prev) => [...prev, payload.message]);
        markMessagesAsRead();
      }
    });

    socket.on('messages-read', (payload) => {
      if (payload.conversationId === conversationIdRef.current) {
        setMessages((prev) =>
          prev.map((message) =>
            message.senderId === user.id ? { ...message, isRead: true, readAt: payload.readAt } : message
          )
        );
      }
    });

    socket.on('user-typing', (payload) => {
      if (payload.userId !== user.id && payload.conversationId === conversationIdRef.current) {
        setOtherUserTyping(true);
      }
    });

    socket.on('user-stopped-typing', (payload) => {
      if (payload.userId !== user.id && payload.conversationId === conversationIdRef.current) {
        setOtherUserTyping(false);
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
      clearTimeout(typingTimeoutRef.current);
      isTypingRef.current = false;
    };
  }, [token, user, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markMessagesAsRead();
      }
    };

    const handleWindowFocus = () => {
      markMessagesAsRead();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [markMessagesAsRead]);

  const handleTyping = (event) => {
    setNewMessage(event.target.value);

    if (!socketRef.current || !conversationId) {
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current.emit('typing-start', { conversationId });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socketRef.current?.emit('typing-stop', { conversationId });
        isTypingRef.current = false;
      }
    }, 1000);
  };

  const sendMessage = useCallback(
    (event) => {
      event?.preventDefault();

      const socket = socketRef.current;
      const trimmed = newMessage.trim();

      if (!socket || !conversationId || !trimmed) {
        return;
      }

      socket.emit(
        'send-message',
        {
          conversationId,
          content: trimmed
        },
        (response) => {
          if (!response?.success) {
            console.error('Failed to send message:', response?.error);
            return;
          }

          setNewMessage('');
          if (isTypingRef.current) {
            socket.emit('typing-stop', { conversationId });
            isTypingRef.current = false;
          }
        }
      );
    },
    [conversationId, newMessage]
  );

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !socketRef.current || !conversationId) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const bufferArray = Array.from(new Uint8Array(arrayBuffer));

    socketRef.current.emit(
      'send-message',
      {
        conversationId,
        content: `Shared a file: ${file.name}`,
        fileData: {
          buffer: bufferArray,
          type: file.type,
          name: file.name
        }
      },
      (response) => {
        if (!response?.success) {
          console.error('Failed to upload file:', response?.error);
        }
      }
    );
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    }

    if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    }

    return format(messageDate, 'MMM dd, HH:mm');
  };

  const MessageBubble = ({ message }) => {
    const isOwn = message.senderId === user?.id;
    const resolvedUrl = resolveFileUrl(message.fileUrl);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[70%] sm:max-w-[60%] ${isOwn ? 'order-2' : ''}`}>
          <div
            className={`rounded-2xl px-4 py-2 break-words ${
              isOwn ? 'bg-gradient-primary text-white' : 'bg-dark-700 text-gray-100'
            }`}
          >
            <p
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: message.content || '' }}
            />

            {resolvedUrl && (
              <div className="mt-2">
                {message.fileType?.startsWith('image/') ? (
                  <img
                    src={resolvedUrl}
                    alt={message.fileName || 'Shared file'}
                    className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open(resolvedUrl, '_blank')}
                  />
                ) : (
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    <span className="text-sm truncate max-w-[160px]">{message.fileName}</span>
                  </a>
                )}
              </div>
            )}

            <div
              className={`flex items-center gap-1 mt-1 text-xs ${
                isOwn ? 'text-white/70' : 'text-gray-500'
              }`}
            >
              <span>{formatMessageTime(message.createdAt)}</span>
              {isOwn && (
                message.isRead ? <CheckCircleIcon className="w-3 h-3" /> : <CheckIcon className="w-3 h-3" />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Select a conversation to start chatting.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg bg-dark-800">
      <div className="flex items-center gap-3 border-b border-dark-700 p-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Conversation'}
          </h3>
          {otherUser?.medicalSchool && (
            <p className="text-sm text-gray-400">{otherUser.medicalSchool}</p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {otherUserTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-gray-400"
          >
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:100ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:200ms]" />
            </div>
            <span>{otherUser ? `${otherUser.firstName} is typing...` : 'Typing...'}</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-dark-700 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 text-gray-400 transition hover:text-white"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
          />

          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-dark-600 bg-dark-700 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="rounded-full bg-gradient-primary p-2 text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
