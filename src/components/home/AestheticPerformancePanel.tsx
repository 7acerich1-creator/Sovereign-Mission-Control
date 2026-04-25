"use client";

/**
 * AestheticPerformancePanel
 * -------------------------
 * First OUTCOME tile on Mission Control. Surfaces the 3×2 grid for the
 * 30-Video A/B/C Performance Test (locked in Sentinel Bot NORTH_STAR S113+,
 * 2026-04-24).
 *
 * Rows = brands (Sovereign Synthesis, The Containment Field).
 * Cols = aesthetic styles (A = macro mechanics + chiaroscuro,
 *                          B = sacred geometry + kinetic abstract,
 *                          C = oil-painted cinematic).
 *
 * Per cell:
 *   - Video count shipped (niche_cooldown rows with aesthetic_style set)
 *   - Avg YouTube CTR (from youtube_analytics.ctr)
 *   - Avg 30s retention % (from youtube_analytics.retention)
 *   - Avg views (from youtube_analytics.views — stand-in until watch_time_s lands)
 *
 * Join bridge:
 *   niche_cooldown.youtube_video_id  →  youtube_analytics.video_id
 * The column `niche_cooldown.youtube_video_id` was added 2026-04-24 (MC S114).
 * Until the Sentinel Bot writes it on publish, the count column still
 * populates (from niche_cooldown alone) but the CTR/retention/views columns
 * show "—" because the join returns nothing.
 *
 * Winner halo: activates on the cell with the highest (avg_ctr × avg_retention)
 * product once every cell in the grid has ≥6 videos.
 *
 * Empty cells render "—" per NORTH_STAR acceptance criteria (zero implies
 * bad performance; dash implies no data).
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles, ExternalLink } from "lucide-react";

type Aesthetic = "A" | "B" | "C";
type BrandKey = "sovereign_synthesis" | "containment_field";

type CellStats = {
  count: number;
  avgCtr: number | null;
  avgRetention: number | null;
  avgViews: number | null;
  joinedCount: number; // how many of the `count` had matching yt_analytics rows
};

type Grid = Record<BrandKey, Record<Aesthetic, CellStats>>;

const EMPTY_CELL: CellStats = {
  count: 0,
  avgCtr: null,
  avgRetention: null,
  avgViews: null,
  joinedCount: 0,
};

const BRAND_ORDER: BrandKey[] = ["sovereign_synthesis", "containment_field"];
const AESTHETIC_ORDER: Aesthetic[] = ["A", "B", "C"];

const BRAND_LABELS: Record<BrandKey, string> = {
  sovereign_synthesis: "SOVEREIGN SYNTHESIS",
  containment_field: "THE CONTAINMENT FIELD",
};

const AESTHETIC_LABELS: Record<Aesthetic, { code: string; title: string; blurb: string }> = {
  A: {
    code: "A",
    title: "MACRO MECHANICS",
    blurb: "85mm chiaroscuro · single light · void-black",
  },
  B: {
    code: "B",
    title: "SACRED GEOMETRY",
    blurb: "kinetic abstract · mandala · fractal",
  },
  C: {
    code: "C",
    title: "OIL-PAINTED CINEMATIC",
    blurb: "Rembrandt / Bacon · brushstroke · gallery",
  },
};

// S113+ ship date — only rows from this date forward count toward the 30-video test.
const S113_CUTOFF = "2026-04-24";

// Link back to the plan (Sentinel Bot NORTH_STAR on GitHub).
const PLAN_URL =
  "https://github.com/AceRichie/Sovereign-Sentinel-Bot/blob/main/NORTH_STAR.md#-first-real-business-goal--the-30-video-abc-performance-test-locked-s113-2026-04-24";

const MIN_CELL_COUNT_FOR_WINNER = 6;

type NicheRow = {
  brand: string | null;
  aesthetic_style: string | null;
  youtube_video_id: string | null;
};

type YtRow = {
  video_id: string;
  ctr: number | string | null;
  retention: number | string | null;
  views: number | null;
};

function emptyGrid(): Grid {
  const grid: Grid = {
    sovereign_synthesis: {
      A: { ...EMPTY_CELL },
      B: { ...EMPTY_CELL },
      C: { ...EMPTY_CELL },
    },
    containment_field: {
      A: { ...EMPTY_CELL },
      B: { ...EMPTY_CELL },
      C: { ...EMPTY_CELL },
    },
  };
  return grid;
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function fmtPct(v: number | null, digits = 1): string {
  if (v === null) return "—";
  // If values look like fractions (0–1), scale. If already in %, keep.
  const scaled = Math.abs(v) <= 1.5 ? v * 100 : v;
  if (scaled === 0) return "—";
  return `${scaled.toFixed(digits)}%`;
}

function fmtNum(v: number | null): string {
  if (v === null || v === 0) return "—";
  return Math.round(v).toLocaleString();
}

export default function AestheticPerformancePanel() {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalShipped, setTotalShipped] = useState(0);
  const [winnerKey, setWinnerKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Pull all niche_cooldown rows eligible for the 30-video test.
      const { data: ncRows, error: ncErr } = await supabase
        .from("niche_cooldown")
        .select("brand,aesthetic_style,youtube_video_id")
        .not("aesthetic_style", "is", null)
        .gte("created_at", S113_CUTOFF);

      if (ncErr) throw ncErr;

      const rows = (ncRows ?? []) as NicheRow[];

      // 2. Pull youtube_analytics for any video_ids present in the niche rows.
      const videoIds = Array.from(
        new Set(rows.map((r) => r.youtube_video_id).filter((v): v is string => !!v))
      );

      let ytMap = new Map<string, YtRow>();
      if (videoIds.length > 0) {
        const { data: ytRows, error: ytErr } = await supabase
          .from("youtube_analytics")
          .select("video_id,ctr,retention,views")
          .in("video_id", videoIds);
        if (ytErr) throw ytErr;
        for (const r of (ytRows ?? []) as YtRow[]) {
          ytMap.set(r.video_id, r);
        }
      }

      // 3. Aggregate into the 3×2 grid.
      const next = emptyGrid();
      const sums: Record<
        string,
        { ctr: number; ctrN: number; ret: number; retN: number; views: number; viewsN: number }
      > = {};

      let total = 0;
      for (const row of rows) {
        const brand = (row.brand ?? "").trim();
        const style = (row.aesthetic_style ?? "").trim().toUpperCase();
        if (!BRAND_ORDER.includes(brand as BrandKey)) continue;
        if (!AESTHETIC_ORDER.includes(style as Aesthetic)) continue;

        const b = brand as BrandKey;
        const s = style as Aesthetic;
        next[b][s].count += 1;
        total += 1;

        const key = `${b}|${s}`;
        sums[key] = sums[key] ?? {
          ctr: 0,
          ctrN: 0,
          ret: 0,
          retN: 0,
          views: 0,
          viewsN: 0,
        };

        if (row.youtube_video_id && ytMap.has(row.youtube_video_id)) {
          next[b][s].joinedCount += 1;
          const yt = ytMap.get(row.youtube_video_id)!;
          const ctr = toNumber(yt.ctr);
          const ret = toNumber(yt.retention);
          const views = toNumber(yt.views);
          if (ctr !== null && ctr > 0) {
            sums[key].ctr += ctr;
            sums[key].ctrN += 1;
          }
          if (ret !== null && ret > 0) {
            sums[key].ret += ret;
            sums[key].retN += 1;
          }
          if (views !== null && views > 0) {
            sums[key].views += views;
            sums[key].viewsN += 1;
          }
        }
      }

      // Finalize averages.
      for (const b of BRAND_ORDER) {
        for (const s of AESTHETIC_ORDER) {
          const key = `${b}|${s}`;
          const agg = sums[key];
          if (!agg) continue;
          next[b][s].avgCtr = agg.ctrN > 0 ? agg.ctr / agg.ctrN : null;
          next[b][s].avgRetention = agg.retN > 0 ? agg.ret / agg.retN : null;
          next[b][s].avgViews = agg.viewsN > 0 ? agg.views / agg.viewsN : null;
        }
      }

      // Winner eligibility: every cell must have ≥MIN_CELL_COUNT_FOR_WINNER videos.
      let winner: string | null = null;
      const allEligible = BRAND_ORDER.every((b) =>
        AESTHETIC_ORDER.every((s) => next[b][s].count >= MIN_CELL_COUNT_FOR_WINNER)
      );
      if (allEligible) {
        let best = -Infinity;
        for (const b of BRAND_ORDER) {
          for (const s of AESTHETIC_ORDER) {
            const cell = next[b][s];
            if (cell.avgCtr === null || cell.avgRetention === null) continue;
            const score = cell.avgCtr * cell.avgRetention;
            if (score > best) {
              best = score;
              winner = `${b}|${s}`;
            }
          }
        }
      }

      setGrid(next);
      setTotalShipped(total);
      setWinnerKey(winner);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load aesthetic performance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const progressPct = Math.min(100, Math.round((totalShipped / 30) * 100));

  return (
    <section className="dashboard-section aesthetic-perf-section">
      <div className="section-header-row">
        <h2 className="section-heading">
          AESTHETIC PERFORMANCE
          <span className="apf-sub-tag">30-video A/B/C test · first outcome tile</span>
        </h2>
        <a
          href={PLAN_URL}
          target="_blank"
          rel="noreferrer"
          className="section-link"
          title="Read the 30-video A/B/C plan in Sentinel Bot NORTH_STAR"
        >
          READ THE PLAN <ExternalLink size={12} style={{ marginLeft: 4 }} />
        </a>
      </div>

      <div className="card apf-card">
        <div className="apf-progress-row">
          <div className="apf-progress-label">
            <span>{totalShipped}</span>
            <span className="apf-progress-target">/ 30 videos shipped</span>
          </div>
          <div className="apf-progress-bar">
            <div className="apf-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          {winnerKey && (
            <div className="apf-winner-banner">
              <Sparkles size={12} /> WINNER LOCKED: {winnerKey.replace("|", " · ")}
            </div>
          )}
        </div>

        {error && <div className="apf-error">Load error: {error}</div>}
        {loading && <div className="apf-loading">Loading aesthetic data…</div>}

        <div className="apf-grid">
          <div className="apf-grid-header">
            <div className="apf-corner-cell" />
            {AESTHETIC_ORDER.map((s) => (
              <div key={s} className="apf-col-header">
                <div className="apf-col-code">STYLE {AESTHETIC_LABELS[s].code}</div>
                <div className="apf-col-title">{AESTHETIC_LABELS[s].title}</div>
                <div className="apf-col-blurb">{AESTHETIC_LABELS[s].blurb}</div>
              </div>
            ))}
          </div>

          {BRAND_ORDER.map((b) => (
            <div key={b} className="apf-row">
              <div className="apf-row-header">
                <div className="apf-brand-label">{BRAND_LABELS[b]}</div>
                <div className="apf-brand-sub">{b}</div>
              </div>
              {AESTHETIC_ORDER.map((s) => {
                const cell = grid[b][s];
                const isWinner = winnerKey === `${b}|${s}`;
                const hasData = cell.count > 0;
                return (
                  <div
                    key={s}
                    className={`apf-cell ${isWinner ? "apf-cell-winner" : ""} ${
                      hasData ? "apf-cell-filled" : "apf-cell-empty"
                    }`}
                  >
                    <div className="apf-cell-count">
                      <span className="apf-count-value">{hasData ? cell.count : "—"}</span>
                      <span className="apf-count-label">videos</span>
                    </div>
                    <div className="apf-metric-row">
                      <span className="apf-metric-label">CTR</span>
                      <span className="apf-metric-value">{fmtPct(cell.avgCtr)}</span>
                    </div>
                    <div className="apf-metric-row">
                      <span className="apf-metric-label">30s RET</span>
                      <span className="apf-metric-value">{fmtPct(cell.avgRetention)}</span>
                    </div>
                    <div className="apf-metric-row">
                      <span className="apf-metric-label">VIEWS</span>
                      <span className="apf-metric-value">{fmtNum(cell.avgViews)}</span>
                    </div>
                    {hasData && cell.joinedCount < cell.count && (
                      <div
                        className="apf-cell-warning"
                        title="Some videos are missing the YouTube videoId join — CTR/retention averages only reflect the joined subset. Bot must write niche_cooldown.youtube_video_id on publish."
                      >
                        {cell.joinedCount}/{cell.count} joined
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="apf-footer">
          <span className="apf-footer-dot apf-footer-dot-live" />
          Reads <code>niche_cooldown</code> (aesthetic_style ≥ 2026-04-24) ⨝{" "}
          <code>youtube_analytics</code> via <code>youtube_video_id</code>. Cells stay dashed until
          the Sentinel Bot writes the YouTube videoId back after publish.
        </div>
        <div className="apf-scope-note">
          <em>Retention/CTR pending YT analytics scope re-consent.</em>
          <a
            href={PLAN_URL}
            target="_blank"
            rel="noreferrer"
            className="apf-why-link"
            title="Read the 30-video A/B/C plan in Sentinel Bot NORTH_STAR"
          >
            Why this matters →
          </a>
        </div>
      </div>

      <style jsx>{`
        .aesthetic-perf-section {
          margin-top: 18px;
        }
        .apf-sub-tag {
          margin-left: 10px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
        }
        .apf-card {
          padding: 16px 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .apf-progress-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .apf-progress-label {
          font-family: "Space Mono", ui-monospace, monospace;
          font-size: 12px;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .apf-progress-label > span:first-child {
          font-size: 22px;
          font-weight: 700;
          color: var(--accent, #e5850f);
          letter-spacing: 0.02em;
        }
        .apf-progress-target {
          color: var(--text-secondary, #6b7280);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .apf-progress-bar {
          flex: 1;
          min-width: 140px;
          height: 4px;
          background: color-mix(in srgb, var(--border, #2a2a2a) 70%, transparent);
          border-radius: 2px;
          overflow: hidden;
        }
        .apf-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent, #e5850f), #f2c06a);
          transition: width 0.6s ease;
        }
        .apf-winner-banner {
          font-family: "Space Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: var(--accent, #e5850f);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border: 1px solid color-mix(in srgb, var(--accent, #e5850f) 45%, transparent);
          border-radius: 3px;
          background: color-mix(in srgb, var(--accent, #e5850f) 8%, transparent);
        }
        .apf-loading,
        .apf-error {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          font-family: "Space Mono", ui-monospace, monospace;
        }
        .apf-error {
          color: #ef4444;
        }
        .apf-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 2px;
        }
        .apf-grid-header,
        .apf-row {
          display: grid;
          grid-template-columns: minmax(180px, 1.1fr) repeat(3, minmax(140px, 1fr));
          gap: 10px;
          align-items: stretch;
        }
        .apf-corner-cell {
          /* empty */
        }
        .apf-col-header {
          padding: 10px 12px;
          border: 1px solid var(--border, #2a2a2a);
          border-radius: 4px;
          background: color-mix(in srgb, var(--surface, #121212) 70%, transparent);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .apf-col-code {
          font-family: "Space Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          color: var(--accent, #e5850f);
          font-weight: 700;
        }
        .apf-col-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--text-primary, #f5f5f5);
          text-transform: uppercase;
        }
        .apf-col-blurb {
          font-size: 10px;
          color: var(--text-secondary, #6b7280);
          line-height: 1.3;
        }
        .apf-row-header {
          padding: 12px;
          border: 1px solid var(--border, #2a2a2a);
          border-radius: 4px;
          background: color-mix(in srgb, var(--surface, #121212) 70%, transparent);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
        }
        .apf-brand-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-primary, #f5f5f5);
          text-transform: uppercase;
        }
        .apf-brand-sub {
          font-family: "Space Mono", ui-monospace, monospace;
          font-size: 10px;
          color: var(--text-secondary, #6b7280);
        }
        .apf-cell {
          padding: 12px;
          border: 1px solid var(--border, #2a2a2a);
          border-radius: 4px;
          background: var(--surface, #121212);
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .apf-cell-filled {
          border-color: color-mix(in srgb, var(--accent, #e5850f) 30%, var(--border, #2a2a2a));
        }
        .apf-cell-empty {
          opacity: 0.65;
        }
        .apf-cell-winner {
          border-color: var(--accent, #e5850f);
          box-shadow: 0 0 0 1px var(--accent, #e5850f),
            0 0 24px color-mix(in srgb, var(--accent, #e5850f) 45%, transparent);
        }
        .apf-cell-count {
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding-bottom: 6px;
          border-bottom: 1px dashed color-mix(in srgb, var(--border, #2a2a2a) 70%, transparent);
        }
        .apf-count-value {
          font-family: "Space Mono", ui-monospace, monospace;
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary, #f5f5f5);
        }
        .apf-count-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-secondary, #6b7280);
        }
        .apf-metric-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11px;
        }
        .apf-metric-label {
          font-family: "Space Mono", ui-monospace, monospace;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-secondary, #6b7280);
        }
        .apf-metric-value {
          font-family: "Space Mono", ui-monospace, monospace;
          font-weight: 600;
          color: var(--text-primary, #f5f5f5);
        }
        .apf-cell-warning {
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #f59e0b;
          padding-top: 2px;
        }
        .apf-footer {
          font-size: 10px;
          line-height: 1.5;
          color: var(--text-secondary, #6b7280);
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-family: "Space Mono", ui-monospace, monospace;
          padding-top: 8px;
          border-top: 1px solid color-mix(in srgb, var(--border, #2a2a2a) 70%, transparent);
        }
        .apf-footer code {
          background: color-mix(in srgb, var(--accent, #e5850f) 10%, transparent);
          padding: 1px 4px;
          border-radius: 2px;
          color: var(--accent, #e5850f);
        }
        .apf-footer-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .apf-footer-dot-live {
          background: var(--accent, #e5850f);
          box-shadow: 0 0 6px var(--accent, #e5850f);
        }
        .apf-scope-note {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
          font-size: 10px;
          color: var(--text-secondary, #6b7280);
          font-family: "Space Mono", ui-monospace, monospace;
        }
        .apf-scope-note em {
          font-style: italic;
        }
        .apf-why-link {
          color: #C9A84C;
          text-decoration: none;
          letter-spacing: 0.06em;
          font-weight: 700;
        }
        .apf-why-link:hover {
          color: #E8C56A;
        }
        :global([data-theme="light"]) .apf-why-link {
          color: #8A6F1E;
        }
        :global([data-theme="light"]) .apf-why-link:hover {
          color: #B8901E;
        }
        :global([data-theme="light"]) .apf-scope-note {
          color: rgba(26, 26, 46, 0.55);
        }

        @media (max-width: 1100px) {
          .apf-grid-header,
          .apf-row {
            grid-template-columns: minmax(140px, 1fr) repeat(3, minmax(120px, 1fr));
            gap: 6px;
          }
        }
        @media (max-width: 720px) {
          .apf-grid-header,
          .apf-row {
            grid-template-columns: 1fr;
          }
          .apf-row-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
      `}</style>
    </section>
  );
}
