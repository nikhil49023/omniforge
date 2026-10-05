"use client";

import React, { useState } from "react";
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FileText, 
  Terminal, 
  Package,
  Layers
} from "lucide-react";
import { GeneratedCodeFiles } from "@/types";

interface CodeStudioProps {
  files: GeneratedCodeFiles;
  serviceName?: string;
}

type TabKey = "fastmcp_py" | "mcp_ts" | "docker_compose" | "readme" | "schema_json";

interface TabMeta {
  key: TabKey;
  label: string;
  filename: string;
  icon: React.ComponentType<{ className?: string }>;
  language: string;
}

const TABS: TabMeta[] = [
  {
    key: "fastmcp_py",
    label: "FastMCP (Python)",
    filename: "server.py",
    icon: Terminal,
    language: "python",
  },
  {
    key: "mcp_ts",
    label: "TypeScript MCP",
    filename: "server.ts",
    icon: FileCode,
    language: "typescript",
  },
  {
    key: "docker_compose",
    label: "docker-compose.yml",
    filename: "docker-compose.yml",
    icon: Package,
    language: "yaml",
  },
  {
    key: "readme",
    label: "README.md",
    filename: "README.md",
    icon: FileText,
    language: "markdown",
  },
  {
    key: "schema_json",
    label: "schema.json",
    filename: "schema.json",
    icon: Layers,
    language: "json",
  },
];

export function CodeStudio({ files, serviceName }: CodeStudioProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("fastmcp_py");
  const [copied, setCopied] = useState(false);

  const activeContent = files[activeTab] || "";
  const currentTabMeta = TABS.find((t) => t.key === activeTab) || TABS[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Failed to copy code", e);
    }
  };

  const handleDownloadActive = () => {
    const blob = new Blob([activeContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentTabMeta.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Generate combined bundle JSON or multi-file trigger
    const bundle = {
      serviceName: serviceName || "OmniForge FastMCP Server",
      generatedAt: new Date().toISOString(),
      files: {
        "server.py": files.fastmcp_py,
        "server.ts": files.mcp_ts,
        "docker-compose.yml": files.docker_compose,
        "README.md": files.readme,
        "schema.json": files.schema_json,
      },
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `omniforge-${(serviceName || "mcp").toLowerCase().replace(/[^a-z0-9]/g, "-")}-bundle.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render code lines with line numbers
  const lines = activeContent.split("\n");

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#0E1322] border border-[#1E293B] shadow-xl overflow-hidden">
      {/* Tab bar header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#0A0E1A] border-b border-[#1E293B]">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#1A233A] text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-[#121829] border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-[#06080F] hover:bg-[#151D33] border border-[#1E293B] hover:border-cyan-500/40 rounded-lg transition-all cursor-pointer"
            title="Copy active code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadActive}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-[#06080F] hover:bg-[#151D33] border border-[#1E293B] hover:border-cyan-500/40 rounded-lg transition-all cursor-pointer"
            title={`Download ${currentTabMeta.filename}`}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTabMeta.filename}</span>
          </button>

          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800 rounded-lg transition-all cursor-pointer"
            title="Download full project bundle"
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Bundle</span>
          </button>
        </div>
      </div>

      {/* Code Editor / Viewer */}
      <div className="relative flex-1 bg-[#06080F] overflow-auto max-h-[580px] font-mono text-xs text-slate-200">
        <div className="flex min-w-full">
          {/* Line Numbers */}
          <div className="select-none py-4 px-3 text-right text-slate-600 bg-[#080B14] border-r border-[#1E293B]/60 font-mono text-xs leading-relaxed flex-shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="leading-relaxed">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Text Content */}
          <pre className="flex-1 py-4 px-4 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-100">
            <code>{activeContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
