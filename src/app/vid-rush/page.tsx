"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Play, ArrowRight } from 'lucide-react';

type VidRushItem = {
  id: string;
  topic: string;
  script: string;
  status: string;
  ctr_observed: number;
  created_at: string;
  title_variants: string[];
  thumbnail_prompt: string;
};

export default function VidRushPortal() {
  const [queue, setQueue] = useState<VidRushItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<VidRushItem | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  useEffect(() => {
    fetchQueue();
    const channel = supabase
      .channel('vid-rush-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vid_rush_queue' }, () => fetchQueue())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchQueue() {
    const { data } = await supabase
      .from('vid_rush_queue')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setQueue(data);
  }

  async function handleInitializeRush() {
    if (!newTopic) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/vid-rush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newTopic })
      });
      if (!res.ok) throw new Error("Synthesis failed");
      setNewTopic("");
      fetchQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="glow-orb glow-gold" style={{ top: '-10%', right: '25%' }} />
      <div className="glow-orb glow-violet" style={{ bottom: '-10%', left: '25%' }} />

      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">VID RUSH COMMAND</h1>
          <p className="eyebrow text-secondary">ALGORITHMIC SIEGE ENGINE :: PROTOCOL 77</p>
        </div>
      </header>

      {/* INITIALIZATION */}
      <div className="card init-card">
        <h2 className="section-label">INITIALIZE NEW SIEGE</h2>
        <div className="init-row">
          <input 
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInitializeRush()}
            placeholder="Enter High-CPM Topic (e.g. Wealth Architecture)..."
            className="init-input"
          />
          <button className="btn btn-primary" onClick={handleInitializeRush} disabled={isSynthesizing}>
            {isSynthesizing ? "SYNTHESIZING..." : "START RUSH →"}
          </button>
        </div>
      </div>

      <div className="vidrush-layout">
        {/* QUEUE TABLE */}
        <div className="card queue-card">
          <div className="queue-header">
            <h2 className="section-label">ACTIVE SIEGE QUEUE</h2>
            <span className="queue-count">{queue.length} IN SYSTEM</span>
          </div>
          <div className="queue-table">
            <div className="table-head">
              <span>TOPIC</span>
              <span>STATUS</span>
              <span>CTR</span>
              <span>ACTION</span>
            </div>
            {queue.length === 0 ? (
              <div className="empty-row">NO ACTIVE SIEGE DETECTED</div>
            ) : (
              queue.map((item) => (
                <div 
                  key={item.id} 
                  className={`table-row ${selectedItem?.id === item.id ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="topic-cell">
                    <span className="topic-name">{item.topic}</span>
                    <span className="topic-date">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className={`status-pill ${item.status === 'Siege_Active' ? 'active' : item.status === 'Synthesized' ? 'synth' : ''}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className={`ctr-value ${item.ctr_observed >= 6 ? 'good' : 'low'}`}>
                    {item.ctr_observed.toFixed(1)}%
                  </div>
                  <div>
                    <button className="view-btn">VIEW_PACKET</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DETAIL VIEW */}
        <div className="card detail-card">
          <h2 className="section-label">PACKET DETAILS</h2>
          {selectedItem ? (
            <div className="detail-content">
              <div className="detail-section">
                <span className="detail-label">TITLE VARIANTS</span>
                <div className="variants-list">
                  {selectedItem.title_variants?.map((title, i) => (
                    <div key={i} className="variant-item">{i + 1}. {title}</div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <span className="detail-label">RETENTION SCRIPT</span>
                <div className="script-block">{selectedItem.script}</div>
              </div>
              <div className="detail-section">
                <span className="detail-label">THUMBNAIL VECTOR</span>
                <div className="thumb-prompt">{selectedItem.thumbnail_prompt}</div>
              </div>
              <button className="btn btn-primary w-full">PUSH TO PRODUCTION CHANNEL →</button>
            </div>
          ) : (
            <div className="empty-detail">
              <Play size={32} className="empty-icon" />
              <p>SELECT A PACKET FROM THE QUEUE</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
        .h1-display { font-size: 48px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
        .eyebrow { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.28em; }

        .section-label { font-size: 11px; font-weight: 800; color: var(--color-text-muted); letter-spacing: 0.15em; font-family: var(--font-mono); }

        .init-card { margin-bottom: 32px; }
        .init-row { display: flex; gap: 16px; margin-top: 16px; }
        .init-input { flex: 1; background: var(--color-bg-deepest); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 16px; color: var(--color-text-primary); font-family: var(--font-mono); font-size: 13px; outline: none; transition: var(--transition-fast); }
        .init-input:focus { border-color: var(--color-accent-secondary); }

        .vidrush-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 32px; }

        .queue-card { padding: 0; overflow: hidden; }
        .queue-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.02); }
        .queue-count { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); }

        .table-head { display: grid; grid-template-columns: 2fr 1fr 0.7fr 1fr; padding: 12px 24px; font-size: 10px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.1em; border-bottom: 1px solid var(--border-color); }

        .table-row { display: grid; grid-template-columns: 2fr 1fr 0.7fr 1fr; padding: 16px 24px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: var(--transition-fast); align-items: center; }
        .table-row:hover { background: rgba(255,255,255,0.02); }
        .table-row.selected { background: rgba(124, 92, 252, 0.05); border-left: 3px solid var(--color-accent-secondary); }

        .topic-cell { display: flex; flex-direction: column; gap: 2px; }
        .topic-name { font-size: 13px; font-weight: 600; }
        .topic-date { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); }

        .status-pill { font-size: 10px; font-family: var(--font-mono); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color); color: var(--color-text-muted); }
        .status-pill.active { border-color: var(--color-accent-success); color: var(--color-accent-success); background: rgba(46,204,143,0.1); }
        .status-pill.synth { border-color: var(--color-accent-secondary); color: var(--color-accent-secondary); background: rgba(124,92,252,0.1); }

        .ctr-value { font-size: 13px; font-family: var(--font-mono); font-weight: 700; }
        .ctr-value.good { color: var(--color-accent-success); }
        .ctr-value.low { color: var(--color-accent-danger); }

        .view-btn { background: none; border: none; font-size: 10px; font-family: var(--font-mono); color: var(--color-accent-secondary); cursor: pointer; letter-spacing: 0.05em; }
        .view-btn:hover { color: var(--color-text-primary); }

        .empty-row { padding: 48px 24px; text-align: center; font-size: 12px; font-family: var(--font-mono); color: var(--color-text-muted); }

        .detail-card { display: flex; flex-direction: column; }
        .detail-content { display: flex; flex-direction: column; gap: 24px; margin-top: 20px; }
        .detail-section { display: flex; flex-direction: column; gap: 8px; }
        .detail-label { font-size: 10px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-muted); letter-spacing: 0.15em; }

        .variants-list { display: flex; flex-direction: column; gap: 6px; }
        .variant-item { font-size: 12px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-family: var(--font-mono); }

        .script-block { font-size: 12px; font-family: var(--font-mono); color: var(--color-text-secondary); background: var(--color-bg-deepest); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); white-space: pre-wrap; line-height: 1.6; max-height: 200px; overflow-y: auto; }

        .thumb-prompt { font-size: 12px; font-style: italic; color: var(--color-text-muted); background: rgba(255,255,255,0.02); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color); }

        .empty-detail { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; min-height: 300px; color: var(--color-text-muted); gap: 16px; }
        .empty-icon { opacity: 0.2; }
        .empty-detail p { font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.1em; }
      `}</style>
    </div>
  );
}
