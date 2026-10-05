/**
 * lib/jev.ts
 * JEV System 1 Tactical Decision Engine
 * High-frequency reflexive AI decision model operating at <30ms latency.
 * Evaluates real-time combat telemetry and makes instant tactical choices.
 */

export type JevAction = 
  | 'IDLE_STALK'
  | 'ADVANCE'
  | 'RETREAT_DASH'
  | 'PARRY'
  | 'COUNTER_SLASH'
  | 'HEAVY_LUNGE'
  | 'OVERDRIVE_COMBO';

export interface CombatTelemetry {
  playerX: number;
  bossX: number;
  distance: number;
  playerAction: 'idle' | 'running' | 'slashing' | 'parrying' | 'dashing';
  playerAttackFrame: number;
  playerHealth: number;
  bossHealth: number;
  playerComboStreak: number;
  bulletTimeActive: boolean;
  recentPlayerPatterns: string[]; // e.g. ['dash', 'slash', 'slash']
}

export interface JevDecision {
  action: JevAction;
  confidence: number; // 0.0 - 1.0
  latencyMs: number;  // 12ms - 28ms simulated reflex
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  telemetryTag: string;
  reactionWindow: number; // in milliseconds
}

export class JevTacticalEngine {
  private lastDecisionTime = 0;
  private actionCooldown = 0;
  private feintHistory: boolean[] = [];

  public evaluate(telemetry: CombatTelemetry, now: number): JevDecision {
    const startEval = performance.now();
    const dist = Math.abs(telemetry.playerX - telemetry.bossX);
    const inMeleeRange = dist < 140;
    const inCloseRange = dist < 260;
    const isPlayerTelegraphing = telemetry.playerAction === 'slashing' && telemetry.playerAttackFrame < 12;
    const isOverdrive = telemetry.bossHealth < 35;

    // Default System 1 Baseline
    let action: JevAction = 'IDLE_STALK';
    let confidence = 0.85;
    let threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' = 'NOMINAL';
    let tag = 'TACTICAL_POSITIONING';

    // 1. Reflex Threat Interception (Player is slashing in melee range)
    if (inMeleeRange && isPlayerTelegraphing) {
      threatLevel = 'CRITICAL';

      // Habit analysis: Did the player spam attack 3 times in a row?
      const isSpamming = telemetry.recentPlayerPatterns.filter(p => p === 'slashing').length >= 3;

      if (isSpamming) {
        // High confidence instant parry
        action = 'PARRY';
        confidence = 0.98;
        tag = 'SPAM_RECOGNIZED // PERFECT_PARRY_LOCK';
      } else if (telemetry.playerAction === 'slashing' && Math.random() < 0.72) {
        // Standard high-speed parry
        action = 'PARRY';
        confidence = 0.89;
        tag = 'TELEGRAPH_INTERCEPT // REFLEX_PARRY';
      } else {
        // Sidestep / Dash through
        action = 'RETREAT_DASH';
        confidence = 0.78;
        tag = 'EVASIVE_SLIP // REPOSITION';
      }
    }
    // 2. Player is in recovery / parry recovery (Vulnerable window)
    else if (inMeleeRange && telemetry.playerAction === 'parrying') {
      threatLevel = 'ELEVATED';
      // Wait out parry or heavy strike
      action = isOverdrive ? 'OVERDRIVE_COMBO' : 'COUNTER_SLASH';
      confidence = 0.92;
      tag = 'GUARD_BREAK_OPPORTUNITY // LUNGE';
    }
    // 3. Player is dashing (Invulnerable)
    else if (inCloseRange && telemetry.playerAction === 'dashing') {
      threatLevel = 'ELEVATED';
      action = 'RETREAT_DASH';
      confidence = 0.84;
      tag = 'PHASE_DETECTED // BACKSTEP';
    }
    // 4. Player is idle or running at distance
    else if (inCloseRange && !inMeleeRange) {
      if (Math.random() < 0.45) {
        action = 'HEAVY_LUNGE';
        confidence = 0.82;
        tag = 'GAP_CLOSE // INITIATE_STRIKE';
      } else {
        action = 'ADVANCE';
        confidence = 0.75;
        tag = 'PRESSURE_PRESSURE';
      }
    } else if (!inCloseRange) {
      action = 'ADVANCE';
      confidence = 0.70;
      tag = 'TRACKING_TARGET';
    }

    const latencyMs = Number((performance.now() - startEval + 12 + Math.random() * 8).toFixed(1));

    return {
      action,
      confidence,
      latencyMs,
      threatLevel,
      telemetryTag: tag,
      reactionWindow: Math.floor(120 + (1 - confidence) * 100),
    };
  }
}

export const jevEngine = new JevTacticalEngine();
