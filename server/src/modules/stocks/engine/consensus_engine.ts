// ============================================================================
// Multi-Agent Consensus Engine (Master Prompt Section 16)
// Weighted Multi-Dimensional Synthesis (Weight * Confidence * Accuracy)
// ============================================================================

import { AgentOutputRecord, RecommendationDecision } from '../types.js';

export interface AgentInputVote {
  agentId: string;
  weight: number;
  confidence: number; // 0.0 - 1.0
  historicalAccuracy: number; // 0.0 - 1.0 (defaults to 0.70)
  score: number; // 0 - 100
  decision: string;
  isRedTeamVeto?: boolean;
}

export interface ConsensusOutput {
  consensusScore: number; // 0 - 100
  consensusConfidence: number; // 0.0 - 1.0
  consensusDecision: RecommendationDecision;
  totalVotes: number;
  bullishWeight: number;
  bearishWeight: number;
  neutralWeight: number;
  vetoTriggered: boolean;
  explanation: string;
}

export class ConsensusEngine {
  public calculateConsensus(votes: AgentInputVote[]): ConsensusOutput {
    if (!votes || votes.length === 0) {
      return {
        consensusScore: 50,
        consensusConfidence: 0.0,
        consensusDecision: 'WAIT',
        totalVotes: 0,
        bullishWeight: 0,
        bearishWeight: 0,
        neutralWeight: 0,
        vetoTriggered: false,
        explanation: 'ไม่มีข้อมูลคะแนนโหวตจาก Agent',
      };
    }

    // Check for hard veto from Red Team
    const vetoVote = votes.find((v) => v.isRedTeamVeto === true);
    if (vetoVote) {
      return {
        consensusScore: 20,
        consensusConfidence: 0.95,
        consensusDecision: 'AVOID',
        totalVotes: votes.length,
        bullishWeight: 0,
        bearishWeight: 100,
        neutralWeight: 0,
        vetoTriggered: true,
        explanation: `ถูกยับยั้งเด็ดขาดโดย ${vetoVote.agentId} (Red Team Veto)`,
      };
    }

    let totalEffectiveWeight = 0;
    let weightedScoreSum = 0;
    let weightedConfidenceSum = 0;

    let bullishWeight = 0;
    let bearishWeight = 0;
    let neutralWeight = 0;

    for (const vote of votes) {
      // Effective Weight = Base Weight * Confidence * Historical Accuracy
      const effectiveWeight = vote.weight * vote.confidence * (vote.historicalAccuracy || 0.7);
      totalEffectiveWeight += effectiveWeight;
      weightedScoreSum += vote.score * effectiveWeight;
      weightedConfidenceSum += vote.confidence * effectiveWeight;

      if (vote.score >= 70) {
        bullishWeight += effectiveWeight;
      } else if (vote.score <= 40) {
        bearishWeight += effectiveWeight;
      } else {
        neutralWeight += effectiveWeight;
      }
    }

    const consensusScore = totalEffectiveWeight > 0 ? Math.round(weightedScoreSum / totalEffectiveWeight) : 50;
    const consensusConfidence =
      totalEffectiveWeight > 0 ? parseFloat((weightedConfidenceSum / totalEffectiveWeight).toFixed(2)) : 0.5;

    let consensusDecision: RecommendationDecision = 'WAIT';
    if (consensusScore >= 85) consensusDecision = 'STRONG_BUY';
    else if (consensusScore >= 75) consensusDecision = 'BUY';
    else if (consensusScore >= 65) consensusDecision = 'ACCUMULATE';
    else if (consensusScore >= 48) consensusDecision = 'HOLD';
    else if (consensusScore >= 35) consensusDecision = 'REDUCE';
    else if (consensusScore >= 20) consensusDecision = 'SELL';
    else consensusDecision = 'AVOID';

    return {
      consensusScore,
      consensusConfidence,
      consensusDecision,
      totalVotes: votes.length,
      bullishWeight: Math.round((bullishWeight / (totalEffectiveWeight || 1)) * 100),
      bearishWeight: Math.round((bearishWeight / (totalEffectiveWeight || 1)) * 100),
      neutralWeight: Math.round((neutralWeight / (totalEffectiveWeight || 1)) * 100),
      vetoTriggered: false,
      explanation: `คะแนนสังเคราะห์ ${consensusScore}/100 ความเชื่อมั่น ${(consensusConfidence * 100).toFixed(0)}% จาก ${votes.length} Agents`,
    };
  }
}

export const consensusEngine = new ConsensusEngine();
