# OmniForge: Autonomous Agentic Loop State
**Project:** OmniForge (Docs-to-FastMCP Studio)
**Workspace:** `/home/nikhil/Desktop/FS`
**Status:** In Progress (Iteration 1/5)
**Circuit Breaker:** Max 5 iterations

---

## 1. Goal
Build a fullstack client-server application (Next.js 15 + Tailwind CSS + Lucide + Monaco Editor + Firebase/Memory Store) that:
1. Takes any documentation URL (or curated presets like Stripe, Resend, Supabase, Firecrawl, GitHub).
2. Uses **Firecrawl-Local** (`http://localhost:3002/v1/scrape`) in development, with BYOK and high-fidelity fallback snapshots for live public deployment.
3. Implements **System 1 Triage** (LAYA / Jev concept) in `<30ms` to filter raw markdown, extract structured endpoint/parameter schemas, and eliminate prose noise.
4. Uses **System 2 Groq LPU** (`llama-3.3-70b-versatile`) to synthesize production-grade FastMCP (Python) & Model Context Protocol (TypeScript) servers with live streaming.
5. Provides an **Interactive In-Browser MCP Tool Tester** to execute tools against mock/real responses.
6. Has a live deployable build verified for Vercel deployment.

---

## 2. Success Criteria & Deterministic Verification Gates
- [ ] Gate 1: **FastMCP / TypeScript MCP Spec Validation** (Verified Python & TS syntax standards).
- [ ] Gate 2: **Backend API Deterministic Testing**
  - `/api/scrape` returns clean markdown & structure.
  - `/api/triage` returns `<30ms` parsed endpoint schema.
  - `/api/generate` produces syntactically valid FastMCP Python and TypeScript code.
  - `/api/test-tool` executes schema-validated simulated tool invocation.
- [ ] Gate 3: **Client Studio UI**
  - Cyber-dark developer interface with live pipeline status radar.
  - Split view: Endpoints tree + Monaco/Code viewer.
  - In-browser interactive MCP tester.
- [ ] Gate 4: **Production Build Gate**
  - `npm run build` exits with code 0 without any TypeScript or Next.js build errors.
- [ ] Gate 5: **Live Deployment Gate**
  - Vercel deployment command passes and returns a live public URL.

---

## 3. Subagent Loop Roles
- **Researcher:** `7aced351-9029-4a48-949b-b451e93b37dc` (Active)
- **Maker (Core Pipeline Architect):** `2ec248fd-4a79-4207-9c54-d56eece7dbc5` (Active)
- **Maker (Frontend UI & Interactive Studio):** (To be launched after core API ready)
- **Checker (Verification & Adversarial QA Subagent):** (To be launched for Gate 2 & Gate 4 validation)

---

## 4. Current Iteration Log
- **Iteration 1**: Scaffolding project, setting up environment keys, building core crawler + triage + Groq LPU generation pipelines.
