import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { BFF_BASE_URL } from '../../../core/api/client';
import { authStorage } from '../../../core/storage/authStorage';
import { useAuthStore } from '../../../core/store/authStore';

export function useInboxWebSocket(activeConversationId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function initWebSocket() {
      const token = await authStorage.getAccessToken();
      if (!token || !isMounted) return;

      const wsProtocol = BFF_BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const host = BFF_BASE_URL.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${host}/mobile/v1/realtime?token=${encodeURIComponent(token)}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);

            if (payload.event === 'message.created') {
              if (activeConversationId) {
                queryClient.invalidateQueries({
                  queryKey: ['conversation_details', activeConversationId],
                });
              }
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
            } else if (payload.event === 'conversation.updated') {
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
          } catch (_) {}
        };

        ws.onerror = () => {};
        ws.onclose = () => {};
      } catch (_) {}
    }

    initWebSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, activeConversationId, queryClient]);
}

