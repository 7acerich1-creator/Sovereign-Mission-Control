# DO IT — Mission Control Dashboard Tiles (3 tiles, build all of them)

**You are mounted in `Sovereign-Mission-Control\repo\`. The Architect typed "do it." That means execute this entire spec without asking clarifying questions. The questions are already answered below.**

---

## Build all three tiles. Order: Tile 1 → Tile 3 → Tile 2.

### Tile 1 — Audience Funnel Snapshot (build FIRST)

**What it is:** Hero band at the top of the dashboard. The bottom-line "are we moving toward $1.2M" view. NOT for ops debugging.

**Headline:** `X visitors / 500 target this week` with a horizontal progress bar.

**Below the headline — 4-row mini-table:**

| Metric | This wk | Last wk | Target | Δ |
|---|---|---|---|---|
| Top-of-funnel attention (YT views combined) | live | snapshot | 10,000/wk | % |
| Landing visitors | live | snapshot | 500/wk | % |
| Email signups (`initiates`) | live | snapshot | 50/wk | % |
| Paid conversions (Stripe) | live | snapshot | 1/wk | % |

**Vercel API route:** `src/app/api/funnel-snapshot/route.ts`

**SQL the route runs against Supabase project `wzthxohtgojenukmdubz`:**
```sql
SELECT
  (SELECT SUM(visitors) FROM landing_analytics WHERE fetched_at > NOW() - INTERVAL '7 days') AS landing_this_wk,
  (SELECT SUM(visitors) FROM landing_analytics WHERE fetched_at > NOW() - INTERVAL '14 days' AND fetched_at <= NOW() - INTERVAL '7 days') AS landing_last_wk,
  (SELECT COUNT(*) FROM initiates WHERE created_at > NOW() - INTERVAL '7 days') AS signups_this_wk,
  (SELECT COUNT(*) FROM initiates WHERE created_at > NOW() - INTERVAL '14 days' AND created_at <= NOW() - INTERVAL '7 days') AS signups_last_wk,
  (SELECT SUM(views) FROM youtube_analytics WHERE fetched_at > NOW() - INTERVAL '7 days') AS yt_this_wk,
  (SELECT SUM(views) FROM youtube_analytics WHERE fetched_at > NOW() - INTERVAL '14 days' AND fetched_at <= NOW() - INTERVAL '7 days') AS yt_last_wk,
  (SELECT COUNT(*) FROM revenue_log WHERE created_at > NOW() - INTERVAL '7 days') AS conversions_this_wk,
  (SELECT COUNT(*) FROM revenue_log WHERE created_at > NOW() - INTERVAL '14 days' AND created_at <= NOW() - INTERVAL '7 days') AS conversions_last_wk;
```

**Component:** `src/components/dashboard/AudienceFunnelSnapshot.tsx`

**Visual:**
- Top-of-page hero band, full-width above all other content
- Dark amber gradient background matching Sovereign Synthesis brand palette
- Progress bar fill `#3EF7E8`, track `#1a1a2e`
- Numeric font: Space Mono
- Progress bar represents `landing_this_wk / 500`. Cap visual at 100% if exceeded.

**Mount:** Edit the home page (`src/app/page.tsx`) and place this component above all existing dashboard content.

---

### Tile 3 — Tasks & Projects Kanban (build SECOND)

**What it is:** A 3-column kanban-lite. The audit's hard truth was that bot infra is healthy but human-side execution is the gap. This tile keeps the human work visible alongside the autonomous goals.

**Data source:** Existing Supabase `tasks` table in project `wzthxohtgojenukmdubz`. Schema:
- `id` uuid, `title` text, `description` text
- `type` 'human' | 'ai'
- `status` 'todo' | 'in-progress' | 'done' (existing data uses capitalized 'To Do' / 'Complete' — handle both)
- `priority` 'low' | 'medium' | 'high'
- `created_at` timestamptz

**Layout — 3 columns:** To Do | In Progress | Done (last 7d)

**Per-task card:** title, priority chip (red/yellow/green), type chip (`human` = blue, `ai` = purple), created_at relative time.

