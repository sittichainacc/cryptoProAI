// ============================================================================
// Phase 10 Unit Test Suite: Real-Time SSE Streaming & Multi-Channel Notifications
// ============================================================================

import { realtimeSSEService } from '../src/modules/stocks/realtime/realtime_sse.service.js';
import { 
  notificationDispatcher, 
  NotificationChannel,
  NotificationChannelType 
} from '../src/modules/stocks/notifications/notification_dispatcher.service.js';
import { EventEmitter } from 'events';

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

/**
 * Mock Express Response for SSE Testing
 */
class MockSSEResponse extends EventEmitter {
  public headers: Record<string, string> = {};
  public writtenData: string[] = [];
  public closed: boolean = false;

  setHeader(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
  }

  write(chunk: string) {
    this.writtenData.push(chunk);
    return true;
  }

  flushHeaders() {}

  end() {
    this.closed = true;
    this.emit('close');
  }
}

async function runPhase10Tests() {
  console.log('========================================================');
  console.log('🧪 RUNNING PHASE 10 TESTS: REAL-TIME SSE & NOTIFICATIONS');
  console.log('========================================================\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Real-Time SSE Service Lifecycle
  // --------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Real-Time SSE Streaming Service ---');

  const initialStats = realtimeSSEService.getStats();
  assert(initialStats !== undefined, 'SSE service stats must be defined');
  assert(typeof initialStats.activeClients === 'number', 'activeClients must be numeric');
  assert(typeof initialStats.uptimeSeconds === 'number', 'uptimeSeconds must be numeric');

  const mockRes1 = new MockSSEResponse() as any;
  const clientId1 = realtimeSSEService.registerClient(mockRes1, '127.0.0.1', 'Node-Test/1.0');

  assert(clientId1.startsWith('sse_'), `ClientId must have 'sse_' prefix (got ${clientId1})`);
  assert(mockRes1.headers['content-type'] === 'text/event-stream', 'SSE Content-Type header must be text/event-stream');
  assert(mockRes1.headers['cache-control']?.includes('no-cache'), 'SSE Cache-Control header must include no-cache');
  assert(mockRes1.headers['connection'] === 'keep-alive', 'SSE Connection header must be keep-alive');
  assert(mockRes1.writtenData.length >= 1, 'Client must receive initial connected event handshake');
  assert(mockRes1.writtenData[0].includes('event: connected'), 'Handshake event name must be connected');

  const statsAfter1 = realtimeSSEService.getStats();
  assert(statsAfter1.activeClients === 1, 'Active clients count must be 1');

  // Send targeted event
  const targetedSuccess = realtimeSSEService.sendToClient(clientId1, 'custom_event', { foo: 'bar' });
  assert(targetedSuccess === true, 'sendToClient must return true for registered client');
  assert(mockRes1.writtenData.some((w: string) => w.includes('event: custom_event')), 'Client must receive targeted event');

  // Register second client
  const mockRes2 = new MockSSEResponse() as any;
  const clientId2 = realtimeSSEService.registerClient(mockRes2, '127.0.0.2', 'Node-Test/2.0');
  assert(realtimeSSEService.getStats().activeClients === 2, 'Active clients count must be 2');

  // Broadcast event
  realtimeSSEService.broadcast('market_tick', { symbol: 'NVDA', price: 238.50 });
  assert(mockRes1.writtenData.some((w: string) => w.includes('event: market_tick')), 'Client 1 must receive broadcast');
  assert(mockRes2.writtenData.some((w: string) => w.includes('event: market_tick')), 'Client 2 must receive broadcast');
  assert(realtimeSSEService.getStats().totalBroadcasts >= 1, 'Total broadcasts must increment');

  // Disconnect client 1
  mockRes1.end();
  assert(realtimeSSEService.getStats().activeClients === 1, 'Active clients count must decrease to 1 after disconnect');

  // Reset
  realtimeSSEService.reset();
  assert(realtimeSSEService.getStats().activeClients === 0, 'Active clients must be 0 after reset');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Notification Channel Management
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Notification Channel Management ---');

  const channels = await notificationDispatcher.getChannels();
  assert(Array.isArray(channels), 'Channels must be an array');
  assert(channels.length >= 2, 'Default seeded channels must exist (got ' + channels.length + ')');
  assert(channels.some(c => c.channelType === 'discord'), 'Discord default channel must exist');
  assert(channels.some(c => c.channelType === 'telegram'), 'Telegram default channel must exist');

  // Create new channel
  const newChan = await notificationDispatcher.saveChannel({
    channelType: 'webhook',
    channelName: 'Trading Desk Webhook',
    webhookUrl: 'https://webhook.internal/risk-alerts',
    subscribedEvents: ['CIRCUIT_BREAKER', 'SYSTEM_TEST'],
    isActive: true
  });

  assert(newChan.id !== undefined, 'Created channel must have valid ID');
  assert(newChan.channelName === 'Trading Desk Webhook', 'Created channel name must match');
  assert(newChan.subscribedEvents.includes('CIRCUIT_BREAKER'), 'Created channel must include CIRCUIT_BREAKER event');

  // Update channel
  const updatedChan = await notificationDispatcher.saveChannel({
    id: newChan.id,
    channelType: 'webhook',
    channelName: 'Trading Desk Webhook (Updated)',
    isActive: false
  });
  assert(updatedChan.channelName === 'Trading Desk Webhook (Updated)', 'Updated channel name must match');
  assert(updatedChan.isActive === false, 'Updated channel isActive must be false');

  // Delete channel
  const deleteResult = await notificationDispatcher.deleteChannel(newChan.id);
  assert(deleteResult === true, 'deleteChannel must return true');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Multi-Channel Dispatch & SSE Synchronization
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Multi-Channel Dispatch & SSE Synchronization ---');

  // Attach a mock SSE listener to test automatic broadcasting
  const sseTestRes = new MockSSEResponse() as any;
  realtimeSSEService.registerClient(sseTestRes);

  const dispatchResult = await notificationDispatcher.dispatch({
    eventType: 'CIRCUIT_BREAKER',
    severity: 'CRITICAL',
    title: 'Test Drawdown Breach',
    message: 'Drawdown exceeded limit'
  });

  assert(dispatchResult.delivered >= 1, 'Dispatch to default channels must succeed');
  assert(dispatchResult.channels.length >= 1, 'Dispatched channels list must be populated');
  assert(sseTestRes.writtenData.some((w: string) => w.includes('event: notification_alert')), 'Dispatch must simultaneously broadcast SSE notification_alert event');
  assert(sseTestRes.writtenData.some((w: string) => w.includes('Test Drawdown Breach')), 'SSE payload must include alert title');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: High-Level Specialized Event Handlers
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: High-Level Specialized Event Handlers ---');

  // 4.1 Circuit Breaker Notification
  const cbRes = await notificationDispatcher.notifyCircuitBreaker(2, 0.11, 'DEFENSIVE_DELEVERAGING');
  assert(cbRes.delivered >= 1, 'notifyCircuitBreaker must deliver alerts');

  // 4.2 Red Team VETO Notification
  const vetoRes = await notificationDispatcher.notifyRedTeamVeto('TSLA', -1.25, [
    'Beneish M-Score manipulation risk',
    'Gross margin degradation'
  ]);
  assert(vetoRes.delivered >= 1, 'notifyRedTeamVeto must deliver alerts');

  // 4.3 AI-CIO Supermajority Approval Notification
  const cioRes = await notificationDispatcher.notifyCIOApproval('NVDA', 'BUY', 88.5, 260.0);
  assert(cioRes.delivered >= 1, 'notifyCIOApproval must deliver alerts');

  // 4.4 Macro Shock Surge Notification
  const macroRes = await notificationDispatcher.notifyMacroShock('VIX', 28.5, 20.0);
  assert(macroRes.delivered >= 1, 'notifyMacroShock must deliver alerts');

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Delivery Audit Logs
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Delivery Audit Logs ---');

  const logs = await notificationDispatcher.getLogs(20);
  assert(Array.isArray(logs), 'getLogs must return an array');
  assert(logs.length >= 4, `Must have logged multiple delivery events (got ${logs.length})`);

  const latestLog = logs[0];
  assert(latestLog.title !== undefined, 'Log entry must have title');
  assert(latestLog.severity !== undefined, 'Log entry must have severity');
  assert(['DELIVERED', 'SIMULATED', 'FAILED'].includes(latestLog.status), `Log status must be valid (got ${latestLog.status})`);
  assert(latestLog.sentAt !== undefined, 'Log entry must have sentAt timestamp');

  realtimeSSEService.reset();

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n========================================================');
  console.log(`🏁 PHASE 10 TEST EXECUTION SUMMARY:`);
  console.log(`   Total Unit Tests: ${totalTests}`);
  console.log(`   Passed:           ${passedTests}`);
  console.log(`   Failed:           ${totalTests - passedTests}`);
  console.log(`   Success Rate:     ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('========================================================\n');

  if (totalTests === passedTests) {
    console.log('✅ ALL PHASE 10 TESTS PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME PHASE 10 TESTS FAILED!\n');
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
