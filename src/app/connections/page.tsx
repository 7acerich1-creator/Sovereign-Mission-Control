"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Radio,
  CheckCircle,
  AlertTriangle,
  Activity,
  Server,
  Cpu,
  DollarSign,
  BarChart3,
  Send,
  Mic,
  Video,
  Database,
  Cloud,
  Bot,
  Mail,
  Globe,
  Zap,
  XCircle,
} from 'lucide-react';

/* ── Types ── */
type Connection = {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive';
  via_zapier?: boolean;
  last_sync?: string;
  category: string;
  description?: string;
  health_table?: string;
  health_column?: string;
  stale_hours?: number;
};

type HealthPulse = {
  lastPipelineRun: string | null;
  lastYTFetch: string | null;
  dispatchCount24h: number;
  draftsCount7d: number;
};

/* ── Provider Meta ── */
const PROVIDER_META: Record<string, { color: string; icon: string }> = {
  'gravity-claw': { color: '#7C5CFC', icon: 'GC' },
  buffer:         { color: '#231F20', icon: 'BF' },
  runpod:         { color: '#673AB7', icon: 'RP' },
  groq:           { color: '#F55036', icon: 'GQ' },
  google:         { color: '#4285F4', icon: 'G' },
  elevenlabs:     { color: '#FFFFFF', icon: 'EL' },
  railway:        { color: '#0B0D0E', icon: 'RW' },
  vercel:         { color: '#FFFFFF', icon: 'VC' },
  supabase:       { color: '#3ECF8E', icon: 'SB' },
  pinecone:       { color: '#10B981', icon: 'PC' },
  stripe:         { color: '#635BFF', icon: 'ST' },
  telegram:       { color: '#0088CC', icon: 'TG' },
  resend:         { color: '#FFFFFF', icon: 'RS' },
};

const CATEGORY_ORDER = ['pipeline', 'ai', 'infra', 'revenue', 'comms', 'analytics'];
const CATEGORY_LABELS: Record<string, string> = {
  pipeline:  'CONTENT PIPELINE',
  ai:        'AI ENGINES',
  infra:     'INFRASTRUCTURE',
  revenue:   'REVENUE & EMAIL',
  comms:     'COMMUNICATIONS',
  analytics: 'ANALYTICS',
};
const CATEGORY_ICONS: Record<string, any> = {
  pipeline:  Video,
  ai:        Cpu,
  infra:     Server,
  revenue:   DollarSign,
  comms:     Send,
  analytics: BarChart3,
};

/* ── Helpers ── */
function relativeTime(ts: string | null): string {
  if (!ts) return 'never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function hoursAgo(ts: string | null): number {
  if (!ts) return Infinity;
  return (Date.now() - new Date(ts).getTime()) / 3600000;
}

function healthColor(ts: string | null, staleHours: number): string {
  const h = hoursAgo(ts);
  if (h <= staleHours) return '#1D9E75';
  if (h <= staleHours * 2) return '#C9A84C';
  return '#ef4444';
}

function getMeta(provider: string) {
  return PROVIDER_META[provider] || { color: '#7C5CFC', icon: provider.charAt(0).toUpperCase() };
}

