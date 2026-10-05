"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Globe, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import gsap from "gsap";
import { PRESET_DEMOS } from "@/lib/presets";
import { PresetDemo } from "@/types";

interface HeroInputProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (targetUrl?: string) => void;
  onSelectPreset: (preset: PresetDemo) => void;
  isProcessing: boolean;
  selectedPresetId?: string | null;
}

export function HeroInput({
  url,
  setUrl,
  onSubmit,
  onSelectPreset,
  isProcessing,
  selectedPresetId,
}: HeroInputProps) {
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Validate URL format
  useEffect(() => {
    if (!url.trim()) {
      setIsValidUrl(null);
      return;
    }
    try {
      const parsed = new URL(url.trim());
      setIsValidUrl(parsed.protocol === "http:" || parsed.protocol === "https:");
    } catch {
      setIsValidUrl(false);
    }
  }, [url]);

  // Magnetic button hover effect using GSAP
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || isProcessing) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    gsap.to(buttonRef.current, {
      x: x * 0.25,
      y: y * 0.25,
      duration: 0.2,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.4)",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isProcessing) return;
    onSubmit(url.trim());
  };

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto text-center space-y-6 pt-6 pb-4">
      {/* Badge Banner */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-xs font-mono">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Autonomous API Docs ➔ FastMCP Server Synthesis</span>
      </div>

      {/* Main Headline */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
          Turn Any Documentation into a{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Production FastMCP Server
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
          Powered by <strong className="text-slate-200">Firecrawl</strong> markdown DOM crawling,{" "}
          <strong className="text-cyan-300">LAYA Reflex</strong> schema triage (&lt;30ms), and{" "}
          <strong className="text-amber-300">Groq LPU</strong> (600 tokens/sec) FastMCP synthesis.
        </p>
      </div>

      {/* Hero URL Input Form */}
      <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl bg-[#0E1322] border border-[#273549] shadow-[0_0_30px_rgba(6,182,212,0.12)] focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all">
          <div className="relative flex-1 flex items-center w-full px-3">
            <Globe className="w-5 h-5 text-slate-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any API documentation URL (e.g. https://resend.com/docs/...)"
              disabled={isProcessing}
              className="w-full py-2.5 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 font-mono focus:outline-none disabled:opacity-60"
            />
            {url && !isProcessing && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer mr-1"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isValidUrl === true && (
              <span title="Valid URL structure">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </span>
            )}
            {isValidUrl === false && (
              <span title="Invalid URL format">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              </span>
            )}
          </div>

          {/* Magnetic High-Energy Button */}
          <button
            ref={buttonRef}
            type="submit"
            disabled={!url.trim() || isProcessing}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full sm:w-auto relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-sm font-sans shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Synthesize FastMCP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Instant Presets Chips */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
          <span>Instant One-Click Documentation Presets:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESET_DEMOS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isProcessing}
                onClick={() => onSelectPreset(preset)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-105"
                    : "bg-[#0E1322] hover:bg-[#151D33] border-[#1E293B] hover:border-slate-600 text-slate-300 hover:text-white"
                }`}
              >
                <span>{preset.icon}</span>
                <span className="font-medium">{preset.title}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
