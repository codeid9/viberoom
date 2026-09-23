import React, { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { MessageBubble } from './MessageBubble';
import { Button } from './Button';
import { fetchRoomMessages } from '../services/messageService';
import type { IMessageItem } from '../types/message';

interface ChatPanelProps {
  roomId: string;
  socket: Socket | null;
  isJoined: boolean;
  senderName: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  roomId,
  socket,
  isJoined,
  senderName,
}) => {
  const [messages, setMessages] = useState<IMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Fetch message history on room load
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    fetchRoomMessages(roomId)
      .then((history) => {
        if (isMounted) {
          setMessages(history);
          setIsLoading(false);
          setTimeout(() => scrollToBottom(false), 50);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load messages');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 2. Listen for incoming real-time messages & errors
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: IMessageItem) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => scrollToBottom(true), 30);
    };

    const handleMessageError = (err: { message?: string }) => {
      setErrorMessage(err?.message || 'Failed to deliver message.');
      setTimeout(() => setErrorMessage(null), 4000);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-error', handleMessageError);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-error', handleMessageError);
    };
  }, [socket]);

  // 3. Send message handler using socket's verified identity
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = inputText.trim();
    if (!cleanContent || !socket || !isJoined) return;

    socket.emit('send-message', {
      roomId,
      content: cleanContent,
    });

    setInputText('');
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col bg-neutral-900/60 border-t lg:border-t-0 lg:border-l border-neutral-800/80 h-96 lg:h-full shrink-0">
      {/* Chat header showing confirmed display name */}
      <div className="h-12 px-4 border-b border-neutral-800/80 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Room Chat
        </span>
        <div className="flex items-center gap-1.5 bg-neutral-950/60 px-2 py-0.5 rounded-md border border-neutral-800">
          <span className="text-[10px] text-neutral-500">You:</span>
          <span className="text-xs font-medium text-neutral-200">{senderName}</span>
        </div>
      </div>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="px-3 py-1.5 bg-rose-950/70 border-b border-rose-800/50 text-rose-300 text-[11px]">
          {errorMessage}
        </div>
      )}

      {/* Messages viewport */}
      <div className="flex-1 p-4 overflow-y-auto min-h-0 flex flex-col">
        {isLoading ? (
          <div className="m-auto flex flex-col items-center gap-2 text-neutral-500 text-xs">
            <span className="w-4 h-4 border-2 border-neutral-600 border-t-indigo-500 rounded-full animate-spin" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="m-auto text-center px-4">
            <p className="text-neutral-500 text-xs">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isSelf={msg.senderName === senderName}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-neutral-800/80 bg-neutral-900/80 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isJoined ? 'Send a message...' : 'Connecting to chat...'}
          maxLength={1000}
          disabled={!isJoined}
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
        />
        <Button type="submit" size="sm" disabled={!inputText.trim() || !isJoined}>
          Send
        </Button>
      </form>
    </aside>
  );
};