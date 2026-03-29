"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Brain,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Zap,
  Eye,
  Compass,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Layers,
  FileText,
  Send,
} from 'lucide-react';

/* ---- TYPES ---- */
type MissionMetrics = {
  liberation_count: number;
  total_leads: number;
  p77_conversions: number;
  manifesto_conversions: number;
  inner_circle_conversions: number;
};
type RevenueEntry = { id: string; amount: number; source: string; timestamp: string };
type CommandQueueEntry = { id: string; command: string; status: string; agent_name: string; created_at: string };
type GlitchEntry = { id: string; severity: string; description: string; detected_at: string };
type AgentHistoryEntry = { id: string; agent_name: string; content: string; created_at: string };
type KnowledgeNode = { id: string; category: string; content: string; created_at: string };

/* ---- HELPERS ---- */
function daysUntil(target: string): number {
  return Math.max(0, Math.ceil((new Date(target).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}
function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TARGET_REVENUE = 1200000;
const TARGET_DATE = "2027-01-01";
const TARGET_MINDS = 100000;

export default function SecondBrain() {
  const [metrics, setMetrics] = useState<MissionMetrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [tasks, setTasks] = useState<CommandQueueEntry[]>([]);
  const [glitches, setGlitches] = useState<GlitchEntry[]>([]);
  const [recentOps, setRecentOps] = useState<AgentHistoryEntry[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [quickNote, setQuickNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch all data sources in parallel
    Promise.all([
      supabase.from('mission_metrics').select('*').order('updated_at', { ascending: false }).limit(1),
      supabase.from('revenue_log').select('*').order('timestamp', { ascending: false }).limit(20),
      supabase.from('command_queue').select('*').in('status', ['pending', 'active', 'Pending', 'Active']).order('created_at', { ascending: false }),
      supabase.from('glitch_log').select('*').order('detected_at', { ascending: false }).limit(5),
      supabase.from('agent_history').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('knowledge_nodes').select('*').order('created_at', { ascending: false }).limit(20),
    ]).then(([mRes, rRes, tRes, gRes, aRes, kRes]) => {
      if (mRes.data?.[0]) setMetrics(mRes.data[0]);
      if (rRes.data) setRevenue(rRes.data);
      if (tRes.data) setTasks(tRes.data);
      if (gRes.data) setGlitches(gRes.data);
      if (aRes.data) setRecentOps(aRes.data);
      if (kRes.data) setKnowledgeNodes(kRes.data as KnowledgeNode[]);
    });
  }, []);

  const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const revenuePercent = Math.min(100, (totalRevenue / TARGET_REVENUE) * 100);
  const liberationCount = metrics?.liberation_count || 0;
  const liberationPercent = Math.min(100, (liberationCount / TARGET_MINDS) * 100);
  const daysLeft = daysUntil(TARGET_DATE);
  const dailyBurn = daysLeft > 0 ? ((TARGET_REVENUE - totalRevenue) / daysLeft) : 0;

  const totalConversions = (metrics?.p77_conversions || 0) + (metrics?.manifesto_conversions || 0) + (metrics?.inner_circle_conversions || 0);
  const criticalGlitches = glitches.filter(g => g.severity?.toLowerCase() === 'critical').length;
  const activeTasks = tasks.filter(t => t.status?.toLowerCase() === 'active').length;
  const pendingTasks = tasks.filter(t => t.status?.toLowerCase() === 'pending').length;

  // Quick capture
  async function handleQuickCapture() {
    if (!quickNote.trim()) return;
    setSaving(true);
    await supabase.from('knowledge_nodes').insert({ content: quickNote.trim(), category: 'brain-capture', tags: [] });
    setQuickNote('');
    setSaving(false);
    const { data } = await supabase.from('knowledge_nodes').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setKnowledgeNodes(data as KnowledgeNode[]);
  }

  return (
    <div className="higher-mind fade-in">
      <header className="hm-header">
        <div className="hm-title-row">
          <Brain size={28} className="hm-icon" />
          <div>
            <h1 className="hm-title">HIGHER MIND</h1>
            <p className="hm-subtitle">STRATEGIC OVERVIEW :: SOVEREIGN SYNTHESIS</p>
          </div>
        </div>
        <div className="hm-countdown">
          <span className="hm-days">{daysLeft}</span>
          <span className="hm-days-label">DAYS TO TARGET</span>
        </div>
      </header>

      {/* === PRIMARY METRICS === */}
      <section className="hm-metrics">
        <div className="hm-metric-card gold">
          <div className="hm-mc-top">
            <DollarSign size={16} />
            <span className="hm-mc-label">REVENUE</span>
          </div>
          <span className="hm-mc-value">${totalRevenue.toLocaleString()}</span>
          <div className="hm-progress-bar">
            <div className="hm-progress-fill gold-fill" style={{ width: `${revenuePercent}%` }} />
          </div>
          <span className="hm-mc-target">{revenuePercent.toFixed(1)}% of $1.2M</span>
        </div>

        <div className="hm-metric-card cyan">
          <div className="hm-mc-top">
            <Users size={16} />
            <span className="hm-mc-label">LIBERATION</span>
          </div>
          <span className="hm-mc-value">{liberationCount.toLocaleString()}</span>
          <div className="hm-progress-bar">
            <div className="hm-progress-fill cyan-fill" style={{ width: `${liberationPercent}%` }} />
          </div>
          <span className="hm-mc-target">{liberationPercent.toFixed(1)}% of 100K minds</span>
        </div>

        <div className="hm-metric-card violet">
          <div className="hm-mc-top">
            <TrendingUp size={16} />
            <span className="hm-mc-label">DAILY BURN RATE</span>
          </div>
          <span className="hm-mc-value">${Math.round(dailyBurn).toLocaleString()}</span>
          <span className="hm-mc-target">required per day to hit target</span>
        </div>

        <div className="hm-metric-card green">
          <div className="hm-mc-top">
            <Target size={16} />
            <span className="hm-mc-label">CONVERSIONS</span>
          </div>
          <span className="hm-mc-value">{totalConversions}</span>
          <div className="hm-mc-breakdown">
            <span>P77: {metrics?.p77_conversions || 0}</span>
            <span>MAP: {metrics?.manifesto_conversions || 0}</span>
            <span>IC: {metrics?.inner_circle_conversions || 0}</span>
          </div>
        </div>
      </section>

      {/* === STRATEGIC GRID === */}
      <div className="hm-grid">

        {/* LEFT: Operational Pulse */}
        <div className="hm-column">

          {/* ACTIVE OPERATIONS */}
          <div className="hm-card">
            <div className="hm-card-header">
              <Zap size={14} />
              <span>OPERATIONAL PULSE</span>
              <span className="hm-badge">{activeTasks} ACTIVE / {pendingTasks} QUEUED</span>
            </div>
            <div className="hm-ops-list">
              {tasks.slice(0, 6).map(t => (
                <div key={t.id} className="hm-ops-row">
                  <span className={`hm-ops-dot ${t.status?.toLowerCase()}`} />
                  <span className="hm-ops-agent">{t.agent_name || '---'}</span>
                  <span className="hm-ops-cmd">{t.command}</span>
                </div>
              ))}
              {tasks.length === 0 && <div className="hm-empty">No active operations</div>}
            </div>
            <Link href="/" className="hm-card-link">VIEW ALL TASKS <ArrowRight size={12} /></Link>
          </div>

          {/* ANOMALY RADAR */}
          <div className="hm-card">
            <div className="hm-card-header">
              <AlertTriangle size={14} />
              <span>ANOMALY RADAR</span>
              {criticalGlitches > 0 && <span className="hm-badge danger">{criticalGlitches} CRITICAL</span>}
            </div>
            <div className="hm-glitch-list">
              {glitches.slice(0, 4).map(g => (
                <div key={g.id} className="hm-glitch-row">
                  <div className={`hm-glitch-dot ${g.severity?.toLowerCase()}`} />
                  <span className="hm-glitch-text">{g.description?.slice(0, 80)}{(g.description?.length || 0) > 80 ? '...' : ''}</span>
                  <span className="hm-glitch-time">{g.detected_at ? timeAgo(g.detected_at) : '---'}</span>
                </div>
              ))}
              {glitches.length === 0 && (
                <div className="hm-clear-state">
                  <CheckCircle size={16} />
                  <span>ALL SYSTEMS NOMINAL</span>
                </div>
              )}
            </div>
          </div>

          {/* QUICK CAPTURE */}
          <div className="hm-card">
            <div className="hm-card-header">
              <FileText size={14} />
              <span>QUICK CAPTURE</span>
            </div>
            <div className="hm-capture">
              <textarea
                className="hm-capture-input"
                placeholder="Capture a thought, decision, or insight..."
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickCapture(); } }}
              />
              <button className="hm-capture-btn" onClick={handleQuickCapture} disabled={saving || !quickNote.trim()}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Intelligence Feed */}
        <div className="hm-column">

          {/* CREW INTELLIGENCE */}
          <div className="hm-card">
            <div className="hm-card-header">
              <Eye size={14} />
              <span>CREW INTELLIGENCE</span>
            </div>
            <div className="hm-intel-feed">
              {recentOps.slice(0, 8).map(op => (
                <div key={op.id} className="hm-intel-row">
                  <span className="hm-intel-agent">{op.agent_name?.toUpperCase() || 'SYSTEM'}</span>
                  <span className="hm-intel-content">{op.content?.slice(0, 120)}{(op.content?.length || 0) > 120 ? '...' : ''}</span>
                  <span className="hm-intel-time">{timeAgo(op.created_at)}</span>
                </div>
              ))}
              {recentOps.length === 0 && <div className="hm-empty">No recent crew activity</div>}
            </div>
            <Link href="/crew" className="hm-card-link">VIEW FULL CREW <ArrowRight size={12} /></Link>
          </div>

          {/* KNOWLEDGE ARCHIVE */}
          <div className="hm-card">
            <div className="hm-card-header">
              <Layers size={14} />
              <span>KNOWLEDGE ARCHIVE</span>
              <span className="hm-badge">{knowledgeNodes.length} NODES</span>
            </div>
            <div className="hm-knowledge-list">
              {knowledgeNodes.slice(0, 6).map(n => (
                <div key={n.id} className="hm-knowledge-row">
                  <span className="hm-k-cat">{n.category?.toUpperCase()}</span>
                  <span className="hm-k-content">{n.content?.slice(0, 100)}{(n.content?.length || 0) > 100 ? '...' : ''}</span>
                  <span className="hm-k-time">{timeAgo(n.created_at)}</span>
                </div>
              ))}
              {knowledgeNodes.length === 0 && <div className="hm-empty">No stored knowledge yet</div>}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .higher-mind {
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px 60px;
        }

        .hm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 0 0;
        }
        .hm-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hm-icon { color: #7C5CFC; }
        .hm-title {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--color-text-primary);
        }
        .hm-subtitle {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          letter-spacing: 0.12em;
          margin-top: 4px;
        }
        .hm-countdown {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 12px;
          padding: 12px 24px;
        }
        .hm-days {
          font-size: 32px;
          font-weight: 900;
          color: #C9A84C;
          font-family: var(--font-mono);
          line-height: 1;
        }
        .hm-days-label {
          font-size: 8px;
          font-weight: 800;
          color: #C9A84C;
          letter-spacing: 0.12em;
          margin-top: 4px;
        }

        /* METRICS */
        .hm-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .hm-metric-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hm-metric-card.gold { border-left: 3px solid #C9A84C; }
        .hm-metric-card.cyan { border-left: 3px solid #3EF7E8; }
        .hm-metric-card.violet { border-left: 3px solid #7C5CFC; }
        .hm-metric-card.green { border-left: 3px solid #1D9E75; }

        .hm-mc-top {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
        }
        .hm-mc-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
          font-family: var(--font-mono);
        }
        .hm-mc-value {
          font-size: 26px;
          font-weight: 900;
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          line-height: 1.1;
        }
        .hm-progress-bar {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .hm-progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s ease;
        }
        .gold-fill { background: linear-gradient(90deg, #C9A84C, #e8d48b); }
        .cyan-fill { background: linear-gradient(90deg, #3EF7E8, #7CFCE4); }

        .hm-mc-target {
          font-size: 9px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }
        .hm-mc-breakdown {
          display: flex;
          gap: 12px;
          font-size: 9px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        /* GRID */
        .hm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .hm-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* CARDS */
        .hm-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
        }
        .hm-card-header {
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
        .hm-badge {
          margin-left: auto;
          background: rgba(124,92,252,0.15);
          color: #7C5CFC;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 800;
        }
        .hm-badge.danger {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
        }
        .hm-card-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 20px;
          border-top: 1px solid var(--border-color);
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          color: #7C5CFC;
          text-decoration: none;
          transition: background 0.15s;
        }
        .hm-card-link:hover { background: rgba(124,92,252,0.05); }

        /* OPS */
        .hm-ops-list { padding: 8px 0; }
        .hm-ops-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 20px;
          font-size: 11px;
        }
        .hm-ops-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .hm-ops-dot.active { background: #1D9E75; box-shadow: 0 0 6px rgba(29,158,117,0.6); }
        .hm-ops-dot.pending { background: #C9A84C; }
        .hm-ops-agent {
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          min-width: 60px;
          color: var(--color-text-muted);
        }
        .hm-ops-cmd {
          font-size: 11px;
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* GLITCH */
        .hm-glitch-list { padding: 8px 0; }
        .hm-glitch-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 20px;
        }
        .hm-glitch-dot {
          width: 6px; height: 6px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;
        }
        .hm-glitch-dot.critical { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.6); }
        .hm-glitch-dot.warning { background: #C9A84C; }
        .hm-glitch-dot.info { background: #3EF7E8; }
        .hm-glitch-text {
          font-size: 11px;
          color: var(--color-text-secondary);
          flex: 1;
          line-height: 1.4;
        }
        .hm-glitch-time {
          font-size: 9px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          flex-shrink: 0;
        }
        .hm-clear-state {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px;
          color: #1D9E75;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-mono);
        }

        /* INTEL FEED */
        .hm-intel-feed { padding: 4px 0; }
        .hm-intel-row {
          display: grid;
          grid-template-columns: 70px 1fr auto;
          gap: 10px;
          padding: 10px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          align-items: start;
        }
        .hm-intel-agent {
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: #7C5CFC;
          letter-spacing: 0.05em;
        }
        .hm-intel-content {
          font-size: 11px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }
        .hm-intel-time {
          font-size: 9px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        /* KNOWLEDGE */
        .hm-knowledge-list { padding: 4px 0; }
        .hm-knowledge-row {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 10px;
          padding: 10px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          align-items: start;
        }
        .hm-k-cat {
          font-size: 8px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: #C9A84C;
          background: rgba(201,168,76,0.1);
          padding: 2px 6px;
          border-radius: 3px;
          text-align: center;
        }
        .hm-k-content {
          font-size: 11px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }
        .hm-k-time {
          font-size: 9px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        /* CAPTURE */
        .hm-capture {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 16px 20px;
        }
        .hm-capture-input {
          flex: 1;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          font-size: 12px;
          resize: none;
          min-height: 60px;
          outline: none;
        }
        .hm-capture-input:focus { border-color: #7C5CFC; }
        .hm-capture-btn {
          background: #7C5CFC;
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: opacity 0.2s;
        }
        .hm-capture-btn:hover { opacity: 0.85; }
        .hm-capture-btn:disabled { opacity: 0.3; cursor: default; }

        .hm-empty {
          padding: 24px 20px;
          text-align: center;
          color: var(--color-text-muted);
          font-size: 11px;
          font-family: var(--font-mono);
        }

        @media (max-width: 1100px) {
          .hm-metrics { grid-template-columns: repeat(2, 1fr); }
          .hm-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .hm-metrics { grid-template-columns: 1fr; }
          .hm-header { flex-direction: column; gap: 16px; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
