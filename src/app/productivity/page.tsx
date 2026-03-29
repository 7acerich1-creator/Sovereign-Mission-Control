"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Zap,
  Target,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Calendar,
  MessageCircle,
  Send,
  Clock,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';

const SAPPHIRE_INSIGHTS = [
  "Revenue momentum builds from consistent daily execution. Track the inputs, not just the outputs.",
  "The Inner Circle pipeline is your highest-leverage growth channel. Nurture sequences should run 24/7.",
  "Content velocity directly correlates with list growth. Yuki should be generating minimum 3 hooks per day.",
  "Your automation coverage is the multiplier. Every manual task Alfred can absorb frees you for architecture.",
  "Pattern analysis shows weekday mornings (7-10 AM) produce 3x engagement. Front-load your content drops.",
  "At current trajectory, hitting $1.2M requires $4,000/day in revenue actions. Break that into hourly execution blocks.",
  "The funnel is only as strong as its weakest conversion point. Vector needs fresh data on where leads drop off.",
  "Veritas flagged 3 market signals this week. Review them before your next content batch — timing is everything.",
  "Delegate faster. You're the Architect, not the mason. Every crew member should have active tasks right now.",
  "Revenue milestones: $100K validates the model. $300K proves scale. $1.2M proves sovereignty.",
];

type Todo = { id: string; text: string; done: boolean };

