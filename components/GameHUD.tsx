'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { GameStats } from './GameCanvas';
import { Shield, Zap, Sparkles, Volume2, VolumeX, RotateCcw, Swords, Cpu } from 'lucide-react';
import { sound } from '@/lib/sound';

interface GameHUDProps {
  stats: GameStats;
  onRestart: () => void;
  onMuteToggle: () => boolean;
  isMuted: boolean;
}

export function GameHUD({ stats, onRestart, onMuteToggle, isMuted }: GameHUDProps) {
  const comboRef = useRef<HTMLDivElement | null>(null);
  const telemetryRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // GSAP animation on combo increase
  useEffect(() => {
    if (stats.combo > 1 && comboRef.current) {
      gsap.fromTo(
        comboRef.current,
        { scale: 1.5, color: '#f59e0b' },
        { scale: 1.0, color: '#22d3ee', duration: 0.35, ease: 'back.out(2)' }
      );
    }
  }, [stats.combo]);

  // GSAP animation on JEV decision update
  useEffect(() => {
    if (telemetryRef.current) {
      gsap.fromTo(
        telemetryRef.current,
        { opacity: 0.7, x: 8 },
        { opacity: 1.0, x: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [stats.lastJevDecision?.action]);

  // GSAP animation on game over modal
  useEffect(() => {
    if (stats.gameOver && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [stats.gameOver]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Top Combat Gauges */}
      <div className="flex items-center justify-between w-full">
        {/* Player Gauge (Left) */}
        <div className="flex flex-col gap-1.5 w-72">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              CYBER_NINJA [YOU]
            </span>
            <span className="text-slate-400 font-bold">{Math.round(stats.playerHp)}%</span>
          </div>
          <div className="h-4 w-full bg-slate-900/90 rounded-full border border-cyan-500/30 p-0.5 overflow-hidden shadow-lg shadow-cyan-950/30">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-150"
              style={{ width: `${stats.playerHp}%` }}
            ></div>
          </div>
          {/* Adrenaline / Bullet-Time Meter */}
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <div className="h-1.5 flex-1 bg-slate-900/80 rounded-full border border-slate-700/50 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  stats.bulletTimeActive ? 'bg-amber-400 animate-pulse' : 'bg-amber-500/80'
                }`}
                style={{ width: `${stats.adrenaline}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono text-amber-400/80">
              {stats.bulletTimeActive ? 'TIME DILATION' : 'ADRENALINE'}
            </span>
          </div>
        </div>

        {/* Center VS & Round Indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="px-4 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2 shadow-xl">
            <Swords className="w-4 h-4 text-cyan-400" />
            <span className="font-bold tracking-widest text-slate-200">REFLEX DUEL</span>
          </div>
          {stats.bulletTimeActive && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              SLOW-MO ACTIVE [0.28x]
            </span>
          )}
        </div>

        {/* Boss JEV Gauge (Right) */}
        <div className="flex flex-col gap-1.5 w-72 text-right">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold">{Math.round(stats.bossHp)}%</span>
            <span className="text-rose-400 font-bold tracking-wider flex items-center gap-1.5">
              JEV [SYSTEM 1 SENTINEL]
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            </span>
          </div>
          <div className="h-4 w-full bg-slate-900/90 rounded-full border border-rose-500/30 p-0.5 overflow-hidden shadow-lg shadow-rose-950/30">
            <div
              className="h-full bg-gradient-to-l from-rose-600 to-rose-400 rounded-full transition-all duration-150 float-right"
              style={{ width: `${stats.bossHp}%` }}
            ></div>
          </div>
          <div className="text-[10px] font-mono text-rose-400/80 flex items-center justify-end gap-1">
            <Cpu className="w-3 h-3 text-rose-400" />
            <span>NEURAL INTERCEPT ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Middle Combo Floating Feedback */}
      <div className="flex items-center justify-between px-8">
        <div>
          {stats.combo > 1 && (
            <div ref={comboRef} className="flex flex-col">
              <span className="font-black italic text-4xl tracking-tighter drop-shadow-md text-cyan-400">
                {stats.combo}x COMBO
              </span>
              <span className="text-xs font-mono text-slate-400 tracking-wider">
                {stats.combo > 4 ? '🔥 DOMINATING' : 'BLADE VELOCITY'}
              </span>
            </div>
          )}
        </div>

        {/* Live JEV Neural Telemetry HUD */}
        {stats.lastJevDecision && (
          <div
            ref={telemetryRef}
            className="flex flex-col gap-1 bg-[#0c1220]/90 border border-slate-800 p-3.5 rounded-xl shadow-xl backdrop-blur max-w-xs text-xs font-mono"
          >
            <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-1.5">
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                JEV SYSTEM 1 RADAR
              </span>
              <span className="text-emerald-400 font-semibold">
                ⚡ {stats.lastJevDecision.latencyMs}ms
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Decision:</span>
              <span className="font-bold text-slate-100 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {stats.lastJevDecision.action}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Confidence:</span>
              <span className="text-cyan-400 font-semibold">
                {(stats.lastJevDecision.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="text-[10px] text-slate-400 truncate pt-1 border-t border-slate-800/80">
              {stats.lastJevDecision.telemetryTag}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Audio Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/60 pt-3">
        {/* Keybind Badges */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">A / D</span>
          <span>Move</span>
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">W</span>
          <span>Jump</span>
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold">J</span>
          <span>Slash</span>
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">K</span>
          <span>Parry</span>
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-400 font-bold">L</span>
          <span>Dash</span>
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400 font-bold">Space</span>
          <span>Slow-Mo</span>
        </div>

        {/* Audio Mute Button */}
        <button
          onClick={onMuteToggle}
          className="pointer-events-auto px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>

      {/* Game Over / Victory Modal Overlay */}
      {stats.gameOver && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-6 z-50">
          <div
            ref={modalRef}
            className={`max-w-md w-full p-8 rounded-2xl border flex flex-col items-center text-center gap-4 shadow-2xl ${
              stats.victory
                ? 'bg-[#061814] border-emerald-500/50 shadow-emerald-950/40'
                : 'bg-[#180a0d] border-rose-500/50 shadow-rose-950/40'
            }`}
          >
            <div
              className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl ${
                stats.victory ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {stats.victory ? '👑' : '💀'}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white uppercase">
              {stats.victory ? 'JEV SENTINEL DEFEATED' : 'SYNAPSE OVERLOAD // DEFEAT'}
            </h2>

            {/* Groq LPU Boss Banter */}
            <div className="p-3.5 bg-black/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 italic max-w-sm">
              &quot;{stats.bossTaunt || (stats.victory ? 'System 1 anomaly logged. Neural reflexes accepted.' : 'Biological reaction limits breached.')}&quot;
            </div>

            {/* Match Stats */}
            <div className="grid grid-cols-2 gap-3 w-full py-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400">Max Combo</div>
                <div className="text-base font-bold text-cyan-400">{stats.maxCombo}x</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400">Parries Landed</div>
                <div className="text-base font-bold text-emerald-400">{stats.parries}</div>
              </div>
            </div>

            {/* Restart CTA */}
            <button
              onClick={onRestart}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all ${
                stats.victory
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rematch (Press R)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
