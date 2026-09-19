export interface LiveTick {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  direction: 'up' | 'down' | 'same';
  updatedAt: number;
}

type TickListener = (ticks: Record<string, LiveTick>) => void;
type StatusListener = (status: 'connected' | 'connecting' | 'disconnected') => void;

class RealtimeMarketService {
  private ws: WebSocket | null = null;
  private url = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';
  private tickListeners: Set<TickListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private latestTicks: Record<string, LiveTick> = {};
  private prevPrices: Record<string, number> = {};
  private reconnectTimeout: any = null;
  private isDestroyed = false;
  private status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
  private pendingBatch: Record<string, LiveTick> = {};
  private throttleTimer: any = null;
  private messageCount = 0;

  constructor() {}

  public connect() {
    if (this.isDestroyed || (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING))) {
      return;
    }

    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        console.log('[RealtimeService] Connected to Binance Public WebSocket Stream');
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (!Array.isArray(raw)) return;

          this.messageCount++;
          const now = Date.now();

          for (const item of raw) {
            if (!item.s || !item.s.endsWith('USDT')) continue;

            const baseSymbol = item.s.replace('USDT', '');
            const price = parseFloat(item.c);
            const open = parseFloat(item.o);
            const high = parseFloat(item.h);
            const low = parseFloat(item.l);
            const volume = parseFloat(item.v);
            const quoteVolume = parseFloat(item.q);

            if (isNaN(price)) continue;

            const change24h = open > 0 ? ((price - open) / open) * 100 : 0;
            const prev = this.prevPrices[baseSymbol] ?? price;
            const direction: 'up' | 'down' | 'same' = price > prev ? 'up' : price < prev ? 'down' : 'same';
            this.prevPrices[baseSymbol] = price;

            const tick: LiveTick = {
              symbol: baseSymbol,
              price,
              change24h: Math.round(change24h * 100) / 100,
              high24h: high,
              low24h: low,
              volume24h: volume,
              quoteVolume24h: quoteVolume,
              direction,
              updatedAt: now,
            };

            this.latestTicks[baseSymbol] = tick;
            this.pendingBatch[baseSymbol] = tick;
          }

          // Throttle broadcast to every 250ms for ultra-smooth rendering
          if (!this.throttleTimer) {
            this.throttleTimer = setTimeout(() => {
              this.broadcastBatch();
              this.throttleTimer = null;
            }, 250);
          }
        } catch {
          // ignore parsing error
        }
      };

      this.ws.onerror = () => {
        // silently handled in onclose
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private broadcastBatch() {
    if (Object.keys(this.pendingBatch).length === 0) return;
    const batchCopy = { ...this.pendingBatch };
    this.pendingBatch = {};

    for (const listener of this.tickListeners) {
      try {
        listener(batchCopy);
      } catch (err) {
        console.error('[RealtimeService] Listener error:', err);
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isDestroyed) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 3000);
  }

  private setStatus(status: 'connected' | 'connecting' | 'disconnected') {
    this.status = status;
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (e) {
        console.error(e);
      }
    }
  }

  public subscribeTicks(listener: TickListener): () => void {
    this.tickListeners.add(listener);
    if (Object.keys(this.latestTicks).length > 0) {
      listener(this.latestTicks);
    }
    // Automatically connect on first subscriber
    if (this.status === 'disconnected') {
      this.connect();
    }
    return () => {
      this.tickListeners.delete(listener);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getStatus() {
    return this.status;
  }

  public getTick(symbol: string): LiveTick | undefined {
    return this.latestTicks[symbol];
  }

  public getMessageCount() {
    return this.messageCount;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.throttleTimer) clearTimeout(this.throttleTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.tickListeners.clear();
    this.statusListeners.clear();
  }
}

export const realtimeService = new RealtimeMarketService();
