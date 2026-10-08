// ============================================================================
// Master Regression Test Suite Runner (All Phases 0 - 10)
// Executes tests for all modules and ensures 100% compliance
// ============================================================================

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  'stocks_phase0.test.ts',
  'stocks_phase1.test.ts',
  'stocks_phase2.test.ts',
  'stocks_phase3.test.ts',
  'stocks_phase4.test.ts',
  'stocks_phase5.test.ts',
  'stocks_phase6.test.ts',
  'stocks_phase7.test.ts',
  'stocks_phase8.test.ts',
  'stocks_providers.test.ts',
  'stocks_phase10.test.ts',
];

console.log('========================================================');
console.log('🧪 MASTER REGRESSION TEST SUITE (PHASES 0 - 10)');
console.log(`📋 Total Test Files: ${testFiles.length}`);
console.log('========================================================\n');

let passedFiles = 0;
let failedFiles = 0;

const tsxBin = process.platform === 'win32'
  ? path.join(__dirname, '..', 'node_modules', '.bin', 'tsx.cmd')
  : path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  console.log(`▶️ Executing: ${file}...`);
  try {
    execSync(`"${tsxBin}" "${filePath}"`, { stdio: 'inherit', cwd: path.join(__dirname, '..'), timeout: 60000 });
    passedFiles++;
    console.log(`\n✅ ${file} COMPLETED SUCCESSFULLY\n`);
  } catch {
    failedFiles++;
    console.error(`\n❌ ${file} FAILED\n`);
  }
}

console.log('========================================================');
console.log('🏁 MASTER REGRESSION TEST EXECUTION SUMMARY:');
console.log(`   Total Suites: ${testFiles.length}`);
console.log(`   Passed:       ${passedFiles}`);
console.log(`   Failed:       ${failedFiles}`);
console.log('========================================================');

if (failedFiles > 0) {
  process.exit(1);
} else {
  console.log('🎉 100% OF SYSTEM TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
