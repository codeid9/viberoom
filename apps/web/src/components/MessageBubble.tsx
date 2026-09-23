import React from 'react';
import type { IMessageItem } from '../types/message';

interface MessageBubbleProps {
  message: IMessageItem;
  isSelf: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSelf }) => {
  const { senderName, content, createdAt } = message;

  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col mb-3 ${isSelf ? 'items-end' : 'items-start'}`}>
      <div className="flex items-baseline gap-2 mb-1 px-1">
        <span className="text-xs font-medium text-neutral-400">{senderName}</span>
        <span className="text-[10px] text-neutral-600">{formattedTime}</span>
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words shadow-sm ${
          isSelf
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-neutral-800/90 text-neutral-200 border border-neutral-700/50 rounded-tl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
};