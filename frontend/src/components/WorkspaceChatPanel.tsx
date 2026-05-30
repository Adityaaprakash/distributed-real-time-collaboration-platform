import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChatMessageResponse } from '../services/chatService';
import { ChatMessage } from './ChatMessage';
import './WorkspaceChat.css';

interface WorkspaceChatPanelProps {
  messages: ChatMessageResponse[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isLoadingHistory: boolean;
  currentUserEmail: string | undefined;
}

export const WorkspaceChatPanel: React.FC<WorkspaceChatPanelProps> = ({
  messages,
  sendMessage,
  isConnected,
  isLoadingHistory,
  currentUserEmail
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    const isSmallDiff = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    
    if (isSmallDiff) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
      setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className={`connection-pill ${isConnected ? 'connected' : 'reconnecting'}`}>
          {isConnected ? '● Connected' : '○ Reconnecting...'}
        </div>
      </div>
      
      <div className="messages-container" ref={containerRef}>
        {isLoadingHistory ? (
          <div className="loading-history">Loading history...</div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
            <span style={{ fontSize: '32px', marginBottom: '10px' }}>💬</span>
            <p>No messages yet — say hello!</p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isOwnMessage={msg.senderEmail === currentUserEmail} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          rows={2}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!isConnected || !inputValue.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};
