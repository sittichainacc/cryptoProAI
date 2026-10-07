import fs from 'fs';
import path from 'path';

const src = path.resolve('client/dist');
const targets = [
  path.resolve('dist'),
  path.resolve('public'),
  path.resolve('server/dist/public'),
  path.resolve('server/public'),
];

if (!fs.existsSync(src)) {
  console.warn(`[Build] ⚠️ Source directory ${src} not found. Skipping copy.`);
} else {
  for (const target of targets) {
    try {
      fs.mkdirSync(target, { recursive: true });
      fs.cpSync(src, target, { recursive: true });
      console.log(`[Build] ✅ Synced client/dist -> ${target}`);
    } catch (err) {
      console.error(`[Build] ⚠️ Failed copying to ${target}:`, err.message);
    }
  }
}
