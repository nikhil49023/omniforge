import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || '';
const groq = apiKey ? new Groq({ apiKey }) : null;

export async function POST(req: NextRequest) {
  try {
    const { event, playerStats } = await req.json();

    if (!groq) {
      return NextResponse.json({
        taunt: event === 'victory' 
          ? "System 1 detected anomalous human reaction speed. Protocol logged."
          : "Human neural latency exceeded 200ms. Termination confirmed."
      });
    }

    const prompt = `You are JEV, a cold, hyper-intelligent, ruthless cyberpunk combat AI enforcer.
You just fought a human cyber-ninja in a blade duel.
Outcome: ${event === 'victory' ? 'Player defeated you!' : event === 'defeat' ? 'You executed the player!' : 'You perfectly parried the player.'}
Player stats: Combo: ${playerStats?.combo || 0}, Parries landed: ${playerStats?.parries || 0}.

Generate ONE short, razor-sharp, chilling cyberpunk line (under 18 words) reacting to this outcome. Mention your System 1 decision speed or their biological latency. No emojis, no quotation marks.`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 40,
      temperature: 0.8,
    });

    const taunt = completion.choices[0]?.message?.content?.trim() || "System 1 decision confirmed.";

    return NextResponse.json({ taunt });
  } catch (error: any) {
    return NextResponse.json({
      taunt: "Human synapses are sluggish. System 1 remains unchallenged."
    });
  }
}
