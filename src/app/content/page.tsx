"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Play,
  Eye,
  TrendingUp,
  ThumbsUp,
  MessageSquare,
  RefreshCw,
  Filter,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import CtaAuditPanel from '@/components/content/CtaAuditPanel';
import LandingAnalyticsPanel from '@/components/content/LandingAnalyticsPanel';

type VideoItem = {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
  outlier_score: number;
  channel_name: string;
  channel_id: string;
  video_type: string;
  published_at: string;
  fetched_at: string;
};

type ChannelStats = {
  totalViews: number;
  totalVideos: number;
  avgOutlier: number;
  avgEngagement: number;
  topOutlier: number;
  subsCount?: number;
};

type CtaStatus = {
  video_id: string;
  status: string;
};

const CHANNELS = ["All", "Ace Richie", "The Containment Field"] as const;
type ChannelFilter = typeof CHANNELS[number];

const VIDEO_TYPES = ["All", "video", "short"] as const;
type TypeFilter = typeof VIDEO_TYPES[number];

type TabKey = 'performance' | 'cta_audit' | 'landing';

export default function ContentIntel() {
  const [activeTab, setActiveTab] = useState<TabKey>('performance');
  const [items, setItems] = useState<VideoItem[]>([]);
  const [stats, setStats] = useState<ChannelStats>({ totalViews: 0, totalVideos: 0, avgOutlier: 0, avgEngagement: 0, topOutlier: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [channel, setChannel] = useState<ChannelFilter>("All");
  const [videoType, setVideoType] = useState<TypeFilter>("All");
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [ctaMap, setCtaMap] = useState<Record<string, string>>({});
  const [pendingCtaCount, setPendingCtaCount] = useState(0);

  // Fetch CTA statuses for badge overlay on video cards
  const fetchCtaStatuses = useCallback(async () => {
    const { data } = await supabase
      .from('cta_audit_proposals')
      .select('video_id, status');
    if (data) {
      const map: Record<string, string> = {};
      let pending = 0;
      (data as CtaStatus[]).forEach(row => {
        // Keep the most "urgent" status per video
        const existing = map[row.video_id];
        if (!existing || row.status === 'pending_review') {
          map[row.video_id] = row.status;
        }
        if (row.status === 'pending_review') pending++;
      });
      setCtaMap(map);
      setPendingCtaCount(pending);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('youtube_analytics')
      .select('*')
      .order('outlier_score', { ascending: false });

    if (channel !== "All") {
      query = query.eq('channel_name', channel);
    }
    if (videoType !== "All") {
      query = query.eq('video_type', videoType);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      setItems(data as VideoItem[]);
      const totalViews = data.reduce((sum, i) => sum + (i.views || 0), 0);
      const avgEng = data.reduce((sum, i) => sum + (i.engagement || 0), 0) / data.length;
      const avgOut = data.reduce((sum, i) => sum + parseFloat(i.outlier_score || 0), 0) / data.length;
      const topOut = Math.max(...data.map(i => parseFloat(i.outlier_score || 0)));
      setStats({
        totalViews,
        totalVideos: data.length,
        avgOutlier: avgOut,
        avgEngagement: avgEng,
        topOutlier: topOut
      });
      setLastFetched(data[0]?.fetched_at || null);
    } else {
      setItems([]);
      setStats({ totalViews: 0, totalVideos: 0, avgOutlier: 0, avgEngagement: 0, topOutlier: 0 });
    }
    setLoading(false);
  }, [channel, videoType]);

  useEffect(() => { fetchData(); fetchCtaStatuses(); }, [fetchData, fetchCtaStatuses]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/youtube-refresh', { method: 'POST' });
      if (res.ok) {
        await new Promise(r => setTimeout(r, 1500));
        await fetchData();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 3) return { color: '#2ecc8b', bg: 'rgba(46,204,139,0.15)', label: 'OUTLIER' };
    if (score >= 1.5) return { color: '#7c5cfc', bg: 'rgba(124,92,252,0.15)', label: 'ABOVE AVG' };
    if (score >= 0.8) return { color: '#888', bg: 'rgba(255,255,255,0.05)', label: 'BASELINE' };
    return { color: '#e74c3c', bg: 'rgba(231,76,60,0.15)', label: 'BELOW' };
  };

  const getCtaBadge = (videoId: string) => {
    const status = ctaMap[videoId];
    if (!status) return { color: '#555', bg: 'rgba(255,255,255,0.04)', label: '—' };
    if (status === 'pending_review') return { color: '#E5850F', bg: 'rgba(229,133,15,0.15)', label: 'CTA' };
    if (status === 'executed') return { color: '#2ecc8b', bg: 'rgba(46,204,139,0.15)', label: 'CTA' };
    return null; // no badge for rejected/skipped/approved-but-not-executed
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">CONTENT INTEL</h1>
          <p className="eyebrow text-secondary">OPTIMIZATION COMMAND SURFACE</p>
        </div>
        <div className="header-actions">
          {activeTab === 'performance' && lastFetched && (
            <span className="last-fetched">
              <Clock size={12} />
              {timeAgo(lastFetched)}
            </span>
          )}
          {activeTab === 'performance' && (
            <button
              className={`btn btn-refresh ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={16} />
              {refreshing ? 'PULLING...' : 'REFRESH'}
            </button>
          )}
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <Play size={14} />
          PERFORMANCE
        </button>
        <button
          className={`tab-btn ${activeTab === 'cta_audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('cta_audit')}
        >
          <ShieldAlert size={14} />
          CTA AUDIT
          {pendingCtaCount > 0 && (
            <span className="tab-badge">{pendingCtaCount}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'landing' ? 'active' : ''}`}
          onClick={() => setActiveTab('landing')}
        >
          <BarChart3 size={14} />
          LANDING
        </button>
      </nav>

      {/* PANEL: PERFORMANCE */}
      {activeTab === 'performance' && (
        <>
          {/* FILTERS */}
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label">CHANNEL</span>
              <div className="filter-pills">
                {CHANNELS.map(c => (
                  <button
                    key={c}
                    className={`pill ${channel === c ? 'active' : ''}`}
                    onClick={() => setChannel(c)}
                  >
                    {c === "All" ? "ALL" : c === "Ace Richie" ? "ACE RICHIE" : "TCF"}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">TYPE</span>
              <div className="filter-pills">
                {VIDEO_TYPES.map(t => (
                  <button
                    key={t}
                    className={`pill ${videoType === t ? 'active' : ''}`}
                    onClick={() => setVideoType(t)}
                  >
                    {t === "All" ? "ALL" : t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <section className="metrics-grid">
            <div className="card stat-card border-top-gold">
              <div className="stat-content">
                <span className="stat-label">VIDEOS TRACKED</span>
                <span className="stat-value">{stats.totalVideos}</span>
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
            <div className="card stat-card border-top-success">
              <div className="stat-content">
                <span className="stat-label">TOP OUTLIER</span>
                <span className="stat-value">{stats.topOutlier.toFixed(1)}x</span>
              </div>
            </div>
          </section>

          {/* OUTLIER BASELINE BAR */}
          <div className="card baseline-card">
            <div className="baseline-header">
              <span className="baseline-label">OUTLIER DISTRIBUTION</span>
              <span className="baseline-value">
                Avg: {(stats.totalViews / Math.max(stats.totalVideos, 1)).toLocaleString(undefined, {maximumFractionDigits: 0})} views/video
              </span>
            </div>
            <div className="baseline-bar">
              <div className="baseline-fill" style={{ width: `${Math.min((stats.avgOutlier / Math.max(stats.topOutlier, 1)) * 100, 100)}%` }}></div>
              <div className="baseline-marker" style={{ left: `${Math.min((1 / Math.max(stats.topOutlier, 1)) * 100, 100)}%` }}>
                <span className="marker-label">1x BASELINE</span>
              </div>
            </div>
          </div>

          {/* VIDEO GRID */}
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <p>LOADING INTEL...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Play size={32} />
              <p>NO DATA — HIT REFRESH TO PULL FROM YOUTUBE</p>
            </div>
          ) : (
            <div className="content-grid">
              {items.map(item => {
                const badge = getScoreBadge(parseFloat(String(item.outlier_score)));
                const ctaBadge = getCtaBadge(item.video_id);
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
                      <div className="outlier-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.color }}>
                        {parseFloat(String(item.outlier_score)).toFixed(1)}x
                      </div>
                      {ctaBadge && (
                        <div className="cta-status-badge" style={{ background: ctaBadge.bg, color: ctaBadge.color, borderColor: ctaBadge.color }}>
                          {ctaBadge.label}
                        </div>
                      )}
                      {item.video_type === 'short' && (
                        <div className="type-badge">SHORT</div>
                      )}
                      <div className="channel-tag">
                        {item.channel_name === 'Ace Richie' ? 'AR' : 'TCF'}
                      </div>
                    </div>
                    <div className="content-body">
                      <h3 className="content-title">{item.title}</h3>
                      <div className="content-stats">
                        <div className="mini-stat">
                          <Eye size={13} />
                          <span>{item.views.toLocaleString()}</span>
                        </div>
                        <div className="mini-stat">
                          <ThumbsUp size={13} />
                          <span>{item.likes}</span>
                        </div>
                        <div className="mini-stat">
                          <MessageSquare size={13} />
                          <span>{item.comments}</span>
                        </div>
                      </div>
                      <div className="content-footer">
                        <span className="content-date">{new Date(item.published_at).toLocaleDateString()}</span>
                        <a
                          href={`https://youtube.com/watch?v=${item.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon-small"
                        >
                          <ArrowUpRight size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* PANEL: CTA AUDIT */}
      {activeTab === 'cta_audit' && <CtaAuditPanel />}

      {/* PANEL: LANDING ANALYTICS */}
      {activeTab === 'landing' && <LandingAnalyticsPanel />}

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .header-actions { display: flex; align-items: center; gap: 16px; }
        .last-fetched { display: flex; align-items: center; gap: 6px; font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.05em; }

        .btn-refresh { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 16px; color: var(--color-text-secondary); font-size: 11px; font-weight: 700; font-family: var(--font-mono); letter-spacing: 0.08em; cursor: pointer; transition: var(--transition-fast); }
        .btn-refresh:hover { border-color: var(--color-accent-secondary); color: var(--color-accent-secondary); }
        .btn-refresh.spinning { opacity: 0.6; pointer-events: none; }
        .btn-refresh.spinning :global(svg) { animation: spin 1s linear infinite; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* TAB NAVIGATION */
        .tab-nav { display: flex; gap: 4px; margin-bottom: 28px; padding: 4px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; }
        .tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: transparent; border: 1px solid transparent; border-radius: 10px; font-size: 10px; font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.1em; color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); position: relative; }
        .tab-btn:hover { color: var(--color-text-secondary); background: rgba(255,255,255,0.02); }
        .tab-btn.active { color: var(--color-accent-secondary); background: rgba(124,92,252,0.06); border-color: rgba(124,92,252,0.2); }
        .tab-badge { font-size: 9px; font-weight: 800; background: #E5850F; color: #000; padding: 1px 7px; border-radius: 10px; margin-left: 4px; }

        .filter-bar { display: flex; gap: 32px; margin-bottom: 32px; padding: 16px 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 10px; }
        .filter-group { display: flex; align-items: center; gap: 12px; }
        .filter-label { font-size: 9px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; }
        .filter-pills { display: flex; gap: 6px; }
        .pill { background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 12px; font-size: 10px; font-weight: 700; font-family: var(--font-mono); color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); letter-spacing: 0.05em; }
        .pill:hover { border-color: var(--color-text-secondary); color: var(--color-text-secondary); }
        .pill.active { border-color: var(--color-accent-secondary); color: var(--color-accent-secondary); background: rgba(124,92,252,0.08); }

        .border-top-gold { border-top: 4px solid var(--color-accent-primary); }
        .border-top-violet { border-top: 4px solid var(--color-accent-secondary); }
        .border-top-cyan { border-top: 4px solid var(--color-accent-cyan, #00d4ff); }
        .border-top-success { border-top: 4px solid var(--color-accent-success, #2ecc8b); }

        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }

        .baseline-card { padding: 20px 28px; background: rgba(255,255,255,0.02); margin-bottom: 32px; }
        .baseline-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
        .baseline-label { font-size: 10px; font-weight: 800; color: var(--color-text-muted); letter-spacing: 0.1em; font-family: var(--font-mono); }
        .baseline-value { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-secondary); }
        .baseline-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; position: relative; }
        .baseline-fill { height: 100%; background: linear-gradient(90deg, transparent, var(--color-accent-secondary)); opacity: 0.3; border-radius: 3px; }
        .baseline-marker { position: absolute; top: -10px; bottom: -10px; width: 2px; background: var(--color-accent-secondary); box-shadow: 0 0 8px var(--color-accent-secondary); }
        .marker-label { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 8px; font-weight: 800; color: var(--color-accent-secondary); letter-spacing: 0.1em; font-family: var(--font-mono); }

        .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; color: var(--color-text-muted); gap: 16px; }
        .loading-state p, .empty-state p { font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.1em; }
        .spin-icon { animation: spin 1s linear infinite; }

        .content-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        .content-card { padding: 0; display: flex; flex-direction: column; overflow: hidden; }

        .content-thumbnail { aspect-ratio: 16/9; background: var(--color-bg-deepest); position: relative; overflow: hidden; }
        .content-thumbnail img { width: 100%; height: 100%; object-fit: cover; }

        .thumbnail-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); opacity: 0.3; }

        .outlier-badge { position: absolute; top: 10px; right: 10px; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; font-family: var(--font-mono); border: 1px solid; backdrop-filter: blur(8px); }

        .cta-status-badge { position: absolute; bottom: 10px; left: 10px; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; font-family: var(--font-mono); border: 1px solid; backdrop-filter: blur(8px); letter-spacing: 0.08em; }

        .type-badge { position: absolute; bottom: 10px; right: 10px; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; font-family: var(--font-mono); background: rgba(0,0,0,0.7); color: #fff; letter-spacing: 0.1em; }

        .channel-tag { position: absolute; top: 10px; left: 10px; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; font-family: var(--font-mono); background: rgba(0,0,0,0.7); color: var(--color-accent-primary); letter-spacing: 0.1em; }

        .content-body { padding: 16px 18px; flex: 1; display: flex; flex-direction: column; }

        .content-title { font-size: 13px; font-weight: 600; line-height: 1.4; margin-bottom: 14px; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .content-stats { display: flex; gap: 16px; margin-bottom: 14px; }
        .mini-stat { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--color-text-secondary); font-family: var(--font-mono); }

        .content-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-color); }
        .content-date { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); }

        .btn-icon-small { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); display: flex; align-items: center; text-decoration: none; }
        .btn-icon-small:hover { color: var(--color-accent-primary); }

        @media (max-width: 1200px) { .content-grid { grid-template-columns: repeat(2, 1fr); } .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } .filter-bar { flex-direction: column; gap: 16px; } .tab-nav { flex-direction: column; } }
      `}</style>
    </div>
  );
}
