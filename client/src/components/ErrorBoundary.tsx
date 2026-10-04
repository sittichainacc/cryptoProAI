import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CryptoPro ErrorBoundary] Uncaught render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('cryptopro_auth_role');
      localStorage.removeItem('cryptopro_auth_user');
      localStorage.removeItem('cryptopro_chart_indicators_v2');
      localStorage.removeItem('cryptopro_chart_engine_v2');
      localStorage.removeItem('cryptopro_chart_timeframe_v2');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'เกิดข้อผิดพลาดในการประมวลผลหน้าจอ';

      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#080C15',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: '#10182B',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '32px 28px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(239, 68, 68, 0.15)',
              textAlign: 'center',
            }}
          >
            {/* Header Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertTriangle size={32} color="#EF4444" />
            </div>

            {/* Title */}
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF' }}>
              CryptoPro AI — ตรวจพบข้อผิดพลาดชั่วคราว
            </h1>

            <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 20px', lineHeight: 1.6 }}>
              ระบบป้องกันปัญหาจอดำ (Crash Recovery Guard) กำลังทำงาน ข้อมูลหรือการเชื่อมต่อบางส่วนกำลังรอการรีเฟรช
            </p>

            {/* Error Message Box */}
            <div
              style={{
                backgroundColor: '#0B101E',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#F87171',
                textAlign: 'left',
                marginBottom: '24px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {errorMessage}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.15s ease',
                }}
              >
                <RefreshCw size={16} />
                รีเฟรชหน้าจอ (Reload)
              </button>

              <button
                onClick={this.handleResetCache}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={16} />
                ล้างแคชและเริ่มใหม่ (Reset Cache)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
