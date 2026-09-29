/**
 * 🥇 GoldBacktestPanel — Backtest V2 / Validation
 * Calibration · Setup × Regime matrix · Walk-forward · PSR/DSR/PBO/Reality Check · Exit policy · Event window study
 */
import React, { useEffect, useState } from 'react';
import type { GoldBacktestResult, GoldBacktestBucket, GoldMatrixCell, GoldWalkForwardFold, ValidationTag } from '../../types/gold.js';

const C = { green: 'var(--neon-green)', red: 'var(--neon-red)', amber: 'var(--neon-amber)', blue: 'var(--neon-blue)', purple: 'var(--neon-purple)', muted: 'var(--text-secondary)', text: 'var(--text-primary)' };
const signed = (n: number | null | undefined, s = 'R') => n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}${s}`;
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'nowrap', fontSize: 12 };
const tdR: React.CSSProperties = { ...td, textAlign: 'right' };
const th: React.CSSProperties = { ...td, color: 'var(--text-secondary)', fontWeight: 600 };

export const SETUP_TH: Record<string, string> = {
  TREND_PULLBACK: 'Trend Pullback', BREAKOUT_RETEST: 'Breakout Retest', LIQUIDITY_SWEEP_REVERSAL: 'Liquidity Sweep Reversal',
  COMPRESSION_BREAKOUT: 'Compression Breakout', MACRO_CONFIRMATION_ENTRY: 'Macro Confirmation', NONE: '—', '*': 'ทุก Setup',
};

export const TAG: Record<ValidationTag, { th: string; color: string }> = {
  PROMOTE: { th: 'Promote', color: 'var(--neon-green)' },
  CONDITIONAL: { th: 'Conditional', color: 'var(--neon-amber)' },
  NEED_MORE_DATA: { th: 'Need more data', color: 'var(--text-secondary)' },
  REJECT: { th: 'Reject', color: 'var(--neon-red)' },
};

export const TagChip: React.FC<{ tag: ValidationTag | null | undefined }> = ({ tag }) => tag ? (
  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700, color: TAG[tag].color, border: `1px solid ${TAG[tag].color}`, background: 'var(--bg-card-inner)', whiteSpace: 'nowrap' }}>{TAG[tag].th}</span>
) : null;

const Card: React.FC<{ title: string; children: React.ReactNode; note?: string }> = ({ title, children, note }) => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 16, border: '1px solid var(--border-color)', minWidth: 0 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>{title}</div>
    {children}
    {note && <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{note}</div>}
  </div>
);
const Table: React.FC<{ head: string[]; children: React.ReactNode; alignFirst?: boolean }> = ({ head, children }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr>{head.map((h, i) => <th key={h} style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
const Stat: React.FC<{ label: string; value: string; color: string; sub?: string }> = ({ label, value, color, sub }) => (
  <div style={{ background: 'var(--bg-card-inner)', borderRadius: 10, padding: '10px 12px', minWidth: 0 }}>
    <div style={{ fontSize: 10, color: C.muted }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>}
  </div>
);

const BucketRows: React.FC<{ rows: GoldBacktestBucket[] }> = ({ rows }) => (
  <>{rows.map(b => (
    <tr key={b.label}>
      <td style={td}>{SETUP_TH[b.label] ?? b.label}</td>
      <td style={tdR}>{b.trades}</td>
      <td style={tdR}>{b.winRateTp1}%</td>
      <td style={{ ...tdR, color: b.expectancyR > 0 ? C.green : C.red, fontWeight: 700 }}>{signed(b.expectancyR)}</td>
      <td style={{ ...tdR, color: C.muted }}>{b.ciLowR != null ? `${signed(b.ciLowR, '')} … ${signed(b.ciHighR, '')}` : '—'}</td>
      <td style={tdR}>{b.profitFactor ?? '—'}</td>
      <td style={tdR}>{b.maxDrawdownR}R</td>
      <td style={tdR}><TagChip tag={b.status} /></td>
    </tr>
  ))}</>
);
const BUCKET_HEAD = ['กลุ่ม', 'เทรด', 'ถึง TP1', 'Expectancy', '95% CI', 'PF', 'Max DD', 'สถานะ'];

const FoldRows: React.FC<{ rows: GoldWalkForwardFold[] }> = ({ rows }) => (
  <>{rows.map(f => (
    <tr key={f.fold + f.testPeriod}>
      <td style={td}>#{f.fold} · {f.testPeriod}</td>
      <td style={{ ...tdR, color: C.muted }}>{f.trainPeriod}</td>
      <td style={{ ...tdR, color: C.muted }}>{f.chosenConfig}</td>
      <td style={tdR}>{signed(f.trainExpectancyR)}</td>
      <td style={tdR}>{f.testTrades}</td>
      <td style={{ ...tdR, color: f.testExpectancyR > 0 ? C.green : C.red, fontWeight: 700 }}>{signed(f.testExpectancyR)}</td>
    </tr>
  ))}</>
);

const CellRows: React.FC<{ rows: GoldMatrixCell[]; cols: (keyof GoldMatrixCell)[] }> = ({ rows, cols }) => (
  <>{rows.map((c, i) => (
    <tr key={i}>
      {cols.map((k, j) => <td key={k} style={j === 0 ? td : { ...tdR, color: C.muted }}>{k === 'setup' ? SETUP_TH[c.setup] ?? c.setup : String(c[k])}</td>)}
      <td style={tdR}>{c.trades}</td>
      <td style={tdR}>{c.winRateTp1}%</td>
      <td style={{ ...tdR, color: c.expectancyR > 0 ? C.green : C.red, fontWeight: 700 }}>{signed(c.expectancyR)}</td>
      <td style={tdR}><TagChip tag={c.status} /></td>
    </tr>
  ))}</>
);

export const GoldBacktestPanel: React.FC = () => {
  const [bt, setBt] = useState<GoldBacktestResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/gold/backtest').then(r => r.json()).then(j => { if (alive) j.success ? setBt(j.data) : setErr(j.error); }).catch(e => alive && setErr(e.message));
    return () => { alive = false; };
  }, []);
  if (err) return <Card title="🧪 Backtest"><div style={{ color: C.red, fontSize: 12 }}>Backtest ไม่สำเร็จ: {err}</div></Card>;
  if (!bt) return <Card title="🧪 Backtest V2"><div style={{ color: C.muted, fontSize: 12 }}>กำลังรัน Walk-forward, Parameter grid 9 configs, Calibration และ Event Study บนข้อมูล 2 ปี... (ครั้งแรกอาจใช้เวลา 1–2 นาทีเพื่อโหลดประวัติข่าว)</div></Card>;

  const v = bt.validation;
  const vColor = v.status === 'PRODUCTION' ? C.green : v.status === 'REJECTED' ? C.red : C.amber;
  const grid = 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 16, border: `2px solid ${vColor}`, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>VALIDATION STATUS · {bt.period.from} → {bt.period.to}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: vColor, margin: '4px 0 10px' }}>{v.statusTh}</div>
        <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 8 }}>
          <Stat label="Historical Expectancy" value={signed(v.historicalExpectancyR)} color={v.historicalExpectancyR > 0 ? C.green : C.red} sub={`${v.sampleSize} เทรด`} />
          <Stat label="Recent (6 เดือน)" value={signed(v.recentExpectancyR)} color={v.recentExpectancyR > 0 ? C.green : C.red} />
          <Stat label="Walk-forward OOS" value={signed(v.walkForwardOosR)} color={(v.walkForwardOosR ?? 0) > 0 ? C.green : C.red} />
          <Stat label="Final Holdout" value={signed(v.holdoutR)} color={(v.holdoutR ?? 0) > 0 ? C.green : C.red} />
          <Stat label="Stability" value={v.stability.replace('_', '-')} color={v.stability === 'HIGH' ? C.green : v.stability === 'LOW' ? C.red : C.amber} />
          <Stat label="Calibration" value={v.calibrated ? 'Calibrated' : 'Not calibrated'} color={v.calibrated ? C.green : C.amber} />
        </div>
        {v.reasonsTh.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>ยังไม่ผ่านเกณฑ์ production เพราะ:</div>
            {v.reasonsTh.map(r => <div key={r} style={{ fontSize: 12, color: C.text, padding: '2px 0' }}>✕ {r}</div>)}
          </div>
        )}
      </div>

      <Card title="📐 Statistical Tests — edge จริง หรือผลจากการลองพารามิเตอร์?" note={`ทดสอบ ${bt.stats.configsTested} configs · Sharpe ต่อเทรด ${bt.stats.sharpePerTrade}`}>
        <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 8 }}>
          <Stat label="PSR — P(Sharpe > 0)" value={`${Math.round(bt.stats.psr * 100)}%`} color={bt.stats.psr >= 0.95 ? C.green : C.amber} sub="เกณฑ์ ≥ 95%" />
          <Stat label="DSR — หลังหักการลองหลาย config" value={`${Math.round(bt.stats.dsr * 100)}%`} color={bt.stats.dsr >= 0.95 ? C.green : C.amber} sub="เกณฑ์ ≥ 95%" />
          <Stat label="PBO — โอกาส overfit" value={Number.isFinite(bt.stats.pbo) ? `${Math.round(bt.stats.pbo * 100)}%` : '—'} color={bt.stats.pbo < 0.3 ? C.green : C.red} sub="เกณฑ์ < 30%" />
          <Stat label="White's Reality Check p" value={Number.isFinite(bt.stats.realityCheckP) ? String(bt.stats.realityCheckP) : '—'} color={bt.stats.realityCheckP < 0.1 ? C.green : C.amber} sub="เกณฑ์ < 0.10" />
        </div>
      </Card>

      <Card title="🎯 Calibration — Quality score เทียบผลจริง" note={`Spearman(quality, R) = ${bt.calibration.spearman ?? '—'} · ${bt.calibration.monotonic ? 'Monotonic ✓' : 'ไม่ monotonic ✕'} — ${bt.calibration.calibrated ? 'เปิดใช้ Calibrated probability แล้ว' : 'ยังไม่แปลงคะแนนเป็นความน่าจะเป็น ต้อง recalibrate สูตร scoring ก่อน'}`}>
        <Table head={['Score', 'เทรด', 'ถึง TP1', 'ถึง TP2', 'Expected R', 'Calibrated P(TP1)', 'P(TP2)', 'E[R]']}>
          {bt.calibration.rows.map(r => (
            <tr key={r.bucket}>
              <td style={td}>{r.bucket}</td><td style={tdR}>{r.trades}</td><td style={tdR}>{r.winRateTp1}%</td><td style={tdR}>{r.winRateTp2}%</td>
              <td style={{ ...tdR, color: r.expectancyR > 0 ? C.green : C.red, fontWeight: 700 }}>{signed(r.expectancyR)}</td>
              <td style={tdR}>{r.calibratedPTp1 != null ? `${r.calibratedPTp1}%` : '—'}</td>
              <td style={tdR}>{r.calibratedPTp2 != null ? `${r.calibratedPTp2}%` : '—'}</td>
              <td style={tdR}>{signed(r.calibratedExpR)}</td>
            </tr>
          ))}
        </Table>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: '12px 0 4px' }}>ตรวจแยกกลุ่ม (คะแนนสูงยังสัมพันธ์กับผลดีไหม)</div>
        <Table head={['กลุ่ม', 'เทรด', 'Spearman(Q, R)', 'Monotonic']}>
          {bt.calibration.slices.map(s => (
            <tr key={s.slice}>
              <td style={td}>{SETUP_TH[s.slice] ?? s.slice}</td><td style={tdR}>{s.trades}</td>
              <td style={{ ...tdR, color: (s.spearmanQualityVsR ?? 0) > 0.1 ? C.green : (s.spearmanQualityVsR ?? 0) < -0.05 ? C.red : C.muted }}>{s.spearmanQualityVsR ?? '—'}</td>
              <td style={{ ...tdR, color: s.monotonic ? C.green : C.muted }}>{s.monotonic ? '✓' : '✕'}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="🧩 ผลแยกตาม Setup" note="Promote = n ≥ 30, expectancy ≥ 0.1R, CI ล่าง > 0 และ walk-forward OOS เป็นบวก · Reject = expectancy ≤ 0 (ระบบไม่ออก READY จาก setup นี้)">
        <Table head={BUCKET_HEAD}><BucketRows rows={bt.bySetup} /></Table>
      </Card>

      <Card title="🗺️ Setup × Regime / Direction" note="ใช้เป็น gate จริง: ถ้า Setup ถูก Reject ใน regime ปัจจุบัน ระบบจะไม่ออก READY">
        <Table head={['Setup', 'Regime', 'Side', 'เทรด', 'ถึง TP1', 'Expectancy', 'สถานะ']}>
          <CellRows rows={bt.setupByTrend} cols={['setup', 'trend', 'side']} />
        </Table>
      </Card>

      {bt.byDimension.map(d => (
        <Card key={d.dimension} title={`📊 ${d.dimension}`}>
          <Table head={BUCKET_HEAD}><BucketRows rows={d.buckets} /></Table>
        </Card>
      ))}

      <Card title="🔬 Matrix: Setup × Regime × Direction × Session × Event State" note="แสดงเฉพาะกลุ่มที่มี ≥ 6 เทรด · กลุ่มเล็กมีความไม่แน่นอนสูง — ใช้ดูทิศทาง ไม่ใช่ข้อสรุป">
        <Table head={['Setup', 'Regime', 'Side', 'Session', 'Event', 'เทรด', 'ถึง TP1', 'Expectancy', 'สถานะ']}>
          <CellRows rows={bt.matrix} cols={['setup', 'trend', 'side', 'session', 'eventState']} />
        </Table>
      </Card>

      <Card title="⏩ Walk-forward (Expanding window)" note={`เลือก config จากช่วง train แล้ววัดผลช่วงถัดไปที่ไม่เคยเห็น · ความคงที่ของ config ที่เลือก ${Math.round(bt.walkForward.configStability * 100)}%`}>
        <Table head={['Test fold', 'Train', 'Config ที่เลือก', 'Train R', 'เทรด', 'Test R']}><FoldRows rows={bt.walkForward.expanding} /></Table>
      </Card>
      <Card title="🔁 Walk-forward (Rolling window) + Final holdout" note="Final holdout = ช่วงสุดท้ายที่ไม่ถูกใช้เลือกพารามิเตอร์เลย">
        <Table head={['Test fold', 'Train', 'Config ที่เลือก', 'Train R', 'เทรด', 'Test R']}>
          <FoldRows rows={bt.walkForward.rolling} />
          {bt.walkForward.holdout && <FoldRows rows={[{ ...bt.walkForward.holdout, testPeriod: `${bt.walkForward.holdout.testPeriod} (HOLDOUT)` }]} />}
        </Table>
      </Card>

      <Card title="🎛️ Parameter Stability" note="ถ้าผลเปลี่ยนมากเมื่อขยับพารามิเตอร์เล็กน้อย แปลว่า edge เปราะบาง">
        <Table head={['Config', 'เทรด', 'Expectancy']}>
          {bt.parameterGrid.map(g => (
            <tr key={g.config}>
              <td style={{ ...td, fontWeight: g.isDefault ? 800 : 400 }}>{g.config}{g.isDefault ? ' (ใช้งานจริง)' : ''}</td>
              <td style={tdR}>{g.trades}</td>
              <td style={{ ...tdR, color: g.expectancyR > 0 ? C.green : C.red, fontWeight: 700 }}>{signed(g.expectancyR)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="🚪 Exit Policy — วิธีออกแบบไหนดีกว่าจริง?" note="ถ้าวิธีซับซ้อนไม่ได้ดีกว่าอย่างมีนัย ควรใช้วิธีที่ง่ายกว่า · MFE capture = R ที่ได้จริง / R สูงสุดที่ราคาไปถึง">
        <Table head={['Policy', 'Expectancy', 'Win%', 'Avg Win', 'Avg Loss', 'MFE Capture', 'Giveback', 'Max DD']}>
          {bt.exitPolicies.map(p => (
            <tr key={p.policy}>
              <td style={td}>{p.labelTh}</td>
              <td style={{ ...tdR, color: p.expectancyR > 0 ? C.green : C.red, fontWeight: 700 }}>{signed(p.expectancyR)}</td>
              <td style={tdR}>{p.winRate}%</td><td style={tdR}>{signed(p.avgWinR)}</td><td style={tdR}>{signed(p.avgLossR)}</td>
              <td style={tdR}>{Math.round(p.mfeCapture * 100)}%</td><td style={tdR}>{p.givebackR}R</td><td style={tdR}>{p.maxDrawdownR}R</td>
            </tr>
          ))}
        </Table>
      </Card>

      {bt.eventStudy ? (
        <Card title={`📅 Event Window Study — เรียนรู้จาก ${bt.eventStudy.eventsLoaded} เหตุการณ์`} note={bt.eventStudy.granularityNote}>
          <Table head={['ข่าว', 'จำนวน', 'Vol ×ปกติ', 'เสี่ยงโดน Stop ถ้าถือผ่าน', 'Whipsaw', 'ชม.จนนิ่ง', 'ทองตาม Surprise', 'Window ก่อน/หลัง', 'ความเชื่อมั่น']}>
            {bt.eventStudy.rows.map(r => (
              <tr key={r.type} title={r.noteTh}>
                <td style={td}>{r.nameTh}</td><td style={tdR}>{r.events}</td><td style={tdR}>{r.volExpansion}×</td>
                <td style={{ ...tdR, color: r.holdThroughStopRisk >= 30 ? C.red : C.text }}>{r.holdThroughStopRisk}%</td>
                <td style={tdR}>{r.whipsawRate}%</td><td style={tdR}>{r.hoursToStabilize}</td>
                <td style={tdR}>{r.reactionAccuracy != null ? `${r.reactionAccuracy}% (${r.reactionSamples})` : '—'}</td>
                <td style={{ ...tdR, fontWeight: 700 }}>{r.recommendedPreMin} / {r.recommendedPostMin} นาที</td>
                <td style={tdR}>{r.confidence}</td>
              </tr>
            ))}
          </Table>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: '12px 0 4px' }}>รอกี่ชั่วโมงหลังข่าวถึงเข้าตามทิศได้ (Stop 1 ATR · Target 1.5 ATR)</div>
          <Table head={['ข่าว', ...[1, 2, 3, 4, 6, 8].map(h => `รอ ${h} ชม.`), 'วันปกติ']}>
            {bt.eventStudy.rows.filter(r => r.confidence !== 'LOW').map(r => (
              <tr key={r.type}>
                <td style={td}>{r.nameTh}</td>
                {r.waitTable.map(w => <td key={w.waitH} style={{ ...tdR, color: w.stopOutRate <= r.baselineStopOutRate + 5 ? C.green : C.muted }}>{signed(w.expectancyR)} · SL {w.stopOutRate}%</td>)}
                <td style={{ ...tdR, color: C.muted }}>{signed(r.baselineExpectancyR)} · SL {r.baselineStopOutRate}%</td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <Card title="📅 Event Window Study"><div style={{ fontSize: 12, color: C.muted }}>ยังโหลดประวัติข่าวเศรษฐกิจไม่ได้ — Event window ใช้ค่าเริ่มต้น</div></Card>
      )}

      <Card title="ℹ️ วิธีทดสอบและข้อจำกัด">
        {bt.methodNoteTh.map(n => <div key={n} style={{ fontSize: 12, color: C.text, padding: '3px 0' }}>• {n}</div>)}
      </Card>
    </div>
  );
};