/* ── Component ── */
export default function Connections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pulse, setPulse] = useState<HealthPulse>({ lastPipelineRun: null, lastYTFetch: null, dispatchCount24h: 0, draftsCount7d: 0 });
  const [loading, setLoading] = useState(true);
  const [showMakeBanner, setShowMakeBanner] = useState(true);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('connections-health')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_connections' }, () => fetchConnections())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchConnections(), fetchPulse()]);
    setLoading(false);
  }

  async function fetchConnections() {
    const { data } = await supabase.from('system_connections').select('*').order('name');
    if (data) setConnections(data as Connection[]);
  }

  async function fetchPulse() {
    const [ceq, yta, cd, cdr] = await Promise.all([
      supabase.from('content_engine_queue').select('created_at').order('created_at', { ascending: false }).limit(1),
      supabase.from('youtube_analytics').select('fetched_at').order('fetched_at', { ascending: false }).limit(1),
      supabase.from('crew_dispatch').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('content_drafts').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 604800000).toISOString()),
    ]);
    setPulse({
      lastPipelineRun: ceq.data?.[0]?.created_at || null,
      lastYTFetch: yta.data?.[0]?.fetched_at || null,
      dispatchCount24h: cd.count || 0,
      draftsCount7d: cdr.count || 0,
    });
  }

  const activeCount = connections.filter(c => c.status === 'active').length;
  const totalCount = connections.length;

  // Detect degraded connections
  const degraded = connections.filter(c => {
    if (c.status === 'inactive') return true;
    if (c.last_sync && c.stale_hours && hoursAgo(c.last_sync) > (c.stale_hours || 24) * 2) return true;
    return false;
  });

  // Group by category
  const grouped: Record<string, Connection[]> = {};
  connections.forEach(c => {
    const cat = c.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  });

  const pulseCards = [
    { label: 'LAST PIPELINE RUN', value: relativeTime(pulse.lastPipelineRun), color: healthColor(pulse.lastPipelineRun, 24), sub: 'content_engine_queue' },
    { label: 'LAST YT FETCH', value: relativeTime(pulse.lastYTFetch), color: healthColor(pulse.lastYTFetch, 26), sub: 'youtube_analytics' },
    { label: 'DISPATCHES (24H)', value: String(pulse.dispatchCount24h), color: pulse.dispatchCount24h > 0 ? '#1D9E75' : '#C9A84C', sub: 'crew_dispatch' },
    { label: 'DRAFTS (7D)', value: String(pulse.draftsCount7d), color: pulse.draftsCount7d > 0 ? '#1D9E75' : '#C9A84C', sub: 'content_drafts' },
  ];

  return (
    <div className="sh-page fade-in">
      {/* ALERT BANNER */}
      {degraded.length > 0 && (
        <div className="sh-alert">
          <AlertTriangle size={14} />
          <span>DEGRADED — {degraded.length} connection{degraded.length > 1 ? 's' : ''} require attention: {degraded.map(d => d.name).join(', ')}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="sh-header">
        <div>
          <h1 className="sh-title">SYSTEM HEALTH</h1>
          <p className="sh-subtitle">OPERATIONAL STATUS :: LIVE PIPELINE MONITOR</p>
        </div>
        <div className="sh-health">
          <div className="sh-ring-wrap">
            <svg viewBox="0 0 80 80" className="sh-ring-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none"
                stroke={activeCount === totalCount ? '#1D9E75' : '#C9A84C'}
                strokeWidth="6"
                strokeDasharray={`${(activeCount / Math.max(totalCount, 1)) * 213.6} 213.6`}
                strokeLinecap="round" transform="rotate(-90 40 40)" />
            </svg>
            <div className="sh-ring-center">
              <span className="sh-ring-val">{activeCount}</span>
              <span className="sh-ring-lbl">/ {totalCount}</span>
            </div>
          </div>
          <div className="sh-health-text">
            <span className="sh-health-status">{activeCount === totalCount ? 'ALL SYSTEMS ONLINE' : `${totalCount - activeCount} OFFLINE`}</span>
            <span className="sh-health-detail">System Health</span>
          </div>
        </div>
      </header>

      {/* PULSE CARDS */}
      <section className="sh-pulse">
        {pulseCards.map(card => (
          <div key={card.label} className="sh-pulse-card">
            <div className="sh-pulse-dot" style={{ background: card.color, boxShadow: `0 0 8px ${card.color}40` }} />
            <div className="sh-pulse-body">
              <span className="sh-pulse-label">{card.label}</span>
              <span className="sh-pulse-value" style={{ color: card.color }}>{card.value}</span>
              <span className="sh-pulse-sub">{card.sub}</span>
            </div>
          </div>
        ))}
      </section>

      {/* CONNECTION GRID */}
      <section className="sh-grid">
        {CATEGORY_ORDER.filter(cat => grouped[cat]).map(cat => {
          const CatIcon = CATEGORY_ICONS[cat] || Radio;
          const conns = grouped[cat];
          return (
            <div key={cat} className="sh-category">
              <div className="sh-cat-header">
                <CatIcon size={12} />
                <span>{CATEGORY_LABELS[cat] || cat.toUpperCase()}</span>
                <span className="sh-cat-count">{conns.filter(c => c.status === 'active').length}/{conns.length}</span>
              </div>
              <div className="sh-cat-body">
                {conns.map(conn => {
                  const meta = getMeta(conn.provider);
                  const isActive = conn.status === 'active';
                  const stale = conn.last_sync && conn.stale_hours ? hoursAgo(conn.last_sync) > conn.stale_hours * 2 : false;
                  return (
                    <div key={conn.id} className={`sh-conn ${isActive ? '' : 'offline'}`}>
                      <div className="sh-conn-icon" style={{ borderColor: isActive ? meta.color : 'rgba(255,255,255,0.1)' }}>
                        <span style={{ color: isActive ? meta.color : 'var(--color-text-muted)' }}>{meta.icon}</span>
                        <div className={`sh-dot ${isActive ? 'on' : 'off'}`} />
                      </div>
                      <div className="sh-conn-info">
                        <div className="sh-conn-top">
                          <span className="sh-conn-name">{conn.name}</span>
                          {stale && <span className="sh-stale-badge">STALE</span>}
                        </div>
                        {conn.description && <span className="sh-conn-desc">{conn.description}</span>}
                        <div className="sh-conn-meta">
                          <span className={`sh-conn-status ${isActive ? 'on' : 'off'}`}>
                            {isActive ? 'ONLINE' : 'OFFLINE'}
                          </span>
                          {conn.last_sync && <span className="sh-conn-sync">{relativeTime(conn.last_sync)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* MAKE.COM CANCELLATION REMINDER */}
      {showMakeBanner && (
        <div className="sh-make-banner">
          <div className="sh-make-content">
            <AlertTriangle size={14} />
            <span><strong>ACTION REQUIRED:</strong> Cancel your Make.com subscription — all scenarios deprecated and replaced with native bot pipelines.</span>
          </div>
          <button className="sh-make-dismiss" onClick={() => setShowMakeBanner(false)}>
            <XCircle size={14} />
          </button>
        </div>
      )}

      {connections.length === 0 && !loading && (
        <div className="sh-empty">
          <Radio size={40} style={{ opacity: 0.15 }} />
          <span>NO SIGNALS DETECTED</span>
        </div>
      )}

      <style jsx>{`
        .sh-page { display: flex; flex-direction: column; gap: 24px; max-width: 1400px; margin: 0 auto; padding: 0 20px 60px; }

        /* ALERT */
        .sh-alert {
          display: flex; align-items: center; gap: 10px; padding: 12px 18px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px; color: #ef4444;
          font-size: 11px; font-weight: 700; font-family: var(--font-mono); letter-spacing: 0.04em;
        }

        /* HEADER */
        .sh-header { display: flex; justify-content: space-between; align-items: center; padding: 32px 0 0; }
        .sh-title { font-size: 28px; font-weight: 900; letter-spacing: 0.08em; }
        .sh-subtitle { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.12em; margin-top: 4px; }
        .sh-health { display: flex; align-items: center; gap: 16px; }
        .sh-ring-wrap { position: relative; width: 72px; height: 72px; }
        .sh-ring-svg { width: 100%; height: 100%; }
        .sh-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .sh-ring-val { font-size: 20px; font-weight: 900; font-family: var(--font-mono); line-height: 1; }
        .sh-ring-lbl { font-size: 9px; color: var(--color-text-muted); font-family: var(--font-mono); }
        .sh-health-text { display: flex; flex-direction: column; gap: 2px; }
        .sh-health-status { font-size: 11px; font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.05em; }
        .sh-health-detail { font-size: 9px; color: var(--color-text-muted); font-family: var(--font-mono); }

        /* PULSE */
        .sh-pulse { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .sh-pulse-card {
          background: var(--color-bg-surface); border: 1px solid var(--border-color);
          border-radius: 12px; padding: 18px; display: flex; gap: 14px; align-items: flex-start;
        }
        .sh-pulse-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .sh-pulse-body { display: flex; flex-direction: column; gap: 2px; }
        .sh-pulse-label { font-size: 9px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.08em; }
        .sh-pulse-value { font-size: 22px; font-weight: 900; font-family: var(--font-mono); line-height: 1.1; }
        .sh-pulse-sub { font-size: 8px; font-family: var(--font-mono); color: var(--color-text-muted); opacity: 0.6; }

        /* GRID */
        .sh-grid { display: flex; flex-direction: column; gap: 20px; }
        .sh-category { background: var(--color-bg-surface); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
        .sh-cat-header {
          display: flex; align-items: center; gap: 8px; padding: 14px 20px;
          border-bottom: 1px solid var(--border-color);
          font-size: 10px; font-weight: 800; font-family: var(--font-mono);
          letter-spacing: 0.08em; color: var(--color-text-muted);
        }
        .sh-cat-count {
          margin-left: auto; color: #7C5CFC; background: rgba(124,92,252,0.1);
          padding: 2px 8px; border-radius: 4px; font-size: 9px;
        }
        .sh-cat-body { display: flex; flex-direction: column; }

        /* CONNECTION ROW */
        .sh-conn {
          display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px;
          border-bottom: 1px solid var(--border-color); transition: background 0.15s;
        }
        .sh-conn:last-child { border-bottom: none; }
        .sh-conn:hover { background: rgba(255,255,255,0.02); }
        .sh-conn.offline { opacity: 0.45; }

        .sh-conn-icon {
          width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 900; font-family: var(--font-mono);
          position: relative; flex-shrink: 0; background: rgba(0,0,0,0.3);
        }
        .sh-dot {
          position: absolute; bottom: -2px; right: -2px;
          width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--color-bg-surface);
        }
        .sh-dot.on { background: #1D9E75; box-shadow: 0 0 6px rgba(29,158,117,0.6); }
        .sh-dot.off { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.4); }

        .sh-conn-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
        .sh-conn-top { display: flex; align-items: center; gap: 8px; }
        .sh-conn-name { font-size: 13px; font-weight: 700; }
        .sh-stale-badge {
          font-size: 8px; font-weight: 900; font-family: var(--font-mono);
          background: rgba(201,168,76,0.15); color: #C9A84C;
          padding: 1px 6px; border-radius: 3px; letter-spacing: 0.06em;
        }
        .sh-conn-desc { font-size: 11px; color: var(--color-text-muted); line-height: 1.4; }
        .sh-conn-meta { display: flex; align-items: center; gap: 12px; margin-top: 2px; }
        .sh-conn-status {
          font-size: 8px; font-weight: 900; font-family: var(--font-mono); letter-spacing: 0.08em;
        }
        .sh-conn-status.on { color: #1D9E75; }
        .sh-conn-status.off { color: #ef4444; }
        .sh-conn-sync { font-size: 9px; font-family: var(--font-mono); color: var(--color-text-muted); }

        /* MAKE BANNER */
        .sh-make-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.25); border-radius: 10px;
        }
        .sh-make-content {
          display: flex; align-items: center; gap: 10px; color: #C9A84C;
          font-size: 11px; font-family: var(--font-mono);
        }
        .sh-make-dismiss {
          background: none; border: none; color: #C9A84C; cursor: pointer; opacity: 0.6;
          padding: 4px; display: flex; align-items: center;
        }
        .sh-make-dismiss:hover { opacity: 1; }

        /* EMPTY */
        .sh-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; color: var(--color-text-muted); }

        @media (max-width: 900px) {
          .sh-pulse { grid-template-columns: repeat(2, 1fr); }
          .sh-header { flex-direction: column; gap: 20px; align-items: flex-start; }
        }
        @media (max-width: 500px) { .sh-pulse { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
