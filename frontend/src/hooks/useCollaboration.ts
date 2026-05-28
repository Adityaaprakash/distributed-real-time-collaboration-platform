import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken } from '../services/auth';
import { DocumentEditBroadcast, PresenceBroadcast, CursorBroadcast } from '../types/collaboration';

export function useCollaboration(
  documentId: string | null,
  currentUserEmail: string | undefined,
  onRemoteEdit: (broadcast: DocumentEditBroadcast) => void,
  onPresenceUpdate: (broadcast: PresenceBroadcast) => void,
  onCursorUpdate: (broadcast: CursorBroadcast) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Store callbacks in refs so they don't trigger re-reconnects
  const onRemoteEditRef = useRef(onRemoteEdit);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);
  const onCursorUpdateRef = useRef(onCursorUpdate);

  useEffect(() => {
    onRemoteEditRef.current = onRemoteEdit;
    onPresenceUpdateRef.current = onPresenceUpdate;
    onCursorUpdateRef.current = onCursorUpdate;
  }, [onRemoteEdit, onPresenceUpdate, onCursorUpdate]);

  useEffect(() => {
    if (!documentId || !currentUserEmail) return;

    const token = getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);

        client.subscribe(`/topic/documents/${documentId}`, (message) => {
          const broadcast = JSON.parse(message.body) as DocumentEditBroadcast;
          if (broadcast.editorEmail !== currentUserEmail) {
            onRemoteEditRef.current(broadcast);
          }
        });

        client.subscribe(`/topic/documents/${documentId}/presence`, (message) => {
          onPresenceUpdateRef.current(JSON.parse(message.body) as PresenceBroadcast);
        });

        client.subscribe(`/topic/documents/${documentId}/cursor`, (message) => {
          const broadcast = JSON.parse(message.body) as CursorBroadcast;
          if (broadcast.userEmail !== currentUserEmail) {
            onCursorUpdateRef.current(broadcast);
          }
        });

        client.publish({
          destination: `/app/documents/${documentId}/join`,
          body: JSON.stringify({ documentId, status: 'JOINED' })
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (client.connected) {
        client.publish({
          destination: `/app/documents/${documentId}/leave`,
          body: JSON.stringify({ documentId, status: 'LEFT' })
        });
      }
      client.deactivate();
      setIsConnected(false);
    };
  }, [documentId, currentUserEmail]);

  const sendEdit = (content: string, title: string) => {
    if (clientRef.current?.connected && documentId) {
      clientRef.current.publish({
        destination: `/app/documents/${documentId}/edit`,
        body: JSON.stringify({ documentId, content, title, clientTimestamp: Date.now() })
      });
    }
  };

  const sendCursor = (cursorLine: number) => {
    if (clientRef.current?.connected && documentId) {
      clientRef.current.publish({
        destination: `/app/documents/${documentId}/cursor`,
        body: JSON.stringify({ documentId, cursorLine })
      });
    }
  };

  return { sendEdit, sendCursor, isConnected };
}
