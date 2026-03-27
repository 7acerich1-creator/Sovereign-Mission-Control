"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Brain, 
  Search, 
  FileText, 
  Link as LinkIcon, 
  Upload,
  Tag,
  Database
} from 'lucide-react';

type KnowledgeNode = {
  id: string;
  category: string;
  content: string;
  created_at: string;
  tags?: string[];
};

export default function SecondBrain() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Note' | 'URL' | 'File'>('Note');
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [bulkContent, setBulkContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('knowledge-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_nodes' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNodes(data as KnowledgeNode[]);
    setLoading(false);
  }

  async function handleStore() {
    setIsSaving(true);
    try {
      let content = '';
      let category = 'note';

      if (activeTab === 'Note') {
        content = noteContent;
        category = 'note';
      } else if (activeTab === 'URL') {
        content = urlContent;
        category = 'url';
      }

      if (!content.trim()) { setIsSaving(false); return; }

      const { error } = await supabase.from('knowledge_nodes').insert({
        content,
        category,
        tags: [],
      });

      if (error) throw error;

      // Clear inputs
      if (activeTab === 'Note') setNoteContent('');
      if (activeTab === 'URL') setUrlContent('');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      fetchData();
    } catch (err) {
      console.error('Store failed:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBulkSync() {
    if (!bulkContent.trim()) return;
    setIsSaving(true);
    try {
      const lines = bulkContent.split('\n').filter(l => l.trim());
      const rows = lines.map(line => ({
        content: line.trim(),
        category: 'bulk',
        tags: [],
      }));

      const { error } = await supabase.from('knowledge_nodes').insert(rows);
      if (error) throw error;

      setBulkContent('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      fetchData();
    } catch (err) {
      console.error('Bulk sync failed:', err);
    } finally {
      setIsSaving(false);
    }
  }

  const filteredNodes = nodes.filter(node => 
    node.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">SECOND BRAIN</h1>
          <p className="eyebrow text-secondary">KNOWLEDGE ARCHITECTURE :: SEMANTIC MEMORY</p>
        </div>
      </header>

      {/* STAT CARDS */}
      <section className="metrics-grid">
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">STORED FACTS</span>
            <span className="stat-value">{nodes.length}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">CATEGORIES</span>
            <span className="stat-value">{new Set(nodes.map(n => n.category)).size}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">SEARCH RESULTS</span>
            <span className="stat-value">{searchQuery ? filteredNodes.length : '—'}</span>
          </div>
        </div>
      </section>

      <div className="brain-layout">
        {/* INPUT SECTION */}
        <section className="brain-input-column">
          <div className="card input-card">
            <div className="type-selector">
              <button 
                className={`type-btn ${activeTab === 'Note' ? 'active' : ''}`}
                onClick={() => setActiveTab('Note')}
              >
                <FileText size={16} />
                <span>QUICK NOTE</span>
              </button>
              <button 
                className={`type-btn ${activeTab === 'URL' ? 'active' : ''}`}
                onClick={() => setActiveTab('URL')}
              >
                <LinkIcon size={16} />
                <span>URL</span>
              </button>
              <button 
                className={`type-btn ${activeTab === 'File' ? 'active' : ''}`}
                onClick={() => setActiveTab('File')}
              >
                <Upload size={16} />
                <span>FILE</span>
              </button>
            </div>

            <div className="input-body">
              {activeTab === 'Note' && (
                <textarea 
                  className="textarea-brain" 
                  placeholder="Capture raw data for processing..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              )}
              {activeTab === 'URL' && (
                <input 
                  type="text" 
                  className="input-brain" 
                  placeholder="Paste URL (YouTube, Article, Documentation)..."
                  value={urlContent}
                  onChange={(e) => setUrlContent(e.target.value)}
                />
              )}
              {activeTab === 'File' && (
                <div className="drop-zone">
                  <Upload size={32} className="mb-4 opacity-20" />
                  <p>DRAG & DROP ARCHIVE</p>
                  <span className="text-xs opacity-50">PDF, TXT, JSON (Max 10MB)</span>
                </div>
              )}
              <div className="input-footer">
                <button 
                  className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'} w-full`}
                  onClick={handleStore}
                  disabled={isSaving}
                >
                  {isSaving ? 'STORING...' : (saveSuccess ? '✓ STORED' : 'STORE IN ARCHITECTURE →')}
                </button>
              </div>
            </div>
          </div>
          
          <div className="card bulk-add-card">
            <h3 className="h3-display mb-4">BULK INGESTION</h3>
            <textarea 
              className="textarea-small" 
              placeholder="Paste multiple items (one per line)..."
              value={bulkContent}
              onChange={(e) => setBulkContent(e.target.value)}
            />
            <button 
              className="btn btn-outline w-full mt-4"
              onClick={handleBulkSync}
              disabled={isSaving}
            >
              {isSaving ? 'SYNCING...' : 'BULK SYNC'}
            </button>
          </div>
        </section>

        {/* SEARCH & LIST SECTION */}
        <section className="brain-list-column">
          <div className="search-container mb-8">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search architecture..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="memory-list">
            {filteredNodes.map((node, idx) => (
              <div key={node.id} className={`card memory-card fade-in stagger-${(idx % 3) + 1}`}>
                <div className="memory-header">
                  <div className="category-tag">
                    <Database size={10} />
                    <span>{node.category.toUpperCase()}</span>
                  </div>
                  <span className="memory-time">{new Date(node.created_at).toLocaleDateString()}</span>
                </div>
                <p className="memory-content">{node.content}</p>
                <div className="memory-footer">
                   <div className="tag-group">
                     {node.tags?.map(tag => (
                       <span key={tag} className="s-tag">#{tag}</span>
                     ))}
                   </div>
                </div>
              </div>
            ))}
            {filteredNodes.length === 0 && (
              <div className="empty-state">
                <Brain size={48} className="empty-icon" />
                <p>MEMORY ARCHIVE EMPTY</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .brain-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 48px;
        }

        .input-card {
          padding: 0;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .type-selector {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border-color);
        }

        .type-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .type-btn.active {
          background: var(--color-bg-surface);
          color: var(--color-accent-primary);
          box-shadow: inset 0 -2px 0 var(--color-accent-primary);
        }

        .input-body {
          padding: 24px;
        }

        .textarea-brain {
          width: 100%;
          min-height: 160px;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          font-size: 13px;
          margin-bottom: 20px;
          resize: none;
        }

        .input-brain {
          width: 100%;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          font-size: 13px;
          margin-bottom: 20px;
        }

        .drop-zone {
          height: 160px;
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .btn-success { background: var(--color-accent-success); color: var(--color-bg-deepest); }

        .textarea-small {
          width: 100%;
          min-height: 100px;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px;
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          font-size: 12px;
          resize: none;
        }

        .search-bar {
          position: relative;
          background: var(--color-bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0 48px;
          height: 52px;
          display: flex;
          align-items: center;
        }

        .search-icon { position: absolute; left: 16px; color: var(--color-text-muted); }

        .search-bar input {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--color-text-primary);
          font-size: 15px;
          outline: none;
        }

        .memory-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .memory-card {
          padding: 24px;
        }

        .memory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .category-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 9px;
          font-weight: 800;
          color: var(--color-accent-secondary);
          font-family: var(--font-mono);
          background: rgba(124, 92, 252, 0.1);
          padding: 4px 10px;
          border-radius: 4px;
        }

        .memory-time {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .memory-content {
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          margin-bottom: 16px;
        }

        .s-tag {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-accent-primary);
          margin-right: 12px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 0;
          color: var(--color-text-muted);
          border: 1px dashed var(--border-color);
          border-radius: 16px;
        }

        .empty-icon { opacity: 0.2; margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
