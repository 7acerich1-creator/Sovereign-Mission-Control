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
  Filter,
  Plus,
  X,
  CheckCircle,
  Zap,
  Shield,
  Eye
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

const GLITCH_SOURCES = [
  'BIOLOGICAL DRAG',
  'FEAR SIGNAL',
  'SCARCITY LOOP',
  'SIMULATION NOISE',
  'SYSTEM ERROR',
  'EXTERNAL INTERFERENCE',
  'MENTAL PATTERN',
  'ENERGY DRAIN',
  'CREW FLAGGED',
];

export default function GlitchLog() {
  const [glitches, setGlitches] = useState<GlitchEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'Critical' | 'Warning' | 'Info'>('all');
  const [showResolved, setShowResolved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'Critical' | 'Warning' | 'Info'>('Warning');
  const [newSource, setNewSource] = useState(GLITCH_SOURCES[0]);

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

  async function createGlitch() {
    if (!newTitle.trim()) return;
    await supabase.from('glitch_log').insert({
      title: newTitle.trim(),
      description: newDesc.trim(),
      severity: newSeverity,
      source: newSource,
      resolved: false,
    });
    setNewTitle('');
    setNewDesc('');
    setNewSeverity('Warning');
    setNewSource(GLITCH_SOURCES[0]);
    setShowForm(false);
  }

  async function toggleResolved(id: string, current: boolean) {
    await supabase.from('glitch_log').update({ resolved: !current }).eq('id', id);
  }

  async function deleteGlitch(id: string) {
    await supabase.from('glitch_log').delete().eq('id', id);
  }

  const visibleGlitches = glitches
    .filter(g => filter === 'all' || g.severity === filter)
    .filter(g => showResolved || !g.resolved);

  const criticalCount = glitches.filter(g => g.severity === 'Critical' && !g.resolved).length;
  const warningCount = glitches.filter(g => g.severity === 'Warning' && !g.resolved).length;
  const resolvedCount = glitches.filter(g => g.resolved).length;
  const resolvedPercent = glitches.length > 0
    ? Math.round((resolvedCount / glitches.length) * 100)
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
          <p className="eyebrow text-secondary">SIMULATION INTERFERENCE DETECTION :: PROTOCOL 77 SHIELD</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span className="label">ACTIVE THREATS</span>
            <span className="value text-danger">{criticalCount + warningCount}</span>
          </div>
          <div className="mini-stat">
            <span className="label">NEUTRALIZED</span>
            <span className="value text-success">{resolvedPercent}%</span>
          </div>
        </div>
      </header>

      {/* INTEL BRIEFING */}
      <div className="card intel-brief">
        <Shield size={16} style={{ color: 'var(--color-accent-secondary)', flexShrink: 0 }} />
        <p>
          <strong>THE SHIELD</strong> — Glitches are simulation interference: fear signals, scarcity loops, biological drag,
          mental patterns, and system errors that slow your trajectory toward $1.2M. Log them. Name them. Neutralize them.
          What you can see, you can override.
        </p>
      </div>

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
            <span className="stat-label">TOTAL LOGGED</span>
            <span className="stat-value">{glitches.length}</span>
          </div>
        </div>
        <div className="card stat-card border-top-success">
          <div className="stat-content">
            <span className="stat-label">RESOLVED</span>
            <span className="stat-value text-success">{resolvedCount}</span>
          </div>
        </div>
      </section>

      {/* CONTROLS BAR */}
      <div className="controls-bar">
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
          <button
            className={`filter-btn ${!showResolved ? 'active' : ''}`}
            onClick={() => setShowResolved(v => !v)}
          >
            <Eye size={12} />
            {showResolved ? 'HIDE RESOLVED' : 'SHOW RESOLVED'}
          </button>
        </div>
        <button className="log-glitch-btn" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showForm ? 'CANCEL' : 'LOG GLITCH'}</span>
        </button>
      </div>

      {/* NEW GLITCH FORM */}
      {showForm && (
        <div className="card glitch-form fade-in">
          <h3 className="form-title">LOG NEW INTERFERENCE</h3>
          <div className="form-grid">
            <div className="form-field full-width">
              <label>WHAT IS THE GLITCH?</label>
              <input
                type="text"
                placeholder="Name the interference pattern..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createGlitch()}
                className="form-input"
                autoFocus
              />
            </div>
            <div className="form-field full-width">
              <label>DESCRIBE IT</label>
              <textarea
                placeholder="What triggered it? How is it affecting your frequency? What's the override strategy?"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="form-field">
              <label>SEVERITY</label>
              <div className="severity-picker">
                {(['Critical', 'Warning', 'Info'] as const).map(s => (
                  <button
                    key={s}
                    className={`sev-btn ${s.toLowerCase()} ${newSeverity === s ? 'active' : ''}`}
                    onClick={() => setNewSeverity(s)}
                  >
                    {getSeverityIcon(s)}
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>SOURCE</label>
              <select className="form-select" value={newSource} onChange={e => setNewSource(e.target.value)}>
                {GLITCH_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button className="submit-btn" onClick={createGlitch} disabled={!newTitle.trim()}>
            <Zap size={14} />
            LOG & CONTAIN
          </button>
        </div>
      )}

      {/* GLITCH LIST */}
      <div className="glitch-list">
        {visibleGlitches.map((glitch, idx) => (
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
                  {glitch.resolved && <span className="resolved-badge">NEUTRALIZED</span>}
                </div>
                <span className="glitch-time">
                  <Clock size={10} />
                  {new Date(glitch.created_at).toLocaleString()}
                </span>
              </div>
              <p className="glitch-description">{glitch.description}</p>
              <div className="glitch-footer">
                <span className="glitch-source">SOURCE :: {glitch.source}</span>
                <div className="glitch-actions">
                  <button
                    className={`action-btn ${glitch.resolved ? 'reopen' : 'resolve'}`}
                    onClick={() => toggleResolved(glitch.id, glitch.resolved)}
                  >
                    <CheckCircle size={13} />
                    {glitch.resolved ? 'REOPEN' : 'NEUTRALIZE'}
                  </button>
                  <button className="action-btn delete" onClick={() => deleteGlitch(glitch.id)}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {visibleGlitches.length === 0 && (
          <div className="empty-state">
            <Activity size={48} className="empty-icon" />
            <p>{glitches.length === 0 ? 'NO ANOMALIES DETECTED — FREQUENCY STABLE' : 'NO MATCHES FOR CURRENT FILTER'}</p>
            {glitches.length === 0 && (
              <p style={{ fontSize: 12, opacity: 0.4, marginTop: 8 }}>
                When the simulation pushes back, log it here. Name it. Override it.
              </p>
            )}
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
        .border-top-success { border-top: 4px solid var(--color-accent-success); }

        .intel-brief {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 18px 24px;
          margin-bottom: 24px;
          border-left: 3px solid var(--color-accent-secondary);
          font-size: 13px;
          line-height: 1.6;
          color: var(--color-text-secondary);
        }
        .intel-brief strong {
          color: var(--color-accent-secondary);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .filter-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
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

        .log-glitch-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid rgba(217, 85, 85, 0.3);
          background: rgba(217, 85, 85, 0.08);
          color: var(--color-accent-danger);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .log-glitch-btn:hover {
          background: rgba(217, 85, 85, 0.15);
          border-color: rgba(217, 85, 85, 0.5);
        }

        /* FORM */
        .glitch-form {
          padding: 28px;
          margin-bottom: 24px;
          border: 1px solid rgba(124, 92, 252, 0.15);
        }
        .form-title {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          color: var(--color-accent-secondary);
          margin-bottom: 20px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .full-width { grid-column: 1 / -1; }
        .form-field label {
          display: block;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
          margin-bottom: 8px;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--color-text-primary);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          border-color: var(--color-accent-secondary);
        }
        .form-textarea { resize: vertical; }
        .form-select {
          cursor: pointer;
          appearance: none;
        }

        .severity-picker {
          display: flex;
          gap: 8px;
        }
        .sev-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--color-text-muted);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .sev-btn.critical.active { background: rgba(217, 85, 85, 0.12); color: var(--color-accent-danger); border-color: var(--color-accent-danger); }
        .sev-btn.warning.active { background: rgba(201, 168, 76, 0.12); color: var(--color-accent-primary); border-color: var(--color-accent-primary); }
        .sev-btn.info.active { background: rgba(62, 247, 232, 0.1); color: var(--color-accent-cyan); border-color: var(--color-accent-cyan); }

        .submit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          background: var(--color-accent-secondary);
          color: white;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .submit-btn:hover:not(:disabled) { filter: brightness(1.15); }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* GLITCH LIST */
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
        .glitch-card.resolved { opacity: 0.5; }

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

        .glitch-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .glitch-source {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-accent-secondary);
          opacity: 0.7;
        }

        .glitch-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: transparent;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .action-btn.resolve { color: var(--color-accent-success); }
        .action-btn.resolve:hover { background: rgba(46, 204, 143, 0.1); border-color: var(--color-accent-success); }
        .action-btn.reopen { color: var(--color-accent-primary); }
        .action-btn.reopen:hover { background: rgba(201, 168, 76, 0.1); border-color: var(--color-accent-primary); }
        .action-btn.delete { color: var(--color-text-muted); padding: 6px 8px; }
        .action-btn.delete:hover { color: var(--color-accent-danger); background: rgba(217, 85, 85, 0.1); }

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
