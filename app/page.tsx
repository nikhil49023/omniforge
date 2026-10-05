'use client';

import React, { useState } from 'react';
import { GameCanvas, GameStats } from '@/components/GameCanvas';
import { GameHUD } from '@/components/GameHUD';
import { sound } from '@/lib/sound';
import { Cpu, Zap, Swords, Sparkles, ExternalLink } from 'lucide-react';

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function ArcadePage() {
  const [stats, setStats] = useState<GameStats>({
    playerHp: 100,
    bossHp: 100,
    adrenaline: 100,
    combo: 0,
    maxCombo: 0,
    parries: 0,
    gameOver: false,
    victory: false,
    bossTaunt: null,
    lastJevDecision: null,
    bulletTimeActive: false,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [gameKey, setGameKey] = useState(1);

  const handleStatsUpdate = (newStats: GameStats) => {
    setStats(newStats);
  };

  const handleRestart = () => {
    setGameKey((prev) => prev + 1);
  };

  const handleMuteToggle = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    return muted;
  };

  // Virtual buttons for click/touch players
  const triggerKey = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    }, 120);
  };

  return (
    <main className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col items-center justify-between p-4 md:p-6 selection:bg-cyan-500 selection:text-black">
      {/* Sleek Top Banner */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Swords className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-black tracking-wider uppercase bg-gradient-to-r from-white via-cyan-200 to-slate-400 bg-clip-text text-transparent">
              CYBER-DUEL // JEV ARENA
            </h1>
            <p className="text-[10px] font-mono text-slate-400">
              Human Synapses vs. System 1 AI Decision Engine (&lt;20ms)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-300">JEV System 1 Core</span>
          </div>
          <a
            href="https://github.com/nikhil49023/omniforge"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Game Stage */}
      <section className="relative w-full max-w-5xl my-auto py-2">
        <div className="relative">
          <GameCanvas key={gameKey} onStatsUpdate={handleStatsUpdate} />
          <GameHUD
            stats={stats}
            onRestart={handleRestart}
            onMuteToggle={handleMuteToggle}
            isMuted={isMuted}
          />
        </div>

        {/* Mobile / Clickable Quick Buttons */}
        <div className="mt-3 grid grid-cols-4 gap-2 sm:hidden font-mono text-xs">
          <button
            onClick={() => triggerKey('KeyJ')}
            className="py-2.5 rounded-xl bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 font-bold active:bg-cyan-500/50 active:scale-95 transition-transform"
          >
            [J] STRIKE
          </button>
          <button
            onClick={() => triggerKey('KeyK')}
            className="py-2.5 rounded-xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold active:bg-emerald-500/50 active:scale-95 transition-transform"
          >
            [K] PARRY
          </button>
          <button
            onClick={() => triggerKey('KeyL')}
            className="py-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 font-bold active:bg-indigo-500/50 active:scale-95 transition-transform"
          >
            [L] DASH
          </button>
          <button
            onClick={() => triggerKey('Space')}
            className="py-2.5 rounded-xl bg-amber-600/30 border border-amber-500/50 text-amber-300 font-bold active:bg-amber-500/50 active:scale-95 transition-transform"
          >
            [SPACE] SLOW
          </button>
        </div>
      </section>

      {/* Minimalist Telemetry Legend */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-900 pt-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <span>Tactical Parrying window: 150ms • Feints bait JEV parry cooldown</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Groq LPU Dialogue</span>
          <span>WebGL Audio Synthesizer</span>
          <span>GSAP Micro-Interactions</span>
        </div>
      </footer>
    </main>
  );
}
