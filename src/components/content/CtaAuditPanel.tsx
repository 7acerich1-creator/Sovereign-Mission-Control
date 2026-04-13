"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck,
  ShieldX,
  SkipForward,
  AlertTriangle,
  ExternalLink,
  Eye,
  RefreshCw,
} from 'lucide-react';

type Proposal = {
  id: string;
  video_id: string;
  video_title: string;
  brand: string;
  channel: string;
  views: number;
  ctr: number | null;
  issues_found: string[];
  current_description: string;
  proposed_description: string | null;
  proposed_comment: string | null;
  status: string;
  reviewed_at: string | null;
  executed_at: string | null;
  created_at: string;
};

export default function CtaAuditPanel() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending_review' | 'all'>('pending_review');

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('cta_audit_proposals')
      .select('*')
      .order('status', { ascending: true })
      .order('views', { ascending: false });

    if (filter === 'pending_review') {
      query = query.eq('status', 'pending_review');
    }

    const { data } = await query;
    setProposals((data as Proposal[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  async function handleAction(id: string, status: 'approved' | 'rejected' | 'skipped') {
    setActing(id);
    try {
      const res = await fetch('/api/cta-proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setProposals(prev => prev.map(p =>
          p.id === id ? { ...p, status, reviewed_at: new Date().toISOString() } : p
        ));
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActing(null);
    }
  }

  const pendingCount = proposals.filter(p => p.status === 'pending_review').length;

  return (
    <div className="cta-panel">
      {/* Header bar */}
      <div className="cta-header">
        <div className="cta-header-left">
          <h2 className="panel-title">CTA AUDIT PROPOSALS</h2>
          {pendingCount > 0 && (
            <span className="pending-count">{pendingCount} PENDING</span>
          )}
        </div>
        <div className="cta-header-right">
          <div className="filter-pills">
            <button
              className={`pill ${filter === 'pending_review' ? 'active' : ''}`}
              onClick={() => setFilter('pending_review')}
            >PENDING</button>
            <button
              className={`pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >ALL</button>
          </div>
          <button className="btn-refresh-sm" onClick={fetchProposals}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="panel-empty">
          <RefreshCw size={20} className="spin-icon" />
          <p>LOADING PROPOSALS...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="panel-empty">
          <ShieldCheck size={28} />
          <p>No pending proposals. Audits run weekly — check back Monday.</p>
        </div>
      ) : (
        <div className="proposal-list">
          {proposals.map(p => (
            <div key={p.id} className={`proposal-card status-${p.status}`}>
              {/* Card header */}
              <div className="proposal-header">
                <div className="proposal-meta">
                  <a
                    href={`https://youtube.com/watch?v=${p.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proposal-title-link"
                  >
                    {p.video_title} <ExternalLink size={12} />
                  </a>
                  <div className="proposal-tags">
                    <span className="tag tag-channel">{p.channel || p.brand}</span>
                    <span className="tag tag-views"><Eye size={10} /> {(p.views || 0).toLocaleString()}</span>
                    {p.ctr !== null && <span className="tag tag-ctr">CTR {p.ctr}%</span>}
                    <span className={`tag tag-status tag-${p.status}`}>{p.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {p.issues_found && p.issues_found.length > 0 && (
                <div className="issues-row">
                  {p.issues_found.map((issue, i) => (
                    <span key={i} className="issue-badge">
                      <AlertTriangle size={10} /> {issue}
                    </span>
                  ))}
                </div>
              )}

              {/* Diff view */}
              {p.proposed_description && (
                <div className="diff-view">
                  <div className="diff-col diff-current">
                    <span className="diff-label">CURRENT</span>
                    <pre className="diff-text">{p.current_description || '(empty)'}</pre>
                  </div>
                  <div className="diff-col diff-proposed">
                    <span className="diff-label">PROPOSED</span>
                    <pre className="diff-text">{p.proposed_description}</pre>
                  </div>
                </div>
              )}

              {/* Proposed comment */}
              {p.proposed_comment && (
                <div className="proposed-comment">
                  <span className="diff-label">PINNED COMMENT</span>
                  <pre className="diff-text">{p.proposed_comment}</pre>
                </div>
              )}

              {/* Actions */}
              {p.status === 'pending_review' && (
                <div className="proposal-actions">
                  <button
                    className="action-btn approve"
                    onClick={() => handleAction(p.id, 'approved')}
                    disabled={acting === p.id}
                  >
                    <ShieldCheck size={14} /> APPROVE
                  </button>
                  <button
                    className="action-btn reject"
                    onClick={() => handleAction(p.id, 'rejected')}
                    disabled={acting === p.id}
                  >
                    <ShieldX size={14} /> REJECT
                  </button>
                  <button
                    className="action-btn skip"
                    onClick={() => handleAction(p.id, 'skipped')}
                    disabled={acting === p.id}
                  >
                    <SkipForward size={14} /> SKIP
                  </button>
                </div>
              )}

              {/* Executed timestamp */}
              {p.status === 'executed' && p.executed_at && (
                <div className="executed-stamp">
                  Pushed to YouTube {new Date(p.executed_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .cta-panel { display: flex; flex-direction: column; gap: 0; }
        .cta-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .cta-header-left { display: flex; align-items: center; gap: 12px; }
        .cta-header-right { display: flex; align-items: center; gap: 12px; }
        .panel-title { font-size: 11px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; margin: 0; }
        .pending-count { font-size: 10px; font-weight: 800; font-family: var(--font-mono); color: #E5850F; background: rgba(229,133,15,0.12); padding: 3px 10px; border-radius: 12px; letter-spacing: 0.08em; }

        .filter-pills { display: flex; gap: 4px; }
        .pill { background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 10px; font-size: 9px; font-weight: 700; font-family: var(--font-mono); color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); letter-spacing: 0.05em; }
        .pill:hover { border-color: var(--color-text-secondary); color: var(--color-text-secondary); }
        .pill.active { border-color: var(--color-accent-secondary); color: var(--color-accent-secondary); background: rgba(124,92,252,0.08); }

        .btn-refresh-sm { background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px; color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); display: flex; align-items: center; }
        .btn-refresh-sm:hover { border-color: var(--color-text-secondary); color: var(--color-text-secondary); }

        .panel-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: var(--color-text-muted); gap: 12px; }
        .panel-empty p { font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.08em; }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .proposal-list { display: flex; flex-direction: column; gap: 16px; }

        .proposal-card { background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 20px; transition: var(--transition-fast); }
        .proposal-card.status-pending_review { border-left: 3px solid #E5850F; }
        .proposal-card.status-approved { border-left: 3px solid var(--color-accent-secondary); opacity: 0.7; }
        .proposal-card.status-executed { border-left: 3px solid var(--color-accent-success); opacity: 0.6; }
        .proposal-card.status-rejected { border-left: 3px solid var(--color-accent-danger); opacity: 0.5; }
        .proposal-card.status-skipped { border-left: 3px solid var(--color-text-muted); opacity: 0.5; }

        .proposal-header { margin-bottom: 12px; }
        .proposal-title-link { font-size: 14px; font-weight: 600; color: var(--color-text-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: var(--transition-fast); }
        .proposal-title-link:hover { color: var(--color-accent-primary); }

        .proposal-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .tag { font-size: 9px; font-weight: 700; font-family: var(--font-mono); padding: 2px 8px; border-radius: 4px; letter-spacing: 0.06em; display: inline-flex; align-items: center; gap: 4px; }
        .tag-channel { background: rgba(124,92,252,0.1); color: var(--color-accent-secondary); }
        .tag-views { background: rgba(255,255,255,0.04); color: var(--color-text-secondary); }
        .tag-ctr { background: rgba(62,247,232,0.1); color: var(--color-cyan); }
        .tag-status { text-transform: uppercase; }
        .tag-pending_review { background: rgba(229,133,15,0.12); color: #E5850F; }
        .tag-approved { background: rgba(124,92,252,0.1); color: var(--color-accent-secondary); }
        .tag-executed { background: rgba(46,204,139,0.1); color: var(--color-accent-success); }
        .tag-rejected { background: rgba(217,85,85,0.1); color: var(--color-accent-danger); }
        .tag-skipped { background: rgba(255,255,255,0.04); color: var(--color-text-muted); }

        .issues-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .issue-badge { font-size: 10px; font-weight: 600; font-family: var(--font-mono); color: var(--color-accent-danger); background: rgba(217,85,85,0.08); border: 1px solid rgba(217,85,85,0.2); padding: 3px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; }

        .diff-view { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .diff-col { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; overflow: hidden; }
        .diff-current { opacity: 0.5; }
        .diff-proposed { border-color: rgba(229,133,15,0.3); }
        .diff-label { font-size: 8px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; display: block; margin-bottom: 8px; }
        .diff-text { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-secondary); white-space: pre-wrap; word-break: break-word; margin: 0; line-height: 1.6; max-height: 200px; overflow-y: auto; }

        .proposed-comment { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 14px; }

        .proposal-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-color); }
        .action-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-button); font-size: 10px; font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.08em; cursor: pointer; transition: var(--transition-fast); border: 1px solid transparent; }
        .action-btn:disabled { opacity: 0.4; pointer-events: none; }
        .action-btn.approve { background: rgba(46,204,139,0.1); color: var(--color-accent-success); border-color: rgba(46,204,139,0.3); }
        .action-btn.approve:hover { background: rgba(46,204,139,0.2); }
        .action-btn.reject { background: rgba(217,85,85,0.08); color: var(--color-accent-danger); border-color: rgba(217,85,85,0.2); }
        .action-btn.reject:hover { background: rgba(217,85,85,0.15); }
        .action-btn.skip { background: rgba(255,255,255,0.03); color: var(--color-text-muted); border-color: var(--border-color); }
        .action-btn.skip:hover { color: var(--color-text-secondary); }

        .executed-stamp { font-size: 10px; font-family: var(--font-mono); color: var(--color-accent-success); padding-top: 10px; border-top: 1px solid var(--border-color); letter-spacing: 0.05em; }

        @media (max-width: 768px) { .diff-view { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
