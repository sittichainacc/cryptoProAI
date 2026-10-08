// ============================================================================
// Phase 11: AI-CIO Dialectical Chat Assistant & Executive Audio/Text Briefing UI
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Send,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  Plus,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  FileText,
  Sliders,
  Award
} from 'lucide-react';

export interface DialecticalThesis {
  summary: string;
  keyPoints: string[];
  momentumScore: number;
  dcfUpsidePct: number;
  catalysts: string[];
}

export interface DialecticalAntithesis {
  summary: string;
  keyRisks: string[];
  redTeamVeto: boolean;
  beneishMScore: number;
  shortInterestPct: number;
  technicalBreakdown: string;
}

export interface DialecticalSynthesis {
  verdict: 'SUPERMAJORITY_BUY' | 'BUY' | 'ACCUMULATE' | 'HOLD' | 'REDUCE' | 'VETO_REJECT';
  confidencePct: number;
  allocationPct: number;
  stopLossPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  rationales: string[];
  conditionsToAbort: string[];
}

export interface CIODialecticalResponse {
  ticker?: string;
  query: string;
  thesis: DialecticalThesis;
  antithesis: DialecticalAntithesis;
  synthesis: DialecticalSynthesis;
  formattedMarkdown: string;
  contextSnapshot: {
    regime: string;
    vix: number;
    us10y: number;
    portfolioDrawdown: number;
    circuitBreaker: string;
    cashRatioPct: number;
  };
}

export interface ExecutiveBriefing {
  id: string;
  briefingType: 'MORNING' | 'INTRADAY' | 'EVENING';
  title: string;
  fullText: string;
  audioScript: string;
  metrics: {
    regime: string;
    vix: number;
    us10y: number;
    dxy: number;
    portfolioNav: number;
    portfolioDrawdown: number;
    circuitBreaker: string;
    cashRatioPct: number;
    topOpportunities: string[];
    redTeamVetoes: string[];
  };
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  dialecticalData?: CIODialecticalResponse;
  createdAt: string;
}

