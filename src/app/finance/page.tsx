"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  ArrowUpRight,
  Calendar,
  Layers
} from 'lucide-react';

type PaymentEntry = {
  id: string;
  amount: number;
  source: string;
  description: string;
  created_at: string;
};

type RevenueBySource = {
  source: string;
  total: number;
  color: string;
};

export default function RevenueGrid() {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{month: string; amount: number}[]>([]);
  const [sources, setSources] = useState<RevenueBySource[]>([]);
  const [loading, setLoading] = useState(true);

  const TARGET = 1200000;

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('revenue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_history' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('payment_history')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) {
      setPayments(data as PaymentEntry[]);
      const total = data.reduce((sum, p) => sum + Number(p.amount), 0);
      setTotalRevenue(total);

      // Group by month
      const byMonth: Record<string, number> = {};
      data.forEach((p: any) => {
        const month = new Date(p.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
        byMonth[month] = (byMonth[month] || 0) + Number(p.amount);
      });
      setMonthlyData(Object.entries(byMonth).map(([month, amount]) => ({ month, amount })));

      // Group by source
      const bySource: Record<string, number> = {};
      data.forEach((p: any) => {
        const src = p.source || 'Other';
        bySource[src] = (bySource[src] || 0) + Number(p.amount);
      });
      const sourceColors = ['#C9A84C', '#7C5CFC', '#3EF7E8', '#2ECC8F', '#D95555', '#A07AFF'];
      setSources(Object.entries(bySource).map(([source, total], i) => ({
        source, total, color: sourceColors[i % sourceColors.length]
      })));
    }
    setLoading(false);
  }

  const progressPercent = Math.min((totalRevenue / TARGET) * 100, 100);
  const remaining = TARGET - totalRevenue;
  const daysToDeadline = Math.ceil((new Date('2027-01-01').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dailyRequired = remaining > 0 ? Math.ceil(remaining / daysToDeadline) : 0;

  const maxMonthly = Math.max(...monthlyData.map(m => m.amount), 1);

  return (
    <div className="fade-in">
      <div className="glow-orb glow-gold" style={{ top: '-10%', left: '30%' }} />

      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">REVENUE GRID</h1>
          <p className="eyebrow text-secondary">$1.2M LIQUID SUM :: SOVEREIGN OBJECTIVE</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span className="label">DAYS REMAINING</span>
            <span className="value">{daysToDeadline}</span>
          </div>
          <div className="mini-stat">
            <span className="label">DAILY REQUIRED</span>
            <span className="value text-primary">${dailyRequired.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* MAIN PROGRESS CARD */}
      <div className="card progress-hero-card">
        <div className="progress-hero-header">
          <div className="hero-amount">
            <span className="hero-label">NET LIQUID SUM</span>
            <span className="hero-value">${totalRevenue.toLocaleString()}</span>
          </div>
          <div className="hero-target">
            <span className="hero-label">TARGET</span>
            <span className="hero-target-value">$1,200,000</span>
          </div>
        </div>
        <div className="hero-progress-bar">
          <div className="hero-progress-fill" style={{ width: `${progressPercent}%` }}>
            <div className="progress-glow" />
          </div>
        </div>
        <div className="hero-progress-labels">
          <span>{progressPercent.toFixed(1)}% ACHIEVED</span>
          <span>${remaining.toLocaleString()} REMAINING</span>
        </div>
      </div>

      <div className="finance-layout">
        {/* MONTHLY BREAKDOWN */}
        <div className="card chart-card">
          <h2 className="h2-display mb-6">MONTHLY TIMELINE</h2>
          <div className="chart-bars">
            {monthlyData.map((m, idx) => (
              <div key={idx} className="chart-bar-container">
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${(m.amount / maxMonthly) * 100}%` }}
                  >
                    <span className="bar-value">${(m.amount / 1000).toFixed(1)}K</span>
                  </div>
                </div>
                <span className="bar-label">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* REVENUE BY SOURCE */}
        <div className="card source-card">
          <h2 className="h2-display mb-6">REVENUE BY SOURCE</h2>
          <div className="source-list">
            {sources.map((s, idx) => (
              <div key={idx} className="source-item">
                <div className="source-header">
                  <div className="source-name-row">
                    <div className="source-dot" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                    <span className="source-name">{s.source}</span>
                  </div>
                  <span className="source-amount">${s.total.toLocaleString()}</span>
                </div>
                <div className="source-bar">
                  <div 
                    className="source-fill" 
                    style={{ 
                      width: `${(s.total / totalRevenue) * 100}%`,
                      background: s.color,
                      boxShadow: `0 0 12px ${s.color}40`
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          {/* PROJECTION */}
          <div className="projection-section">
            <h3 className="projection-title">VELOCITY PROJECTION</h3>
            <div className="projection-stats">
              <div className="proj-stat">
                <span className="proj-label">CURRENT VELOCITY</span>
                <span className="proj-value">${monthlyData.length > 0 ? (totalRevenue / monthlyData.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}/mo</span>
              </div>
              <div className="proj-stat">
                <span className="proj-label">REQUIRED VELOCITY</span>
                <span className="proj-value text-primary">${daysToDeadline > 0 ? (remaining / (daysToDeadline / 30)).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}/mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .proj-value { font-size: 18px; font-weight: 800; font-family: var(--font-mono); }
        .progress-hero-card {
          padding: 40px;
          margin-bottom: 48px;
          background: linear-gradient(135deg, var(--color-bg-surface), rgba(201, 168, 76, 0.03));
          border-color: rgba(201, 168, 76, 0.2);
        }

        .progress-hero-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
        .hero-label { display: block; font-size: 11px; font-weight: 800; color: var(--color-text-muted); letter-spacing: 0.15em; margin-bottom: 8px; }
        .hero-value { font-size: 56px; font-weight: 900; font-family: var(--font-mono); background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-primary-glow)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-target-value { font-size: 24px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); }

        .hero-progress-bar { height: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
        .hero-progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-primary-glow)); border-radius: 6px; position: relative; transition: width 1s ease; }
        .progress-glow { position: absolute; right: 0; top: -4px; bottom: -4px; width: 20px; background: var(--color-accent-primary-glow); filter: blur(8px); border-radius: 50%; }

        .hero-progress-labels { display: flex; justify-content: space-between; font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); font-weight: 700; letter-spacing: 0.05em; }

        .finance-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }

        .h2-display { font-size: 24px; font-weight: 800; letter-spacing: -0.01em; }
        .mb-6 { margin-bottom: 24px; }

        .chart-bars { display: flex; align-items: flex-end; gap: 24px; height: 200px; padding-top: 20px; }
        .chart-bar-container { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
        .chart-bar-wrapper { flex: 1; width: 100%; display: flex; align-items: flex-end; }
        .chart-bar { width: 100%; background: linear-gradient(180deg, var(--color-accent-primary), rgba(201, 168, 76, 0.3)); border-radius: 6px 6px 0 0; position: relative; min-height: 8px; transition: height 0.6s ease; }
        .bar-value { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 10px; font-family: var(--font-mono); font-weight: 700; color: var(--color-accent-primary); white-space: nowrap; }
        .bar-label { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); font-weight: 700; }

        .source-list { display: flex; flex-direction: column; gap: 24px; margin-bottom: 32px; }
        .source-item { display: flex; flex-direction: column; gap: 8px; }
        .source-header { display: flex; justify-content: space-between; align-items: center; }
        .source-name-row { display: flex; align-items: center; gap: 10px; }
        .source-dot { width: 8px; height: 8px; border-radius: 50%; }
        .source-name { font-size: 13px; font-weight: 600; }
        .source-amount { font-size: 14px; font-weight: 800; font-family: var(--font-mono); }
        .source-bar { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; overflow: hidden; }
        .source-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

        .projection-section { padding-top: 24px; border-top: 1px solid var(--border-color); }
        .projection-title { font-size: 11px; font-weight: 800; color: var(--color-text-muted); letter-spacing: 0.15em; margin-bottom: 16px; }
        .projection-stats { display: flex; gap: 32px; }
        .proj-stat { display: flex; flex-direction: column; gap: 4px; }
        .proj-label { font-size: 10px; font-weight: 700; color: var(--color-text-muted); letter-spacing: 0.05em; }
        .proj-value { font-size: 18px; font-weight: 800; font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
