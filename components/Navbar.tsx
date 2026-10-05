"use client";

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Flame, 
  Zap, 
  Settings, 
  ExternalLink, 
  Check, 
  X, 
  ShieldCheck,
  Server
} from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}
import { loadSettings, saveSettings, UserSettings, DEFAULT_SETTINGS } from "@/lib/storage";

interface NavbarProps {
  onSettingsChange?: (settings: UserSettings) => void;
}

export function Navbar({ onSettingsChange }: NavbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSettings(settings);
    setSettings(updated);
    if (onSettingsChange) {
      onSettingsChange(updated);
    }
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      setIsSettingsOpen(false);
    }, 1000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#1E293B] bg-[#06080F]/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-indigo-600/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-sans">
                  Omni<span className="text-cyan-400">Forge</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold">
                  FastMCP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Docs ➔ FastMCP Studio
              </p>
            </div>
          </div>

          {/* Telemetry Status Pills */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div 
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0E1322] border border-[#1E293B] text-xs font-mono text-slate-300 shadow-sm"
              title="Local Firecrawl daemon on port 3002"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Firecrawl:</span>
              <span className="text-emerald-400 font-medium">Local :3002</span>
            </div>

            <div 
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0E1322] border border-[#1E293B] text-xs font-mono text-slate-300 shadow-sm"
              title="System 1 Reflex Triage with sub-30ms latency"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">System 1:</span>
              <span className="text-cyan-300 font-medium">LAYA &lt;30ms</span>
            </div>

            <div 
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0E1322] border border-[#1E293B] text-xs font-mono text-slate-300 shadow-sm"
              title="System 2 Groq LPU high-speed synthesis"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">System 2:</span>
              <span className="text-amber-400 font-medium">Groq LPU 600t/s</span>
            </div>
          </div>

          {/* Actions & BYOK Settings */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-[#0E1322] hover:bg-[#151D33] border border-[#1E293B] hover:border-cyan-500/50 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
              title="Configure Custom Keys (BYOK)"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">BYOK Settings</span>
              {settings.groqApiKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>

            <a
              href="https://github.com/jlowin/fastmcp"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 bg-[#0E1322] hover:bg-[#151D33] border border-[#1E293B] rounded-lg transition-colors cursor-pointer"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FastMCP</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </header>

      {/* BYOK Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0E1322] border border-[#273549] rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Client Settings & BYOK</h3>
                  <p className="text-xs text-slate-400">Custom keys for Groq LPU & Firecrawl runtime</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Groq API Key (Optional for Public/Custom BYOK)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings.groqApiKey}
                    onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                    placeholder="gsk_... (Defaults to server environment)"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[#06080F] border border-[#1E293B] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded cursor-pointer"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Stored securely in your local browser storage. Never transmitted to 3rd parties.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Firecrawl Engine URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={settings.firecrawlUrl}
                      onChange={(e) => setSettings({ ...settings, firecrawlUrl: e.target.value })}
                      placeholder="http://localhost:3002"
                      className="w-full pl-9 pr-3.5 py-2 text-xs font-mono bg-[#06080F] border border-[#1E293B] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, firecrawlUrl: "http://localhost:3002" })}
                    className="px-2.5 py-2 text-xs font-mono text-slate-400 hover:text-white bg-[#06080F] border border-[#1E293B] rounded-lg cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Groq LPU Synthesis Model
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#06080F] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="llama-3.3-70b-versatile">Llama-3.3-70B-Versatile (600 t/s Recommended)</option>
                  <option value="llama-3.1-8b-instant">Llama-3.1-8B-Instant (1,200 t/s Ultra-Fast)</option>
                  <option value="mixtral-8x7b-32768">Mixtral-8x7B (MoE 32k Context)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => {
                    const def = saveSettings(DEFAULT_SETTINGS);
                    setSettings(def);
                    if (onSettingsChange) onSettingsChange(def);
                  }}
                  className="text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear All Custom Keys
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/40 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold font-mono text-white bg-cyan-600 hover:bg-cyan-500 active:scale-95 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                  >
                    {showSavedFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
