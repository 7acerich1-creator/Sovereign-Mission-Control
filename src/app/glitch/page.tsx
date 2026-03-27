"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  ShieldAlert,
  Activity,
  Clock,
  Filter
} from 'lucide-react';

type GlitchEntry = {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'Warning' | 'Info';
  source: string;
  resolved: boolean;
  created_at: string;
};

export default function GlitchLog() {
  const [glitches, setGlitches] = useState<GlitchEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'Critical' | 'Warning' | 'Info'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('glitch-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'glitch_log' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('glitch_log')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setGlitches(data as GlitchEntry[]);
    }
    setLoading(false);
  }

  const filteredGlitches = filter === 'all' ? glitches : glitches.filter(g => g.severity === filter);
  const criticalCount = glitches.filter(g => g.severity === 'Critical' && !g.resolved).length;
  const warningCount = glitches.filter(g => g.severity === 'Warning' && !g.resolved).length;
  const resolvedPercent = glitches.length > 0 
    ? Math.round((glitches.filter(g => g.resolved).length / glitches.length) * 100) 
    : 100;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <ShieldAlert size={16} />;
      case 'Warning': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className="fade-in">
      <div className="glow-orb glow-danger" style={{ top: '-10%', right: '20%' }} />

      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">GLITCH LOG</h1>
          <p className="eyebrow text-secondary">ANOMALY DETECTION :: SIMULATION ERRORS</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span className="label">ACTIVE THREATS</span>
            <span className="value text-danger">{criticalCount + warningCount}</span>
          </div>
          <div className="mini-stat">
            <span className="label">RESOLUTION</span>
            <span className="value text-success">{resolvedPercent}%</span>
          </div>
        </div>
      </header>

      {/* STAT CARDS */}
      <section className="metrics-grid">
        <div className="card stat-card border-top-danger">
          <div className="stat-content">
            <span className="stat-label">CRITICAL</span>
            <span className="stat-value text-danger">{criticalCount}</span>
          </div>
        </div>
        <div className="card stat-card border-top-warning">
          <div className="stat-content">
            <span className="stat-label">WARNINGS</span>
            <span className="stat-value text-warning">{warningCount}</span>
          </div>
        </div>
        <div className="card stat-card border-top-cyan">
          <div className="stat-content">
            <span className="stat-label">TOTAL ANOMALIES</span>
            <span className="stat-value">{glitches.length}</span>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="filter-bar">
        {(['all', 'Critical', 'Warning', 'Info'] as const).map(f => (
          <button 
            key={f} 
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'ALL' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* GLITCH LIST */}
      <div className="glitch-list">
        {filteredGlitches.map((glitch, idx) => (
          <div 
            key={glitch.id} 
            className={`card glitch-card fade-in stagger-${(idx % 3) + 1} ${glitch.severity.toLowerCase()} ${glitch.resolved ? 'resolved' : ''}`}
          >
            <div className="glitch-severity-bar" />
            <div className="glitch-body">
              <div className="glitch-header">
                <div className="glitch-title-row">
                  <div className={`severity-icon ${glitch.severity.toLowerCase()}`}>
                    {getSeverityIcon(glitch.severity)}
                  </div>
                  <h3 className="glitch-title">{glitch.title}</h3>
                  {glitch.resolved && <span className="resolved-badge">RESOLVED</span>}
                </div>
                <span className="glitch-time">
                  <Clock size={10} />
                  {new Date(glitch.created_at).toLocaleString()}
                </span>
              </div>
              <p className="glitch-description">{glitch.description}</p>
              <div className="glitch-footer">
                <span className="glitch-source">SOURCE :: {glitch.source}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredGlitches.length === 0 && (
          <div className="empty-state">
            <Activity size={48} className="empty-icon" />
            <p>NO ANOMALIES DETECTED — FREQUENCY STABLE</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .glow-danger {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.06;
          pointer-events: none;
          z-index: 0;
          background: var(--color-accent-danger);
        }

        .text-danger { color: var(--color-accent-danger); }
        .text-warning { color: var(--color-accent-primary); }
        .text-success { color: var(--color-accent-success); }

        .border-top-danger { border-top: 4px solid var(--color-accent-danger); }
        .border-top-warning { border-top: 4px solid var(--color-accent-primary); }
        .border-top-cyan { border-top: 4px solid var(--color-accent-cyan); }

        .filter-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
        }

        .filter-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
        }

        .filter-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .filter-btn:hover { border-color: var(--color-accent-secondary); color: var(--color-text-primary); }
        .filter-btn.active { background: var(--color-bg-surface); color: var(--color-accent-primary); border-color: var(--color-accent-primary); }

        .glitch-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .glitch-card {
          display: flex;
          padding: 0;
          overflow: hidden;
          transition: var(--transition-normal);
        }

        .glitch-card.resolved { opacity: 0.6; }

        .glitch-severity-bar {
          width: 4px;
          flex-shrink: 0;
        }

        .glitch-card.critical .glitch-severity-bar { background: var(--color-accent-danger); box-shadow: 0 0 12px var(--color-accent-danger); }
        .glitch-card.warning .glitch-severity-bar { background: var(--color-accent-primary); box-shadow: 0 0 12px var(--color-accent-primary); }
        .glitch-card.info .glitch-severity-bar { background: var(--color-accent-cyan); }

        .glitch-body {
          flex: 1;
          padding: 24px;
        }

        .glitch-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .glitch-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .severity-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .severity-icon.critical { background: rgba(217, 85, 85, 0.15); color: var(--color-accent-danger); }
        .severity-icon.warning { background: rgba(201, 168, 76, 0.15); color: var(--color-accent-primary); }
        .severity-icon.info { background: rgba(62, 247, 232, 0.1); color: var(--color-accent-cyan); }

        .glitch-title { font-size: 15px; font-weight: 700; }

        .resolved-badge {
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          background: rgba(46, 204, 143, 0.1);
          color: var(--color-accent-success);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(46, 204, 143, 0.2);
        }

        .glitch-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          white-space: nowrap;
        }

        .glitch-description {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .glitch-footer { display: flex; justify-content: space-between; align-items: center; }

        .glitch-source {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-accent-secondary);
          opacity: 0.7;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 0;
          color: var(--color-text-muted);
          border: 1px dashed var(--border-color);
          border-radius: 16px;
        }

        .empty-icon { opacity: 0.2; margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
