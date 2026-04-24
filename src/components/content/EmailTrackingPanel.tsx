"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Send,
  CheckCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  RefreshCw,
  Mail,
  ExternalLink,
} from 'lucide-react';

type EmailEvent = {
  id: string;
  event_type: string;
  email_id: string | null;
  from_addr: string | null;
  to_addr: string | null;
  subject: string | null;
  link_url: string | null;
  created_at: string;
};

type EventCounts = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
};

const EVENT_LABELS: Record<string, { label: string; color: string; icon: typeof Send }> = {
  'email.sent':       { label: 'SENT',      color: '#7c5cfc', icon: Send },
  'email.delivered':  { label: 'DELIVERED',  color: '#2ecc8b', icon: CheckCircle },
  delivered:          { label: 'DELIVERED',  color: '#2ecc8b', icon: CheckCircle },
  'email.opened':     { label: 'OPENED',    color: '#00d4ff', icon: Eye },
  opened:             { label: 'OPENED',    color: '#00d4ff', icon: Eye },
  'email.clicked':    { label: 'CLICKED',   color: '#D4A017', icon: MousePointerClick },
  clicked:            { label: 'CLICKED',   color: '#D4A017', icon: MousePointerClick },
  'email.bounced':    { label: 'BOUNCED',   color: '#e74c3c', icon: AlertTriangle },
  bounced:            { label: 'BOUNCED',   color: '#e74c3c', icon: AlertTriangle },
  'email.complained': { label: 'COMPLAINT', color: '#e74c3c', icon: AlertTriangle },
  complained:         { label: 'COMPLAINT', color: '#e74c3c', icon: AlertTriangle },
};

function normalizeEventType(raw: string): string {
  return raw.replace('email.', '');
}

