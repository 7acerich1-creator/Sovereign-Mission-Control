"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Save, 
  Lock, 
  ShieldCheck, 
  Cpu,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';

type ConfigEntry = {
  id: string;
  category: string;
  key: string;
  value: string;
  description?: string;
};

export default function Settings() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('system_config')
      .select('*')
      .order('category', { ascending: true });
    
    if (data) {
       setConfigs(data as ConfigEntry[]);
       const prompt = data.find(c => c.key === 'system_prompt');
       if (prompt) setSystemPrompt(prompt.value);
    }
    setLoading(false);
  }

  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert(
          { key: 'system_prompt', value: systemPrompt, category: 'Core' },
          { onConflict: 'key' }
        );
      if (error) throw error;
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigBlur = async (item: ConfigEntry, newValue: string) => {
    if (newValue === item.value) return; // No change
    try {
      await supabase
        .from('system_config')
        .upsert(
          { key: item.key, value: newValue, category: item.category, description: item.description },
          { onConflict: 'key' }
        );
      // Update local state
      setConfigs(prev => prev.map(c => c.id === item.id ? { ...c, value: newValue } : c));
    } catch (err) {
      console.error('Config auto-save failed:', err);
    }
  };

  const categories = Array.from(new Set(configs.map(c => c.category)));

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">SETTINGS</h1>
          <p className="eyebrow text-secondary">CORE PERSONALITY :: SYSTEM CONFIG</p>
        </div>
      </header>

      <div className="settings-layout">
        <section className="settings-main-column">
          {/* PERSONALITY SECTION */}
          <div className="card personality-card mb-8">
            <div className="card-header-with-action">
              <div className="header-labels">
                <h3 className="h3-display">PERSONALITY & CHARACTER</h3>
                <span className="text-secondary text-xs">Primary System Prompt :: THE MASTER INSTRUCTION</span>
              </div>
              <button 
                className={`btn ${savedSuccess ? 'btn-success' : 'btn-primary'}`} 
                onClick={handleSavePrompt}
                disabled={isSaving}
              >
                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : (savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />)}
                <span className="ml-2">{isSaving ? 'UPDATING...' : (savedSuccess ? 'SAVED' : 'SAVE CHANGES')}</span>
              </button>
            </div>
            
            <textarea 
              className="textarea-personality font-mono" 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Inject the Sovereign Protocol..."
            />
          </div>

          {/* CONFIG GRID */}
          <div className="config-sections">
            {categories.map(cat => (
              <div key={cat} className="config-group mb-8">
                <h4 className="config-cat-title">{cat.toUpperCase()}</h4>
                <div className="card no-padding overflow-hidden">
                  <div className="config-list">
                    {configs.filter(c => c.category === cat).map(item => (
                      <div key={item.id} className="config-item">
                        <div className="config-info">
                          <span className="config-key">{item.key.replace(/_/g, ' ')}</span>
                          <span className="config-desc">{item.description}</span>
                        </div>
                        <input 
                          type="text" 
                          className="config-input" 
                          defaultValue={item.value}
                          onBlur={(e) => handleConfigBlur(item, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-sidebar-column">
          <div className="card status-panel">
            <h3 className="h3-display mb-6">SYSTEM CORE</h3>
            <div className="core-stats">
              <div className="core-stat-item">
                <Cpu size={16} className="text-secondary" />
                <span>LATENCY :: 42ms</span>
              </div>
              <div className="core-stat-item">
                <ShieldCheck size={16} className="text-success" />
                <span>INTEGRITY :: 100%</span>
              </div>
              <div className="core-stat-item">
                <Lock size={16} className="text-primary" />
                <span>ENCRYPTION :: RSA-4096</span>
              </div>
            </div>
            <button className="btn btn-outline w-full mt-8">RUN SYSTEM DIAGNOSTICS</button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .settings-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 48px;
        }

        .card-header-with-action {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .btn-success { background: var(--color-accent-success); color: var(--color-bg-deepest); }

        .textarea-personality {
          width: 100%;
          min-height: 400px;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 24px;
          color: var(--color-text-primary);
          line-height: 1.6;
          font-size: 14px;
          resize: vertical;
          outline: none;
          transition: var(--transition-fast);
        }

        .textarea-personality:focus { border-color: var(--color-accent-primary); }

        .config-cat-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--color-text-muted);
          letter-spacing: 0.2em;
          margin-bottom: 12px;
          padding-left: 8px;
        }

        .no-padding { padding: 0; }

        .config-list { display: flex; flex-direction: column; }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          transition: var(--transition-fast);
        }

        .config-item:last-child { border-bottom: none; }
        .config-item:hover { background: rgba(255, 255, 255, 0.02); }

        .config-info { display: flex; flex-direction: column; gap: 4px; }
        .config-key { font-size: 13px; font-weight: 700; text-transform: capitalize; color: var(--color-text-primary); }
        .config-desc { font-size: 11px; color: var(--color-text-muted); }

        .config-input {
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 8px 12px;
          color: var(--color-accent-secondary);
          font-family: var(--font-mono);
          font-size: 13px;
          text-align: right;
          width: 200px;
          transition: var(--transition-fast);
        }

        .config-input:focus { border-color: var(--color-accent-secondary); outline: none; background: rgba(124, 92, 252, 0.05); }

        .core-stats { display: flex; flex-direction: column; gap: 16px; }
        .core-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-secondary);
        }

        .status-panel { background: linear-gradient(135deg, var(--color-bg-surface), var(--color-bg-deepest)); }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
