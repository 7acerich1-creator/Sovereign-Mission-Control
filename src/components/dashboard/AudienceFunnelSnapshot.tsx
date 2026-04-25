"use client";

/**
 * AudienceFunnelSnapshot
 * ----------------------
 * Hero band — the bottom-line "are we moving toward $1.2M" view.
 * Renders ABOVE all other dashboard content. NOT for ops debugging.
 *
 * Source: GET /api/funnel-snapshot — pulls weekly windows from
 * landing_analytics, youtube_analytics, initiates, revenue_log.
 *
 * Headline: `landing_this_wk / 500 visitors target this week`
 * Below: 4-row mini-table (yt_views, landing, signups, conversions)
 *
 * Brand: dark amber gradient body, cyan progress fill (#3EF7E8),
 * Space Mono numerics. Capped at 100% if exceeded.
 */

import { useEffect, useState, useCallback } from "react";

type MetricRow = {
  key: string;
  label: string;
  this_wk: number;
  last_wk: number;
  target: number;
  delta_pct: number | null;
};

type Snapshot = {
  updated_at: string;
  headline: {
    landing_this_wk: number;
    target: number;
    progress_pct: number;
  };
  metrics: MetricRow[];
};

function fmtNum(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmtDelta(d: number | null): { text: string; tone: "up" | "down" | "neutral" } {
  if (d === null) return { text: "—", tone: "neutral" };
  if (Math.abs(d) < 0.05) return { text: "0%", tone: "neutral" };
  const tone = d > 0 ? "up" : "down";
  const sign = d > 0 ? "+" : "";
  return { text: `${sign}${d.toFixed(0)}%`, tone };
}

export default function AudienceFunnelSnapshot() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/funnel-snapshot", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Snapshot;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const headline = data?.headline;
  const progressPct = Math.min(100, headline?.progress_pct ?? 0);

  return (
    <section className="afs-section">
      <div className="afs-card">
        <div className="afs-headline-row">
          <div className="afs-headline-numbers">
            <span className="afs-headline-value">
              {headline ? fmtNum(headline.landing_this_wk) : "—"}
            </span>
            <span className="afs-headline-target">
              / {headline?.target ?? 500} target this week
            </span>
          </div>
          <div className="afs-tag">AUDIENCE FUNNEL · LIVE</div>
        </div>

        <div className="afs-progress-track">
          <div className="afs-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {error && <div className="afs-error">Load error: {error}</div>}

        <div className="afs-table">
          <div className="afs-table-head">
            <div className="afs-th afs-th-label">Metric</div>
            <div className="afs-th afs-th-num">This wk</div>
            <div className="afs-th afs-th-num">Last wk</div>
            <div className="afs-th afs-th-num">Target</div>
            <div className="afs-th afs-th-num">Δ</div>
          </div>

          {(data?.metrics ?? PLACEHOLDER_METRICS).map((m) => {
            const delta = fmtDelta(m.delta_pct);
            return (
              <div className="afs-row" key={m.key}>
                <div className="afs-td afs-td-label">{m.label}</div>
                <div className="afs-td afs-td-num afs-num-now">
                  {loading && !data ? "…" : fmtNum(m.this_wk)}
                </div>
                <div className="afs-td afs-td-num afs-num-prev">
                  {loading && !data ? "…" : fmtNum(m.last_wk)}
                </div>
                <div className="afs-td afs-td-num afs-num-target">
                  {fmtNum(m.target)}/wk
                </div>
                <div className={`afs-td afs-td-num afs-delta afs-delta-${delta.tone}`}>
                  {delta.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .afs-section {
          margin-bottom: 24px;
        }
        .afs-card {
          position: relative;
          padding: 28px 32px 24px;
          border-radius: 16px;
          border: 1px solid rgba(201, 168, 76, 0.22);
          background:
            radial-gradient(120% 140% at 0% 0%, rgba(201, 128, 76, 0.10), transparent 55%),
            radial-gradient(110% 130% at 100% 0%, rgba(201, 168, 76, 0.06), transparent 60%),
            linear-gradient(135deg, #0e0d0a 0%, #050508 100%);
          box-shadow:
            0 0 0 1px rgba(201, 168, 76, 0.04),
            0 24px 60px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
        }
        :global([data-theme="light"]) .afs-card {
          background:
            radial-gradient(120% 140% at 0% 0%, rgba(201, 168, 76, 0.10), transparent 55%),
            radial-gradient(110% 130% at 100% 0%, rgba(124, 92, 252, 0.04), transparent 60%),
            #FFFFFF;
          border-color: rgba(201, 168, 76, 0.30);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(26, 26, 46, 0.08);
        }
        :global([data-theme="light"]) .afs-card::before {
          background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.45), transparent);
        }
        .afs-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.55), transparent);
          pointer-events: none;
        }
        .afs-headline-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .afs-headline-numbers {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .afs-headline-value {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 56px;
          font-weight: 700;
          line-height: 1;
          color: #3EF7E8;
          text-shadow: 0 0 32px rgba(62, 247, 232, 0.25);
          letter-spacing: -0.01em;
        }
        :global([data-theme="light"]) .afs-headline-value {
          color: #0E9E94;
          text-shadow: none;
        }
        .afs-headline-target {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 14px;
          font-weight: 600;
          color: rgba(232, 228, 240, 0.55);
          letter-spacing: 0.04em;
        }
        :global([data-theme="light"]) .afs-headline-target {
          color: rgba(26, 26, 46, 0.55);
        }
        .afs-tag {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #C9A84C;
          padding: 5px 10px;
          border-radius: 20px;
          background: rgba(201, 168, 76, 0.10);
          border: 1px solid rgba(201, 168, 76, 0.28);
        }
        :global([data-theme="light"]) .afs-tag {
          color: #8A6F1E;
          background: rgba(201, 168, 76, 0.12);
          border-color: rgba(201, 168, 76, 0.35);
        }

        .afs-progress-track {
          height: 6px;
          background: #1a1a2e;
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        :global([data-theme="light"]) .afs-progress-track {
          background: rgba(26, 26, 46, 0.08);
        }
        .afs-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3EF7E8, #7C5CFC);
          border-radius: 3px;
          transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 0 18px rgba(62, 247, 232, 0.35);
        }
        :global([data-theme="light"]) .afs-progress-fill {
          background: linear-gradient(90deg, #0E9E94, #7C5CFC);
          box-shadow: 0 0 12px rgba(14, 158, 148, 0.35);
        }

        .afs-error {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 11px;
          color: #D95555;
        }

        .afs-table {
          display: flex;
          flex-direction: column;
          border-top: 1px solid rgba(124, 92, 252, 0.10);
          padding-top: 14px;
        }
        :global([data-theme="light"]) .afs-table {
          border-top-color: rgba(26, 26, 46, 0.08);
        }
        .afs-table-head, .afs-row {
          display: grid;
          grid-template-columns: 1.6fr 0.8fr 0.8fr 0.9fr 0.6fr;
          gap: 14px;
          padding: 8px 4px;
          align-items: center;
        }
        .afs-table-head {
          padding-top: 0;
          padding-bottom: 8px;
          border-bottom: 1px dashed rgba(124, 92, 252, 0.14);
        }
        :global([data-theme="light"]) .afs-table-head {
          border-bottom-color: rgba(26, 26, 46, 0.10);
        }
        .afs-th {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(232, 228, 240, 0.45);
          font-weight: 700;
        }
        :global([data-theme="light"]) .afs-th {
          color: rgba(26, 26, 46, 0.50);
        }
        .afs-th-num, .afs-td-num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .afs-row {
          border-bottom: 1px solid rgba(124, 92, 252, 0.06);
          transition: background 0.2s ease;
        }
        :global([data-theme="light"]) .afs-row {
          border-bottom-color: rgba(26, 26, 46, 0.05);
        }
        .afs-row:last-child { border-bottom: none; }
        .afs-row:hover {
          background: rgba(124, 92, 252, 0.04);
        }
        :global([data-theme="light"]) .afs-row:hover {
          background: rgba(124, 92, 252, 0.05);
        }
        .afs-td-label {
          font-size: 13px;
          color: var(--color-text-primary, #E8E4F0);
          font-weight: 500;
        }
        .afs-td-num {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 14px;
          font-weight: 600;
        }
        .afs-num-now {
          color: #3EF7E8;
        }
        :global([data-theme="light"]) .afs-num-now {
          color: #0E9E94;
        }
        .afs-num-prev {
          color: rgba(232, 228, 240, 0.45);
          font-weight: 500;
        }
        :global([data-theme="light"]) .afs-num-prev {
          color: rgba(26, 26, 46, 0.50);
        }
        .afs-num-target {
          color: #C9A84C;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        :global([data-theme="light"]) .afs-num-target {
          color: #8A6F1E;
        }
        .afs-delta {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .afs-delta-up { color: #1D9E75; }
        .afs-delta-down { color: #D95555; }
        .afs-delta-neutral { color: rgba(232, 228, 240, 0.4); }
        :global([data-theme="light"]) .afs-delta-neutral { color: rgba(26, 26, 46, 0.40); }

        @media (max-width: 720px) {
          .afs-card { padding: 20px; }
          .afs-headline-value { font-size: 40px; }
          .afs-table-head, .afs-row {
            grid-template-columns: 1.6fr 0.7fr 0.7fr 0.6fr;
            gap: 8px;
          }
          .afs-th-num:nth-child(4),
          .afs-td-num.afs-num-target { display: none; }
        }
      `}</style>
    </section>
  );
}

const PLACEHOLDER_METRICS: MetricRow[] = [
  { key: "yt_views", label: "Top-of-funnel attention (YT views combined)", this_wk: 0, last_wk: 0, target: 10000, delta_pct: null },
  { key: "landing", label: "Landing visitors", this_wk: 0, last_wk: 0, target: 500, delta_pct: null },
  { key: "signups", label: "Email signups (initiates)", this_wk: 0, last_wk: 0, target: 50, delta_pct: null },
  { key: "conversions", label: "Paid conversions (Stripe)", this_wk: 0, last_wk: 0, target: 1, delta_pct: null },
];
