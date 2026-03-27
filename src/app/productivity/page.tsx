"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Zap, 
  Target, 
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

const MOTIVATIONAL_MESSAGES = [
  "The simulation only rewards those who stay consistent.",
  "Biological drag is the only thing standing between you and Escape Velocity.",
  "Foundation is where the architecture is built. Do not skip.",
  "Growth requires friction. Lean into it.",
  "Scale is inevitable if the base is solid.",
  "One day at a time. One habit at a time.",
  "The Architect doesn't hope. The Architect executes.",
  "System mastery is a marathon, not a sprint.",
  "Your current frequency determines your next reality.",
  "Liberation starts with self-discipline."
];

type Todo = { id: string; text: string; done: boolean };

export default function Productivity() {
  const [habits, setHabits] = useState<boolean[]>(new Array(90).fill(false));
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchHabits();
    fetchTodos();
    fetchNote();
    setMessage(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);

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
    const newItem = { id: Date.now().toString(), text: newTodo, done: false };
    const nextTodos = [...todos, newItem];
    setTodos(nextTodos);
    setNewTodo('');
    await supabase.from('todos').insert({ text: newTodo, done: false });
  };

  const toggleTodo = async (id: string) => {
    const nextTodos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(nextTodos);
    const target = todos.find(t => t.id === id);
    if (target) await supabase.from('todos').update({ done: !target.done }).eq('id', id);
  };

  const deleteTodo = async (id: string) => {
    const nextTodos = todos.filter(t => t.id !== id);
    setTodos(nextTodos);
    await supabase.from('todos').delete().eq('id', id);
  };

  const saveNote = async (val: string) => {
    setNote(val);
  };

  const persistNote = async () => {
    await supabase.from('architect_notes').upsert({ id: 'primary', content: note }, { onConflict: 'id' });
  };

  const completedDays = habits.filter(h => h).length;
  const progressPercent = Math.round((completedDays / 90) * 100);
  const currentPhase = completedDays <= 30 ? 'Foundation' : (completedDays <= 60 ? 'Growth' : 'Scale');

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">PRODUCTIVITY</h1>
          <p className="eyebrow text-secondary">PHASE MATRIX 01</p>
        </div>
      </header>

      {/* STAT CARDS */}
      <section className="metrics-grid">
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">DAYS COMPLETED</span>
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
            <span className="stat-label">PROGRESS</span>
            <span className="stat-value">{progressPercent}%</span>
          </div>
        </div>
      </section>

      <div className="productivity-grid">
        {/* HABIT TRACKER */}
        <div className="card habit-section">
          <div className="section-header">
            <h2 className="h2-display">90-DAY HABIT TRACKER</h2>
            <div className="motivational-quote">"{message}"</div>
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
            <h2 className="h3-display mb-4">QUICK TASKS</h2>
            <div className="todo-input-group">
              <input 
                type="text" 
                className="input" 
                placeholder="Add focus task..." 
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
            </div>
          </div>

          <div className="card notes-section">
            <h2 className="h3-display mb-4">ARCHITECT NOTES</h2>
            <textarea 
              className="textarea" 
              placeholder="Captured frequency..." 
              value={note}
              onChange={(e) => saveNote(e.target.value)}
              onBlur={persistNote}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
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

        .motivational-quote {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-accent-primary);
          font-style: italic;
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
        }

        .btn-icon {
          background: var(--color-accent-secondary);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
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

        .todo-item:hover .btn-delete {
          opacity: 1;
        }

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
        }
      `}</style>
    </div>
  );
}
