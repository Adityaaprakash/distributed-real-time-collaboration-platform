import React from 'react';
import { ChatMessageResponse } from '../services/chatService';

interface ChatMessageProps {
  message: ChatMessageResponse;
  isOwnMessage: boolean;
}

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  return (
    <div className={`chat-message-wrapper ${isOwnMessage ? 'own' : 'other'} ${message._optimistic ? 'optimistic' : ''}`}>
      {!isOwnMessage && (
        <span className="sender-name">{message.senderFullName || message.senderEmail}</span>
      )}
      <div className="chat-bubble">
        {message.content}
      </div>
      <div className="message-meta">
        <span className="timestamp">{timeAgo(message.createdAt)}</span>
        {message._optimistic && <span className="sending-label"> Sending...</span>}
      </div>
    </div>
  );
};
