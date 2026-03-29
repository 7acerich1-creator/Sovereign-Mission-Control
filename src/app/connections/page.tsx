"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Radio,
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Globe,
  MessageCircle,
  Heart,
  Share2,
} from 'lucide-react';

type Connection = {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive';
  via_zapier?: boolean;
  last_sync?: string;
};

// Platform config with icons and colors
const PLATFORM_META: Record<string, { color: string; icon: string; category: string }> = {
  telegram:   { color: '#0088CC', icon: 'T',  category: 'messaging' },
  instagram:  { color: '#E4405F', icon: 'IG', category: 'social' },
  youtube:    { color: '#FF0000', icon: 'YT', category: 'content' },
  tiktok:     { color: '#00F2EA', icon: 'TK', category: 'social' },
  twitter:    { color: '#1DA1F2', icon: 'X',  category: 'social' },
  stripe:     { color: '#635BFF', icon: 'S',  category: 'revenue' },
  supabase:   { color: '#3ECF8E', icon: 'SB', category: 'data' },
  elevenlabs: { color: '#FFFFFF', icon: 'EL', category: 'ai' },
  anthropic:  { color: '#D4A574', icon: 'AI', category: 'ai' },
  vercel:     { color: '#FFFFFF', icon: 'V',  category: 'infra' },
  make:       { color: '#6D00CC', icon: 'MK', category: 'automation' },
  zapier:     { color: '#FF4A00', icon: 'ZP', category: 'automation' },
  notion:     { color: '#FFFFFF', icon: 'N',  category: 'data' },
  gumroad:    { color: '#FF90E8', icon: 'GR', category: 'revenue' },
  clickup:    { color: '#7B68EE', icon: 'CU', category: 'ops' },
};

function getPlatformMeta(name: string) {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, v] of Object.entries(PLATFORM_META)) {
    if (key.includes(k)) return v;
  }
  return { color: '#7C5CFC', icon: name.charAt(0).toUpperCase(), category: 'other' };
}

