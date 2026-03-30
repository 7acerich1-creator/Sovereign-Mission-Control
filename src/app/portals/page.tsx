"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Radio, Shield, Crown, UserPlus, RefreshCw,
  ChevronDown, ChevronUp, Search, Filter, Zap, Eye,
  CheckCircle, XCircle, Clock, Mail
} from 'lucide-react';

/* ==========================================================
   MEMBER MANAGEMENT — SOVEREIGN DELIVERY PIPELINE
   Shows who has access to what tier, when they purchased,
   manual grant/revoke controls. The Architect's access panel.
   ========================================================== */

type MemberAccess = {
  id: string;
  user_id: string | null;
  email: string;
  tier_slug: string;
  granted_at: string | null;
  expires_at: string | null;
  stripe_session_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  granted_by: string | null;
  created_at: string;
};

type ProductTier = {
  tier_slug: string;
  name: string;
  tier_number: number;
  amount: number;
};

const TIER_COLORS: Record<string, string> = {
  p77: '#3EF7E8',
  manifesto: '#7C5CFC',
  dp1: '#C9804C',
  dp2: '#C9804C',
  dp3: '#C9A84C',
  inner_circle: '#E8C56A',
};

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  active: { color: '#1D9E75', icon: CheckCircle },
  revoked: { color: '#E85C4C', icon: XCircle },
  expired: { color: '#7A7A8A', icon: Clock },
  pending: { color: '#E8C56A', icon: Clock },
};

