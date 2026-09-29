/**
 * 🥇 Gold Fundamental Inputs — อัปเดตด้วยมือทุกไตรมาสจาก World Gold Council
 * แหล่ง: https://www.gold.org/goldhub/research/gold-demand-trends (Gold Demand Trends รายไตรมาส)
 *        https://www.gold.org/goldhub/data/gold-etfs-holdings-and-flows (ETF flows รายเดือน)
 *
 * WGC ไม่มี public API → ห้ามเดาตัวเลข ให้กรอกเมื่ออ่านรายงานแล้วเท่านั้น
 * score: 0-100 (50 = กลาง, >50 = หนุนราคาทอง, <50 = กดดัน) · null = ยังไม่มีข้อมูล (ไม่นำไปคิดคะแนน)
 *
 * ตัวอย่างการให้คะแนน:
 *  - Central bank net purchases สูงกว่าค่าเฉลี่ย 5 ปี → 70-85
 *  - ETF net inflow ไตรมาสล่าสุด → 60-80 / outflow → 20-40
 *  - Mine supply เพิ่มขึ้นมาก → < 50 (อุปทานมากกดดันราคา)
 */

export interface ManualFundamentalInput {
  score: number | null;
  trend: string;
  noteTh: string;
}

export const GOLD_FUNDAMENTAL_INPUTS: {
  asOf: string | null;       // เช่น '2026-Q2'
  reportUrl: string | null;
  centralBankDemand: ManualFundamentalInput;
  etfFlow: ManualFundamentalInput;
  barCoinDemand: ManualFundamentalInput;
  chinaDemand: ManualFundamentalInput;
  indiaDemand: ManualFundamentalInput;
  mineSupply: ManualFundamentalInput;
  recycling: ManualFundamentalInput;
} = {
  asOf: null,
  reportUrl: null,
  centralBankDemand: { score: null, trend: '—', noteTh: 'รออัปเดตจาก WGC Gold Demand Trends' },
  etfFlow: { score: null, trend: '—', noteTh: 'รออัปเดตจาก WGC ETF flows' },
  barCoinDemand: { score: null, trend: '—', noteTh: 'รออัปเดตจาก WGC Gold Demand Trends' },
  chinaDemand: { score: null, trend: '—', noteTh: 'รออัปเดตจาก WGC (China)' },
  indiaDemand: { score: null, trend: '—', noteTh: 'รออัปเดตจาก WGC (India)' },
  mineSupply: { score: null, trend: '—', noteTh: 'รออัปเดตจาก WGC (Supply)' },
  recycling: { score: null, trend: '—', noteTh: 'รออัปเดตจาก WGC (Recycling)' },
};
