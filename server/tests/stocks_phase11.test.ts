// ============================================================================
// Phase 11 Unit Test Suite: AI-CIO Dialectical Chat Assistant & Executive Briefings
// ============================================================================

import {
  aiCIOAssistant,
  AICIOAssistantService,
  BriefingType,
  QuickActionType,
} from '../src/modules/stocks/assistant/ai_cio_assistant.service.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName}`);
    if (detail !== undefined) {
      console.error('   Detail:', detail);
    }
  }
}

async function runPhase11Tests() {
  console.log('========================================================');
  console.log('🧪 RUNNING PHASE 11 TESTS: AI-CIO ASSISTANT & BRIEFINGS');
  console.log('========================================================\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Executive Context Aggregator
  // --------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Executive Context Aggregator ---');
  const context = aiCIOAssistant.compileExecutiveContext();

  assert(typeof context.regime === 'string' && context.regime.length > 0, 'Regime must be defined string');
  assert(typeof context.vix === 'number' && context.vix > 0, `VIX must be positive number (got ${context.vix})`);
  assert(typeof context.us10y === 'number' && context.us10y > 0, `US 10Y Yield must be positive (got ${context.us10y}%)`);
  assert(typeof context.portfolioNav === 'number' && context.portfolioNav > 0, `Portfolio NAV must be positive (got $${context.portfolioNav})`);
  assert(typeof context.portfolioDrawdown === 'number', `Portfolio Drawdown must be numeric (got ${context.portfolioDrawdown}%)`);
  assert(['NORMAL', 'L1_HALT_BUYS', 'L2_DELEVERAGING', 'L3_EMERGENCY_HALT'].includes(context.circuitBreaker), `Circuit Breaker must be valid status (got ${context.circuitBreaker})`);
  assert(typeof context.cashRatioPct === 'number' && context.cashRatioPct >= 0, `Cash ratio must be non-negative (got ${context.cashRatioPct}%)`);
  assert(Array.isArray(context.vetoedTickers), 'Vetoed tickers must be an array');
  assert(Array.isArray(context.approvedBuys), 'Approved buys must be an array');
  assert(context.universeSize >= 20, `Universe size must be >= 20 (got ${context.universeSize})`);

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Ticker Detection Engine
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Ticker Detection Engine ---');
  assert(aiCIOAssistant.detectTicker('วิเคราะห์หุ้น NVDA ให้หน่อย') === 'NVDA', 'Must detect NVDA in Thai sentence');
  assert(aiCIOAssistant.detectTicker('Should I buy $AAPL today?') === 'AAPL', 'Must detect $AAPL with dollar sign');
  assert(aiCIOAssistant.detectTicker('Tell me about Tesla and EV trends') === 'TSLA', 'Must map company name Tesla to TSLA');
  assert(aiCIOAssistant.detectTicker('Is Microsoft a good long-term hold?') === 'MSFT', 'Must map Microsoft to MSFT');
  assert(aiCIOAssistant.detectTicker('What is the outlook for Nvidia?') === 'NVDA', 'Must map Nvidia to NVDA');
  assert(aiCIOAssistant.detectTicker('ตลาดภาพรวมวันนี้เป็นอย่างไรบ้าง') === null, 'Must return null for query without stock name');
  assert(aiCIOAssistant.detectTicker('') === null, 'Must return null for empty string');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Dialectical Reasoning Engine - Ticker Audit
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Dialectical Reasoning Engine (Ticker) ---');
  const nvdaResponse = aiCIOAssistant.synthesizeDialecticalResponse('วิเคราะห์ NVDA');

  assert(nvdaResponse.ticker === 'NVDA', 'Response ticker must be NVDA');
  assert(nvdaResponse.thesis !== undefined, 'Thesis must be defined');
  assert(typeof nvdaResponse.thesis.summary === 'string' && nvdaResponse.thesis.summary.length > 0, 'Thesis summary must be populated');
  assert(nvdaResponse.thesis.keyPoints.length >= 2, 'Thesis must contain at least 2 key points');
  assert(typeof nvdaResponse.thesis.momentumScore === 'number', 'Thesis momentum score must be numeric');
  assert(nvdaResponse.thesis.catalysts.length >= 1, 'Thesis must identify catalysts');

  assert(nvdaResponse.antithesis !== undefined, 'Antithesis must be defined');
  assert(typeof nvdaResponse.antithesis.summary === 'string', 'Antithesis summary must be populated');
  assert(nvdaResponse.antithesis.keyRisks.length >= 2, 'Antithesis must contain at least 2 risk factors');
  assert(typeof nvdaResponse.antithesis.beneishMScore === 'number', 'Antithesis must assess Beneish M-Score');
  assert(typeof nvdaResponse.antithesis.shortInterestPct === 'number', 'Antithesis must track Short Interest %');

  assert(nvdaResponse.synthesis !== undefined, 'Synthesis must be defined');
  assert(['SUPERMAJORITY_BUY', 'BUY', 'ACCUMULATE', 'HOLD', 'REDUCE', 'VETO_REJECT'].includes(nvdaResponse.synthesis.verdict), `Verdict must be valid CIO status (got ${nvdaResponse.synthesis.verdict})`);
  assert(nvdaResponse.synthesis.allocationPct <= 10.0, `Kelly allocation must not exceed 10.0% hard cap (got ${nvdaResponse.synthesis.allocationPct}%)`);
  assert(nvdaResponse.synthesis.stopLossPrice > 0, `Stop loss price must be positive (got $${nvdaResponse.synthesis.stopLossPrice})`);
  assert(nvdaResponse.synthesis.rationales.length >= 2, 'Synthesis must include at least 2 rationales');
  assert(nvdaResponse.synthesis.conditionsToAbort.length >= 1, 'Synthesis must list abort conditions');

  assert(nvdaResponse.formattedMarkdown.includes('### 🏛️ คำแถลงการณ์จาก AI-CIO'), 'Markdown output must include institutional CIO header');
  assert(nvdaResponse.formattedMarkdown.includes('🟢 1. ข้อเสนอเชิงรุก'), 'Markdown output must include Thesis block');
  assert(nvdaResponse.formattedMarkdown.includes('🔴 2. ข้อโต้แย้งและความเสี่ยง'), 'Markdown output must include Antithesis block');
  assert(nvdaResponse.formattedMarkdown.includes('🏆 3. มติชี้ขาดและคำสั่งยุทธวิธี'), 'Markdown output must include Synthesis block');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Dialectical Reasoning Engine - Macro Strategy
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Dialectical Reasoning Engine (Macro Strategy) ---');
  const macroResponse = aiCIOAssistant.synthesizeDialecticalResponse('สรุปภาพรวมตลาดวันนี้และแนวทางบริหารพอร์ต');

  assert(macroResponse.ticker === undefined, 'Macro query should not set a specific ticker');
  assert(macroResponse.thesis.summary.includes('ตลาดอยู่ในสภาวะ'), 'Macro thesis summary must reference market regime');
  assert(macroResponse.antithesis.keyRisks.length >= 2, 'Macro antithesis must list systemic risks');
  assert(macroResponse.synthesis.allocationPct >= 0, 'Macro allocation recommendation must be valid');
  assert(macroResponse.contextSnapshot.regime !== undefined, 'Context snapshot regime must be present');
  assert(macroResponse.formattedMarkdown.includes('ภาพรวมกลยุทธ์มหภาคและพอร์ตโฟลิโอ'), 'Markdown must format macro header');

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Executive Daily Briefing & Audio Script Generator
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Executive Briefing & Natural Audio Script ---');
  const morningBriefing = await aiCIOAssistant.generateDailyBriefing('MORNING', true);

  assert(morningBriefing.id.startsWith('briefing_'), 'Briefing ID must have briefing_ prefix');
  assert(morningBriefing.briefingType === 'MORNING', 'Briefing type must be MORNING');
  assert(morningBriefing.title.includes('AI-CIO Executive Briefing'), 'Briefing title must contain AI-CIO header');
  assert(morningBriefing.fullText.includes('# 🏛️ AI-CIO Executive Briefing'), 'Full text must contain Markdown heading');
  assert(morningBriefing.fullText.includes('บทสรุปสภาวะเศรษฐกิจมหภาค'), 'Full text must cover Macro section');
  assert(morningBriefing.fullText.includes('สถานะความปลอดภัยของพอร์ตโฟลิโอ'), 'Full text must cover Portfolio section');
  assert(morningBriefing.fullText.includes('โอกาสการลงทุนเด่น'), 'Full text must cover Top Opportunities');

  // Audio Script Verification (Web Speech API compatibility)
  assert(typeof morningBriefing.audioScript === 'string', 'Audio script must be a string');
  assert(morningBriefing.audioScript.startsWith('สวัสดีครับท่านผู้บริหาร'), 'Audio script must open with professional greeting');
  assert(!morningBriefing.audioScript.includes('**'), 'Audio script must not contain Markdown bold syntax');
  assert(!morningBriefing.audioScript.includes('##'), 'Audio script must not contain Markdown header syntax');
  assert(morningBriefing.audioScript.includes('เปอร์เซ็นต์'), 'Audio script must speak percentages naturally in Thai');

  // Briefing Metrics Object
  assert(morningBriefing.metrics.portfolioNav > 0, 'Briefing metrics must include NAV');
  assert(morningBriefing.metrics.topOpportunities.length >= 1, 'Briefing metrics must include top opportunities');
  assert(Array.isArray(morningBriefing.metrics.redTeamVetoes), 'Briefing metrics must include red team vetoes array');

  // Caching verification
  const cachedBriefing = await aiCIOAssistant.generateDailyBriefing('MORNING', false);
  assert(cachedBriefing.id === morningBriefing.id, 'Repeated call without forceRefresh must return cached briefing');

  // --------------------------------------------------------------------------
  // TEST SUITE 6: Pre-configured Institutional Quick Actions
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Pre-configured Institutional Quick Actions ---');
  const healthAction = await aiCIOAssistant.executeQuickAction('PORTFOLIO_HEALTH');
  assert(healthAction.formattedMarkdown.includes('รายงานการวินิจฉัยสุขภาพพอร์ตโฟลิโอ'), 'PORTFOLIO_HEALTH must format risk sentinel report');
  assert(healthAction.formattedMarkdown.includes('Circuit Breaker'), 'PORTFOLIO_HEALTH must report circuit breaker');

  const redTeamAction = await aiCIOAssistant.executeQuickAction('RED_TEAM_WARNINGS');
  assert(redTeamAction.formattedMarkdown.includes('Red Team Adversarial Review'), 'RED_TEAM_WARNINGS must format red team review');
  assert(redTeamAction.formattedMarkdown.includes('Beneish M-Score'), 'RED_TEAM_WARNINGS must reference Beneish M-Score criteria');

  const topOppAction = await aiCIOAssistant.executeQuickAction('TOP_OPPORTUNITIES');
  assert(topOppAction.formattedMarkdown.includes('Supermajority Buy'), 'TOP_OPPORTUNITIES must highlight supermajority picks');

  const macroAction = await aiCIOAssistant.executeQuickAction('MACRO_REGIME');
  assert(macroAction.formattedMarkdown.includes('รายงานเจาะลึกสภาวะมหภาค'), 'MACRO_REGIME must report macro intelligence');
  assert(macroAction.formattedMarkdown.includes('CBOE VIX'), 'MACRO_REGIME must report VIX');

  // --------------------------------------------------------------------------
  // TEST SUITE 7: Session & Conversation Lifecycle Management
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Session & Conversation Lifecycle Management ---');
  const newSession = await aiCIOAssistant.createSession('การประชุมกลยุทธ์ไตรมาส 4');
  assert(newSession.id.startsWith('session_'), 'Session ID must start with session_');
  assert(newSession.title === 'การประชุมกลยุทธ์ไตรมาส 4', 'Session title must match');

  const sessions = await aiCIOAssistant.getSessions();
  assert(sessions.length >= 1, 'Sessions list must contain at least 1 session');
  assert(sessions.some((s) => s.id === newSession.id), 'Sessions list must include newly created session');

  // Chat Turn Execution
  const chatResult = await aiCIOAssistant.chat(newSession.id, 'NVDA มีความเสี่ยงอะไรบ้าง');
  assert(chatResult.session.id === newSession.id, 'Chat session ID must match');
  assert(chatResult.userMessage.role === 'user', 'User message role must be user');
  assert(chatResult.userMessage.content === 'NVDA มีความเสี่ยงอะไรบ้าง', 'User message content must match');
  assert(chatResult.assistantMessage.role === 'assistant', 'Assistant message role must be assistant');
  assert(chatResult.dialecticalResponse.ticker === 'NVDA', 'Dialectical response must detect NVDA');

  // Message retrieval
  const sessionMessages = await aiCIOAssistant.getSessionMessages(newSession.id);
  assert(sessionMessages.length === 2, `Session must now contain exactly 2 messages (got ${sessionMessages.length})`);
  assert(sessionMessages[0].role === 'user', 'First message must be user');
  assert(sessionMessages[1].role === 'assistant', 'Second message must be assistant');

  // Session Deletion
  const deleteResult = await aiCIOAssistant.deleteSession(newSession.id);
  assert(deleteResult === true, 'Delete session must return true');
  const postDeleteMsgs = await aiCIOAssistant.getSessionMessages(newSession.id);
  assert(postDeleteMsgs.length === 0, 'Messages must be empty after session deletion');

  // --------------------------------------------------------------------------
  // TEST SUITE 8: Edge Cases, Fallbacks & Error Resilience
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: Edge Cases, Fallbacks & Resilience ---');
  const emptyQueryResponse = aiCIOAssistant.synthesizeDialecticalResponse('');
  assert(emptyQueryResponse.formattedMarkdown.length > 0, 'Empty query must gracefully fallback to macro response');

  const unknownTicker = aiCIOAssistant.synthesizeDialecticalResponse('วิเคราะห์ XYZUNKNOWN123');
  assert(unknownTicker.ticker === undefined || unknownTicker.formattedMarkdown.length > 0, 'Unknown ticker query must not crash');

  const eveningBriefing = await aiCIOAssistant.generateDailyBriefing('EVENING', true);
  assert(eveningBriefing.briefingType === 'EVENING', 'EVENING briefing type must be generated');

  const intradayBriefing = await aiCIOAssistant.generateDailyBriefing('INTRADAY', true);
  assert(intradayBriefing.briefingType === 'INTRADAY', 'INTRADAY briefing type must be generated');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n========================================================');
  console.log(`🏁 PHASE 11 TEST EXECUTION SUMMARY:`);
  console.log(`   Total Unit Tests: ${totalTests}`);
  console.log(`   Passed:           ${passedTests}`);
  console.log(`   Failed:           ${totalTests - passedTests}`);
  console.log(`   Success Rate:     ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('========================================================\n');

  if (totalTests === passedTests) {
    console.log('✅ ALL PHASE 11 TESTS PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME PHASE 11 TESTS FAILED!\n');
    process.exit(1);
  }
}

runPhase11Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
