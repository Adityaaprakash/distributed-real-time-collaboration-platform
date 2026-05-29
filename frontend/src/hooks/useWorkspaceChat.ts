import { useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { chatService, ChatMessageResponse } from '../services/chatService';
import { getToken } from '../services/auth';

export const useWorkspaceChat = (
  workspaceId: string | undefined,
  currentUserEmail: string | undefined
) => {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    let mounted = true;

    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const history = await chatService.getMessages(workspaceId);
        if (mounted) {
          setMessages(history);
          setIsLoadingHistory(false);
        }
      } catch (error) {
        console.error('Failed to load chat history', error);
        if (mounted) setIsLoadingHistory(false);
      }
    };

    loadHistory();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${getToken()}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        if (mounted) setIsConnected(true);
        
        client.subscribe(`/topic/workspaces/${workspaceId}/chat`, (message) => {
          if (!mounted) return;
          const incoming: ChatMessageResponse = JSON.parse(message.body);
          
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) {
                return prev;
            }

            const isDuplicateOfOptimistic = prev.some(
              m => m._optimistic && m.senderEmail === incoming.senderEmail && 
                   new Date(incoming.createdAt).getTime() - new Date(m.createdAt).getTime() < 2000
            );

            if (isDuplicateOfOptimistic) {
                return prev.map(m => {
                    if (m._optimistic && m.senderEmail === incoming.senderEmail) {
                        return incoming;
                    }
                    return m;
                });
            }
            return [...prev, incoming];
          });
        });
      },
      onDisconnect: () => {
        if (mounted) setIsConnected(false);
      },
      onStompError: (error) => {
        console.error('STOMP Error:', error);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      mounted = false;
      client.deactivate();
    };
  }, [workspaceId]);

  const sendMessage = useCallback((content: string) => {
    if (!workspaceId || !currentUserEmail || !content.trim()) return;

    const tempMessage: ChatMessageResponse = {
      id: crypto.randomUUID(),
      workspaceId,
      senderId: '',
      senderEmail: currentUserEmail,
      senderFullName: 'Me',
      content,
      createdAt: new Date().toISOString(),
      _optimistic: true
    };

    setMessages(prev => [...prev, tempMessage]);

    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/workspaces/${workspaceId}/chat`,
        body: JSON.stringify({ workspaceId, content })
      });
    }
  }, [workspaceId, currentUserEmail, stompClient]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoadingHistory
  };
};
