"use client";

import React, { useState } from "react";
import { 
  Boxes, 
  Search, 
  Play, 
  ChevronRight, 
  Tag, 
  Check, 
  ArrowUpRight,
  Filter
} from "lucide-react";
import { ApiEndpoint, HttpMethod } from "@/types";

interface EndpointsListProps {
  endpoints: ApiEndpoint[];
  selectedEndpointId?: string | null;
  onSelectEndpoint: (endpoint: ApiEndpoint) => void;
  onTriggerTest?: (endpoint: ApiEndpoint) => void;
}

export function EndpointsList({
  endpoints,
  selectedEndpointId,
  onSelectEndpoint,
  onTriggerTest,
}: EndpointsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch =
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod =
      methodFilter === "ALL" || ep.method.toUpperCase() === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const getMethodBadgeClass = (method: HttpMethod) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800/80";
      case "POST":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
      case "PUT":
      case "PATCH":
        return "bg-amber-950/80 text-amber-300 border-amber-800/80";
      case "DELETE":
        return "bg-rose-950/80 text-rose-300 border-rose-800/80";
      default:
        return "bg-slate-900 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#0E1322] border border-[#1E293B] shadow-xl overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-[#1E293B] bg-[#0A0E1A]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-sm text-white font-sans">
              Discovered Tool Endpoints
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[11px] font-mono text-cyan-400 font-bold">
              {endpoints.length}
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-2.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tools by route or name..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[#06080F] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Method filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {["ALL", "GET", "POST", "PUT", "DELETE"].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                methodFilter === m
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold"
                  : "bg-[#06080F] text-slate-400 border border-[#1E293B] hover:text-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[600px]">
        {filteredEndpoints.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Boxes className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
            <p className="text-xs font-mono">
              {endpoints.length === 0
                ? "No endpoints discovered yet. Enter docs URL or click a preset to synthesize."
                : "No endpoints matching your filter."}
            </p>
          </div>
        ) : (
          filteredEndpoints.map((ep) => {
            const isSelected = selectedEndpointId === ep.id;
            return (
              <div
                key={ep.id}
                onClick={() => onSelectEndpoint(ep)}
                className={`group relative rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#141C33] border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "bg-[#0A0F1D] hover:bg-[#11182B] border-[#1E293B] hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${getMethodBadgeClass(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {ep.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEndpoint(ep);
                      if (onTriggerTest) onTriggerTest(ep);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 hover:border-cyan-600 transition-all cursor-pointer"
                    title="Load into Interactive Inspector"
                  >
                    <Play className="w-3 h-3 text-cyan-400" />
                    <span>Test</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 mb-2 truncate">
                  {ep.path}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                  {ep.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1.5 border-t border-white/5">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>
                      {ep.parameters.length} parameter{ep.parameters.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {ep.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {ep.category}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