export default function MemberManagement() {
  const [members, setMembers] = useState<MemberAccess[]>([]);
  const [tiers, setTiers] = useState<ProductTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Manual grant form
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantTier, setGrantTier] = useState('');
  const [granting, setGranting] = useState(false);

  // Liberation counters
  const [liberationCount, setLiberationCount] = useState(0);
  const [innerCircleCount, setInnerCircleCount] = useState(0);
  const LIBERATION_TARGET = 100000;
  const INNER_CIRCLE_TARGET = 100;

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('member-access-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_access' }, () => fetchMembers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchAll() {
    await Promise.all([fetchMembers(), fetchTiers(), fetchMetrics()]);
  }

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('member_access')
      .select('*')
      .order('created_at', { ascending: false });
    if (data && !error) {
      setMembers(data);
      setLastSync(new Date().toLocaleTimeString());
    }
    setLoading(false);
  }

  async function fetchTiers() {
    const { data } = await supabase
      .from('product_tiers')
      .select('tier_slug, name, tier_number, amount')
      .order('tier_number', { ascending: true });
    if (data) setTiers(data);
  }

  async function fetchMetrics() {
    const { data } = await supabase
      .from('sovereign_metrics')
      .select('liberation_count, inner_circle_count')
      .limit(1).single();
    if (data) {
      setLiberationCount(data.liberation_count || 0);
      setInnerCircleCount(data.inner_circle_count || 0);
    }
  }

  async function grantAccess() {
    if (!grantEmail.trim() || !grantTier) return;
    setGranting(true);
    const { error } = await supabase.from('member_access').insert({
      email: grantEmail.trim().toLowerCase(),
      tier_slug: grantTier,
      granted_at: new Date().toISOString(),
      status: 'active',
      granted_by: 'architect-manual',
    });
    if (error) {
      alert('Failed to grant access — check console.');
      console.error('Grant error:', error);
    } else {
      setGrantEmail('');
      setGrantTier('');
      setShowGrantForm(false);
      await fetchMembers();
    }
    setGranting(false);
  }

  async function revokeAccess(id: string) {
    const { error } = await supabase
      .from('member_access')
      .update({ status: 'revoked' })
      .eq('id', id);
    if (!error) await fetchMembers();
  }

  async function reactivateAccess(id: string) {
    const { error } = await supabase
      .from('member_access')
      .update({ status: 'active' })
      .eq('id', id);
    if (!error) await fetchMembers();
  }

  // Computed
  const filtered = members.filter(m => {
    const matchesSearch = !searchQuery || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || m.tier_slug === filterTier;
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const activeMembers = members.filter(m => m.status === 'active');
  const uniqueEmails = new Set(activeMembers.map(m => m.email));
  const tierCounts: Record<string, number> = {};
  activeMembers.forEach(m => { tierCounts[m.tier_slug] = (tierCounts[m.tier_slug] || 0) + 1; });

  const liberationPercent = Math.min((liberationCount / LIBERATION_TARGET) * 100, 100);
  const innerCirclePercent = Math.min((innerCircleCount / INNER_CIRCLE_TARGET) * 100, 100);

  function tierName(slug: string): string {
    const t = tiers.find(t => t.tier_slug === slug);
    return t ? t.name : slug.toUpperCase();
  }

  function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="fade-in">
      <div className="glow-orb glow-violet" style={{ top: '-15%', right: '25%' }} />
      <div className="glow-orb glow-gold" style={{ bottom: '10%', left: '-5%' }} />

      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">MEMBER MANAGEMENT</h1>
          <p className="eyebrow text-secondary">DELIVERY PIPELINE :: ACCESS CONTROL</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span className="label">ACTIVE MEMBERS</span>
            <span className="value" style={{ color: '#1D9E75' }}>{uniqueEmails.size}</span>
          </div>
          <div className="mini-stat">
            <span className="label">ACCESS GRANTS</span>
            <span className="value">{activeMembers.length}</span>
          </div>
          <div className="mini-stat">
            <span className="label">TIERS ACTIVE</span>
            <span className="value" style={{ color: '#7C5CFC' }}>{Object.keys(tierCounts).length}</span>
          </div>
        </div>
      </header>

      {/* MISSION PROGRESS */}
      <div className="mission-grid">
        <div className="card mission-card">
          <div className="mission-icon cyan"><Radio size={24} /></div>
          <div className="mission-content">
            <span className="mission-label">MINDS LIBERATED</span>
            <span className="mission-value">{liberationCount.toLocaleString()}</span>
            <div className="mission-bar"><div className="mission-fill cyan-fill" style={{ width: `${liberationPercent}%` }} /></div>
            <span className="mission-target">TARGET :: 100,000 — {liberationPercent.toFixed(2)}%</span>
          </div>
        </div>
        <div className="card mission-card">
          <div className="mission-icon gold"><Shield size={24} /></div>
          <div className="mission-content">
            <span className="mission-label">INNER CIRCLE INITIATES</span>
            <span className="mission-value">{innerCircleCount}</span>
            <div className="mission-bar"><div className="mission-fill gold-fill" style={{ width: `${innerCirclePercent}%` }} /></div>
            <span className="mission-target">TARGET :: 100 — {innerCirclePercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* TIER BREAKDOWN BAR */}
      <div className="tier-breakdown">
        <div className="tier-breakdown-header">
          <span className="tier-breakdown-title">ACCESS DISTRIBUTION</span>
        </div>
        <div className="tier-breakdown-grid">
          {tiers.map(t => (
            <div key={t.tier_slug} className="tier-count-card" style={{ '--tc': TIER_COLORS[t.tier_slug] || '#888' } as React.CSSProperties}>
              <span className="tc-num">{tierCounts[t.tier_slug] || 0}</span>
              <span className="tc-label">T{t.tier_number}</span>
              <span className="tc-name">{t.tier_slug.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SYNC + CONTROLS BAR */}
      <div className="controls-bar">
        <div className="sync-left">
          <div className="sync-dot" />
          <span>LIVE — member_access</span>
          {lastSync && <span className="sync-time">Synced: {lastSync}</span>}
        </div>
        <div className="controls-right">
          <div className="search-wrap">
            <Search size={12} />
            <input
              type="text"
              placeholder="Search email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select className="filter-select" value={filterTier} onChange={e => setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            {tiers.map(t => <option key={t.tier_slug} value={t.tier_slug}>T{t.tier_number} {t.tier_slug}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </select>
          <button className="grant-btn" onClick={() => setShowGrantForm(!showGrantForm)}>
            <UserPlus size={12} />
            GRANT ACCESS
          </button>
          <button className="sync-btn" onClick={fetchMembers} title="Refresh">
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* MANUAL GRANT FORM */}
      {showGrantForm && (
        <div className="grant-form">
          <div className="grant-form-inner">
            <div className="grant-field">
              <label>EMAIL</label>
              <input
                type="email"
                placeholder="member@example.com"
                value={grantEmail}
                onChange={e => setGrantEmail(e.target.value)}
                className="grant-input"
              />
            </div>
            <div className="grant-field">
              <label>TIER</label>
              <select value={grantTier} onChange={e => setGrantTier(e.target.value)} className="grant-select">
                <option value="">Select tier...</option>
                {tiers.map(t => <option key={t.tier_slug} value={t.tier_slug}>T{t.tier_number} — {t.name}</option>)}
              </select>
            </div>
            <button className="grant-submit" onClick={grantAccess} disabled={granting || !grantEmail.trim() || !grantTier}>
              {granting ? 'GRANTING...' : 'CONFIRM GRANT'}
            </button>
          </div>
        </div>
      )}

      {/* MEMBER TABLE */}
      {loading && members.length === 0 ? (
        <div className="loading-state">Loading member access data...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={32} />
          <p>{members.length === 0 ? 'No members yet. Access grants appear here when customers purchase via Stripe.' : 'No members match your filters.'}</p>
        </div>
      ) : (
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr>
                <th>EMAIL</th>
                <th>TIER</th>
                <th>STATUS</th>
                <th>GRANTED</th>
                <th>SOURCE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const statusConf = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConf.icon;
                const tierColor = TIER_COLORS[m.tier_slug] || '#888';
                return (
                  <tr key={m.id}>
                    <td className="member-email">
                      <Mail size={12} style={{ color: '#7A7A8A' }} />
                      {m.email}
                    </td>
                    <td>
                      <span className="tier-badge-sm" style={{ borderColor: tierColor, color: tierColor }}>
                        {m.tier_slug.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: statusConf.color }}>
                        <StatusIcon size={11} />
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(m.granted_at)}</td>
                    <td className="source-cell">{m.granted_by || '—'}</td>
                    <td className="actions-cell">
                      {m.status === 'active' ? (
                        <button className="action-btn revoke" onClick={() => revokeAccess(m.id)}>REVOKE</button>
                      ) : (
                        <button className="action-btn reactivate" onClick={() => reactivateAccess(m.id)}>REACTIVATE</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer">
            Showing {filtered.length} of {members.length} access grants
          </div>
        </div>
      )}

      <style jsx>{`
        /* === MISSION GRID (preserved) === */
        .mission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .mission-card { display: flex; gap: 24px; align-items: flex-start; }
        .mission-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid; flex-shrink: 0; }
        .mission-icon.cyan { background: rgba(62, 247, 232, 0.1); color: var(--color-accent-cyan); border-color: rgba(62, 247, 232, 0.2); }
        .mission-icon.gold { background: rgba(201, 168, 76, 0.1); color: var(--color-accent-primary); border-color: rgba(201, 168, 76, 0.2); }
        .mission-content { flex: 1; }
        .mission-label { display: block; font-size: 11px; font-weight: 800; color: var(--color-text-muted); letter-spacing: 0.15em; margin-bottom: 8px; }
        .mission-value { display: block; font-size: 36px; font-weight: 900; font-family: var(--font-mono); margin-bottom: 16px; }
        .mission-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
        .cyan-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-success)); border-radius: 3px; box-shadow: 0 0 12px rgba(62,247,232,0.3); }
        .gold-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-primary-glow)); border-radius: 3px; box-shadow: 0 0 12px rgba(201,168,76,0.3); }
        .mission-target { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); font-weight: 700; }

        /* === TIER BREAKDOWN === */
        .tier-breakdown { margin-bottom: 28px; }
        .tier-breakdown-header {
          margin-bottom: 12px;
        }
        .tier-breakdown-title {
          font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em;
          color: var(--color-text-muted); font-weight: 700;
        }
        .tier-breakdown-grid {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;
        }
        .tier-count-card {
          background: var(--color-bg-surface); border: 1px solid rgba(255,255,255,0.04);
          border-radius: 10px; padding: 16px 12px; text-align: center;
          border-top: 2px solid var(--tc);
          transition: all 0.2s;
        }
        .tier-count-card:hover {
          border-color: var(--tc);
          box-shadow: 0 0 20px rgba(255,255,255,0.02);
        }
        .tc-num {
          display: block; font-size: 28px; font-weight: 900;
          font-family: var(--font-mono); color: var(--tc);
          line-height: 1; margin-bottom: 6px;
        }
        .tc-label {
          display: block; font-size: 10px; font-weight: 800;
          font-family: var(--font-mono); color: var(--color-text-muted);
          letter-spacing: 0.15em; margin-bottom: 2px;
        }
        .tc-name {
          display: block; font-size: 8px;
          font-family: var(--font-mono); color: var(--color-text-muted);
          letter-spacing: 0.1em; opacity: 0.5;
        }

        /* === CONTROLS BAR === */
        .controls-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; gap: 12px;
          background: rgba(46, 204, 143, 0.04);
          border: 1px solid rgba(46, 204, 143, 0.12);
          border-radius: 8px; margin-bottom: 20px;
          font-family: var(--font-mono); font-size: 10px;
          letter-spacing: 0.1em; color: var(--color-text-muted);
        }
        .sync-left {
          display: flex; align-items: center; gap: 8px;
          color: #1D9E75; font-weight: 700; flex-shrink: 0;
        }
        .sync-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #1D9E75; box-shadow: 0 0 8px #1D9E75;
          animation: pulse-green 2s infinite;
        }
        .sync-time { color: var(--color-text-muted); font-weight: 400; }
        .controls-right {
          display: flex; align-items: center; gap: 10px;
        }
        .search-wrap {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 5px 10px;
          color: var(--color-text-muted);
        }
        .search-input {
          background: transparent; border: none; outline: none;
          font-family: var(--font-mono); font-size: 10px;
          color: var(--color-text-primary); width: 140px;
          letter-spacing: 0.05em;
        }
        .search-input::placeholder { color: var(--color-text-muted); opacity: 0.5; }
        .filter-select {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 5px 10px;
          font-family: var(--font-mono); font-size: 10px;
          color: var(--color-text-primary); cursor: pointer;
          letter-spacing: 0.05em;
        }
        .filter-select option { background: #0a0a0f; }
        .grant-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(124, 92, 252, 0.1); border: 1px solid rgba(124, 92, 252, 0.3);
          border-radius: 6px; padding: 5px 14px;
          font-family: var(--font-mono); font-size: 10px;
          color: #7C5CFC; cursor: pointer; letter-spacing: 0.1em;
          font-weight: 700; transition: all 0.2s;
        }
        .grant-btn:hover { background: rgba(124, 92, 252, 0.2); border-color: #7C5CFC; }
        .sync-btn {
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 5px 8px; cursor: pointer;
          color: var(--color-text-muted); transition: all 0.2s;
        }
        .sync-btn:hover { border-color: #1D9E75; color: #1D9E75; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* === GRANT FORM === */
        .grant-form {
          background: var(--color-bg-surface); border: 1px solid rgba(124, 92, 252, 0.2);
          border-radius: 10px; padding: 20px; margin-bottom: 20px;
          animation: fadeIn 0.2s ease;
        }
        .grant-form-inner {
          display: flex; align-items: flex-end; gap: 16px;
        }
        .grant-field {
          flex: 1; display: flex; flex-direction: column; gap: 6px;
        }
        .grant-field label {
          font-family: var(--font-mono); font-size: 9px;
          letter-spacing: 0.2em; color: var(--color-text-muted); font-weight: 700;
        }
        .grant-input, .grant-select {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px; padding: 10px 14px;
          font-family: var(--font-mono); font-size: 12px;
          color: var(--color-text-primary); outline: none;
          transition: border-color 0.2s;
        }
        .grant-input:focus, .grant-select:focus { border-color: #7C5CFC; }
        .grant-select option { background: #0a0a0f; }
        .grant-submit {
          background: #7C5CFC; border: none; border-radius: 6px;
          padding: 10px 24px; font-family: var(--font-mono);
          font-size: 10px; font-weight: 800; letter-spacing: 0.15em;
          color: #fff; cursor: pointer; white-space: nowrap;
          transition: all 0.2s;
        }
        .grant-submit:hover { background: #6B4CE0; }
        .grant-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === MEMBER TABLE === */
        .loading-state {
          text-align: center; padding: 80px 0;
          font-family: var(--font-mono); font-size: 13px;
          color: var(--color-text-muted); letter-spacing: 0.1em;
        }
        .empty-state {
          text-align: center; padding: 80px 0;
          color: var(--color-text-muted);
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }
        .empty-state p { font-size: 13px; max-width: 400px; line-height: 1.6; }

        .member-table-wrap {
          background: var(--color-bg-surface);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 12px; overflow: hidden;
        }
        .member-table {
          width: 100%; border-collapse: collapse;
          font-size: 12px;
        }
        .member-table thead {
          background: rgba(255,255,255,0.02);
        }
        .member-table th {
          padding: 12px 16px; text-align: left;
          font-family: var(--font-mono); font-size: 9px;
          letter-spacing: 0.2em; color: var(--color-text-muted);
          font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .member-table td {
          padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.02);
          color: var(--color-text-secondary);
          vertical-align: middle;
        }
        .member-table tr:hover td {
          background: rgba(255,255,255,0.01);
        }
        .member-email {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11px;
          color: var(--color-text-primary);
        }
        .tier-badge-sm {
          font-family: var(--font-mono); font-size: 9px;
          font-weight: 800; letter-spacing: 0.12em;
          padding: 3px 10px; border-radius: 4px;
          border: 1px solid; background: rgba(255,255,255,0.02);
        }
        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: var(--font-mono); font-size: 9px;
          font-weight: 700; letter-spacing: 0.1em;
        }
        .date-cell {
          font-family: var(--font-mono); font-size: 10px;
          color: var(--color-text-muted);
        }
        .source-cell {
          font-family: var(--font-mono); font-size: 9px;
          color: var(--color-text-muted); letter-spacing: 0.05em;
        }
        .actions-cell { white-space: nowrap; }
        .action-btn {
          font-family: var(--font-mono); font-size: 9px;
          font-weight: 700; letter-spacing: 0.1em;
          padding: 4px 12px; border-radius: 4px;
          cursor: pointer; transition: all 0.2s;
          border: 1px solid;
        }
        .action-btn.revoke {
          color: #E85C4C; background: rgba(232, 92, 76, 0.06);
          border-color: rgba(232, 92, 76, 0.2);
        }
        .action-btn.revoke:hover { background: rgba(232, 92, 76, 0.15); border-color: #E85C4C; }
        .action-btn.reactivate {
          color: #1D9E75; background: rgba(29, 158, 117, 0.06);
          border-color: rgba(29, 158, 117, 0.2);
        }
        .action-btn.reactivate:hover { background: rgba(29, 158, 117, 0.15); border-color: #1D9E75; }

        .table-footer {
          padding: 10px 16px; text-align: right;
          font-family: var(--font-mono); font-size: 9px;
          color: var(--color-text-muted); letter-spacing: 0.1em;
          border-top: 1px solid rgba(255,255,255,0.03);
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
