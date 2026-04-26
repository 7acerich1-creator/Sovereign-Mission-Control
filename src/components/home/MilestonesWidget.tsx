"use client";

/**
 * MilestonesWidget
 * ----------------
 * Primary "current focus" surface on the Mission Control home dashboard
 * (locked in Sentinel S117, 2026-04-25). Renders the live active
 * milestones for both YouTube channels — only what Ace is working on
 * right now. Future tiers + future sub-milestones are deliberately
 * hidden (per Ace: "those are for the current actual milestones I'm
 * working on. Not the next ones to come.").
 *
 * Data source: `channel_milestones` (Supabase). Writes are owned by
 * the Sentinel-side milestone-sync cron (every 6h). MC reads only,
 * via /api/milestones (60s revalidate). Component re-fetches every 90s
 * so closures swap in silently without a page reload.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Target, ExternalLink } from "lucide-react";

type Channel = "sovereign_synthesis" | "containment_field";

type MilestoneRow = {
  id: string;
  channel: Channel;
  tier: number;
  parent_id: string | null;
  name: string;
  description: string | null;
  target_metric: string;
  target_value: number;
  current_value: number;
  status: "active";
  display_order: number;
};

type ApiPayload = {
  rows: MilestoneRow[];
  updated_at?: string;
  error?: string;
};

const CHANNEL_ORDER: Channel[] = ["sovereign_synthesis", "containment_field"];

const CHANNEL_META: Record<
  Channel,
  { label: string; sub: string; accent: string; soft: string }
> = {
  sovereign_synthesis: {
    label: "SOVEREIGN SYNTHESIS",
    sub: "personal brand · primary revenue",
    accent: "#E5850F",
    soft: "rgba(229, 133, 15, 0.14)",
  },
  containment_field: {
    label: "THE CONTAINMENT FIELD",
    sub: "anonymous · top-of-funnel feeder",
    accent: "#3EF7E8",
    soft: "rgba(62, 247, 232, 0.12)",
  },
};

const METRIC_LABEL: Record<string, string> = {
  subs: "subs",
  subs_and_watch_hours: "subs + watch-hours",
  watch_hours: "watch-hours",
  video_views: "video views",
  cross_traffic_leads: "cross-traffic leads",
};

const POLL_INTERVAL_MS = 90_000;

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1000) return n.toLocaleString();
  // keep small decimals readable; channel_milestones stores numerics
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function clampPct(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, (current / target) * 100));
}

export default function MilestonesWidget() {
  const [rows, setRows] = useState<MilestoneRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/milestones", { cache: "no-store" });
      const json: ApiPayload = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setRows(json.rows ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load milestones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Group by channel, then split parents (parent_id === null) from subs.
  const grouped = useMemo(() => {
    const empty: Record<Channel, { parents: MilestoneRow[]; subs: MilestoneRow[] }> = {
      sovereign_synthesis: { parents: [], subs: [] },
      containment_field: { parents: [], subs: [] },
    };
    if (!rows) return empty;
    for (const r of rows) {
      const bucket = empty[r.channel];
      if (!bucket) continue;
      if (r.parent_id === null) bucket.parents.push(r);
      else bucket.subs.push(r);
    }
    // already ordered by tier + display_order from API
    return empty;
  }, [rows]);

  return (
    <section className="dashboard-section milestones-section">
      <div className="section-header-row">
        <h2 className="section-heading">
          <Target size={14} className="mw-heading-icon" /> CURRENT MILESTONES
          <span className="mw-sub-tag">channel ladder · what we're working on right now</span>
        </h2>
        <span className="mw-source-link" title="Sentinel-side milestone-sync cron writes every 6h">
          channel_milestones <ExternalLink size={11} style={{ marginLeft: 3 }} />
        </span>
      </div>

      {error && (
        <div className="mw-error">
          Load error: {error}. Retrying every 90s.
        </div>
      )}

      <div className="mw-grid">
        {CHANNEL_ORDER.map((channel) => {
          const meta = CHANNEL_META[channel];
          const { parents, subs } = grouped[channel];
          const parent = parents[0] ?? null;

          return (
            <div
              key={channel}
              className="mw-card"
              style={
                {
                  // accent is consumed via custom prop so per-channel theming stays consistent
                  ["--mw-accent" as string]: meta.accent,
                  ["--mw-soft" as string]: meta.soft,
                } as React.CSSProperties
              }
            >
              <div className="mw-card-stripe" />

              <div className="mw-card-header">
                <div className="mw-channel-label">{meta.label}</div>
                <div className="mw-channel-sub">{meta.sub}</div>
              </div>

              {loading && !rows && (
                <>
                  <div className="mw-skeleton mw-skeleton-parent" />
                  <div className="mw-skeleton mw-skeleton-row" />
                  <div className="mw-skeleton mw-skeleton-row" />
                </>
              )}

              {!loading && parent === null && subs.length === 0 && (
                <div className="mw-empty">
                  No active milestones — Sentinel sync may be lagging.
                </div>
              )}

              {parent && (
                <div className="mw-parent">
                  <div className="mw-parent-row">
                    <div className="mw-parent-tier">TIER {parent.tier}</div>
                    <div className="mw-parent-name">{parent.name}</div>
                  </div>
                  <div className="mw-parent-track">
                    <div className="mw-parent-bar">
                      <div
                        className="mw-parent-fill"
                        style={{
                          width: `${clampPct(parent.current_value, parent.target_value)}%`,
                        }}
                      />
                    </div>
                    <div className="mw-parent-numbers">
                      <span className="mw-parent-current">{fmtNum(parent.current_value)}</span>
                      <span className="mw-parent-sep">/</span>
                      <span className="mw-parent-target">{fmtNum(parent.target_value)}</span>
                      <span className="mw-parent-metric">
                        {METRIC_LABEL[parent.target_metric] || parent.target_metric}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {subs.length > 0 && (
                <div className="mw-subs">
                  {subs.map((row) => {
                    const pct = clampPct(row.current_value, row.target_value);
                    return (
                      <div key={row.id} className="mw-sub-row">
                        <div className="mw-sub-head">
                          <span className="mw-sub-name">{row.name}</span>
                          <span className="mw-sub-numbers">
                            <span className="mw-sub-current">{fmtNum(row.current_value)}</span>
                            <span className="mw-sub-sep">/</span>
                            <span className="mw-sub-target">{fmtNum(row.target_value)}</span>
                          </span>
                        </div>
                        <div className="mw-sub-bar">
                          <div className="mw-sub-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mw-sub-foot">
                          <span className="mw-sub-metric">
                            {METRIC_LABEL[row.target_metric] || row.target_metric}
                          </span>
                          <span className="mw-sub-pct">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .milestones-section {
          margin-top: 6px;
        }
        .mw-heading-icon {
          margin-right: 6px;
          vertical-align: -2px;
          color: var(--accent, #e5850f);
        }
        .mw-sub-tag {
          margin-left: 10px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
        }
        .mw-source-link {
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
        }
        .mw-error {
          font-size: 11px;
          color: #ef4444;
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          padding: 6px 10px;
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 4px;
          background: rgba(239, 68, 68, 0.08);
        }
        .mw-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .mw-card {
          position: relative;
          padding: 16px 18px 14px;
          border: 1px solid var(--border, #2a2a2a);
          border-radius: 6px;
          background: var(--surface, #121212);
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow: hidden;
        }
        .mw-card-stripe {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(
            90deg,
            var(--mw-accent) 0%,
            color-mix(in srgb, var(--mw-accent) 35%, transparent) 100%
          );
        }
        .mw-card-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-top: 4px;
        }
        .mw-channel-label {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--mw-accent);
        }
        .mw-channel-sub {
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
        }
        .mw-empty {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          padding: 12px 0;
        }
        .mw-parent {
          padding: 10px 12px;
          border-radius: 4px;
          background: var(--mw-soft);
          border: 1px solid color-mix(in srgb, var(--mw-accent) 30%, transparent);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mw-parent-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .mw-parent-tier {
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: var(--mw-accent);
          padding: 2px 6px;
          border: 1px solid color-mix(in srgb, var(--mw-accent) 50%, transparent);
          border-radius: 3px;
          flex-shrink: 0;
        }
        .mw-parent-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--text-primary, #f5f5f5);
          text-transform: uppercase;
        }
        .mw-parent-track {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mw-parent-bar {
          height: 5px;
          width: 100%;
          background: color-mix(in srgb, var(--mw-accent) 14%, transparent);
          border-radius: 3px;
          overflow: hidden;
        }
        .mw-parent-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--mw-accent),
            color-mix(in srgb, var(--mw-accent) 70%, white)
          );
          transition: width 0.6s ease;
        }
        .mw-parent-numbers {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          font-size: 11px;
        }
        .mw-parent-current {
          font-size: 14px;
          font-weight: 700;
          color: var(--mw-accent);
        }
        .mw-parent-sep,
        .mw-parent-target {
          color: var(--text-secondary, #6b7280);
        }
        .mw-parent-metric {
          margin-left: 8px;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-secondary, #6b7280);
        }
        .mw-subs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mw-sub-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 10px;
          border: 1px solid var(--border, #2a2a2a);
          border-radius: 4px;
          background: color-mix(in srgb, var(--surface, #121212) 80%, transparent);
        }
        .mw-sub-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }
        .mw-sub-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary, #f5f5f5);
          letter-spacing: 0.02em;
        }
        .mw-sub-numbers {
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          font-size: 11px;
          display: inline-flex;
          align-items: baseline;
          gap: 3px;
        }
        .mw-sub-current {
          font-weight: 700;
          color: var(--mw-accent);
        }
        .mw-sub-sep,
        .mw-sub-target {
          color: var(--text-secondary, #6b7280);
        }
        .mw-sub-bar {
          height: 4px;
          width: 100%;
          background: color-mix(in srgb, var(--border, #2a2a2a) 80%, transparent);
          border-radius: 2px;
          overflow: hidden;
        }
        .mw-sub-fill {
          height: 100%;
          background: var(--mw-accent);
          transition: width 0.6s ease;
        }
        .mw-sub-foot {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: var(--font-mono, "Space Mono"), ui-monospace, monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-secondary, #6b7280);
        }
        .mw-sub-pct {
          color: var(--mw-accent);
          font-weight: 700;
        }

        .mw-skeleton {
          background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--border, #2a2a2a) 60%, transparent) 0%,
            color-mix(in srgb, var(--border, #2a2a2a) 30%, transparent) 50%,
            color-mix(in srgb, var(--border, #2a2a2a) 60%, transparent) 100%
          );
          background-size: 200% 100%;
          border-radius: 4px;
          animation: mw-shimmer 1.6s ease-in-out infinite;
        }
        .mw-skeleton-parent {
          height: 56px;
        }
        .mw-skeleton-row {
          height: 44px;
        }
        @keyframes mw-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 900px) {
          .mw-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
