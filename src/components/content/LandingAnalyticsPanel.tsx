"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users,
  FileText,
  Globe,
  Monitor,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

type AnalyticsRow = {
  id: string;
  page_path: string;
  visitors: number;
  page_views: number;
  bounce_rate: number | null;
  avg_duration_seconds: number | null;
  referrer: string | null;
  country: string | null;
  device: string | null;
  period_start: string;
  period_end: string;
  fetched_at: string;
};

export default function LandingAnalyticsPanel() {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('landing_analytics')
      .select('*')
      .gte('period_start', thirtyDaysAgo.toISOString())
      .order('period_start', { ascending: false });

    setRows((data as AnalyticsRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregate stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weekRows = rows.filter(r => new Date(r.period_start) >= sevenDaysAgo);
  const visitorsThisWeek = weekRows.reduce((sum, r) => sum + (r.visitors || 0), 0);
  const pageViewsThisWeek = weekRows.reduce((sum, r) => sum + (r.page_views || 0), 0);

  // Top referrer (most frequent across rows)
  const refCounts: Record<string, number> = {};
  rows.forEach(r => {
    if (r.referrer) {
      refCounts[r.referrer] = (refCounts[r.referrer] || 0) + (r.visitors || 1);
    }
  });
  const topReferrer = Object.entries(refCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // Device split
  const deviceCounts: Record<string, number> = {};
  rows.forEach(r => {
    if (r.device) {
      deviceCounts[r.device] = (deviceCounts[r.device] || 0) + (r.visitors || 1);
    }
  });
  const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // Chart data — aggregate by date for the simple bar chart
  const dailyMap: Record<string, { visitors: number; pageViews: number; referrer: string }> = {};
  rows.forEach(r => {
    const day = new Date(r.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyMap[day]) {
      dailyMap[day] = { visitors: 0, pageViews: 0, referrer: r.referrer || '—' };
    }
    dailyMap[day].visitors += r.visitors || 0;
    dailyMap[day].pageViews += r.page_views || 0;
  });
  const chartDays = Object.entries(dailyMap).reverse().slice(-14); // last 14 days
  const maxVisitors = Math.max(...chartDays.map(([, d]) => d.visitors), 1);

  return (
    <div className="landing-panel">
      <div className="landing-header">
        <h2 className="panel-title">LANDING ANALYTICS</h2>
        <button className="btn-refresh-sm" onClick={fetchData}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="panel-empty">
          <RefreshCw size={20} className="spin-icon" />
          <p>LOADING ANALYTICS...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel-empty">
          <TrendingUp size={28} />
          <p>No analytics data yet. Vercel Analytics is installed — data will appear within 24 hours.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="analytics-cards">
            <div className="a-card">
              <Users size={16} className="a-icon" />
              <div className="a-card-body">
                <span className="a-label">VISITORS THIS WEEK</span>
                <span className="a-value">{visitorsThisWeek.toLocaleString()}</span>
              </div>
            </div>
            <div className="a-card">
              <FileText size={16} className="a-icon" />
              <div className="a-card-body">
                <span className="a-label">PAGE VIEWS THIS WEEK</span>
                <span className="a-value">{pageViewsThisWeek.toLocaleString()}</span>
              </div>
            </div>
            <div className="a-card">
              <Globe size={16} className="a-icon" />
              <div className="a-card-body">
                <span className="a-label">TOP REFERRER</span>
                <span className="a-value a-value-text">{topReferrer}</span>
              </div>
            </div>
            <div className="a-card">
              <Monitor size={16} className="a-icon" />
              <div className="a-card-body">
                <span className="a-label">TOP DEVICE</span>
                <span className="a-value a-value-text">{topDevice}</span>
              </div>
            </div>
          </div>

          {/* Simple bar chart */}
          <div className="chart-container">
            <span className="chart-title">DAILY VISITORS (LAST 14 DAYS)</span>
            <div className="bar-chart">
              {chartDays.map(([day, d]) => (
                <div key={day} className="bar-col">
                  <div className="bar-wrapper">
                    <div
                      className="bar-fill"
                      style={{ height: `${(d.visitors / maxVisitors) * 100}%` }}
                    />
                  </div>
                  <span className="bar-label">{day}</span>
                  <span className="bar-value">{d.visitors}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily table */}
          <div className="daily-table-wrap">
            <table className="daily-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>VISITORS</th>
                  <th>PAGE VIEWS</th>
                  <th>REFERRER</th>
                </tr>
              </thead>
              <tbody>
                {chartDays.reverse().map(([day, d]) => (
                  <tr key={day}>
                    <td>{day}</td>
                    <td>{d.visitors.toLocaleString()}</td>
                    <td>{d.pageViews.toLocaleString()}</td>
                    <td className="ref-cell">{d.referrer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx>{`
        .landing-panel { display: flex; flex-direction: column; gap: 0; }
        .landing-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .panel-title { font-size: 11px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; margin: 0; }
        .btn-refresh-sm { background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px; color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); display: flex; align-items: center; }
        .btn-refresh-sm:hover { border-color: var(--color-text-secondary); color: var(--color-text-secondary); }

        .panel-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: var(--color-text-muted); gap: 12px; }
        .panel-empty p { font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.08em; text-align: center; max-width: 360px; }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .analytics-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .a-card { background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
        .a-icon { color: var(--color-accent-secondary); flex-shrink: 0; margin-top: 2px; }
        .a-card-body { display: flex; flex-direction: column; gap: 4px; }
        .a-label { font-size: 8px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; }
        .a-value { font-size: 22px; font-weight: 700; font-family: var(--font-display); color: var(--color-text-primary); }
        .a-value-text { font-size: 13px; font-family: var(--font-mono); }

        .chart-container { background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 20px; margin-bottom: 20px; }
        .chart-title { font-size: 9px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.12em; display: block; margin-bottom: 16px; }

        .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 120px; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .bar-wrapper { width: 100%; height: 100px; display: flex; align-items: flex-end; }
        .bar-fill { width: 100%; background: linear-gradient(180deg, var(--color-accent-secondary), rgba(124,92,252,0.3)); border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s ease; }
        .bar-label { font-size: 7px; font-family: var(--font-mono); color: var(--color-text-muted); writing-mode: vertical-rl; transform: rotate(180deg); height: 40px; overflow: hidden; }
        .bar-value { font-size: 8px; font-family: var(--font-mono); color: var(--color-text-secondary); }

        .daily-table-wrap { overflow-x: auto; }
        .daily-table { width: 100%; border-collapse: collapse; }
        .daily-table th { font-size: 8px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border-color); }
        .daily-table td { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-secondary); padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .ref-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        @media (max-width: 1200px) { .analytics-cards { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .analytics-cards { grid-template-columns: 1fr; } .bar-label { display: none; } }
      `}</style>
    </div>
  );
}