export interface AICIOChatAssistantProps {
  defaultTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

export const AICIOChatAssistant: React.FC<AICIOChatAssistantProps> = ({
  defaultTicker,
  onSelectTicker,
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('session_default_cio');

  // Briefing state
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [briefingType, setBriefingType] = useState<'MORNING' | 'INTRADAY' | 'EVENING'>('MORNING');
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(false);
  const [briefingViewMode, setBriefingViewMode] = useState<'MARKDOWN' | 'SCRIPT'>('MARKDOWN');

  // Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Executive Context Telemetry
  const [contextData, setContextData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Initial Briefing, History & Context
  useEffect(() => {
    fetchBriefing();
    fetchContext();
    fetchHistory();

    return () => {
      stopAudio();
    };
  }, []);

  const fetchContext = async () => {
    try {
      const res = await fetch('/api/stocks/assistant/context');
      const json = await res.json();
      if (json.success) {
        setContextData(json.data);
      }
    } catch {
      // Fallback
    }
  };

  const fetchBriefing = async (force: boolean = false) => {
    setIsLoadingBriefing(true);
    try {
      const res = await fetch(`/api/stocks/assistant/briefing?type=${briefingType}&forceRefresh=${force}`);
      const json = await res.json();
      if (json.success) {
        setBriefing(json.data);
      }
    } catch (err) {
      console.error('Failed to load briefing:', err);
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/stocks/assistant/history?sessionId=${sessionId}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setMessages(
          json.data.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `สวัสดีครับ ผมคือ **AI-CIO ประธานคณะกรรมการบริหารการลงทุน** ยินดีต้อนรับสู่ Investment Committee Chamber
            
ท่านสามารถส่งคำถามเพื่อสั่งตรวจสอบหุ้นรายตัวผ่านกระบวนการ **Dialectical Debate (Bull Thesis vs Bear Antithesis vs CIO Synthesis)** หรือคลิกปุ่มด่วนด้านบนเพื่อรับการวิเคราะห์ได้ทันทีครับ`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // Offline fallback
    }
  };

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/stocks/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: query,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: json.data.assistantMessage.content,
          dialecticalData: json.data.dialecticalResponse,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(json.error || 'Server returned error');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ เกิดข้อผิดพลาดในการประมวลผลคำตอบ: ${err.message}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action Handler
  const handleQuickAction = async (action: 'PORTFOLIO_HEALTH' | 'RED_TEAM_WARNINGS' | 'TOP_OPPORTUNITIES' | 'MACRO_REGIME') => {
    if (isLoading) return;

    const actionLabels: Record<string, string> = {
      PORTFOLIO_HEALTH: '🏥 ตรวจสอบสุขภาพพอร์ตโฟลิโอ & วิกฤต Drawdown',
      RED_TEAM_WARNINGS: '🛑 รายงานหุ้นที่ตรวจพบความเสี่ยง & Red Team VETO',
      TOP_OPPORTUNITIES: '💎 คัดเลือก Top 3 หุ้นเด่น Supermajority Buy',
      MACRO_REGIME: '🌐 วิเคราะห์สภาวะเศรษฐกิจมหภาค, VIX และ Yield Curve',
    };

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: actionLabels[action] || action,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/stocks/assistant/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (json.success) {
        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: json.data.formattedMarkdown,
          dialecticalData: json.data,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.error('Quick action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Speech Synthesis Controls (Web Speech API)
  const playAudio = () => {
    if (!briefing || !window.speechSynthesis) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(briefing.audioScript);
    utterance.lang = 'th-TH';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang.includes('th') || v.lang.includes('TH'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const pauseAudio = () => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Color helper for verdicts
  const getVerdictBadgeStyle = (verdict?: string) => {
    switch (verdict) {
      case 'SUPERMAJORITY_BUY':
        return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#34d399', label: '🟢 SUPERMAJORITY BUY (เอกฉันท์)' };
      case 'BUY':
        return { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#60a5fa', label: '🔵 BUY (อนุมัติเข้าซื้อ)' };
      case 'ACCUMULATE':
        return { bg: 'rgba(14, 165, 233, 0.2)', border: '#0ea5e9', text: '#38bdf8', label: '💎 ACCUMULATE (ทยอยสะสม)' };
      case 'HOLD':
        return { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', text: '#fde047', label: '🟡 HOLD (ถือครอง/ระวัง)' };
      case 'REDUCE':
        return { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#fdba74', label: '🟠 REDUCE (ทยอยลดน้ำหนัก)' };
      case 'VETO_REJECT':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#f87171', label: '🔴 RED TEAM VETO (สั่งห้ามเด็ดขาด)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', border: '#94a3b8', text: '#cbd5e1', label: verdict || 'EVALUATING' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Top Executive Telemetry Banner */}
      {contextData && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                AI-CIO Intelligence Chamber
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  🟢 41 Agents Ready
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Regime: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{contextData.regime}</span> | S&P 500: {contextData.spyTrend}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>CBOE VIX</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: contextData.vix > 20 ? '#f87171' : '#34d399' }}>
                {contextData.vix.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>US 10Y Yield</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{contextData.us10y.toFixed(2)}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>พอร์ต NAV</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>
                ${contextData.portfolioNav.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Drawdown</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: contextData.portfolioDrawdown < -5 ? '#f87171' : '#34d399' }}>
                {contextData.portfolioDrawdown.toFixed(2)}%
              </div>
            </div>
            <div
              style={{
                background: contextData.circuitBreaker === 'NORMAL' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${contextData.circuitBreaker === 'NORMAL' ? '#10b981' : '#ef4444'}`,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: contextData.circuitBreaker === 'NORMAL' ? '#34d399' : '#f87171',
              }}
            >
              {contextData.circuitBreaker === 'NORMAL' ? '🛡️ Risk Sentinel: NORMAL' : `🚨 Circuit: ${contextData.circuitBreaker}`}
            </div>
          </div>
        </div>
      )}

      {/* 2. Executive Audio & Text Investment Briefing Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={20} style={{ color: '#eab308' }} />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              {briefing ? briefing.title : '🏛️ AI-CIO Executive Investment Briefing'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Briefing Type Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 8, padding: 3 }}>
              {(['MORNING', 'INTRADAY', 'EVENING'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setBriefingType(t);
                    fetchBriefing();
                  }}
                  style={{
                    background: briefingType === t ? '#3b82f6' : 'transparent',
                    color: briefingType === t ? '#fff' : '#94a3b8',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t === 'MORNING' ? 'ภาคเช้า' : t === 'INTRADAY' ? 'ระหว่างวัน' : 'ปิดตลาด'}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setBriefingViewMode('MARKDOWN')}
                style={{
                  background: briefingViewMode === 'MARKDOWN' ? '#475569' : 'transparent',
                  color: briefingViewMode === 'MARKDOWN' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📄 เอกสารสรุป
              </button>
              <button
                onClick={() => setBriefingViewMode('SCRIPT')}
                style={{
                  background: briefingViewMode === 'SCRIPT' ? '#475569' : 'transparent',
                  color: briefingViewMode === 'SCRIPT' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🗣️ สคริปต์เสียง
              </button>
            </div>

            <button
              onClick={() => fetchBriefing(true)}
              disabled={isLoadingBriefing}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <RefreshCw size={14} className={isLoadingBriefing ? 'animate-spin' : ''} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Audio Player Control Bar */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 12,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isSpeaking ? (
              <button
                onClick={playAudio}
                disabled={!briefing}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Play size={16} fill="#fff" />
                ฟังเสียงสรุปพอร์ต (Audio Briefing)
              </button>
            ) : isPaused ? (
              <button
                onClick={playAudio}
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Play size={16} fill="#fff" />
                เล่นต่อ
              </button>
            ) : (
              <button
                onClick={pauseAudio}
                style={{
                  background: '#eab308',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Pause size={16} fill="#fff" />
                หยุดชั่วคราว
              </button>
            )}

            {(isSpeaking || isPaused) && (
              <button
                onClick={stopAudio}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Square size={14} fill="#f87171" />
                หยุด
              </button>
            )}

            {isSpeaking && !isPaused && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                <span style={{ width: 3, height: 16, background: '#10b981', borderRadius: 2 }} className="animate-pulse" />
                <span style={{ width: 3, height: 22, background: '#10b981', borderRadius: 2 }} className="animate-pulse" />
                <span style={{ width: 3, height: 14, background: '#10b981', borderRadius: 2 }} className="animate-pulse" />
                <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600, marginLeft: 6 }}>กำลังบรรยายสด...</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>ความเร็วเสียง:</span>
            {[1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => setSpeechRate(rate)}
                style={{
                  background: speechRate === rate ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                  color: speechRate === rate ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Briefing Content Viewer */}
        <div
          style={{
            maxHeight: 280,
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            padding: '16px 20px',
            fontSize: 13,
            lineHeight: 1.65,
            color: '#cbd5e1',
          }}
        >
          {briefing ? (
            briefingViewMode === 'MARKDOWN' ? (
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{briefing.fullText}</div>
            ) : (
              <div style={{ fontStyle: 'italic', color: '#93c5fd' }}>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>🎙️ สคริปต์สำหรับการบรรยายด้วยเสียง (Web Speech API):</div>
                "{briefing.audioScript}"
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>กำลังจัดเตรียมรายงานสรุปการลงทุน...</div>
          )}
        </div>
      </div>

      {/* 3. Pre-configured Quick Action Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} style={{ color: '#eab308' }} />
          คำถามด่วนระดับบอร์ดบริหาร:
        </span>
        <button
          onClick={() => handleQuickAction('PORTFOLIO_HEALTH')}
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🏥 วินิจฉัยสุขภาพพอร์ต & Drawdown
        </button>
        <button
          onClick={() => handleQuickAction('RED_TEAM_WARNINGS')}
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🛑 เช็คหุ้นโดน Red Team VETO
        </button>
        <button
          onClick={() => handleQuickAction('TOP_OPPORTUNITIES')}
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          💎 Top 3 Supermajority Buy
        </button>
        <button
          onClick={() => handleQuickAction('MACRO_REGIME')}
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#d8b4fe',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🌐 วิเคราะห์ Macro & VIX & 10Y
        </button>
      </div>

      {/* 4. Dialectical Debate Chat Chamber */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          height: 620,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Chat Feed Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={18} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
              ห้องประชุมวิภาษวิธี AI-CIO (Dialectical Debate Chamber)
            </span>
          </div>

          <button
            onClick={() => {
              setMessages([]);
              fetchHistory();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
            }}
          >
            <Trash2 size={14} />
            ล้างบทสนทนา
          </button>
        </div>

        {/* Chat Messages Scrollable Feed */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const dialectic = msg.dialecticalData;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: isUser ? '75%' : '90%',
                    background: isUser ? '#2563eb' : 'rgba(30, 41, 59, 0.75)',
                    border: isUser ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '14px 18px',
                    color: '#f8fafc',
                    fontSize: 13,
                    lineHeight: 1.6,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* Dialectical Structured Cards */}
                  {!isUser && dialectic && dialectic.thesis && dialectic.synthesis && (
                    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Top Verdict Ribbon */}
                      <div
                        style={{
                          ...getVerdictBadgeStyle(dialectic.synthesis.verdict),
                          border: `1px solid ${getVerdictBadgeStyle(dialectic.synthesis.verdict).border}`,
                          borderRadius: 8,
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        <span>{getVerdictBadgeStyle(dialectic.synthesis.verdict).label}</span>
                        <span>สัดส่วนที่อนุญาต: {dialectic.synthesis.allocationPct}% ของพอร์ต</span>
                      </div>

                      {/* Side-by-Side Dialectical Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {/* Bull Thesis Card */}
                        <div
                          style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: 10,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <TrendingUp size={14} />
                            ข้อเสนอเชิงรุก (Thesis / Bull)
                          </div>
                          <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 6 }}>{dialectic.thesis.summary}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            โมเมนตัม: <span style={{ color: '#34d399', fontWeight: 600 }}>{dialectic.thesis.momentumScore}/100</span> | DCF Upside: <span style={{ color: '#34d399', fontWeight: 600 }}>+{dialectic.thesis.dcfUpsidePct}%</span>
                          </div>
                        </div>

                        {/* Bear Antithesis Card */}
                        <div
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 10,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <TrendingDown size={14} />
                            ข้อโต้แย้งและความเสี่ยง (Antithesis / Bear)
                          </div>
                          <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 6 }}>{dialectic.antithesis.summary}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            M-Score: <span style={{ color: dialectic.antithesis.beneishMScore > -1.78 ? '#f87171' : '#34d399', fontWeight: 600 }}>{dialectic.antithesis.beneishMScore.toFixed(2)}</span> | Short: <span style={{ color: '#f87171', fontWeight: 600 }}>{dialectic.antithesis.shortInterestPct}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Stops & Targets */}
                      {dialectic.synthesis.stopLossPrice > 0 && (
                        <div
                          style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            borderRadius: 8,
                            padding: '6px 12px',
                            display: 'flex',
                            gap: 16,
                            fontSize: 12,
                            color: '#94a3b8',
                          }}
                        >
                          <div>Stop Loss: <span style={{ color: '#f87171', fontWeight: 700 }}>${dialectic.synthesis.stopLossPrice}</span></div>
                          <div>Target TP1: <span style={{ color: '#34d399', fontWeight: 700 }}>${dialectic.synthesis.takeProfit1}</span></div>
                          <div>Target TP2: <span style={{ color: '#38bdf8', fontWeight: 700 }}>${dialectic.synthesis.takeProfit2}</span></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Raw / Markdown Text */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                  <div
                    style={{
                      fontSize: 10,
                      color: isUser ? '#bfdbfe' : '#64748b',
                      marginTop: 6,
                      textAlign: isUser ? 'right' : 'left',
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13, padding: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={14} color="#fff" />
              </div>
              <span className="animate-pulse">AI-CIO กำลังประมวลผลมุมมองทั้ง 41 AI Agents และรวบรวมข้อสรุป...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Suggested Stock Chips */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Quick Ticker Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>คลิกวิเคราะห์หุ้นทันที:</span>
            {['NVDA', 'TSLA', 'AAPL', 'MSFT', 'PLTR', 'AMZN'].map((sym) => (
              <button
                key={sym}
                onClick={() => handleSendMessage(`วิเคราะห์หุ้น ${sym} ให้หน่อย`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {sym}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="พิมพ์คำถามถึง AI-CIO (เช่น 'ควรซื้อ NVDA ตอนนี้ไหม?', 'วิเคราะห์ TSLA ที่โดน Red Team VETO')"
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: '12px 16px',
                color: '#f8fafc',
                fontSize: 13,
                outline: 'none',
              }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              style={{
                background: inputText.trim() && !isLoading ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '0 20px',
                fontWeight: 600,
                fontSize: 13,
                cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
              ส่งคำถาม
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
