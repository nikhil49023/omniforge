'use client';

import React, { useState } from 'react';
import { SpaceCanvas, SpaceFlightStats } from '@/components/SpaceCanvas';
import { CockpitHUD } from '@/components/CockpitHUD';
import { spaceAudio } from '@/lib/space-audio';
import {
  Rocket,
  Shield,
  Zap,
  Target,
  Sparkles,
  Compass,
  Radio,
  ExternalLink,
  Flame,
  Cpu,
} from 'lucide-react';

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function SpaceGamePage() {
  const [stats, setStats] = useState<SpaceFlightStats>({
    shields: 100,
    hull: 100,
    score: 0,
    speed: 1120,
    warpActive: false,
    targetsDestroyed: 0,
    jevGuidance: {
      leadTarget: null,
      targetLocked: false,
      collisionWarning: false,
      collisionVector: null,
      shieldDistribution: { fore: 25, aft: 25, port: 25, starboard: 25 },
      telemetryLog: 'ALL SYSTEMS NOMINAL // VECTOR CLEAR',
      system1LatencyMs: 11.2,
    },
    gameOver: false,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [gameKey, setGameKey] = useState(1);

  const handleStatsUpdate = (newStats: SpaceFlightStats) => {
    setStats(newStats);
  };

  const handleRestart = () => {
    setGameKey((prev) => prev + 1);
  };

  const handleMuteToggle = () => {
    const muted = spaceAudio.toggleMute();
    setIsMuted(muted);
    return muted;
  };

  // Virtual buttons for touch/click users
  const triggerLaser = () => {
    spaceAudio.startThrusterLoop();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    }, 100);
  };

  const triggerWarp = () => {
    spaceAudio.startThrusterLoop();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }));
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col items-center justify-between p-3 md:p-6 selection:bg-cyan-500 selection:text-black">
      {/* 1. Sleek Sci-Fi Header */}
      <header className="w-full max-w-6xl flex items-center justify-between py-2 border-b border-cyan-950/80 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Rocket className="w-5 h-5 text-black transform rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-widest uppercase bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                AETHER-VOID // JEV CHRONO-INTERCEPTOR
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-700/50">
                3D WebGL
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Deep Space Sci-Fi Fantasy Flight Combat &bull; JEV System 1 Tactical Telemetry (&lt;16ms)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[11px] text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>JEV Tactical Co-Pilot Active</span>
          </div>
          <a
            href="https://github.com/nikhil49023/omniforge"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* 2. Main 3D Outer Space Combat Canvas + Holographic Cockpit HUD */}
      <section className="relative w-full max-w-6xl my-auto">
        <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
          <SpaceCanvas key={gameKey} onStatsUpdate={handleStatsUpdate} />
          <CockpitHUD
            stats={stats}
            onRestart={handleRestart}
            onMuteToggle={handleMuteToggle}
            isMuted={isMuted}
          />
        </div>

        {/* Mobile / Tablet On-Screen Touch Controls */}
        <div className="flex sm:hidden items-center justify-between mt-3 px-2">
          <button
            onClick={triggerLaser}
            className="flex-1 py-3 bg-cyan-600/30 active:bg-cyan-500/60 border border-cyan-400 rounded-xl text-cyan-300 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 mr-2"
          >
            <Zap className="w-4 h-4 text-cyan-300" />
            FIRE PLASMA
          </button>
          <button
            onClick={triggerWarp}
            className="flex-1 py-3 bg-indigo-600/30 active:bg-indigo-500/60 border border-indigo-400 rounded-xl text-indigo-300 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 ml-2"
          >
            <Flame className="w-4 h-4 text-indigo-300" />
            WARP SURGE
          </button>
        </div>
      </section>

      {/* 3. Sci-Fi Tactical Intel & JEV Architecture Deck */}
      <footer className="w-full max-w-6xl mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        {/* JEV System 1 Tactical Engine */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5 uppercase text-[11px]">
            <Radio className="w-4 h-4" />
            JEV System 1 Tactical Co-Pilot
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Evaluates celestial projectile trajectories and alien interceptors in &lt;16ms. Continuously computes
            first-order predictive lead target markers, collision avoidance vectors, and dynamic 4-quadrant deflector shield power.
          </p>
        </div>

        {/* Valkyrie-7 Flight Specs */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1.5 uppercase text-[11px]">
            <Compass className="w-4 h-4" />
            Valkyrie-7 Interceptor Specs
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Dual magnetoplasmadynamic ion thrusters with relativistic warp drive. Armed with synchronized
            twin plasma pulse cannons and reactive deflector shields calibrated for asteroid belt incursions.
          </p>
        </div>

        {/* Procedural Audio & WebGL Engine */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-300 font-bold mb-1.5 uppercase text-[11px]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Autonomous WebGL &amp; Audio
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Real-time Three.js 3D WebGL renderer with 3,500 relativistic stars, tumbling deformed asteroids,
            volumetric nebulae, and procedural Web Audio synthesizers (zero external assets or sound files).
          </p>
        </div>
      </footer>
    </main>
  );
}