export default function EmailTrackingPanel() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('email_events')
      .select('id, event_type, email_id, from_addr, to_addr, subject, link_url, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    setEvents((data as EmailEvent[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregate counts
  const counts: EventCounts = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
  events.forEach(e => {
    const normalized = normalizeEventType(e.event_type);
    if (normalized in counts) {
      counts[normalized as keyof EventCounts]++;
    }
  });

  const totalSentish = counts.sent || counts.delivered || 1; // denominator for rates
  const deliveryRate = counts.delivered ? ((counts.delivered / totalSentish) * 100).toFixed(1) : '—';
  const openRate = counts.opened ? ((counts.opened / totalSentish) * 100).toFixed(1) : '—';
  const clickRate = counts.clicked ? ((counts.clicked / totalSentish) * 100).toFixed(1) : '—';

  // Subject-level aggregation
  const subjectMap: Record<string, Record<string, number>> = {};
  events.forEach(e => {
    const subj = e.subject || '(no subject)';
    if (!subjectMap[subj]) subjectMap[subj] = {};
    const norm = normalizeEventType(e.event_type);
    subjectMap[subj][norm] = (subjectMap[subj][norm] || 0) + 1;
  });
  const subjectRows = Object.entries(subjectMap).map(([subject, evts]) => ({
    subject,
    sent: evts.sent || 0,
    delivered: evts.delivered || 0,
    opened: evts.opened || 0,
    clicked: evts.clicked || 0,
    bounced: evts.bounced || 0,
  }));

  // Daily chart data
  const dailyMap: Record<string, EventCounts> = {};
  events.forEach(e => {
    const day = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyMap[day]) dailyMap[day] = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
    const norm = normalizeEventType(e.event_type);
    if (norm in dailyMap[day]) {
      dailyMap[day][norm as keyof EventCounts]++;
    }
  });
  const chartDays = Object.entries(dailyMap).reverse().slice(-14);
  const maxDaily = Math.max(...chartDays.map(([, d]) => d.delivered + d.sent), 1);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getEventMeta = (type: string) => EVENT_LABELS[type] || EVENT_LABELS[normalizeEventType(type)] || { label: type.toUpperCase(), color: '#888', icon: Mail };

  return (
    <div className="email-panel">
      <div className="email-header">
        <h2 className="panel-title">EMAIL TRACKING</h2>
        <button className="btn-refresh-sm" onClick={fetchData}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="panel-empty">
          <RefreshCw size={20} className="spin-icon" />
          <p>LOADING EMAIL EVENTS...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="panel-empty">
          <Mail size={28} />
          <p>No email events yet. Events will appear once Resend webhooks fire delivery/open/click signals.</p>
        </div>
      ) : (
        <>
          {/* STAT CARDS */}
          <div className="email-cards">
            <div className="e-card">
              <Send size={16} className="e-icon" style={{ color: '#7c5cfc' }} />
              <div className="e-card-body">
                <span className="e-label">DELIVERED</span>
                <span className="e-value">{counts.delivered}</span>
                <span className="e-rate">{deliveryRate}% rate</span>
              </div>
            </div>
            <div className="e-card">
              <Eye size={16} className="e-icon" style={{ color: '#00d4ff' }} />
              <div className="e-card-body">
                <span className="e-label">OPENED</span>
                <span className="e-value">{counts.opened}</span>
                <span className="e-rate">{openRate}% rate</span>
              </div>
            </div>
            <div className="e-card">
              <MousePointerClick size={16} className="e-icon" style={{ color: '#D4A017' }} />
              <div className="e-card-body">
                <span className="e-label">CLICKED</span>
                <span className="e-value">{counts.clicked}</span>
                <span className="e-rate">{clickRate}% rate</span>
              </div>
            </div>
            <div className="e-card">
              <AlertTriangle size={16} className="e-icon" style={{ color: '#e74c3c' }} />
              <div className="e-card-body">
                <span className="e-label">BOUNCED</span>
                <span className="e-value">{counts.bounced}</span>
                <span className="e-rate">{counts.complained > 0 ? `${counts.complained} complaints` : '—'}</span>
              </div>
            </div>
          </div>

          {/* DAILY BAR CHART */}
          {chartDays.length > 0 && (
            <div className="chart-container">
              <span className="chart-title">DAILY EMAIL VOLUME (LAST 14 DAYS)</span>
              <div className="bar-chart">
                {chartDays.map(([day, d]) => (
                  <div key={day} className="bar-col">
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{ height: `${((d.delivered + d.sent) / maxDaily) * 100}%` }}
                      />
                      {d.opened > 0 && (
                        <div
                          className="bar-fill-overlay"
                          style={{ height: `${(d.opened / maxDaily) * 100}%` }}
                        />
                      )}
                    </div>
                    <span className="bar-label">{day}</span>
                    <span className="bar-value">{d.delivered + d.sent}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--color-accent-secondary)' }} /> Delivered</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#00d4ff' }} /> Opened</span>
              </div>
            </div>
          )}

          {/* SUBJECT BREAKDOWN TABLE */}
          {subjectRows.length > 0 && (
            <div className="subject-table-wrap">
              <span className="table-title">BY SUBJECT LINE</span>
              <table className="subject-table">
                <thead>
                  <tr>
                    <th>SUBJECT</th>
                    <th>DELIVERED</th>
                    <th>OPENED</th>
                    <th>CLICKED</th>
                    <th>BOUNCED</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectRows.map((row, i) => (
                    <tr key={i}>
                      <td className="subj-cell">{row.subject}</td>
                      <td>{row.delivered}</td>
                      <td>{row.opened}</td>
                      <td>{row.clicked}</td>
                      <td className={row.bounced > 0 ? 'warn-cell' : ''}>{row.bounced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* RECENT EVENT FEED */}
          <div className="feed-wrap">
            <span className="table-title">RECENT EVENTS</span>
            <div className="event-feed">
              {events.slice(0, 30).map(e => {
                const meta = getEventMeta(e.event_type);
                const Icon = meta.icon;
                return (
                  <div key={e.id} className="feed-row">
                    <div className="feed-icon" style={{ color: meta.color }}>
                      <Icon size={14} />
                    </div>
                    <span className="feed-badge" style={{ background: `${meta.color}20`, color: meta.color, borderColor: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="feed-to">{e.to_addr || '—'}</span>
                    <span className="feed-subject">{e.subject || '—'}</span>
                    {e.link_url && (
                      <a href={e.link_url} target="_blank" rel="noopener noreferrer" className="feed-link">
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <span className="feed-time">{timeAgo(e.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .email-panel { display: flex; flex-direction: column; gap: 0; }
        .email-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .panel-title { font-size: 11px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; margin: 0; }
        .btn-refresh-sm { background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px; color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); display: flex; align-items: center; }
        .btn-refresh-sm:hover { border-color: var(--color-text-secondary); color: var(--color-text-secondary); }

        .panel-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: var(--color-text-muted); gap: 12px; }
        .panel-empty p { font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.08em; text-align: center; max-width: 400px; }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* STAT CARDS */
        .email-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .e-card { background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
        .e-icon { flex-shrink: 0; margin-top: 2px; }
        .e-card-body { display: flex; flex-direction: column; gap: 2px; }
        .e-label { font-size: 8px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; }
        .e-value { font-size: 22px; font-weight: 700; font-family: var(--font-display); color: var(--color-text-primary); }
        .e-rate { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); }

        /* CHART */
        .chart-container { background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 20px; margin-bottom: 20px; }
        .chart-title { font-size: 9px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.12em; display: block; margin-bottom: 16px; }
        .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 120px; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .bar-wrapper { width: 100%; height: 100px; display: flex; align-items: flex-end; position: relative; }
        .bar-fill { width: 100%; background: linear-gradient(180deg, var(--color-accent-secondary), rgba(124,92,252,0.3)); border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s ease; }
        .bar-fill-overlay { position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(180deg, #00d4ff, rgba(0,212,255,0.3)); border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s ease; opacity: 0.5; }
        .bar-label { font-size: 7px; font-family: var(--font-mono); color: var(--color-text-muted); writing-mode: vertical-rl; transform: rotate(180deg); height: 40px; overflow: hidden; }
        .bar-value { font-size: 8px; font-family: var(--font-mono); color: var(--color-text-secondary); }
        .chart-legend { display: flex; gap: 16px; margin-top: 12px; }
        .legend-item { font-size: 9px; font-family: var(--font-mono); color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }

        /* SUBJECT TABLE */
        .subject-table-wrap { margin-bottom: 20px; overflow-x: auto; }
        .table-title { font-size: 9px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.12em; display: block; margin-bottom: 12px; }
        .subject-table { width: 100%; border-collapse: collapse; }
        .subject-table th { font-size: 8px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border-color); }
        .subject-table td { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-secondary); padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .subj-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .warn-cell { color: #e74c3c; }

        /* EVENT FEED */
        .feed-wrap { margin-bottom: 8px; }
        .event-feed { display: flex; flex-direction: column; gap: 0; }
        .feed-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s ease; }
        .feed-row:hover { background: rgba(255,255,255,0.02); }
        .feed-icon { flex-shrink: 0; display: flex; align-items: center; }
        .feed-badge { font-size: 8px; font-weight: 800; font-family: var(--font-mono); padding: 2px 8px; border-radius: 4px; border: 1px solid; letter-spacing: 0.08em; flex-shrink: 0; }
        .feed-to { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-secondary); min-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .feed-subject { font-size: 11px; color: var(--color-text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .feed-link { color: var(--color-text-muted); transition: color 0.15s ease; display: flex; align-items: center; flex-shrink: 0; }
        .feed-link:hover { color: var(--color-accent-primary); }
        .feed-time { font-size: 9px; font-family: var(--font-mono); color: var(--color-text-muted); flex-shrink: 0; min-width: 60px; text-align: right; }

        @media (max-width: 1200px) { .email-cards { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .email-cards { grid-template-columns: 1fr; } .feed-to { display: none; } .bar-label { display: none; } }
      `}</style>
    </div>
  );
}
