"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Eye, Zap, Shield, Flame, Cpu, Crown, Lock,
  ExternalLink, ArrowRight, ChevronDown, ChevronUp,
  RefreshCw, BookOpen
} from 'lucide-react';

/* ==========================================================
   PRODUCTS PAGE — SOVEREIGN FUNNEL ARCHITECTURE
   Reads live from Supabase product_tiers table.
   This is the Architect's quality control panel —
   what you see here is what your clients receive.
   ========================================================== */

type CurriculumModule = {
  module: string;
  module_name: string;
  lessons: { num: number; title: string }[];
};

type CurriculumPhase = {
  phase: number;
  phase_name: string;
  codename: string;
  transmissions: { num: string; title: string; subtitle: string | null }[];
};

type ProductTier = {
  price_id: string;
  name: string;
  tier_slug: string;
  amount: number;
  tier_number: number;
  codename: string;
  subtitle: string;
  phase_name: string | null;
  phase_codename: string | null;
  portal_url: string | null;
  sales_url: string | null;
  thank_you_url: string | null;
  status: string;
  curriculum: (CurriculumModule | CurriculumPhase)[];
  features: string[];
  psych_op: string;
  updated_at: string;
};

const TIER_COLORS: Record<string, { color: string; glow: string; border: string; icon: any }> = {
  p77:          { color: '#3EF7E8', glow: 'rgba(62, 247, 232, 0.12)', border: 'rgba(62, 247, 232, 0.25)', icon: Shield },
  manifesto:    { color: '#7C5CFC', glow: 'rgba(124, 92, 252, 0.12)', border: 'rgba(124, 92, 252, 0.25)', icon: Flame },
  dp1:          { color: '#C9804C', glow: 'rgba(201, 128, 76, 0.12)', border: 'rgba(201, 128, 76, 0.25)', icon: Cpu },
  dp2:          { color: '#C9804C', glow: 'rgba(201, 128, 76, 0.12)', border: 'rgba(201, 128, 76, 0.25)', icon: Cpu },
  dp3:          { color: '#C9A84C', glow: 'rgba(201, 168, 76, 0.15)', border: 'rgba(201, 168, 76, 0.25)', icon: Crown },
  inner_circle: { color: '#E8C56A', glow: 'rgba(232, 197, 106, 0.15)', border: 'rgba(232, 197, 106, 0.3)', icon: Lock },
};

function formatPrice(amount: number): string {
  if (amount === 0) return 'FREE';
  return '$' + amount.toLocaleString();
}

