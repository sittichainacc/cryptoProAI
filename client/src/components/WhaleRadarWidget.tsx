import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { WhaleRadarSummary, WhaleTransaction } from '../types/index.js';
import { Radar, ArrowUpRight, ArrowDownRight, Shield, RefreshCw, ExternalLink, Filter } from 'lucide-react';

interface WhaleRadarWidgetProps {
  currency: 'THB' | 'USDT';
  onSelectCoin?: (symbol: string) => void;
}

export const WhaleRadarWidget: React.FC<WhaleRadarWidgetProps> = ({
  currency,
  onSelectCoin,
}) => {
  const [data, setData] = useState<WhaleRadarSummary | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACCUMULATION' | 'DISTRIBUTION'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getWhaleRadar();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="crypto-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        กำลังโหลดข้อมูลเรดาร์เจ้ามือ...
      </div>
    );
  }

  const multiplier = currency === 'THB' ? 34.5 : 1;
  const prefix = currency === 'THB' ? '฿' : '$';

  const filteredTx = data.transactions.filter((tx) => {
    if (filter === 'ALL') return true;
    return tx.action === filter;
  });

  return (
    <div className="crypto-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div className="card-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-cyan)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <Radar size={18} />
          </div>
          <div>
            <div className="card-title" style={{ fontSize: '15px' }}>
              Whale Alert & On-Chain Flow Radar (เรดาร์ตรวจจับเจ้ามือ)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ติดตามธุรกรรมขนาดใหญ่ระดับสถาบันและการเคลื่อนย้ายเหรียญเข้า/ออกกระดานเทรด
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ fontSize: '11.5px', padding: '4px 8px', gap: '4px' }}
            disabled={isLoading}
            title="รีเฟรชข้อมูลธุรกรรมวาฬ"
          >
            <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Gauges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px 14px',
        }}
      >
        {/* 1. Whale Volume */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>วอลุ่มเจ้ามือ 24 ชม.</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', marginTop: '2px' }}>
            {currency === 'THB' ? `฿${(data.totalWhaleVolume24h * 34.5 / 1e9).toFixed(1)}B` : data.totalWhaleVolumeFormatted}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--neon-cyan)', marginTop: '2px' }}>
            ตรวจพบ 142 ธุรกรรมขนาดใหญ่
          </div>
        </div>

        {/* 2. Net Exchange Flow */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>กระแสสุทธิเข้า/ออก Exchange</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
            {currency === 'THB' ? `-฿${(Math.abs(data.netExchangeFlowUsd) * 34.5 / 1e6).toFixed(1)}M` : data.netExchangeFlowFormatted}
          </div>
          <div style={{ fontSize: '10.5px', color: '#10B981', marginTop: '2px' }}>
            ● ถอนออกสะสมเข้า Cold Wallet
          </div>
        </div>

        {/* 3. Whale Sentiment */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Whale Sentiment Meter</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <div
              style={{
                flex: 1,
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${data.whaleSentimentPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                  borderRadius: '4px',
                }}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>
              {data.whaleSentimentPct}%
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {data.whaleSentimentLabelTh}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[
          { id: 'ALL', label: 'ทั้งหมด (All Transfers)' },
          { id: 'ACCUMULATION', label: '🟢 ถอนสะสมเข้ากระเป๋าเย็น (Accumulation)' },
          { id: 'DISTRIBUTION', label: '🔴 โอนเข้ากระดานเทรด (Exchange Inflow)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: filter === t.id ? '1px solid var(--neon-blue)' : '1px solid var(--border-color)',
              background: filter === t.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: filter === t.id ? '#60A5FA' : 'var(--text-muted)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div style={{ overflowX: 'auto' }}>
        <table className="crypto-table">
          <thead>
            <tr>
              <th>เวลา</th>
              <th>เหรียญ</th>
              <th style={{ textAlign: 'right' }}>จำนวน</th>
              <th style={{ textAlign: 'right' }}>มูลค่า ({currency})</th>
              <th>ต้นทาง (From)</th>
              <th>ปลายทาง (To)</th>
              <th style={{ textAlign: 'center' }}>ประเภทธุรกรรม</th>
              <th style={{ textAlign: 'center' }}>Sentiment</th>
              <th style={{ textAlign: 'center' }}>TxHash</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((tx) => {
              const displayVal = (tx.valueUsd * multiplier).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              });

              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectCoin && onSelectCoin(tx.symbol)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>{tx.timeAgo}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: 'var(--neon-cyan)',
                        }}
                      >
                        {tx.symbol.slice(0, 3)}
                      </div>
                      <span style={{ fontWeight: 800, color: '#FFF' }}>{tx.symbol}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#FFF' }}>
                    {tx.amountFormatted}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                    {prefix}{displayVal}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: tx.fromType === 'exchange' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                        color: tx.fromType === 'exchange' ? '#F87171' : 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {tx.from}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: tx.toType === 'cold_wallet' ? 'rgba(16, 185, 129, 0.12)' : tx.toType === 'exchange' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                        color: tx.toType === 'cold_wallet' ? 'var(--neon-green-light)' : tx.toType === 'exchange' ? '#F87171' : 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {tx.to}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: tx.action === 'ACCUMULATION' ? 'rgba(16, 185, 129, 0.15)' : tx.action === 'DISTRIBUTION' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: tx.action === 'ACCUMULATION' ? '#10B981' : tx.action === 'DISTRIBUTION' ? '#EF4444' : 'var(--text-secondary)',
                      }}
                    >
                      {tx.action === 'ACCUMULATION' ? 'สะสม (Accumulation)' : tx.action === 'DISTRIBUTION' ? 'เฝ้าระวังแรงขาย (Inflow)' : 'โอนย้าย (Transfer)'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: tx.sentiment === 'BULLISH' ? 'var(--neon-green-light)' : tx.sentiment === 'BEARISH' ? 'var(--neon-red)' : 'var(--text-muted)',
                      }}
                    >
                      {tx.sentiment === 'BULLISH' ? 'BULLISH' : tx.sentiment === 'BEARISH' ? 'BEARISH' : 'NEUTRAL'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: 'var(--neon-blue)' }}>
                    {tx.txHash}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
