"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Radio, Zap, Rocket, Shield, Star } from 'lucide-react';

type OpalApp = {
  id: string;
  name: string;
  description: string;
  tier: 'Alpha' | 'Beta' | 'Omega';
  status: 'online' | 'offline' | 'maintenance';
  color: string;
};

export default function InitiatePortals() {
  const [liberationCount, setLiberationCount] = useState(0);
  const [innerCircleCount, setInnerCircleCount] = useState(0);

  const LIBERATION_TARGET = 100000;
  const INNER_CIRCLE_TARGET = 100;

  const opalApps: OpalApp[] = [
    { id: 'alpha', name: 'OPAL-ALPHA', description: 'Entry-level frequency alignment. First contact with the Architecture.', tier: 'Alpha', status: 'online', color: '#3EF7E8' },
    { id: 'beta', name: 'OPAL-BETA', description: 'Advanced habit deconstruction protocol. Breaks legacy loops and rewires behavioral firmware.', tier: 'Beta', status: 'online', color: '#7C5CFC' },
    { id: 'omega', name: 'OPAL-OMEGA', description: 'Architectural manifestation & goal tracking. Full sovereign integration.', tier: 'Omega', status: 'maintenance', color: '#C9A84C' },
  ];

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('metrics-portal-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sovereign_metrics' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const { data } = await supabase
      .from('sovereign_metrics')
      .select('liberation_count, inner_circle_count')
      .limit(1).single();
    if (data) {
      setLiberationCount(data.liberation_count || 0);
      setInnerCircleCount(data.inner_circle_count || 0);
    }
  }

  const liberationPercent = Math.min((liberationCount / LIBERATION_TARGET) * 100, 100);
  const innerCirclePercent = Math.min((innerCircleCount / INNER_CIRCLE_TARGET) * 100, 100);

  return (
    <div className="fade-in">
      <div className="glow-orb glow-violet" style={{ top: '-15%', right: '25%' }} />

      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">INITIATE PORTALS</h1>
          <p className="eyebrow text-secondary">LIBERATION FREQUENCY :: OPAL ENGINE</p>
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

      {/* OPAL PORTALS */}
      <div className="section-header">
        <h2 className="h2-display">OPAL MINI-APPS</h2>
        <span className="portal-count">{opalApps.filter(a => a.status === 'online').length} / {opalApps.length} ACTIVE</span>
      </div>

      <div className="portals-grid">
        {opalApps.map((app, idx) => (
          <div key={app.id} className={`card portal-card fade-in stagger-${idx + 1}`} style={{ '--portal-color': app.color } as any}>
            <div className="portal-header">
              <div className="portal-tier" style={{ borderColor: app.color, color: app.color }}>{app.tier.toUpperCase()}</div>
              <div className={`portal-status ${app.status}`}>
                <div className="dot-sm" />
                <span>{app.status.toUpperCase()}</span>
              </div>
            </div>
            <h3 className="portal-name">{app.name}</h3>
            <p className="portal-desc">{app.description}</p>
            <button className={`btn ${app.status === 'online' ? 'btn-primary' : 'btn-outline'}`} disabled={app.status !== 'online'}
              style={app.status === 'online' ? { background: app.color, color: '#050508' } : {}}>
              {app.status === 'online' ? 'LAUNCH PORTAL →' : 'UPGRADING...'}
            </button>
          </div>
        ))}
      </div>

      {/* FREQUENCY WAVE */}
      <div className="card freq-card">
        <div className="freq-header">
          <h2 className="h2-display">LIBERATION FREQUENCY</h2>
          <div className="freq-live"><span className="freq-label">LIVE</span><div className="freq-dot" /></div>
        </div>
        <div className="freq-wave">
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} className="freq-bar" style={{ height: `${10 + Math.sin(i * 0.5) * 30 + Math.random() * 15}px`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
        .h1-display { font-size: 48px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
        .eyebrow { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.28em; }

        .mission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 48px; }
        .mission-card { display: flex; gap: 24px; align-items: flex-start; }
        .mission-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid; }
        .mission-icon.cyan { background: rgba(62, 247, 232, 0.1); color: var(--color-accent-cyan); border-color: rgba(62, 247, 232, 0.2); }
        .mission-icon.gold { background: rgba(201, 168, 76, 0.1); color: var(--color-accent-primary); border-color: rgba(201, 168, 76, 0.2); }
        .mission-content { flex: 1; }
        .mission-label { display: block; font-size: 11px; font-weight: 800; color: var(--color-text-muted); letter-spacing: 0.15em; margin-bottom: 8px; }
        .mission-value { display: block; font-size: 36px; font-weight: 900; font-family: var(--font-mono); margin-bottom: 16px; }
        .mission-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
        .cyan-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-success)); border-radius: 3px; box-shadow: 0 0 12px rgba(62,247,232,0.3); }
        .gold-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-primary-glow)); border-radius: 3px; box-shadow: 0 0 12px rgba(201,168,76,0.3); }
        .mission-target { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); font-weight: 700; }

        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .h2-display { font-size: 24px; font-weight: 800; }
        .portal-count { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); font-weight: 700; }

        .portals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px; }
        .portal-card { display: flex; flex-direction: column; }
        .portal-card:hover { border-color: var(--portal-color); }
        .portal-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .portal-tier { font-size: 10px; font-weight: 900; font-family: var(--font-mono); letter-spacing: 0.15em; padding: 4px 12px; border-radius: 20px; border: 1px solid; }
        .portal-status { display: flex; align-items: center; gap: 6px; font-size: 9px; font-weight: 800; font-family: var(--font-mono); }
        .dot-sm { width: 6px; height: 6px; border-radius: 50%; }
        .portal-status.online { color: var(--color-accent-success); }
        .portal-status.online .dot-sm { background: var(--color-accent-success); box-shadow: 0 0 8px var(--color-accent-success); }
        .portal-status.maintenance { color: var(--color-accent-primary); }
        .portal-status.maintenance .dot-sm { background: var(--color-accent-primary); }
        .portal-name { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
        .portal-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 32px; flex: 1; }

        .freq-card { padding: 32px; }
        .freq-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .freq-live { display: flex; align-items: center; gap: 8px; }
        .freq-label { font-size: 9px; font-weight: 800; color: var(--color-accent-success); letter-spacing: 0.1em; }
        .freq-dot { width: 6px; height: 6px; background: var(--color-accent-success); border-radius: 50%; box-shadow: 0 0 8px var(--color-accent-success); animation: pulse-green 2s infinite; }
        .freq-wave { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
        .freq-bar { flex: 1; background: linear-gradient(180deg, var(--color-accent-cyan), transparent); border-radius: 2px 2px 0 0; opacity: 0.7; animation: wave 2s ease-in-out infinite; }
        @keyframes wave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.6); } }
      `}</style>
    </div>
  );
}
