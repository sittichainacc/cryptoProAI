// ============================================================================
// Real-Time Server-Sent Events (SSE) Streaming Service (Phase 10)
// ============================================================================

import { Response } from 'express';
import crypto from 'crypto';

export interface SSEClient {
  id: string;
  res: Response;
  connectedAt: Date;
  ip?: string;
  userAgent?: string;
}

export interface BroadcastMessage {
  event: string;
  data: any;
  timestamp: string;
}

export class RealtimeSSEService {
  private clients: Map<string, SSEClient> = new Map();
  private totalBroadcasts: number = 0;
  private startedAt: Date = new Date();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Registers a new HTTP connection as an SSE client
   */
  public registerClient(res: Response, ip?: string, userAgent?: string): string {
    const clientId = `sse_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Set standard SSE streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, Cloudflare)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    const client: SSEClient = {
      id: clientId,
      res,
      connectedAt: new Date(),
      ip,
      userAgent
    };

    this.clients.set(clientId, client);

    // Send initial handshake payload
    this.sendToClient(clientId, 'connected', {
      clientId,
      status: 'ONLINE',
      connectedAt: client.connectedAt.toISOString(),
      activeClients: this.clients.size
    });

    // Handle client disconnect / socket close
    res.on('close', () => {
      this.removeClient(clientId);
    });

    res.on('error', (err) => {
      console.warn(`[RealtimeSSE] Client ${clientId} connection error:`, err.message);
      this.removeClient(clientId);
    });

    return clientId;
  }

  /**
   * Removes client on disconnection
   */
  public removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcasts an event to all connected active SSE clients
   */
  public broadcast(event: string, payload: any): void {
    const timestamp = new Date().toISOString();
    const formattedData = JSON.stringify({
      ...payload,
      _sse_timestamp: timestamp
    });

    const ssePayload = `event: ${event}\ndata: ${formattedData}\n\n`;

    this.totalBroadcasts++;
    const disconnectedIds: string[] = [];

    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(ssePayload);
      } catch (err) {
        disconnectedIds.push(id);
      }
    }

    // Clean up stale sockets
    for (const id of disconnectedIds) {
      this.removeClient(id);
    }
  }

  /**
   * Dispatches a message to a single specific client
   */
  public sendToClient(clientId: string, event: string, payload: any): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    try {
      const formattedData = JSON.stringify({
        ...payload,
        _sse_timestamp: new Date().toISOString()
      });
      client.res.write(`event: ${event}\ndata: ${formattedData}\n\n`);
      return true;
    } catch (err) {
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Heartbeat to prevent intermediate proxies from terminating idle connections
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.clients.size === 0) return;

      const pingPayload = `: ping - ${new Date().toISOString()}\n\n`;
      const deadIds: string[] = [];

      for (const [id, client] of this.clients.entries()) {
        try {
          client.res.write(pingPayload);
        } catch {
          deadIds.push(id);
        }
      }

      for (const id of deadIds) {
        this.removeClient(id);
      }
    }, 15000); // 15-second heartbeat
  }

  /**
   * Returns current streaming service telemetry
   */
  public getStats() {
    return {
      activeClients: this.clients.size,
      totalBroadcasts: this.totalBroadcasts,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      startedAt: this.startedAt.toISOString()
    };
  }

  /**
   * Clear all active clients (e.g. during test tear down)
   */
  public reset(): void {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.end();
      } catch {}
    }
    this.clients.clear();
    this.totalBroadcasts = 0;
  }
}

// Global Singleton Instance
export const realtimeSSEService = new RealtimeSSEService();
