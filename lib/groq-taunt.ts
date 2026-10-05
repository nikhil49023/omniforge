/**
 * lib/groq-taunt.ts
 * Generates dynamic cyberpunk boss banter and combat autopsy using Groq LPU.
 */

const FALLBACK_TAUNTS = {
  victory: [
    "Your neural reflexes were acceptable, human. Barely.",
    "System 1 detected your feint. You adapted faster than expected.",
    "Anomaly logged. Your blade speed breached predicted parameters.",
  ],
  defeat: [
    "Predictable. Your attack entropy degraded to zero.",
    "Latency: 280ms. Human synapses cannot outpace synthetic decision gates.",
    "Another meatbag consigned to the scrap heap.",
  ],
  parried: [
    "Did you truly believe that strike was undetectable?",
    "Telemetry received. Vector deflected.",
    "Your telegraph window is a canyon, runner.",
  ],
};

export async function fetchBossTaunt(event: 'victory' | 'defeat' | 'parried', playerStats?: { combo: number; parries: number }): Promise<string> {
  const fallbacks = FALLBACK_TAUNTS[event];
  const fallbackLine = fallbacks[Math.floor(Math.random() * fallbacks.length)]!;

  try {
    const res = await fetch('/api/taunt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, playerStats }),
    });
    if (!res.ok) return fallbackLine;
    const data = await res.json();
    return data.taunt || fallbackLine;
  } catch {
    return fallbackLine;
  }
}
