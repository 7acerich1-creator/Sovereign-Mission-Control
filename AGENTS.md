<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## ⚡ Session Start Protocol (READ FIRST — NON-NEGOTIABLE)
1. **Read `LIVE_STATE.md` at repo root FIRST.** It is auto-generated from `src/app/**`, `src/lib/supabase.ts`, and the package manifest, and is the terminal authority on which pages exist, which deps are live, and which env vars are set.
2. **If `LIVE_STATE.md` is missing or older than 24h**, run `npm run verify-state` to regenerate it before touching anything.
3. **Read `../MISSION-CONTROL-MASTER-REFERENCE.md` for invariants + history.** If its runtime claims contradict `LIVE_STATE.md`, **`LIVE_STATE.md` wins** — flag the contradiction and patch the master ref before proceeding.
4. **For Sentinel Bot state** (TTS routing, LLM teams, Railway env vars) the authoritative source is `C:\Users\richi\Sovereign-Sentinel-Bot\LIVE_STATE.md`. Never infer Sentinel Bot runtime state from MC prose.
5. **When the Architect shares a URL, FETCH IT.** `yt-dlp` + `ffmpeg` for videos, `WebFetch` for pages. Never cite capability limits without trying every tool first.
