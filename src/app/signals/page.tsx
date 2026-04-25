"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Radio,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  Search,
  Users,
  Clock,
  Filter,
} from 'lucide-react';

type CommentRow = {
  comment_id: string;
  brand: 'sovereign_synthesis' | 'containment_field';
  video_id: string;
  video_title: string | null;
  author_handle: string | null;
  author_display_name: string | null;
  text_original: string | null;
  published_at: string | null;
  alerted_at: string | null;
};

// S114: 'ace_richie' enum key was wrong — DB has been writing 'sovereign_synthesis'
// (the bot's youtube-comment-watcher uses sovereign_synthesis throughout). Type
// union, BRAND_META key, count branch, and filter button all flipped to match
// the actual DB value, fixing the silent-blank render bug on /signals.
const BRAND_META: Record<CommentRow['brand'], { label: string; color: string; bg: string }> = {
  sovereign_synthesis: {
    label: 'SOVEREIGN SYNTHESIS',
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.12)',
  },
  containment_field: {
    label: 'CONTAINMENT FIELD',
    color: '#fa709a',
    bg: 'rgba(250,112,154,0.12)',
  },
};

type BrandFilter = 'all' | CommentRow['brand'];

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export default function SignalsPage() {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('all');
  const [videoFilter, setVideoFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('youtube_comments_seen')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[Signals] fetch error', error);
    }
    setRows((data as CommentRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const videoOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(r => {
      if (brandFilter !== 'all' && r.brand !== brandFilter) return;
      if (!map.has(r.video_id)) {
        map.set(r.video_id, r.video_title || r.video_id);
      }
    });
    return Array.from(map.entries());
  }, [rows, brandFilter]);

  useEffect(() => {
    if (videoFilter !== 'all' && !videoOptions.some(([id]) => id === videoFilter)) {
      setVideoFilter('all');
    }
  }, [videoOptions, videoFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (brandFilter !== 'all' && r.brand !== brandFilter) return false;
      if (videoFilter !== 'all' && r.video_id !== videoFilter) return false;
      if (q) {
        const hay = `${r.text_original || ''} ${r.author_display_name || ''} ${r.author_handle || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, brandFilter, videoFilter, search]);

  const counts = useMemo(() => {
    let ace = 0, cf = 0;
    rows.forEach(r => {
      if (r.brand === 'sovereign_synthesis') ace += 1;
      else if (r.brand === 'containment_field') cf += 1;
    });
    return { ace, cf, total: rows.length };
  }, [rows]);

  const uniqueAuthors = useMemo(() => {
    const s = new Set<string>();
    filtered.forEach(r => {
      const k = r.author_handle || r.author_display_name;
      if (k) s.add(k);
    });
    return s.size;
  }, [filtered]);

  const latestAt = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered[0].published_at;
  }, [filtered]);

  return (
    <div className="signals-root">
      <div className="signals-head">
        <div>
          <h1 className="signals-title">
            <Radio size={20} /> AUDIENCE SIGNALS
          </h1>
          <p className="signals-sub">
            Every comment on both YouTube channels, closest-first. Poll cadence: 5 min. The faster you respond, the longer the candidate stays warm.
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchData}>
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> REFRESH
        </button>
      </div>

      <div className="summary-cards">
        <div className="s-card">
          <MessageSquare size={16} className="s-icon" />
          <div className="s-body">
            <span className="s-label">TOTAL COMMENTS</span>
            <span className="s-value">{counts.total.toLocaleString()}</span>
          </div>
        </div>
        <div className="s-card">
          <div className="s-dot" style={{ background: BRAND_META.sovereign_synthesis.color }} />
          <div className="s-body">
            <span className="s-label">SOVEREIGN SYNTHESIS</span>
            <span className="s-value">{counts.ace.toLocaleString()}</span>
          </div>
        </div>
        <div className="s-card">
          <div className="s-dot" style={{ background: BRAND_META.containment_field.color }} />
          <div className="s-body">
            <span className="s-label">CONTAINMENT FIELD</span>
            <span className="s-value">{counts.cf.toLocaleString()}</span>
          </div>
        </div>
        <div className="s-card">
          <Users size={16} className="s-icon" />
          <div className="s-body">
            <span className="s-label">UNIQUE VOICES (FILTERED)</span>
            <span className="s-value">{uniqueAuthors.toLocaleString()}</span>
          </div>
        </div>
        <div className="s-card">
          <Clock size={16} className="s-icon" />
          <div className="s-body">
            <span className="s-label">LATEST SIGNAL</span>
            <span className="s-value s-value-text">{timeAgo(latestAt)}</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="brand-tabs">
          <button
            className={`b-tab ${brandFilter === 'all' ? 'active' : ''}`}
            onClick={() => setBrandFilter('all')}
          >
            ALL
          </button>
          <button
            className={`b-tab ${brandFilter === 'sovereign_synthesis' ? 'active' : ''}`}
            onClick={() => setBrandFilter('sovereign_synthesis')}
            style={{ '--tab-color': BRAND_META.sovereign_synthesis.color } as any}
          >
            SOVEREIGN SYNTHESIS ({counts.ace})
          </button>
          <button
            className={`b-tab ${brandFilter === 'containment_field' ? 'active' : ''}`}
            onClick={() => setBrandFilter('containment_field')}
            style={{ '--tab-color': BRAND_META.containment_field.color } as any}
          >
            CONTAINMENT FIELD ({counts.cf})
          </button>
        </div>

        <div className="video-select-wrap">
          <Filter size={12} />
          <select
            className="video-select"
            value={videoFilter}
            onChange={e => setVideoFilter(e.target.value)}
          >
            <option value="all">All videos ({videoOptions.length})</option>
            {videoOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title.length > 60 ? title.slice(0, 57) + '…' : title}
              </option>
            ))}
          </select>
        </div>

        <div className="search-wrap">
          <Search size={12} />
          <input
            type="text"
            placeholder="Search text, author, handle…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <RefreshCw size={22} className="spin-icon" />
          <p>LOADING SIGNALS…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Radio size={28} />
          <p>
            {rows.length === 0
              ? 'No comments captured yet. The watcher seeds silently on first run; new comments will arrive here within 5 minutes of posting.'
              : 'No matches for these filters.'}
          </p>
        </div>
      ) : (
        <div className="comment-list">
          {filtered.map(r => {
            const meta = BRAND_META[r.brand];
            const replyUrl = `https://youtube.com/watch?v=${r.video_id}&lc=${r.comment_id}`;
            return (
              <article key={r.comment_id} className="comment-row">
                <div className="c-head">
                  <span
                    className="brand-badge"
                    style={{ color: meta.color, background: meta.bg, borderColor: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className="c-time">{timeAgo(r.published_at)}</span>
                  <span className="c-video">
                    {r.video_title || r.video_id}
                  </span>
                </div>
                <div className="c-author">
                  <span className="c-display">{r.author_display_name || 'Unknown'}</span>
                  {r.author_handle && <span className="c-handle">{r.author_handle}</span>}
                </div>
                <p className="c-text">{r.text_original || '(no text)'}</p>
                <div className="c-actions">
                  <a href={replyUrl} target="_blank" rel="noopener noreferrer" className="btn-reply">
                    <ExternalLink size={12} /> REPLY ON YOUTUBE
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .signals-root { padding: 24px 32px 80px; max-width: 1280px; }
        .signals-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
        .signals-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 800; font-family: var(--font-display); color: var(--color-text-primary); letter-spacing: 0.08em; margin: 0 0 6px; }
        .signals-sub { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-muted); line-height: 1.6; max-width: 640px; margin: 0; }
        .btn-refresh { display: inline-flex; align-items: center; gap: 6px; background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 14px; font-size: 10px; font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.12em; color: var(--color-text-secondary); cursor: pointer; transition: var(--transition-fast); }
        .btn-refresh:hover { border-color: var(--color-accent-secondary); color: var(--color-text-primary); }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .summary-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
        .s-card { background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 14px; display: flex; align-items: flex-start; gap: 10px; }
        .s-icon { color: var(--color-accent-secondary); margin-top: 2px; }
        .s-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; }
        .s-body { display: flex; flex-direction: column; gap: 3px; }
        .s-label { font-size: 8px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.14em; }
        .s-value { font-size: 20px; font-weight: 700; font-family: var(--font-display); color: var(--color-text-primary); }
        .s-value-text { font-size: 13px; font-family: var(--font-mono); }

        .filter-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px; background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 12px; }
        .brand-tabs { display: flex; gap: 6px; }
        .b-tab { background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 12px; font-size: 9px; font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.1em; color: var(--color-text-muted); cursor: pointer; transition: var(--transition-fast); }
        .b-tab:hover { color: var(--color-text-primary); border-color: var(--color-text-secondary); }
        .b-tab.active { color: var(--tab-color, var(--color-text-primary)); border-color: var(--tab-color, var(--color-accent-secondary)); background: rgba(255,255,255,0.03); }

        .video-select-wrap, .search-wrap { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 10px; color: var(--color-text-muted); flex: 1; min-width: 200px; }
        .video-select, .search-input { background: transparent; border: none; outline: none; color: var(--color-text-primary); font-family: var(--font-mono); font-size: 11px; flex: 1; }
        .video-select option { background: var(--color-bg-panel); color: var(--color-text-primary); }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; color: var(--color-text-muted); gap: 14px; background: var(--color-bg-panel); border: 1px dashed var(--border-color); border-radius: var(--radius-card); }
        .empty-state p { font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.06em; text-align: center; max-width: 420px; line-height: 1.6; margin: 0; }

        .comment-list { display: flex; flex-direction: column; gap: 10px; }
        .comment-row { background: var(--color-bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-card); padding: 16px 18px; transition: var(--transition-fast); }
        .comment-row:hover { border-color: var(--color-accent-secondary); }
        .c-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
        .brand-badge { font-size: 8px; font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.12em; padding: 3px 8px; border-radius: 4px; border: 1px solid; }
        .c-time { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); }
        .c-video { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-secondary); opacity: 0.7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 360px; }
        .c-author { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
        .c-display { font-size: 12px; font-weight: 700; color: var(--color-text-primary); font-family: var(--font-mono); }
        .c-handle { font-size: 10px; color: var(--color-text-muted); font-family: var(--font-mono); }
        .c-text { font-size: 13px; color: var(--color-text-primary); line-height: 1.55; margin: 0 0 12px; white-space: pre-wrap; word-break: break-word; }
        .c-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .btn-reply { display: inline-flex; align-items: center; gap: 6px; background: rgba(79,172,254,0.08); border: 1px solid rgba(79,172,254,0.3); border-radius: 6px; padding: 6px 12px; font-size: 9px; font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.1em; color: #4facfe; text-decoration: none; transition: var(--transition-fast); }
        .btn-reply:hover { background: rgba(79,172,254,0.16); border-color: #4facfe; }

        @media (max-width: 1100px) { .summary-cards { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px) { .summary-cards { grid-template-columns: repeat(2, 1fr); } .signals-root { padding: 16px; } .filter-bar { flex-direction: column; align-items: stretch; } }
      `}</style>
    </div>
  );
}
