"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Unplug, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Zap
} from 'lucide-react';

type Connection = {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive';
  via_zapier?: boolean;
  last_sync?: string;
};

export default function Connections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('system_connections')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) {
      setConnections(data as Connection[]);
    }
    setLoading(false);
  }

  const activeCount = connections.filter(c => c.status === 'active').length;
  const progressPercent = Math.round((activeCount / connections.length) * 100) || 0;

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">CONNECTIONS</h1>
          <p className="eyebrow text-secondary">INTEGRATION MATRIX :: SYNC STATUS</p>
        </div>
      </header>

      {/* PROGRESS HUD */}
      <div className="card connection-progress-card mb-12">
        <div className="progress-header">
          <div className="progress-info">
            <span className="progress-label">CORE ARCHITECTURE SYNC</span>
            <span className="progress-value">{activeCount} / {connections.length} CONNECTED</span>
          </div>
          <span className="progress-percentage">{progressPercent}%</span>
        </div>
        <div className="progress-bar-large">
          <div className="progress-fill-gradient" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="connections-grid">
        {connections.map((conn, idx) => (
          <div key={conn.id} className={`card connection-card fade-in stagger-${(idx % 3) + 1} ${conn.status}`}>
            <div className="card-top">
              <div className="provider-logo">
                {/* Fallback logos using initials */}
                <div className="logo-placeholder">{conn.name.charAt(0)}</div>
              </div>
              <div className="status-badge">
                <div className={`dot ${conn.status}`}></div>
                <span>{conn.status.toUpperCase()}</span>
              </div>
              <button className="btn-disconnect">
                <X size={14} />
              </button>
            </div>
            
            <div className="card-body">
              <h3 className="connection-name">{conn.name}</h3>
              {conn.via_zapier && (
                <div className="zapier-badge">
                  <Zap size={10} />
                  <span>via ZAPIER</span>
                </div>
              )}
            </div>

            <div className="card-footer">
              {conn.status === 'active' ? (
                <div className="sync-info">
                  <CheckCircle2 size={12} className="text-success" />
                  <span>Last sync: 2m ago</span>
                </div>
              ) : (
                <button className="btn btn-outline btn-sm w-full">RECONNECT →</button>
              )}
            </div>
          </div>
        ))}

        {/* CONNECT NEW GHOST CARD */}
        <div className="card connect-ghost-card">
          <div className="ghost-content">
            <div className="ghost-icon">
              <Plus size={24} />
            </div>
            <span className="ghost-label">NEW INTEGRATION</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .connection-progress-card {
          padding: 32px;
          background: rgba(255, 255, 255, 0.02);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
        }

        .progress-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: var(--color-text-muted);
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .progress-value {
          font-size: 24px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--color-text-primary);
        }

        .progress-percentage {
          font-size: 24px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--color-accent-primary);
        }

        .progress-bar-large {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill-gradient {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent-secondary), var(--color-accent-cyan));
          box-shadow: 0 0 20px rgba(124, 92, 252, 0.4);
        }

        .connections-grid {
          display: grid;
          grid-template-cols: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
        }

        .connection-card {
           padding: 24px;
           display: flex;
           flex-direction: column;
           gap: 20px;
           transition: var(--transition-normal);
        }

        .connection-card.inactive {
          opacity: 0.6;
          border-style: dashed;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .provider-logo {
          width: 40px;
          height: 40px;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-placeholder {
          font-weight: 800;
          color: var(--color-accent-primary);
          font-family: var(--font-mono);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
        }

        .status-badge .dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-badge .dot.active { background: var(--color-accent-success); box-shadow: 0 0 8px var(--color-accent-success); }
        .status-badge .dot.inactive { background: var(--color-accent-danger); }

        .btn-disconnect {
          position: absolute;
          top: -12px;
          right: -12px;
          width: 24px;
          height: 24px;
          background: var(--color-bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 50%;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: var(--transition-fast);
        }

        .connection-card:hover .btn-disconnect { opacity: 1; }
        .btn-disconnect:hover { color: var(--color-accent-danger); border-color: var(--color-accent-danger); }

        .connection-name {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .zapier-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 78, 0, 0.1);
          color: #FF4E00;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          border: 1px solid rgba(255, 78, 0, 0.2);
        }

        .sync-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        .connect-ghost-card {
          border: 1px dashed var(--border-color);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .connect-ghost-card:hover {
          border-color: var(--color-accent-secondary);
          background: rgba(124, 92, 252, 0.03);
          color: var(--color-accent-secondary);
        }

        .ghost-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .ghost-icon {
          width: 48px;
          height: 48px;
          border: 1px dashed var(--border-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        .ghost-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