export default function ProductsPage() {
  const [expandedTier, setExpandedTier] = useState<number | null>(null);
  const [tiers, setTiers] = useState<ProductTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    fetchTiers();
    const channel = supabase
      .channel('product-tier-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_tiers' }, () => fetchTiers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchTiers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_tiers')
      .select('*')
      .order('tier_number', { ascending: true });
    if (data && !error) {
      setTiers(data as ProductTier[]);
      setLastSync(new Date().toLocaleTimeString());
    }
    setLoading(false);
  }

  const totalProducts = tiers.length;
  const liveProducts = tiers.filter(t => t.status === 'live').length;
  const totalValue = tiers.reduce((sum, t) => sum + (t.status !== 'application' ? Number(t.amount) : 0), 0);

  return (
    <div className="fade-in">
      <div className="glow-orb glow-violet" style={{ top: '-10%', right: '15%' }} />
      <div className="glow-orb glow-gold" style={{ bottom: '10%', left: '-5%' }} />

      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">FUNNEL ARCHITECTURE</h1>
          <p className="eyebrow text-secondary">PRODUCT PIPELINE :: LIVE FROM SUPABASE</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span className="label">TIERS</span>
            <span className="value">{totalProducts}</span>
          </div>
          <div className="mini-stat">
            <span className="label">LIVE</span>
            <span className="value" style={{ color: '#1D9E75' }}>{liveProducts}</span>
          </div>
          <div className="mini-stat">
            <span className="label">STACK VALUE</span>
            <span className="value" style={{ color: '#E8C56A' }}>${totalValue.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* SYNC STATUS */}
      <div className="sync-bar">
        <div className="sync-left">
          <div className="sync-dot" />
          <span>LIVE — SUPABASE product_tiers</span>
        </div>
        {lastSync && <span className="sync-time">Last sync: {lastSync}</span>}
        <button className="sync-btn" onClick={fetchTiers} title="Refresh">
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* FUNNEL FLOW VISUALIZATION */}
      {loading && tiers.length === 0 ? (
        <div className="loading-state">Loading product tiers...</div>
      ) : (
        <section className="funnel-flow">
          {tiers.map((tier, idx) => {
            const visual = TIER_COLORS[tier.tier_slug] || TIER_COLORS.dp1;
            const Icon = visual.icon;
            const isExpanded = expandedTier === tier.tier_number;
            const isLast = idx === tiers.length - 1;
            const hasCurriculum = tier.curriculum && tier.curriculum.length > 0;

            return (
              <div key={tier.tier_slug} className="tier-wrapper">
                <div
                  className={`tier-card ${isExpanded ? 'expanded' : ''}`}
                  style={{
                    '--tier-color': visual.color,
                    '--tier-glow': visual.glow,
                    '--tier-border': visual.border,
                  } as React.CSSProperties}
                  onClick={() => setExpandedTier(isExpanded ? null : tier.tier_number)}
                >
                  {/* TIER HEADER */}
                  <div className="tier-header">
                    <div className="tier-left">
                      <div className="tier-icon-wrap">
                        <Icon size={16} />
                      </div>
                      <div className="tier-meta">
                        <div className="tier-badge">
                          <span className="tier-num">T{tier.tier_number}</span>
                          <span className="tier-codename">{tier.codename}</span>
                        </div>
                        <h3 className="tier-title">{tier.name}</h3>
                        <p className="tier-subtitle">{tier.subtitle}</p>
                      </div>
                    </div>
                    <div className="tier-right">
                      <div className="tier-price">
                        {tier.status === 'application' ? 'APPLICATION' : formatPrice(Number(tier.amount))}
                      </div>
                      {tier.phase_name && (
                        <div className="tier-phase-badge">{tier.phase_name}</div>
                      )}
                      <div className={`tier-status status-${tier.status}`}>
                        <span className="status-dot-sm" />
                        {tier.status.toUpperCase()}
                      </div>
                      <div className="tier-chevron">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DETAIL */}
                  {isExpanded && (
                    <div className="tier-detail">
                      <div className="tier-detail-grid">
                        <div className="detail-section">
                          <div className="detail-label">PSYCH FUNCTION</div>
                          <div className="detail-value psych-op">{tier.psych_op}</div>
                        </div>
                        <div className="detail-section">
                          <div className="detail-label">INCLUDES</div>
                          <ul className="detail-features">
                            {(tier.features || []).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* CURRICULUM — The actual deliverable */}
                      {hasCurriculum && (
                        <div className="curriculum-section">
                          <div className="curriculum-header">
                            <BookOpen size={14} />
                            <span>CURRICULUM — WHAT THE CLIENT RECEIVES</span>
                          </div>
                          {tier.curriculum.map((item: any, ci: number) => (
                            <div key={ci} className="curriculum-block">
                              {'module' in item && item.module_name ? (
                                <>
                                  <div className="curriculum-module-name">
                                    MODULE {item.module} // {item.module_name}
                                  </div>
                                  <div className="curriculum-lessons">
                                    {(item.lessons || []).map((l: any, li: number) => (
                                      <div key={li} className="curriculum-lesson">
                                        <span className="lesson-num">L{l.num}</span>
                                        <span className="lesson-title">{l.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : 'phase_name' in item ? (
                                <>
                                  <div className="curriculum-phase-name">
                                    PHASE {item.phase}: {item.phase_name}
                                    {item.codename && (
                                      <span className="phase-codename-tag">{item.codename}</span>
                                    )}
                                  </div>
                                  <div className="curriculum-lessons">
                                    {(item.transmissions || []).map((t: any, ti: number) => (
                                      <div key={ti} className="curriculum-lesson">
                                        <span className="lesson-num">{t.num}</span>
                                        <span className="lesson-title">
                                          {t.title}
                                          {t.subtitle && (
                                            <span className="lesson-subtitle"> — {t.subtitle}</span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="tier-links">
                        {tier.sales_url && (
                          <a href={tier.sales_url} target="_blank" rel="noopener noreferrer" className="tier-link-btn">
                            <ExternalLink size={12} />
                            SALES PAGE
                          </a>
                        )}
                        {tier.portal_url && (
                          <a href={tier.portal_url} target="_blank" rel="noopener noreferrer" className="tier-link-btn secondary">
                            <ArrowRight size={12} />
                            COURSE PORTAL
                          </a>
                        )}
                        {tier.thank_you_url && (
                          <a href={tier.thank_you_url} target="_blank" rel="noopener noreferrer" className="tier-link-btn secondary">
                            <ArrowRight size={12} />
                            THANK YOU PAGE
                          </a>
                        )}
                      </div>

                      <div className="tier-meta-bar">
                        <span>Stripe: {tier.price_id}</span>
                        <span>Slug: {tier.tier_slug}</span>
                        {tier.updated_at && <span>Updated: {new Date(tier.updated_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* FLOW CONNECTOR */}
                {!isLast && (
                  <div className="flow-connector">
                    <div className="flow-line" />
                    <div className="flow-arrow">▼</div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* REVENUE ARCHITECTURE SUMMARY */}
      <section className="rev-summary">
        <div className="rev-header">REVENUE ARCHITECTURE</div>
        <div className="rev-grid">
          <div className="rev-card">
            <div className="rev-label">FULL STACK VALUE</div>
            <div className="rev-amount" style={{ color: '#E8C56A' }}>${totalValue.toLocaleString()}</div>
            <div className="rev-sub">T2 → T6 if customer completes all phases</div>
          </div>
          <div className="rev-card">
            <div className="rev-label">ENTRY POINT</div>
            <div className="rev-amount" style={{ color: '#3EF7E8' }}>$0</div>
            <div className="rev-sub">Free diagnostic → email capture → ascension</div>
          </div>
          <div className="rev-card">
            <div className="rev-label">INNER CIRCLE</div>
            <div className="rev-amount" style={{ color: '#C9A84C' }}>$12,000</div>
            <div className="rev-sub">Application-based. Direct Architect access.</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* === SYNC BAR === */
        .sync-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: rgba(46, 204, 143, 0.04);
          border: 1px solid rgba(46, 204, 143, 0.12);
          border-radius: 8px;
          margin-bottom: 32px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
        }
        .sync-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1D9E75;
          font-weight: 700;
        }
        .sync-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #1D9E75;
          box-shadow: 0 0 8px #1D9E75;
          animation: pulse-green 2s infinite;
        }
        .sync-time { margin-left: auto; }
        .sync-btn {
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 4px 8px; cursor: pointer;
          color: var(--color-text-muted); transition: all 0.2s;
        }
        .sync-btn:hover { border-color: #1D9E75; color: #1D9E75; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .loading-state {
          text-align: center; padding: 80px 0;
          font-family: var(--font-mono); font-size: 13px;
          color: var(--color-text-muted); letter-spacing: 0.1em;
        }

        /* === FUNNEL FLOW === */
        .funnel-flow {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 48px;
        }

        .tier-wrapper {
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .tier-card {
          background: var(--color-bg-surface);
          border: 1px solid var(--tier-border, rgba(255,255,255,0.06));
          border-left: 3px solid var(--tier-color);
          padding: 24px 28px;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
        }
        .tier-card:hover {
          background: var(--color-bg-panel);
          border-color: var(--tier-color);
          box-shadow: 0 0 30px var(--tier-glow);
        }
        .tier-card.expanded {
          background: var(--color-bg-panel);
          border-color: var(--tier-color);
          box-shadow: 0 0 40px var(--tier-glow);
        }

        .tier-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .tier-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          flex: 1;
        }

        .tier-icon-wrap {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: var(--tier-glow);
          color: var(--tier-color);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .tier-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tier-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tier-num {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: var(--tier-color);
        }
        .tier-codename {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .tier-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        .tier-subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.5;
          max-width: 400px;
        }

        .tier-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }

        .tier-price {
          font-family: var(--font-mono);
          font-size: 20px;
          font-weight: 800;
          color: var(--tier-color);
          letter-spacing: 0.05em;
        }

        .tier-phase-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.08em;
          color: var(--color-accent-cyan);
          background: rgba(62, 247, 232, 0.06);
          border: 1px solid rgba(62, 247, 232, 0.12);
          padding: 2px 10px;
          border-radius: 4px;
        }

        .tier-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .status-live { color: #1D9E75; }
        .status-coming-soon { color: var(--color-text-muted); }
        .status-application { color: #E8C56A; }

        .status-dot-sm {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
        }

        .tier-chevron {
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        /* === EXPANDED DETAIL === */
        .tier-detail {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.04);
          animation: fadeIn 0.3s ease;
        }

        .tier-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 20px;
        }

        .detail-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .psych-op {
          color: var(--tier-color);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .detail-features {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .detail-features li {
          font-size: 12px;
          color: var(--color-text-secondary);
          padding-left: 14px;
          position: relative;
        }
        .detail-features li::before {
          content: '>';
          position: absolute;
          left: 0;
          color: var(--tier-color);
          font-weight: 700;
        }

        /* === CURRICULUM === */
        .curriculum-section {
          margin: 20px 0;
          padding: 20px;
          background: rgba(124, 92, 252, 0.03);
          border: 1px solid rgba(124, 92, 252, 0.1);
          border-radius: 10px;
        }
        .curriculum-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--color-accent-secondary, #7C5CFC);
          font-weight: 700;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(124, 92, 252, 0.1);
        }
        .curriculum-block {
          margin-bottom: 16px;
        }
        .curriculum-block:last-child {
          margin-bottom: 0;
        }
        .curriculum-module-name {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--tier-color);
          margin-bottom: 10px;
        }
        .curriculum-phase-name {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--tier-color);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .phase-codename-tag {
          font-size: 8px;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          background: rgba(255,255,255,0.04);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .curriculum-lessons {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-left: 12px;
        }
        .curriculum-lesson {
          display: flex;
          align-items: baseline;
          gap: 10px;
          font-size: 12px;
        }
        .lesson-num {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--tier-color);
          min-width: 28px;
          opacity: 0.7;
        }
        .lesson-title {
          color: var(--color-text-secondary);
        }
        .lesson-subtitle {
          color: var(--color-text-muted);
          font-size: 11px;
          font-style: italic;
        }

        .tier-links {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .tier-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--tier-color);
          background: var(--tier-glow);
          border: 1px solid var(--tier-border);
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .tier-link-btn:hover {
          box-shadow: 0 0 20px var(--tier-glow);
          border-color: var(--tier-color);
        }
        .tier-link-btn.secondary {
          color: var(--color-text-muted);
          background: transparent;
          border-color: rgba(255,255,255,0.06);
        }
        .tier-link-btn.secondary:hover {
          color: var(--tier-color);
          border-color: var(--tier-border);
        }

        .tier-meta-bar {
          display: flex;
          gap: 20px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.03);
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text-muted);
          opacity: 0.5;
          letter-spacing: 0.05em;
        }

        /* === FLOW CONNECTOR === */
        .flow-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 28px;
          position: relative;
        }
        .flow-line {
          width: 1px;
          flex: 1;
          background: linear-gradient(180deg, rgba(124,92,252,0.3), rgba(124,92,252,0.08));
        }
        .flow-arrow {
          font-size: 8px;
          color: var(--color-violet);
          opacity: 0.5;
          line-height: 1;
        }

        /* === REVENUE SUMMARY === */
        .rev-summary {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid rgba(124, 92, 252, 0.12);
        }
        .rev-header {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }
        .rev-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .rev-card {
          background: var(--color-bg-surface);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .rev-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          margin-bottom: 12px;
        }
        .rev-amount {
          font-family: var(--font-mono);
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 8px;
        }
        .rev-sub {
          font-size: 11px;
          color: var(--color-text-muted);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
