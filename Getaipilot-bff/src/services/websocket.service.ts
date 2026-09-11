import { WebSocket } from 'ws';

export interface RealtimeEvent {
  event:
    | 'message.created'
    | 'conversation.updated'
    | 'lead.created'
    | 'call.started'
    | 'call.completed'
    | 'payment.failed'
    | 'notification.created'
    | 'whatsapp.connection.updated'
    | 'whatsapp.template.updated'
    | 'whatsapp.broadcast.created'
    | 'whatsapp.broadcast.updated'
    | 'whatsapp.broadcast.completed'
    | 'whatsapp.credits.updated'
    | string;
  data: any;
  organizationId: string;
  timestamp: string;
}

export class WebSocketService {
  private static connections = new Map<string, Set<WebSocket>>();

  public static registerConnection(organizationId: string, socket: WebSocket) {
    if (!this.connections.has(organizationId)) {
      this.connections.set(organizationId, new Set());
    }
    this.connections.get(organizationId)?.add(socket);

    socket.on('close', () => {
      this.connections.get(organizationId)?.delete(socket);
      if (this.connections.get(organizationId)?.size === 0) {
        this.connections.delete(organizationId);
      }
    });
  }

  public static broadcast(organizationId: string, eventOrPayload: any, data?: any) {
    if (typeof eventOrPayload === 'string') {
      this.broadcastToOrg(organizationId, eventOrPayload, data);
    } else if (eventOrPayload && (eventOrPayload.event || eventOrPayload.type)) {
      this.broadcastToOrg(organizationId, eventOrPayload.event || eventOrPayload.type, eventOrPayload);
    } else {
      this.broadcastToOrg(organizationId, 'conversation.updated', eventOrPayload);
    }
  }

  public static broadcastToOrg(organizationId: string, event: RealtimeEvent['event'], data: any) {
    const orgSockets = this.connections.get(organizationId);
    if (!orgSockets || orgSockets.size === 0) return;

    const payload = JSON.stringify({
      event,
      data,
      organizationId,
      timestamp: new Date().toISOString(),
    });

    for (const socket of orgSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }
}