**Quick-add input** at top of the To Do column:
- Single text input + dropdown (priority: low/medium/high)
- On submit POSTs to `/api/tasks` with `{title, priority, type:'human', status:'todo'}` → inserts into Supabase
- Default priority: medium

**Vercel API routes:**
- `GET /api/tasks` — returns all rows ordered by `created_at DESC`
- `POST /api/tasks` — body `{title, priority?, type?}` inserts new row
- `PATCH /api/tasks/[id]` — body `{status?, priority?}` updates row

**Component:** `src/components/dashboard/TasksKanban.tsx`

**Mount:** Side-by-side with Tile 2 below the hero band. If the existing dashboard is single-column, place this below Tile 1 and above Tile 2.

---

### Tile 2 — Aesthetic Performance Grid (build LAST — empty-state today, fills over 10 days)

**What it is:** 3×2 grid (3 aesthetic styles A/B/C × 2 brands SS/TCF) showing performance of the 30-video test that just became autonomous on the Sentinel side (S115d shipped 2026-04-25).

**Layout:**

```
                Sovereign Synthesis    The Containment Field
A · Macro             [cell]                 [cell]
B · Sacred Geo        [cell]                 [cell]
C · Oil Painting      [cell]                 [cell]
```

**Per-cell content:**
- Video count shipped (e.g. "5 videos")
- Avg CTR % — large, gold (`#C9A84C`)
- Avg 30-second retention % — large, cyan (`#3EF7E8`)
- Avg watch time (small, gray)
- Empty cells render `—` (em dash), NEVER `0`

**Winner halo:** When `video_count >= 6` for at least 4 cells, calculate `ctr × retention` per cell, outline the winner with a 2px gold border.

**Vercel API route:** `src/app/api/aesthetic-performance/route.ts`

**SQL:**
```sql
SELECT
  nc.brand,
  nc.aesthetic_style,
  COUNT(*) AS video_count,
  AVG(ya.ctr) AS avg_ctr,
  AVG(ya.retention) AS avg_retention,
  AVG(ya.engagement) AS avg_engagement
FROM niche_cooldown nc
LEFT JOIN youtube_analytics ya ON ya.video_id = nc.youtube_video_id
WHERE nc.aesthetic_style IS NOT NULL
  AND nc.created_at > '2026-04-24'
GROUP BY nc.brand, nc.aesthetic_style;
```

**Known issue:** `youtube_analytics.retention` and `.ctr` columns are currently all 0.0 across 167 rows — the YT Analytics API needs OAuth re-consent with `yt-analytics.readonly` scope. Build the tile anyway. Add a small italic line at tile bottom: `Retention/CTR pending YT analytics scope re-consent.`

**Component:** `src/components/dashboard/AestheticPerformanceGrid.tsx`

**Bottom-of-tile link:** Small text "Why this matters →" linking to the Sentinel repo's NORTH_STAR.md "🎯 First Real Business Goal" section.

---

## Brand & visual constants — DO NOT redesign

Use the existing MC dashboard's design tokens. Don't introduce new fonts, palette colors, or spacing rules.

Brand colors:
- Cyan: `#3EF7E8` · Gold: `#C9A84C` · Violet: `#7C5CFC`
- Dark base: `#050508` · Card bg: `#0a0a0f` · Card border: `#1a1a2e`

Typography: Space Grotesk + Space Mono (numeric data uses Space Mono).

---

## Supabase connection

Reuse the existing client in this repo. Project ID: `wzthxohtgojenukmdubz`. Service role for server-side API routes; anon for client-side reads with RLS. Match the pattern existing routes use.

---

## Acceptance check

1. Hero band renders with visitor count + 4-row metric table
2. Tasks kanban + Aesthetic grid below the hero (side-by-side or stacked)
3. All three tiles load data from Supabase live
4. Empty aesthetic cells show `—` not `0`
5. Quick-add task form inserts into Supabase
6. Vercel preview deploys cleanly

## Push when done

`git push origin main`. Vercel auto-deploys. Don't ask before pushing — the Architect approved this end-to-end.

If anything is unclear about MC's existing component structure, READ existing dashboard components first and match their patterns. Don't ask the Architect — read the code.
