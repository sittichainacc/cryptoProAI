/**
 * 🥇 Gold Store — disk cache แบบ JSON สำหรับข้อมูลที่ดึงซ้ำแพง (ประวัติข่าวเศรษฐกิจ, ปฏิทิน Fed)
 * เก็บใน os.tmpdir() เพื่อไม่ปนกับ repo · หายได้ (เช่น Cloud Run restart) → ระบบดึงใหม่เอง
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

const DIR = process.env.GOLD_CACHE_DIR || path.join(os.tmpdir(), 'cryptopro-gold');

export function readStore<T>(name: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function writeStore(name: string, value: unknown): void {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const file = path.join(DIR, `${name}.json`);
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(value));
    fs.renameSync(`${file}.tmp`, file);
  } catch (err: any) {
    console.warn(`[GoldStore] write ${name} failed: ${err.message}`);
  }
}

/** เวลาตลาดสหรัฐ (America/New_York) → UTC ms โดยคำนึงถึง DST */
export function etToUtcMs(y: number, m: number, d: number, hh: number, mm: number): number {
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  const offsetMin = tzOffsetMinutes(naive + 5 * 3600_000, 'America/New_York');
  return naive - offsetMin * 60_000;
}

function tzOffsetMinutes(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - utcMs) / 60_000);
}