export default function Connections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('connections-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_connections' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from('system_connections').select('*').order('name', { ascending: true });
    if (data) setConnections(data as Connection[]);
    setLoading(false);
  }

  const activeCount = connections.filter(c => c.status === 'active').length;
  const totalCount = connections.length;
  const categories = connections.reduce((acc, c) => {
    const cat = getPlatformMeta(c.name).category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by category
  const grouped: Record<string, Connection[]> = {};
  connections.forEach(c => {
    const cat = getPlatformMeta(c.name).category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  });

  const categoryLabels: Record<string, string> = {
    social: 'SOCIAL CHANNELS',
    messaging: 'MESSAGING',
    content: 'CONTENT PLATFORMS',
    revenue: 'REVENUE INFRASTRUCTURE',
    data: 'DATA LAYER',
    ai: 'AI ENGINES',
    infra: 'INFRASTRUCTURE',
    automation: 'AUTOMATION',
    ops: 'OPERATIONS',
    other: 'OTHER',
  };

  return (
    <div className="vi-page fade-in">
      <header className="vi-header">
        <div>
          <h1 className="vi-title">SIGNAL INTELLIGENCE</h1>
          <p className="vi-subtitle">NETWORK TOPOLOGY :: REAL-TIME CONNECTION MATRIX</p>
        </div>
        <div className="vi-health">
          <div className="vi-health-ring">
            <svg viewBox="0 0 80 80" className="vi-ring-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={activeCount === totalCount ? '#1D9E75' : '#C9A84C'}
                strokeWidth="6"
                strokeDasharray={`${(activeCount / Math.max(totalCount, 1)) * 213.6} 213.6`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div className="vi-ring-center">
              <span className="vi-ring-value">{activeCount}</span>
              <span className="vi-ring-label">/ {totalCount}</span>
            </div>
          </div>
          <div className="vi-health-text">
            <span className="vi-health-status">{activeCount === totalCount ? 'ALL SYSTEMS ONLINE' : `${totalCount - activeCount} OFFLINE`}</span>
            <span className="vi-health-detail">Network Health</span>
          </div>
        </div>
      </header>

      {/* SIGNAL METRICS — placeholder for future real data */}
      <section className="vi-metrics">
        <div className="vi-metric-card">
          <div className="vi-mc-icon"><Globe size={16} /></div>
          <div className="vi-mc-body">
            <span className="vi-mc-label">TOTAL REACH</span>
            <span className="vi-mc-value">---</span>
            <span className="vi-mc-delta neutral"><Minus size={10} /> awaiting data</span>
          </div>
        </div>
        <div className="vi-metric-card">
          <div className="vi-mc-icon"><Users size={16} /></div>
          <div className="vi-mc-body">
            <span className="vi-mc-label">FOLLOWERS</span>
            <span className="vi-mc-value">---</span>
            <span className="vi-mc-delta neutral"><Minus size={10} /> awaiting data</span>
          </div>
        </div>
        <div className="vi-metric-card">
          <div className="vi-mc-icon"><Heart size={16} /></div>
          <div className="vi-mc-body">
            <span className="vi-mc-label">ENGAGEMENT</span>
            <span className="vi-mc-value">---</span>
            <span className="vi-mc-delta neutral"><Minus size={10} /> awaiting data</span>
          </div>
        </div>
        <div className="vi-metric-card">
          <div className="vi-mc-icon"><MessageCircle size={16} /></div>
          <div className="vi-mc-body">
            <span className="vi-mc-label">CONVERSATIONS</span>
            <span className="vi-mc-value">---</span>
            <span className="vi-mc-delta neutral"><Minus size={10} /> awaiting data</span>
          </div>
        </div>
      </section>

      {/* CONNECTION MATRIX BY CATEGORY */}
      <section className="vi-matrix">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, conns]) => (
          <div key={cat} className="vi-category">
            <div className="vi-cat-header">
              <Radio size={12} />
              <span>{categoryLabels[cat] || cat.toUpperCase()}</span>
              <span className="vi-cat-count">{conns.filter(c => c.status === 'active').length}/{conns.length}</span>
            </div>
            <div className="vi-cat-grid">
              {conns.map(conn => {
                const meta = getPlatformMeta(conn.name);
                const isActive = conn.status === 'active';
                return (
                  <div key={conn.id} className={`vi-node ${isActive ? 'active' : 'inactive'}`}>
                    <div className="vi-node-icon" style={{ borderColor: isActive ? meta.color : 'rgba(255,255,255,0.1)' }}>
                      <span style={{ color: isActive ? meta.color : 'var(--color-text-muted)' }}>{meta.icon}</span>
                      <div className={`vi-node-dot ${isActive ? 'on' : 'off'}`} />
                    </div>
                    <div className="vi-node-info">
                      <span className="vi-node-name">{conn.name}</span>
                      <span className="vi-node-status">{isActive ? 'CONNECTED' : 'OFFLINE'}</span>
                    </div>
                    {conn.via_zapier && (
                      <div className="vi-zapier-tag"><Zap size={8} /></div>
                    )}
                    {/* Future: real metric bar */}
                    <div className="vi-node-bar">
                      <div className="vi-node-bar-fill" style={{
                        width: isActive ? '100%' : '0%',
                        background: isActive ? meta.color : 'transparent',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {connections.length === 0 && !loading && (
        <div className="vi-empty">
          <Radio size={40} className="vi-empty-icon" />
          <span>NO SIGNALS DETECTED</span>
          <span className="vi-empty-sub">Connect platforms to activate intelligence gathering</span>
        </div>
      )}

      <style jsx>{`
        .vi-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px 60px;
        }

        .vi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 0 0;
        }
        .vi-title {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .vi-subtitle {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          letter-spacing: 0.12em;
          margin-top: 4px;
        }

        .vi-health {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .vi-health-ring {
          position: relative;
          width: 72px;
          height: 72px;
        }
        .vi-ring-svg { width: 100%; height: 100%; }
        .vi-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .vi-ring-value {
          font-size: 20px;
          font-weight: 900;
          font-family: var(--font-mono);
          color: var(--color-text-primary);
          line-height: 1;
        }
        .vi-ring-label {
          font-size: 9px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }
        .vi-health-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .vi-health-status {
          font-size: 11px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
          color: var(--color-text-primary);
        }
        .vi-health-detail {
          font-size: 9px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        /* METRICS */
        .vi-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .vi-metric-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 18px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .vi-mc-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(124,92,252,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7C5CFC;
          flex-shrink: 0;
        }
        .vi-mc-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .vi-mc-label {
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          letter-spacing: 0.08em;
        }
        .vi-mc-value {
          font-size: 22px;
          font-weight: 900;
          font-family: var(--font-mono);
          color: var(--color-text-primary);
          line-height: 1.1;
        }
        .vi-mc-delta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-family: var(--font-mono);
        }
        .vi-mc-delta.up { color: #1D9E75; }
        .vi-mc-delta.down { color: #ef4444; }
        .vi-mc-delta.neutral { color: var(--color-text-muted); }

        /* MATRIX */
        .vi-matrix {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .vi-category {
          background: var(--color-bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
        }
        .vi-cat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border-color);
          font-size: 10px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }
        .vi-cat-count {
          margin-left: auto;
          color: #7C5CFC;
          background: rgba(124,92,252,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9px;
        }
        .vi-cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1px;
          background: var(--border-color);
        }

        .vi-node {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: var(--color-bg-surface);
          position: relative;
          transition: background 0.15s;
        }
        .vi-node:hover { background: rgba(255,255,255,0.02); }
        .vi-node.inactive { opacity: 0.5; }

        .vi-node-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          font-family: var(--font-mono);
          position: relative;
          flex-shrink: 0;
          background: rgba(0,0,0,0.3);
        }
        .vi-node-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 2px solid var(--color-bg-surface);
        }
        .vi-node-dot.on { background: #1D9E75; box-shadow: 0 0 6px rgba(29,158,117,0.6); }
        .vi-node-dot.off { background: #555; }

        .vi-node-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          min-width: 0;
        }
        .vi-node-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vi-node-status {
          font-size: 8px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }

        .vi-zapier-tag {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: rgba(255,78,0,0.15);
          color: #FF4E00;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .vi-node-bar {
          width: 40px;
          height: 4px;
          background: rgba(255,255,255,0.04);
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .vi-node-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s;
          opacity: 0.6;
        }

        .vi-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 80px 20px;
          color: var(--color-text-muted);
          text-align: center;
        }
        .vi-empty-icon { opacity: 0.15; }
        .vi-empty-sub { font-size: 11px; opacity: 0.6; }

        @media (max-width: 900px) {
          .vi-metrics { grid-template-columns: repeat(2, 1fr); }
          .vi-header { flex-direction: column; gap: 20px; align-items: flex-start; }
        }
        @media (max-width: 500px) {
          .vi-metrics { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
