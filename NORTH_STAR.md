# NORTH_STAR.md — The Only File That Matters (MC mirror)

> **⚡ Read this BEFORE `LIVE_STATE.md`, BEFORE the master reference, BEFORE anything.**
> This is the Mission Control mirror of the Sentinel Bot NORTH_STAR. Both repos carry the same truth. If they drift, Sentinel Bot wins.

---

## The One Target
**$1,200,000 net liquid by January 1, 2027.**
Everything else is a means. If a proposed action does not move this number or the input metrics that lead to it, it is a distraction.

## The Input Metrics That Actually Lead to the Target
These are the only numbers that matter. Mission Control's dashboards should surface them first; if they don't, that's the MC bug to fix before anything else.

1. **Top-of-funnel attention per week** (YouTube views, Shorts views, IG reach). Target: 10,000/wk baseline, 100,000/wk for escape velocity.
2. **Landing page visitors per week** (sovereign-landing analytics). Target: 500/wk to test conversion.
3. **Email list signups per week** (Tier 0/T1 opt-ins). Target: 50/wk to feed the nurture sequence.
4. **Paid conversions per week** (Stripe). Target: 1/wk at any tier to prove the funnel works end-to-end.
5. **Revenue per week** (Stripe net). Target: $77/wk → $770/wk → $7,700/wk.

**Current reality (measured 2026-04-10, Session 46 funnel audit):**

| Metric | Target/wk | Current (28d → /wk) | Notes |
|---|---|---|---|
| 1. Top-of-funnel attention | 10,000/wk | ~930/wk combined | Ace Richie YT 925/wk, Containment Field 5/wk, Buffer 322 impressions total |
| 2. Landing visitors | 500/wk | **0 AND UNMEASURABLE** | Vercel shows 0. `@vercel/analytics` package NOT INSTALLED on sovereign-landing. |
| 3. Email signups | 50/wk | 0 | |
| 4. Paid conversions | 1/wk | 0 | Stripe $0.00 7-day |
| 5. Revenue | $77/wk | $0/wk | |

**Bright signal:** Ace Richie YT — 44 subs (+12/28d organic), 14.3% CTR on "OUTDATED CODE", 3.7K views/28d. **This is the entire mission's brightest organic channel.**

**Broken link:** sovereign-landing has no analytics package installed. The measurement layer does not exist. Metric #2 cannot be known until this is fixed.

**X/Twitter CANCELED 2026-04-10.** Distribution strategy must be updated.

**The bottleneck is not MC. It is not the bot. The bottleneck is the severed spine between Ace Richie YT (which has attention) and sovereign-landing (which has no CTA path and no analytics).**

---

## What Mission Control's Job Actually Is
MC exists to make #1-#5 above visible in <5 seconds every morning. If opening MC does not immediately show the 5 input metrics and their week-over-week delta, MC is incomplete. Every other feature is secondary.

Current `/finance` and `/content` pages should be audited against this rule. If they show infra health but not funnel health, they are optimizing for the wrong thing.

---

## The Current Highest-Leverage Action (UPDATE EVERY SESSION)
**Action:** **Ship videos against the new dual-rotation pipeline and watch the Aesthetic Performance tile fill.** Bot-side S113+ is live (commit `74da963`). MC-side measurement surface is now live — the **Aesthetic Performance tile** is mounted above-the-fold on the home dashboard (MC S114, 2026-04-24). Tile reads `niche_cooldown` (aesthetic_style ≥ 2026-04-24) ⨝ `youtube_analytics` via `niche_cooldown.youtube_video_id` (new column added this session). Cells currently all "—" because (a) no S113+ videos have shipped yet and (b) the bot hasn't wired the `youtube_video_id` write-back. Both are tracked in the Bot cross-sync log in `MISSION-CONTROL-MASTER-REFERENCE.md`.

**The canonical 30-video plan lives in `C:\Users\richi\Sovereign-Sentinel-Bot\NORTH_STAR.md`** — see the "First Real Business Goal" section. MC's role for this goal is now complete structurally; remaining MC work is passive (tile lights up as data flows in).

**Last updated:** 2026-04-24 (Session 114 — Aesthetic Performance tile shipped, `niche_cooldown.youtube_video_id` column added, first outcome-based KPI tile on MC)

---

## The Pushback Rule (NON-NEGOTIABLE)
If Ace proposes a build task — any new page, any new widget, any refactor — the first question is:

> **"Does this make one of the 5 input metrics more visible or more actionable in under 7 days?"**

- **If yes:** Execute without friction.
- **If no:** Push back in writing before starting. Offer the funnel-visibility alternative.

This rule exists because 46 sessions of infrastructure + $0 revenue is the signal that "build first, measure later" is a loop. The next session that breaks the loop is the session that started generating.

---

See `C:\Users\richi\Sovereign-Sentinel-Bot\NORTH_STAR.md` for the canonical source. This file mirrors it.
