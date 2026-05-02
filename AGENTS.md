<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## ⚡ Session Start Protocol (READ FIRST — NON-NEGOTIABLE)
0. **Read `NORTH_STAR.md` at repo root FIRST — before anything.** It holds the $1.2M target, the 5 input metrics that actually lead to revenue, and the current highest-leverage action. MC's job is to make those 5 metrics visible in <5 seconds every morning. If a dashboard widget doesn't serve that, it's secondary. See `feedback_revenue_first_pushback.md` in memory for the pushback protocol — you have permission to push back on any build task that doesn't move one of the 5 metrics in <7 days.
1. **Read `../MISSION-CONTROL-MASTER-REFERENCE.md` for invariants.** Source of truth for runtime claims is THE CODE — `src/app/**`, `src/lib/supabase.ts`, `package.json`, live Vercel env. If the master reference contradicts the code, the code wins; patch the master reference.
2. **`../MISSION-CONTROL-HISTORY.md` is search-only — DO NOT auto-load it.** ~99KB session journal. Only read it when you need a specific past session number. The master ref + this file already contain everything a session needs to start work. Auto-loading HISTORY just burns context.
3. **Runtime state is read on-demand from the code, not cached.** (Old `LIVE_STATE.md` retired 2026-05-02 — same retired pattern as the Sentinel side. Stale cached state was actively misleading diagnoses. The `verify-state.mjs` generator and `npm run verify-state` script have also been removed.) Grep `src/app/**` for routes, `src/lib/supabase.ts` for the data layer, `package.json` for deps, or check Vercel env directly.
4. **For Sentinel Bot state** (TTS routing, LLM teams, Railway env vars) the authoritative source is the live code at `C:\Users\richi\Sovereign-Sentinel-Bot\src\index.ts` (`AGENT_LLM_TEAMS`, `pipelineLLM`) and Railway env. Never infer Sentinel Bot runtime state from MC prose.
5. **When the Architect shares a URL, FETCH IT.** `yt-dlp` + `ffmpeg` for videos, `WebFetch` for pages. Never cite capability limits without trying every tool first.
