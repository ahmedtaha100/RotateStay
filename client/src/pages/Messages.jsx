import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from '../components/Chat/ChatWindow';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

const Messages = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setConversations([]);
      return;
    }

    const controller = new AbortController();

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Failed to load conversations');
        }

        const data = await response.json();
        setConversations(data);

        const initialConversation = searchParams.get('conversation');
        const conversationExists = data.some((conversation) => conversation.id === initialConversation);

        if (initialConversation && conversationExists) {
          setSelectedConversationId(initialConversation);
        } else if (data.length > 0) {
          setSelectedConversationId(data[0].id);
          setSearchParams((params) => {
            const newParams = new URLSearchParams(params);
            newParams.set('conversation', data[0].id);
            return newParams;
          });
        } else {
          setSelectedConversationId(null);
          setSearchParams((params) => {
            const newParams = new URLSearchParams(params);
            newParams.delete('conversation');
            return newParams;
          });
        }

        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load conversations', err);
          setError('Failed to load conversations');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      controller.abort();
    };
  }, [token]);

  useEffect(() => {
    const conversationQuery = searchParams.get('conversation');
    if (conversationQuery && conversationQuery !== selectedConversationId) {
      const exists = conversations.some((conversation) => conversation.id === conversationQuery);
      if (exists) {
        setSelectedConversationId(conversationQuery);
      }
    }
  }, [searchParams, conversations, selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const otherParticipant = useMemo(() => {
    if (!selectedConversation || !user) {
      return null;
    }

    return selectedConversation.participants.find((participant) => participant.id !== user.id) || null;
  }, [selectedConversation, user]);

  if (authLoading) {
    return (
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-6 py-16 text-gray-300">
        Loading your messages...
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="mx-auto flex h-full max-w-4xl items-center justify-center px-6 py-16 text-center text-gray-300">
        <div>
          <h2 className="text-2xl font-semibold text-white">Sign in to view your messages</h2>
          <p className="mt-4 text-gray-400">
            Secure messaging keeps your booking and swap conversations organized in one place.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-120px)] max-w-6xl flex-col gap-6 px-6 py-12 text-white lg:flex-row">
      <aside className="h-full w-full overflow-hidden rounded-2xl bg-dark-800 lg:w-80">
        <div className="border-b border-dark-700 p-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>

        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-400">Loading conversations...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-gray-400">
            You don’t have any conversations yet.
          </div>
        ) : (
          <ul className="max-h-full overflow-y-auto">
            {conversations.map((conversation) => {
              const otherUser = conversation.participants.find((participant) => participant.id !== user.id);
              const isSelected = selectedConversationId === conversation.id;
              const lastMessagePreview = conversation.lastMessage?.content || 'No messages yet';
              const previewText = lastMessagePreview.replace(/<[^>]+>/g, '');
              const lastMessageTime = conversation.lastMessage?.createdAt
                ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
                : 'No messages yet';

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConversationId(conversation.id);
                      setSearchParams((params) => {
                        const newParams = new URLSearchParams(params);
                        newParams.set('conversation', conversation.id);
                        return newParams;
                      });
                    }}
                    className={`flex w-full flex-col gap-1 border-b border-dark-700 px-4 py-3 text-left transition ${
                      isSelected ? 'bg-dark-700' : 'hover:bg-dark-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">
                        {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Group chat'}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-1">{previewText}</p>
                    <p className="text-xs text-gray-500">{lastMessageTime}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="flex h-full flex-1 flex-col">
        <ChatWindow conversationId={selectedConversationId} otherUser={otherParticipant} />
      </section>
    </div>
  );
};

export default Messages;