export default function Productivity() {
  const [habits, setHabits] = useState<boolean[]>(new Array(90).fill(false));
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [note, setNote] = useState('');
  const [sapphireInsight, setSapphireInsight] = useState('');
  const [sapphireInput, setSapphireInput] = useState('');
  const [sapphireResponse, setSapphireResponse] = useState('');
  const [askingSapphire, setAskingSapphire] = useState(false);

  useEffect(() => {
    fetchHabits();
    fetchTodos();
    fetchNote();
    setSapphireInsight(SAPPHIRE_INSIGHTS[Math.floor(Math.random() * SAPPHIRE_INSIGHTS.length)]);

    const todosChannel = supabase
      .channel('todos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => fetchTodos())
      .subscribe();

    return () => { supabase.removeChannel(todosChannel); };
  }, []);

  async function fetchHabits() {
    const { data } = await supabase.from('habit_days').select('day_index').eq('completed', true);
    if (data) {
      const newHabits = new Array(90).fill(false);
      data.forEach((d: any) => { if (d.day_index >= 0 && d.day_index < 90) newHabits[d.day_index] = true; });
      setHabits(newHabits);
    }
  }

  async function fetchTodos() {
    const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: true });
    if (data) {
      setTodos(data.map((t: any) => ({ id: t.id, text: t.text, done: t.done })));
    }
  }

  async function fetchNote() {
    const { data } = await supabase.from('architect_notes').select('content').limit(1).single();
    if (data) {
      setNote(data.content);
    }
  }

  const toggleHabit = async (index: number) => {
    const newHabits = [...habits];
    newHabits[index] = !newHabits[index];
    setHabits(newHabits);
    if (newHabits[index]) {
      await supabase.from('habit_days').upsert({ day_index: index, completed: true }, { onConflict: 'day_index' });
    } else {
      await supabase.from('habit_days').delete().eq('day_index', index);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodo, done: false }]);
    setNewTodo('');
    await supabase.from('todos').insert({ text: newTodo, done: false });
  };

  const toggleTodo = async (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
    const target = todos.find(t => t.id === id);
    if (target) await supabase.from('todos').update({ done: !target.done }).eq('id', id);
  };

  const deleteTodo = async (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
    await supabase.from('todos').delete().eq('id', id);
  };

  const saveNote = async (val: string) => {
    setNote(val);
  };

  const persistNote = async () => {
    await supabase.from('architect_notes').upsert({ id: 'primary', content: note }, { onConflict: 'id' });
  };

  async function askSapphire() {
    if (!sapphireInput.trim() || askingSapphire) return;
    setAskingSapphire(true);
    setSapphireResponse('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: 'sapphire', content: `[PRODUCTIVITY CONTEXT] ${sapphireInput.trim()}` }),
      });
      const data = await res.json();
      setSapphireResponse(data.response || 'Processing your request, Architect.');
    } catch {
      setSapphireResponse('Connection interrupted. Try again.');
    }
    setSapphireInput('');
    setAskingSapphire(false);
  }

  const completedDays = habits.filter(h => h).length;
  const progressPercent = Math.round((completedDays / 90) * 100);
  const currentPhase = completedDays <= 30 ? 'Foundation' : (completedDays <= 60 ? 'Growth' : 'Scale');
  const todosDone = todos.filter(t => t.done).length;
  const todosTotal = todos.length;

  // Revenue goal tracking
  const goalAmount = 1200000;
  const targetDate = new Date('2027-01-01');
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyTarget = daysRemaining > 0 ? Math.round(goalAmount / daysRemaining) : 0;

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">PRODUCTIVITY</h1>
          <p className="eyebrow text-secondary">SOVEREIGN EXECUTION MATRIX :: SAPPHIRE COORDINATED</p>
        </div>
      </header>

      {/* REVENUE GOAL TRACKER */}
      <div className="card revenue-tracker">
        <div className="revenue-header">
          <div className="revenue-title">
            <DollarSign size={18} style={{ color: 'var(--color-accent-primary)' }} />
            <span>$1.2M LIQUID SUM OBJECTIVE</span>
          </div>
          <div className="revenue-deadline">
            <Calendar size={12} />
            <span>{daysRemaining} DAYS REMAINING</span>
          </div>
        </div>
        <div className="revenue-bar-container">
          <div className="revenue-bar">
            <div className="revenue-bar-fill" style={{ width: '0%' }}></div>
          </div>
          <div className="revenue-markers">
            <span>$0</span>
            <span className="milestone">$100K</span>
            <span className="milestone">$300K</span>
            <span className="milestone">$600K</span>
            <span>$1.2M</span>
          </div>
        </div>
        <div className="revenue-stats">
          <div className="rev-stat">
            <span className="rev-stat-label">DAILY TARGET</span>
            <span className="rev-stat-value">${dailyTarget.toLocaleString()}/day</span>
          </div>
          <div className="rev-stat">
            <span className="rev-stat-label">MONTHLY TARGET</span>
            <span className="rev-stat-value">${(dailyTarget * 30).toLocaleString()}/mo</span>
          </div>
          <div className="rev-stat">
            <span className="rev-stat-label">TARGET DATE</span>
            <span className="rev-stat-value">JAN 1, 2027</span>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <section className="metrics-grid">
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">HABIT STREAK</span>
            <span className="stat-value">{completedDays} / 90</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">CURRENT PHASE</span>
            <span className="stat-value">{currentPhase.toUpperCase()}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">TASKS TODAY</span>
            <span className="stat-value">{todosDone}/{todosTotal}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">EXECUTION</span>
            <span className="stat-value">{progressPercent}%</span>
          </div>
        </div>
      </section>

      {/* SAPPHIRE COORDINATION PANEL */}
      <div className="card sapphire-panel">
        <div className="sapphire-header">
          <div className="sapphire-tag">
            <div className="sapphire-dot"></div>
            <span>SAPPHIRE — COORDINATION</span>
          </div>
          <button className="sapphire-refresh" onClick={() => setSapphireInsight(SAPPHIRE_INSIGHTS[Math.floor(Math.random() * SAPPHIRE_INSIGHTS.length)])}>
            <ArrowUpRight size={12} />
            NEW INSIGHT
          </button>
        </div>
        <div className="sapphire-insight">
          <MessageCircle size={14} style={{ color: '#4facfe', flexShrink: 0, marginTop: 2 }} />
          <p>{sapphireInsight}</p>
        </div>
        {sapphireResponse && (
          <div className="sapphire-response fade-in">
            <p>{sapphireResponse}</p>
          </div>
        )}
        <div className="sapphire-input-bar">
          <input
            type="text"
            placeholder="Ask Sapphire about productivity, strategy, next moves..."
            value={sapphireInput}
            onChange={e => setSapphireInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askSapphire()}
            className="sapphire-input"
          />
          <button className="sapphire-send" onClick={askSapphire} disabled={askingSapphire || !sapphireInput.trim()}>
            <Send size={14} />
          </button>
        </div>
      </div>

      <div className="productivity-grid">
        {/* HABIT TRACKER */}
        <div className="card habit-section">
          <div className="section-header">
            <h2 className="h2-display">90-DAY EXECUTION TRACKER</h2>
          </div>

          <div className="habit-matrix">
            {habits.map((done, idx) => (
              <div
                key={idx}
                className={`habit-cell ${done ? 'done' : ''} ${idx === completedDays ? 'today' : ''}`}
                onClick={() => toggleHabit(idx)}
                title={`Day ${idx + 1}`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          <div className="phase-indicator">
            <div className="phase-segment active">FOUNDATION (1-30)</div>
            <div className={`phase-segment ${completedDays > 30 ? 'active' : ''}`}>GROWTH (31-60)</div>
            <div className={`phase-segment ${completedDays > 60 ? 'active' : ''}`}>SCALE (61-90)</div>
          </div>
        </div>

        {/* TODOS & NOTES */}
        <div className="side-panels">
          <div className="card todo-section">
            <h2 className="h3-display mb-4">DAILY EXECUTION</h2>
            <div className="todo-input-group">
              <input
                type="text"
                className="input"
                placeholder="Add execution item..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              />
              <button className="btn-icon" onClick={addTodo}><Plus size={18} /></button>
            </div>
            <div className="todo-list">
              {todos.map(t => (
                <div key={t.id} className={`todo-item ${t.done ? 'done' : ''}`}>
                  <div className="todo-checkbox" onClick={() => toggleTodo(t.id)}>
                    {t.done && <CheckCircle2 size={12} />}
                  </div>
                  <span className="todo-text">{t.text}</span>
                  <button className="btn-delete" onClick={() => deleteTodo(t.id)}><Trash2 size={14} /></button>
                </div>
              ))}
              {todos.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No tasks. The Architect doesn't rest — add execution items.
                </p>
              )}
            </div>
          </div>

          <div className="card notes-section">
            <h2 className="h3-display mb-4">ARCHITECT NOTES</h2>
            <textarea
              className="textarea"
              placeholder="Captured frequency, strategic thoughts, breakthrough insights..."
              value={note}
              onChange={(e) => saveNote(e.target.value)}
              onBlur={persistNote}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        /* REVENUE TRACKER */
        .revenue-tracker {
          padding: 28px;
          margin-bottom: 24px;
          border-top: 3px solid var(--color-accent-primary);
        }
        .revenue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .revenue-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--color-accent-primary);
        }
        .revenue-deadline {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .revenue-bar-container { margin-bottom: 20px; }
        .revenue-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .revenue-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-success));
          border-radius: 4px;
          transition: width 1s ease;
        }
        .revenue-markers {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text-muted);
        }
        .milestone { color: var(--color-accent-primary); font-weight: 700; }
        .revenue-stats {
          display: flex;
          gap: 32px;
        }
        .rev-stat-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text-muted);
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .rev-stat-value {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        /* SAPPHIRE PANEL */
        .sapphire-panel {
          padding: 24px;
          margin-bottom: 24px;
          border-left: 3px solid #4facfe;
        }
        .sapphire-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .sapphire-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #4facfe;
        }
        .sapphire-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4facfe;
          box-shadow: 0 0 8px #4facfe;
        }
        .sapphire-refresh {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: 1px solid rgba(79, 172, 254, 0.2);
          border-radius: 6px;
          padding: 5px 10px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: rgba(79, 172, 254, 0.6);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .sapphire-refresh:hover {
          color: #4facfe;
          border-color: rgba(79, 172, 254, 0.4);
        }
        .sapphire-insight {
          display: flex;
          gap: 12px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          margin-bottom: 16px;
        }
        .sapphire-response {
          background: rgba(79, 172, 254, 0.06);
          border: 1px solid rgba(79, 172, 254, 0.12);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--color-text-secondary);
        }
        .sapphire-input-bar {
          display: flex;
          gap: 8px;
        }
        .sapphire-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(79, 172, 254, 0.15);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: var(--color-text-primary);
          outline: none;
          transition: border-color 0.2s;
        }
        .sapphire-input:focus { border-color: rgba(79, 172, 254, 0.4); }
        .sapphire-input::placeholder { color: rgba(232, 228, 216, 0.2); }
        .sapphire-send {
          background: rgba(79, 172, 254, 0.15);
          border: 1px solid rgba(79, 172, 254, 0.25);
          border-radius: 8px;
          color: #4facfe;
          padding: 8px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: var(--transition-fast);
        }
        .sapphire-send:hover:not(:disabled) { background: rgba(79, 172, 254, 0.25); }
        .sapphire-send:disabled { opacity: 0.3; cursor: not-allowed; }

        /* GRID */
        .productivity-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        .habit-matrix {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 8px;
          margin-bottom: 32px;
        }

        .habit-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .habit-cell:hover {
          border-color: var(--color-accent-secondary);
          background: rgba(124, 92, 252, 0.1);
        }
        .habit-cell.done {
          background: var(--color-accent-success);
          color: var(--color-bg-deepest);
          border-color: var(--color-accent-success);
          font-weight: 700;
        }
        .habit-cell.today {
          border-color: var(--color-accent-secondary);
          color: var(--color-accent-secondary);
          box-shadow: 0 0 10px rgba(124, 92, 252, 0.3);
        }

        .phase-indicator {
          display: flex;
          gap: 4px;
          height: 32px;
        }
        .phase-segment {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          color: var(--color-text-muted);
          transition: var(--transition-normal);
        }
        .phase-segment.active {
          background: rgba(201, 168, 76, 0.1);
          color: var(--color-accent-primary);
          border: 1px solid rgba(201, 168, 76, 0.2);
        }

        .side-panels {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .todo-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .input {
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          font-size: 12px;
          flex: 1;
          outline: none;
        }
        .input:focus { border-color: var(--color-accent-secondary); }

        .btn-icon {
          background: var(--color-accent-secondary);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .todo-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
        }

        .todo-checkbox {
          width: 18px;
          height: 18px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          color: var(--color-accent-success);
        }
        .todo-item.done .todo-checkbox {
          background: rgba(46, 204, 143, 0.15);
          border-color: var(--color-accent-success);
        }

        .todo-item.done .todo-text {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .todo-text {
          font-size: 12px;
          flex: 1;
        }

        .btn-delete {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          opacity: 0;
          transition: var(--transition-fast);
        }
        .todo-item:hover .btn-delete { opacity: 1; }

        .textarea {
          width: 100%;
          min-height: 200px;
          background: var(--color-bg-deepest);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          font-size: 13px;
          resize: vertical;
          outline: none;
        }
        .textarea:focus { border-color: var(--color-accent-secondary); }

        @media (max-width: 900px) {
          .productivity-grid { grid-template-columns: 1fr; }
          .revenue-stats { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
