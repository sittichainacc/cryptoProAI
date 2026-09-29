/**
 * 🥇 Gold Statistics — เครื่องมือทดสอบว่า edge จริงหรือบังเอิญ
 * Bootstrap CI · PSR · DSR (Bailey & López de Prado) · PBO/CSCV · White's Reality Check · Spearman · Isotonic (PAV)
 * ใช้ RNG แบบ seed คงที่ → ผลซ้ำได้ทุกครั้ง
 */

export function rng(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mean = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
export const std = (a: number[]) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };

/** Standard normal CDF (Abramowitz-Stegun) */
export function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/** Inverse normal CDF (Acklam) */
export function normInv(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Bootstrap 95% CI ของค่าเฉลี่ย */
export function bootstrapCI(x: number[], iters = 2000, seed = 7): [number, number] | null {
  if (x.length < 10) return null;
  const r = rng(seed), means: number[] = [];
  for (let k = 0; k < iters; k++) {
    let s = 0;
    for (let i = 0; i < x.length; i++) s += x[Math.floor(r() * x.length)];
    means.push(s / x.length);
  }
  means.sort((a, b) => a - b);
  return [means[Math.floor(iters * 0.025)], means[Math.floor(iters * 0.975)]];
}

function moments(x: number[]) {
  const m = mean(x), s = std(x);
  if (!s) return { sr: 0, skew: 0, kurt: 3 };
  const n = x.length;
  const skew = x.reduce((a, v) => a + ((v - m) / s) ** 3, 0) / n;
  const kurt = x.reduce((a, v) => a + ((v - m) / s) ** 4, 0) / n;
  return { sr: m / s, skew, kurt };
}

/** Probabilistic Sharpe Ratio: P(SR จริง > srStar) */
export function psr(x: number[], srStar = 0): number {
  if (x.length < 10) return 0;
  const { sr, skew, kurt } = moments(x);
  const denom = Math.sqrt(Math.max(1e-9, 1 - skew * sr + ((kurt - 1) / 4) * sr * sr));
  return normCdf(((sr - srStar) * Math.sqrt(x.length - 1)) / denom);
}

/** Deflated Sharpe Ratio — ปรับ srStar ตามจำนวน config ที่ลอง (N) และความแปรปรวนของ Sharpe ระหว่าง config */
export function dsr(x: number[], sharpesOfConfigs: number[]): number {
  const N = sharpesOfConfigs.length;
  if (N < 2) return psr(x, 0);
  const v = std(sharpesOfConfigs) ** 2;
  const g = 0.5772156649;
  const srStar = Math.sqrt(v) * ((1 - g) * normInv(1 - 1 / N) + g * normInv(1 - 1 / (N * Math.E)));
  return psr(x, srStar);
}

/**
 * Probability of Backtest Overfitting (CSCV)
 * perf[config][block] = ผลงานของ config ในแต่ละช่วงเวลา → แบ่ง IS/OOS ทุกแบบครึ่งต่อครึ่ง
 * เลือก config ดีสุดใน IS แล้วดูอันดับใน OOS → PBO = สัดส่วนที่อันดับ OOS ต่ำกว่ามัธยฐาน
 */
export function pboCscv(perf: number[][]): number {
  const N = perf.length, S = perf[0]?.length ?? 0;
  if (N < 2 || S < 4 || S % 2) return NaN;
  const half = S / 2;
  let below = 0, total = 0;
  const combos: number[][] = [];
  const rec = (start: number, acc: number[]) => {
    if (acc.length === half) { combos.push([...acc]); return; }
    for (let i = start; i < S; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  for (const is of combos) {
    const oos = [...Array(S).keys()].filter(i => !is.includes(i));
    const score = (c: number, blocks: number[]) => mean(blocks.map(b => perf[c][b]));
    let best = 0;
    for (let c = 1; c < N; c++) if (score(c, is) > score(best, is)) best = c;
    const oosScores = perf.map((_, c) => score(c, oos));
    const rank = oosScores.filter(v => v <= oosScores[best]).length; // 1..N
    const w = rank / (N + 1);
    if (Math.log(w / (1 - w)) <= 0) below++;
    total++;
  }
  return below / total;
}

/**
 * White's Reality Check (stationary bootstrap)
 * series[config][t] = ผลตอบแทนรายวัน (R) · H0: config ที่ดีที่สุดไม่มี expectancy > 0
 */
export function realityCheck(series: number[][], iters = 1000, blockLen = 10, seed = 11): number {
  const K = series.length, T = series[0]?.length ?? 0;
  if (K === 0 || T < 30) return NaN;
  const means = series.map(mean);
  const V = Math.max(...means.map(m => Math.sqrt(T) * m));
  const r = rng(seed);
  const p = 1 / blockLen;
  let exceed = 0;
  for (let b = 0; b < iters; b++) {
    const idx: number[] = [];
    let cur = Math.floor(r() * T);
    for (let t = 0; t < T; t++) {
      idx.push(cur);
      cur = r() < p ? Math.floor(r() * T) : (cur + 1) % T;
    }
    let vStar = -Infinity;
    for (let k = 0; k < K; k++) {
      let s = 0;
      for (const i of idx) s += series[k][i];
      vStar = Math.max(vStar, Math.sqrt(T) * (s / T - means[k]));
    }
    if (vStar >= V) exceed++;
  }
  return exceed / iters;
}

export function spearman(x: number[], y: number[]): number | null {
  if (x.length < 10) return null;
  const rank = (a: number[]) => {
    const idx = a.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
    const r = new Array(a.length);
    for (let i = 0; i < idx.length;) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2;
      i = j + 1;
    }
    return r as number[];
  };
  const rx = rank(x), ry = rank(y);
  const mx = mean(rx), my = mean(ry);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < rx.length; i++) { num += (rx[i] - mx) * (ry[i] - my); dx += (rx[i] - mx) ** 2; dy += (ry[i] - my) ** 2; }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}

/** Isotonic regression (Pool-Adjacent-Violators) — คืนฟังก์ชัน x → ค่าที่ fit แบบไม่ลดลง */
export function isotonicFit(x: number[], y: number[]): (v: number) => number {
  const pts = x.map((v, i) => [v, y[i]] as const).sort((a, b) => a[0] - b[0]);
  const blocks: { x: number; sum: number; n: number }[] = [];
  for (const [xv, yv] of pts) {
    blocks.push({ x: xv, sum: yv, n: 1 });
    while (blocks.length > 1 && blocks[blocks.length - 2].sum / blocks[blocks.length - 2].n > blocks[blocks.length - 1].sum / blocks[blocks.length - 1].n) {
      const b = blocks.pop()!;
      const a = blocks[blocks.length - 1];
      a.sum += b.sum; a.n += b.n; a.x = b.x;
    }
  }
  return (v: number) => {
    for (const b of blocks) if (v <= b.x) return b.sum / b.n;
    const l = blocks[blocks.length - 1];
    return l ? l.sum / l.n : 0;
  };
}
