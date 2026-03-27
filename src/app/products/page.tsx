"use client";

import { useState } from 'react';
import {
  Eye, Zap, Shield, Flame, Cpu, Crown, Lock,
  ExternalLink, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   PRODUCTS PAGE — THE SOVEREIGN FUNNEL ARCHITECTURE
   All 8 tiers of the liberation pipeline, wired to live URLs
   ══════════════════════════════════════════════════════════ */

type FunnelTier = {
  tier: number;
  codename: string;
  title: string;
  subtitle: string;
  price: string;
  priceNote?: string;
  color: string;
  glow: string;
  borderColor: string;
  icon: any;
  liveUrl: string;
  postPurchaseUrl?: string;
  status: 'LIVE' | 'COMING SOON' | 'APPLICATION';
  features: string[];
  psychOp: string; // the psychological function this tier serves
};

const FUNNEL: FunnelTier[] = [
  {
    tier: 0,
    codename: 'THE CONTAINMENT FIELD',
    title: 'Links Hub',
    subtitle: 'Mirror the viewer\'s current state. One thread of gold.',
    price: 'FREE',
    color: '#7C7A9A',
    glow: 'rgba(124, 122, 154, 0.12)',
    borderColor: 'rgba(124, 122, 154, 0.25)',
    icon: Eye,
    liveUrl: 'https://sovereign-synthesis.com/tier-0/links',
    status: 'LIVE',
    features: ['Boot sequence animation', 'Psychological state mirroring', 'Single gold thread CTA'],
    psychOp: 'AWARENESS — "Something feels off"',
  },
  {
    tier: 1,
    codename: 'THE DIAGNOSTIC',
    title: 'Reality Override Manual',
    subtitle: 'Interactive 12-question pattern scanner + free PDF.',
    price: 'FREE',
    priceNote: 'Email capture',
    color: '#3EF7E8',
    glow: 'rgba(62, 247, 232, 0.12)',
    borderColor: 'rgba(62, 247, 232, 0.25)',
    icon: Zap,
    liveUrl: 'https://sovereign-synthesis.com/tier-1/',
    postPurchaseUrl: 'https://sovereign-synthesis.com/tier-1/download',
    status: 'LIVE',
    features: ['Interference Pattern Diagnostic', 'Reality Override Manual (PDF)', 'Email sequence trigger'],
    psychOp: 'IDENTIFICATION — "I see the pattern now"',
  },
  {
    tier: 2,
    codename: 'THE FIELD MANUAL',
    title: 'Protocol 77',
    subtitle: 'The Sovereign\'s Field Manual. 4-phase guided runner.',
    price: '$77',
    color: '#3EF7E8',
    glow: 'rgba(62, 247, 232, 0.12)',
    borderColor: 'rgba(62, 247, 232, 0.25)',
    icon: Shield,
    liveUrl: 'https://sovereign-synthesis.com/tier-2/protocol-77',
    postPurchaseUrl: 'https://sovereign-synthesis.com/tier-2/protocol-77-runner',
    status: 'LIVE',
    features: ['Protocol 77 PDF (v3)', 'Interactive Protocol Runner', 'Shield/Map/Anchor framework', 'Stripe checkout live'],
    psychOp: 'PROTECTION — "I have a shield now"',
  },
  {
    tier: 3,
    codename: 'THE OPERATING SYSTEM',
    title: 'Sovereign Architecture Manifesto',
    subtitle: '5-phase OS installation. The architecture becomes visible.',
    price: '$177',
    color: '#7C5CFC',
    glow: 'rgba(124, 92, 252, 0.12)',
    borderColor: 'rgba(124, 92, 252, 0.25)',
    icon: Flame,
    liveUrl: 'https://sovereign-synthesis.com/tier-3/manifesto',
    postPurchaseUrl: 'https://sovereign-synthesis.com/tier-3/manifesto-navigator',
    status: 'LIVE',
    features: ['Manifesto Phase Navigator', '5-phase installation sequence', '$177 credit toward SMA Phase 1'],
    psychOp: 'ARCHITECTURE — "I see the whole system"',
  },
  {
    tier: 4,
    codename: 'DECLASSIFICATION',
    title: 'System Mastery Architecture: Phase 1',
    subtitle: 'Stop Reacting. Start Architecting. The full course.',
    price: '$477',
    priceNote: '$300 with Manifesto credit',
    color: '#C9804C',
    glow: 'rgba(201, 128, 76, 0.12)',
    borderColor: 'rgba(201, 128, 76, 0.25)',
    icon: Cpu,
    liveUrl: 'https://sovereign-synthesis.com/tier-4/defense-protocol',
    postPurchaseUrl: 'https://sovereign-synthesis.com/tier-4/course-portal',
    status: 'LIVE',
    features: ['Full course portal', 'Video modules', 'Stripe checkout live', 'Manifesto credit applied automatically'],
    psychOp: 'MASTERY — "I am building my own architecture"',
  },
  {
    tier: 5,
    codename: 'NEUTRALIZATION',
    title: 'System Mastery Architecture: Phase 2',
    subtitle: 'The Architecture Under Load. Real-world deployment.',
    price: '$1,497',
    color: '#C9804C',
    glow: 'rgba(201, 128, 76, 0.12)',
    borderColor: 'rgba(201, 128, 76, 0.25)',
    icon: Cpu,
    liveUrl: 'https://sovereign-synthesis.com/tier-5/phase-2',
    postPurchaseUrl: 'https://sovereign-synthesis.com/tier-5/course-portal',
    status: 'LIVE',
    features: ['Advanced course portal', 'Architecture under pressure', 'Real-world implementation protocols'],
    psychOp: 'DEPLOYMENT — "The system holds under load"',
  },
  {
    tier: 6,
    codename: 'THE DEPLOYMENT',
    title: 'System Mastery Architecture: Phase 3',
    subtitle: 'Full Sovereign Synthesis. The Integration.',
    price: '$3,777',
    color: '#C9A84C',
    glow: 'rgba(201, 168, 76, 0.15)',
    borderColor: 'rgba(201, 168, 76, 0.25)',
    icon: Crown,
    liveUrl: 'https://sovereign-synthesis.com/tier-6/phase-3',
    postPurchaseUrl: 'https://sovereign-synthesis.com/tier-6/course-portal',
    status: 'LIVE',
    features: ['Complete integration sequence', 'Revenue engineering', 'Full sovereign deployment'],
    psychOp: 'SYNTHESIS — "I am the system"',
  },
  {
    tier: 7,
    codename: 'PRIME ARCHITECT',
    title: 'The Inner Circle',
    subtitle: 'Direct Access to the Architect. Application only.',
    price: 'APPLICATION',
    color: '#E8C56A',
    glow: 'rgba(232, 197, 106, 0.15)',
    borderColor: 'rgba(232, 197, 106, 0.3)',
    icon: Lock,
    liveUrl: 'https://sovereign-synthesis.com/tier-7/inner-circle',
    postPurchaseUrl: 'https://t.me/sovereignsynthesis',
    status: 'APPLICATION',
    features: ['1-on-1 System Architecture', 'Direct Architect Access (Telegram)', 'Custom Reality Override Protocol', 'Revenue Engineering Blueprint'],
    psychOp: 'SOVEREIGNTY — "I architect reality"',
  },
];

export default function ProductsPage() {
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  const totalProducts = FUNNEL.length;
  const liveProducts = FUNNEL.filter(f => f.status === 'LIVE').length;
  const maxRevPerCustomer = '$5,955+';

  return (
    <div className="fade-in">
      <div className="glow-orb glow-violet" style={{ top: '-10%', right: '15%' }} />
      <div className="glow-orb glow-gold" style={{ bottom: '10%', left: '-5%' }} />

      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">FUNNEL ARCHITECTURE</h1>
          <p className="eyebrow text-secondary">PRODUCT PIPELINE :: TIERED LIBERATION SEQUENCE</p>
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
            <span className="label">MAX LTV</span>
            <span className="value" style={{ color: '#E8C56A' }}>{maxRevPerCustomer}</span>
          </div>
        </div>
      </header>

      {/* FUNNEL FLOW VISUALIZATION */}
      <section className="funnel-flow">
        {FUNNEL.map((tier, idx) => {
          const Icon = tier.icon;
          const isExpanded = expandedTier === tier.tier;
          const isLast = idx === FUNNEL.length - 1;

          return (
            <div key={tier.tier} className="tier-wrapper">
              <div
                className={`tier-card ${isExpanded ? 'expanded' : ''}`}
                style={{
                  '--tier-color': tier.color,
                  '--tier-glow': tier.glow,
                  '--tier-border': tier.borderColor,
                } as React.CSSProperties}
                onClick={() => setExpandedTier(isExpanded ? null : tier.tier)}
              >
                {/* TIER HEADER */}
                <div className="tier-header">
                  <div className="tier-left">
                    <div className="tier-icon-wrap">
                      <Icon size={16} />
                    </div>
                    <div className="tier-meta">
                      <div className="tier-badge">
                        <span className="tier-num">T{tier.tier}</span>
                        <span className="tier-codename">{tier.codename}</span>
                      </div>
                      <h3 className="tier-title">{tier.title}</h3>
                      <p className="tier-subtitle">{tier.subtitle}</p>
                    </div>
                  </div>
                  <div className="tier-right">
                    <div className="tier-price">{tier.price}</div>
                    {tier.priceNote && <div className="tier-price-note">{tier.priceNote}</div>}
                    <div className={`tier-status status-${tier.status.toLowerCase().replace(' ', '-')}`}>
                      <span className="status-dot-sm" />
                      {tier.status}
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
                        <div className="detail-value psych-op">{tier.psychOp}</div>
                      </div>
                      <div className="detail-section">
                        <div className="detail-label">INCLUDES</div>
                        <ul className="detail-features">
                          {tier.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="tier-links">
                      <a
                        href={tier.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tier-link-btn"
                      >
                        <ExternalLink size={12} />
                        VIEW LIVE PAGE
                      </a>
                      {tier.postPurchaseUrl && (
                        <a
                          href={tier.postPurchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tier-link-btn secondary"
                        >
                          <ArrowRight size={12} />
                          POST-PURCHASE
                        </a>
                      )}
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

      {/* REVENUE ARCHITECTURE SUMMARY */}
      <section className="rev-summary">
        <div className="rev-header">REVENUE ARCHITECTURE</div>
        <div className="rev-grid">
          <div className="rev-card">
            <div className="rev-label">FULL STACK VALUE</div>
            <div className="rev-amount" style={{ color: '#E8C56A' }}>$5,955</div>
            <div className="rev-sub">T2 → T6 if customer completes all phases</div>
          </div>
          <div className="rev-card">
            <div className="rev-label">ENTRY POINT</div>
            <div className="rev-amount" style={{ color: '#3EF7E8' }}>$0</div>
            <div className="rev-sub">Free diagnostic → email capture → ascension</div>
          </div>
          <div className="rev-card">
            <div className="rev-label">INNER CIRCLE</div>
            <div className="rev-amount" style={{ color: '#C9A84C' }}>∞</div>
            <div className="rev-sub">Application-based. Direct Architect access.</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* ═══ FUNNEL FLOW ═══ */
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
        .tier-price-note {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-cyan);
          letter-spacing: 0.1em;
          text-transform: uppercase;
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

        /* ═══ EXPANDED DETAIL ═══ */
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
          content: '›';
          position: absolute;
          left: 0;
          color: var(--tier-color);
          font-weight: 700;
        }

        .tier-links {
          display: flex;
          gap: 12px;
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

        /* ═══ FLOW CONNECTOR ═══ */
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

        /* ═══ REVENUE SUMMARY ═══ */
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
