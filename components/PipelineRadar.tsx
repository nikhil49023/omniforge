"use client";

import React, { useEffect, useRef } from "react";
import { 
  Globe2, 
  Cpu, 
  Flame, 
  CheckCircle2, 
  Loader2, 
  Circle, 
  Activity, 
  Check 
} from "lucide-react";
import gsap from "gsap";
import { PipelineStageInfo } from "@/types";

interface PipelineRadarProps {
  stages: PipelineStageInfo[];
  isProcessing: boolean;
  totalTimeMs?: number;
}

export function PipelineRadar({ stages, isProcessing, totalTimeMs }: PipelineRadarProps) {
  const radarScanRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // GSAP animation for radar scanning beam while processing
  useEffect(() => {
    let tween: gsap.core.Tween | null = null;
    if (isProcessing && radarScanRef.current) {
      tween = gsap.fromTo(
        radarScanRef.current,
        { left: "-10%" },
        {
          left: "110%",
          duration: 1.6,
          repeat: -1,
          ease: "sine.inOut",
        }
      );
    } else if (radarScanRef.current) {
      gsap.set(radarScanRef.current, { left: "-10%" });
    }

    return () => {
      if (tween) tween.kill();
    };
  }, [isProcessing]);

  const getStageIcon = (key: string, status: string) => {
    if (status === "running") {
      return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
    }
    if (status === "completed") {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    switch (key) {
      case "crawl":
        return <Globe2 className="w-5 h-5 text-slate-500" />;
      case "triage":
        return <Cpu className="w-5 h-5 text-slate-500" />;
      case "synthesis":
        return <Flame className="w-5 h-5 text-slate-500" />;
      case "ready":
      default:
        return <Circle className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-6xl mx-auto rounded-2xl bg-[#090D16] border border-[#1E293B] p-4 sm:p-6 shadow-xl overflow-hidden"
    >
      {/* Laser Scanning Beam (GSAP driven) */}
      {isProcessing && (
        <div
          ref={radarScanRef}
          className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none blur-sm z-10"
        />
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold font-mono tracking-wide text-white uppercase">
            Live 4-Stage Pipeline Radar
          </h2>
          {isProcessing && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-[11px] font-mono text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Scanning & Synthesizing
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          {totalTimeMs ? (
            <span className="text-emerald-400 font-medium">
              Total Pipeline Time: {totalTimeMs}ms
            </span>
          ) : (
            <span>Architecture: Firecrawl ➔ LAYA ➔ Groq LPU</span>
          )}
        </div>
      </div>

      {/* 4 Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage, idx) => {
          const isRunning = stage.status === "running";
          const isCompleted = stage.status === "completed";

          return (
            <div
              key={stage.id}
              className={`relative rounded-xl p-4 border transition-all duration-300 ${
                isRunning
                  ? "bg-[#0E1528] border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  : isCompleted
                  ? "bg-[#0B1320] border-emerald-500/40"
                  : "bg-[#0A0E1A] border-[#1E293B]/70 opacity-80"
              }`}
            >
              {/* Top Row: Stage Step & Icon */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                  Stage 0{idx + 1}
                </span>
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                  {getStageIcon(stage.key, stage.status)}
                </div>
              </div>

              {/* Title & Subtext */}
              <h3 className="font-semibold text-sm text-white mb-1 tracking-tight">
                {stage.name}
              </h3>
              <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                {stage.subtext}
              </p>

              {/* Metrics Badge */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">
                  {stage.metricLabel ?? (isCompleted ? "Status" : isRunning ? "Progress" : "State")}
                </span>
                <span
                  className={
                    isRunning
                      ? "text-cyan-400 font-semibold"
                      : isCompleted
                      ? "text-emerald-400 font-medium"
                      : "text-slate-500"
                  }
                >
                  {stage.metricValue ??
                    (stage.latencyMs
                      ? `${stage.latencyMs}ms`
                      : isCompleted
                      ? "Complete"
                      : isRunning
                      ? "Executing..."
                      : "Standby")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
