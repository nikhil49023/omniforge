'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SpaceFlightStats } from './SpaceCanvas';
import {
  Shield,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  Radio,
  AlertTriangle,
  Flame,
  Gauge,
  Target,
} from 'lucide-react';

interface CockpitHUDProps {
  stats: SpaceFlightStats;
  onRestart: () => void;
  onMuteToggle: () => boolean;
  isMuted: boolean;
}

export function CockpitHUD({ stats, onRestart, onMuteToggle, isMuted }: CockpitHUDProps) {
  const directiveRef = useRef<HTMLDivElement | null>(null);
  const gameOverModalRef = useRef<HTMLDivElement | null>(null);
  const radarSweepRef = useRef<HTMLDivElement | null>(null);
  const collisionAlertRef = useRef<HTMLDivElement | null>(null);

  // GSAP animation on Tactical Directive change
  useEffect(() => {
    if (directiveRef.current) {
      gsap.fromTo(
        directiveRef.current,
        { opacity: 0.4, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, [stats.jevGuidance.telemetryLog]);

  // GSAP animation on Collision Alert
  useEffect(() => {
    if (stats.jevGuidance.collisionWarning && collisionAlertRef.current) {
      gsap.fromTo(
        collisionAlertRef.current,
        { scale: 0.9, opacity: 0.7 },
        { scale: 1.05, opacity: 1, repeat: 3, yoyo: true, duration: 0.15 }
      );
    }
  }, [stats.jevGuidance.collisionWarning]);

  // GSAP animation for radar line sweep
  useEffect(() => {
    if (radarSweepRef.current) {
      gsap.to(radarSweepRef.current, {
        rotation: 360,
        repeat: -1,
        ease: 'none',
        duration: 3,
        transformOrigin: '50% 50%',
      });
    }
  }, []);

  // GSAP animation for Game Over modal
  useEffect(() => {
    if (stats.gameOver && gameOverModalRef.current) {
      gsap.fromTo(
        gameOverModalRef.current,
        { opacity: 0, scale: 0.85, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [stats.gameOver]);

  // Lead target reticle position offset based on JEV predictive calculation
  const leadOffset = stats.jevGuidance.leadTarget;
  const leadPixelX = leadOffset ? Math.max(-120, Math.min(120, leadOffset.x * 2.2)) : 0;
  const leadPixelY = leadOffset ? Math.max(-80, Math.min(80, -leadOffset.y * 2.2)) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden">
      {/* 1. TOP FLIGHT DATA HEADER */}
      <div className="flex items-start justify-between w-full z-10">
        {/* Ship Vitals (Left) */}
        <div className="flex flex-col gap-2 w-64 md:w-72 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              DEFLECTOR SHIELDS
            </span>
            <span className="text-xs font-mono font-bold text-cyan-200">
              {Math.round(stats.shields)}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full border border-cyan-500/30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-sky-300 rounded-full transition-all duration-150 shadow-[0_0_8px_#38bdf8]"
              style={{ width: `${stats.shields}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              HULL INTEGRITY
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                stats.hull < 35 ? 'text-rose-400 animate-ping' : 'text-emerald-300'
              }`}
            >
              {Math.round(stats.hull)}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full border border-emerald-500/30 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                stats.hull < 35
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_#34d399]'
              }`}
              style={{ width: `${stats.hull}%` }}
            />
          </div>

          {/* Warp Engine Status */}
          <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800 text-slate-400">
            <span className="flex items-center gap-1">
              <Flame
                className={`w-3 h-3 ${stats.warpActive ? 'text-cyan-400 animate-bounce' : 'text-slate-500'}`}
              />
              WARP DRIVE
            </span>
            <span
              className={`font-bold ${
                stats.warpActive ? 'text-cyan-300 font-extrabold tracking-wider' : 'text-slate-400'
              }`}
            >
              {stats.warpActive ? 'RELATIVISTIC SURGE' : 'SUBLIGHT CRUISE'}
            </span>
          </div>
        </div>

        {/* JEV System 1 Tactical Telemetry Hub (Center) */}
        <div className="flex flex-col items-center max-w-sm md:max-w-md w-full px-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-cyan-400/40 shadow-lg shadow-cyan-950/60">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="text-[11px] font-mono font-extrabold tracking-widest text-cyan-300 uppercase">
              JEV SYSTEM 1 // TACTICAL CO-PILOT
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ⚡ {stats.jevGuidance.system1LatencyMs}ms
            </span>
          </div>

          {/* Tactical Directive Badge */}
          <div
            ref={directiveRef}
            className={`mt-2 px-4 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 text-xs font-mono font-bold tracking-wide transition-all shadow-md ${
              stats.jevGuidance.collisionWarning
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-rose-950/50'
                : stats.jevGuidance.targetLocked
                ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-amber-950/50'
                : 'bg-black/60 border-cyan-500/30 text-cyan-200 shadow-cyan-950/40'
            }`}
          >
            {stats.jevGuidance.collisionWarning ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            ) : (
              <Target className="w-4 h-4 text-cyan-400" />
            )}
            <span>{stats.jevGuidance.telemetryLog}</span>
          </div>

          {/* JEV Dynamic Shield Distribution Grid */}
          <div className="mt-2 hidden sm:flex items-center gap-4 text-[10px] font-mono text-slate-400 bg-black/40 px-3 py-1 rounded-md border border-slate-800">
            <span>
              FORE: <strong className="text-cyan-300">{stats.jevGuidance.shieldDistribution.fore}%</strong>
            </span>
            <span>
              AFT: <strong className="text-cyan-300">{stats.jevGuidance.shieldDistribution.aft}%</strong>
            </span>
            <span>
              PORT: <strong className="text-cyan-300">{stats.jevGuidance.shieldDistribution.port}%</strong>
            </span>
            <span>
              STARBOARD:{' '}
              <strong className="text-cyan-300">{stats.jevGuidance.shieldDistribution.starboard}%</strong>
            </span>
          </div>
        </div>

        {/* Combat Score & Action Controls (Right) */}
        <div className="flex flex-col items-end gap-2 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-950/40">
          <div className="text-right">
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              SCORE MATRIX
            </div>
            <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-white">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              KILLS: <strong className="text-rose-400">{stats.targetsDestroyed}</strong>
            </span>
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                onClick={onMuteToggle}
                className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950/50 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
                title={isMuted ? 'Unmute Space Audio' : 'Mute Space Audio'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onRestart}
                className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950/50 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
                title="Restart Mission"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER HOLOGRAPHIC COCKPIT HUD & TARGETING RETICLE */}
      <div className="relative flex-1 flex items-center justify-center pointer-events-none">
        {/* Horizon Artificial Gyro Pitch Ladder */}
        <div className="absolute w-48 h-32 border-l border-r border-cyan-500/20 flex flex-col justify-between items-center opacity-30">
          <div className="w-8 border-t border-cyan-400/40 text-[9px] font-mono text-cyan-400 text-center">
            +10°
          </div>
          <div className="w-12 border-t-2 border-cyan-400/60" />
          <div className="w-8 border-t border-cyan-400/40 text-[9px] font-mono text-cyan-400 text-center">
            -10°
          </div>
        </div>

        {/* Outer Circular Reticle Ring */}
        <div className="relative w-44 h-44 rounded-full border border-cyan-400/30 flex items-center justify-center">
          <div className="absolute inset-1 rounded-full border border-dashed border-cyan-500/20 animate-[spin_20s_linear_infinite]" />

          {/* Static Center Crosshairs */}
          <div className="w-6 h-0.5 bg-cyan-400/80 shadow-[0_0_6px_#38bdf8]" />
          <div className="h-6 w-0.5 bg-cyan-400/80 shadow-[0_0_6px_#38bdf8] absolute" />
          <div className="w-2 h-2 rounded-full border border-cyan-300 absolute" />

          {/* JEV Predictive Lead Reticle Marker (Calculated in real-time) */}
          {stats.jevGuidance.leadTarget && (
            <div
              className="absolute transition-transform duration-75 flex flex-col items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${leadPixelX}px, ${leadPixelY}px)`,
              }}
            >
              <div className="w-6 h-6 border-2 border-amber-400/90 rotate-45 flex items-center justify-center shadow-[0_0_10px_#f59e0b]">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              </div>
              <span className="text-[9px] font-mono text-amber-300 font-bold bg-black/70 px-1 rounded mt-1 whitespace-nowrap border border-amber-500/30">
                JEV LEAD
              </span>
            </div>
          )}
        </div>

        {/* Threat Warning Banner when collision is imminent */}
        {stats.jevGuidance.collisionWarning && (
          <div
            ref={collisionAlertRef}
            className="absolute top-1/4 px-6 py-2 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 font-mono font-black text-sm tracking-widest flex items-center gap-2 shadow-[0_0_20px_#f43f5e]"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-ping" />
            <span>{stats.jevGuidance.collisionVector || 'COLLISION IMMINENT — EVADE NOW'}</span>
          </div>
        )}
      </div>

      {/* 3. BOTTOM COCKPIT FLIGHT INSTRUMENTS & RADAR */}
      <div className="flex items-end justify-between w-full z-10">
        {/* Speedometer & Warp Factor */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-cyan-500/20">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">
              SUBLIGHT VELOCITY
            </div>
            <div className="text-lg font-black font-mono text-cyan-300">
              {stats.speed.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">km/s</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              WARP FACTOR: {stats.warpActive ? '1.85 c' : '0.12 c'}
            </div>
          </div>
        </div>

        {/* Flight Controls HUD Tooltip */}
        <div className="hidden md:flex flex-col items-center gap-1 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                MOUSE
              </kbd>{' '}
              Steer Vector
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                SPACE / CLICK
              </kbd>{' '}
              Twin Plasma Lasers
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                SHIFT / W
              </kbd>{' '}
              Relativistic Warp
            </span>
          </div>
        </div>

        {/* Tactical Mini-Radar Scanner */}
        <div className="relative w-28 h-28 rounded-full border border-cyan-500/30 bg-black/70 backdrop-blur-md p-1 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <div className="absolute inset-0 rounded-full border border-slate-800" />
          <div className="absolute inset-4 rounded-full border border-dashed border-cyan-500/20" />

          {/* Sweeping Radar Needle */}
          <div
            ref={radarSweepRef}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-cyan-500/10 to-cyan-400/40"
          />

          {/* Center Player Blip */}
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] z-10" />

          {/* Nearby Threat Blips */}
          <div className="absolute top-6 right-7 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping z-10" />
          <div className="absolute bottom-6 left-8 w-1.5 h-1.5 rounded-full bg-amber-400 z-10" />

          <div className="absolute -bottom-5 text-[9px] font-mono text-cyan-400 tracking-wider">
            RADAR 2.5k AU
          </div>
        </div>
      </div>

      {/* 4. GAME OVER / MISSION DEBRIEF MODAL */}
      {stats.gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 pointer-events-auto p-4">
          <div
            ref={gameOverModalRef}
            className="max-w-md w-full bg-slate-950 border border-rose-500/50 rounded-2xl p-6 shadow-2xl shadow-rose-950/50 flex flex-col items-center text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_15px_#f43f5e]">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black font-mono tracking-wider text-rose-400 mb-1">
              HULL BREACH DETECTED
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-6">
              Valkyrie-7 lost to celestial bombardment. JEV System 1 flight telemetry preserved.
            </p>

            <div className="w-full grid grid-cols-2 gap-3 mb-6 font-mono text-left">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">FINAL COMBAT SCORE</div>
                <div className="text-xl font-bold text-cyan-300">
                  {stats.score.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">DRONES DESTROYED</div>
                <div className="text-xl font-bold text-rose-400">
                  {stats.targetsDestroyed}
                </div>
              </div>
            </div>

            <button
              onClick={onRestart}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black font-mono tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RE-ENGAGE HYPERDRIVE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
