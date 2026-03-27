"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, 
  Play, 
  Eye, 
  MessageSquare, 
  Share2, 
  TrendingUp,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';

type ContentItem = {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  engagement: number;
  outlier_score: number;
  created_at: string;
};

export default function ContentIntel() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState({ totalViews: 0, avgEngagement: 0, tracked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch from youtube_analytics if available, otherwise mock for demonstration
    const { data } = await supabase
      .from('youtube_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data as ContentItem[]);
      const totalViews = data.reduce((sum, i) => sum + (i.views || 0), 0);
      const avgEng = data.length > 0 ? data.reduce((sum, i) => sum + (i.engagement || 0), 0) / data.length : 0;
      setStats({ totalViews, avgEngagement: avgEng, tracked: data.length });
    }
    setLoading(false);
  }

  const getScoreColor = (score: number) => {
    if (score >= 2) return 'green';
    if (score >= 1.2) return 'blue';
    if (score >= 0.8) return 'gray';
    return 'red';
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">CONTENT INTEL</h1>
          <p className="eyebrow text-secondary">VIRALITY ENGINE :: OUTLIER DETECTION</p>
        </div>
      </header>

      {/* STAT CARDS */}
      <section className="metrics-grid">
        <div className="card stat-card border-top-gold">
          <div className="stat-content">
            <span className="stat-label">VIDEOS TRACKED</span>
            <span className="stat-value">{stats.tracked}</span>
          </div>
        </div>
        <div className="card stat-card border-top-violet">
          <div className="stat-content">
            <span className="stat-label">TOTAL VIEWS</span>
            <span className="stat-value">{stats.totalViews.toLocaleString()}</span>
          </div>
        </div>
        <div className="card stat-card border-top-cyan">
          <div className="stat-content">
            <span className="stat-label">AVG ENGAGEMENT</span>
            <span className="stat-value">{stats.avgEngagement.toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* OUTLIER BASELINE */}
      <div className="card baseline-card mb-12">
        <div className="baseline-header">
          <span className="baseline-label">OUTLIER BASELINE :: LAST 15 PIECES</span>
          <span className="baseline-value">Avg: {(stats.totalViews / Math.max(stats.tracked, 1)).toLocaleString()} views</span>
        </div>
        <div className="baseline-bar">
          <div className="baseline-fill" style={{ width: '65%' }}></div>
          <div className="baseline-marker" style={{ left: '65%' }}>
            <span className="marker-label">CURRENT AVERAGE</span>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {items.map(item => {
          const colorClass = getScoreColor(item.outlier_score);
          return (
            <div key={item.id} className="card content-card fade-in">
              <div className="content-thumbnail">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.title} />
                ) : (
                  <div className="thumbnail-placeholder">
                    <Play size={32} />
                  </div>
                )}
                <div className={`outlier-badge ${colorClass}`}>
                  {item.outlier_score}x
                </div>
              </div>
              <div className="content-body">
                <h3 className="content-title">{item.title}</h3>
                <div className="content-stats">
                  <div className="mini-stat">
                    <Eye size={14} />
                    <span>{item.views.toLocaleString()}</span>
                  </div>
                  <div className="mini-stat">
                    <TrendingUp size={14} />
                    <span>{item.engagement}%</span>
                  </div>
                </div>
                <div className="content-footer">
                  <span className="content-date">{new Date(item.created_at).toLocaleDateString()}</span>
                  <button className="btn-icon-small">
                    <Info size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .border-top-gold { border-top: 4px solid var(--color-accent-primary); }
        .border-top-violet { border-top: 4px solid var(--color-accent-secondary); }
        .border-top-cyan { border-top: 4px solid var(--color-accent-cyan); }

        .baseline-card {
          padding: 24px 32px;
          background: rgba(255, 255, 255, 0.02);
        }

        .baseline-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .baseline-label {
          font-size: 11px;
          font-weight: 800;
          color: var(--color-text-muted);
          letter-spacing: 0.1em;
        }

        .baseline-value {
          font-size: 12px;
          font-family: var(--font-mono);
          color: var(--color-text-secondary);
        }

        .baseline-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          position: relative;
        }

        .baseline-fill {
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--color-accent-secondary));
          opacity: 0.3;
          border-radius: 4px;
        }

        .baseline-marker {
          position: absolute;
          top: -12px;
          bottom: -12px;
          width: 2px;
          background: var(--color-accent-secondary);
          box-shadow: 0 0 10px var(--color-accent-secondary);
        }

        .marker-label {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 8px;
          font-weight: 800;
          color: var(--color-accent-secondary);
          letter-spacing: 0.1em;
        }

        .content-grid {
          display: grid;
          grid-template-cols: repeat(3, 1fr);
          gap: 24px;
        }

        .content-card {
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .content-thumbnail {
          aspect-ratio: 16/9;
          background: var(--color-bg-deepest);
          position: relative;
          overflow: hidden;
        }

        .thumbnail-placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          opacity: 0.3;
        }

        .outlier-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          font-family: var(--font-mono);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }

        .outlier-badge.green { background: var(--color-accent-success); color: var(--color-bg-deepest); }
        .outlier-badge.blue { background: var(--color-accent-secondary); color: white; }
        .outlier-badge.gray { background: #333; color: #ccc; }
        .outlier-badge.red { background: var(--color-accent-danger); color: white; }

        .content-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .content-title {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 20px;
          flex: 1;
        }

        .content-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .mini-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
        }

        .content-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .content-date {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .btn-icon-small {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .btn-icon-small:hover { color: var(--color-accent-primary); }
      `}</style>
    </div>
  );
}
