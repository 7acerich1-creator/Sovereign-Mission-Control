"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  category: string;
};

export default function Productivity() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchNote();

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();

    return () => { supabase.removeChannel(tasksChannel); };
  }, []);

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false });
    if (data) setTasks(data);
  }

  async function fetchNote() {
    const { data } = await supabase.from('architect_notes').select('content').limit(1).single();
    if (data) setNote(data.content);
  }

  const saveNote = (val: string) => setNote(val);
  const persistNote = async () => {
    await supabase.from('architect_notes').upsert({ id: 'primary', content: note }, { onConflict: 'id' });
  };

  async function cycleStatus(task: Task) {
    const next = task.status === 'To Do' ? 'In Progress' : task.status === 'In Progress' ? 'Complete' : 'To Do';
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', task.id);
  }

  // Revenue goal tracking
  const goalAmount = 1200000;
  const targetDate = new Date('2027-01-01');
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyTarget = daysRemaining > 0 ? Math.round(goalAmount / daysRemaining) : 0;

  const activeTasks = tasks.filter(t => t.status !== 'Complete');
  const completedTasks = tasks.filter(t => t.status === 'Complete');

  const priorityColor = (p: string) => {
    if (p === 'High') return 'var(--color-accent-danger, #e74c3c)';
    if (p === 'Medium') return 'var(--color-accent-primary)';
    return 'var(--color-text-muted)';
  };

  const statusIcon = (s: string) => {
    if (s === 'Complete') return <CheckCircle2 size={14} style={{ color: 'var(--color-accent-success)' }} />;
    if (s === 'In Progress') return <Clock size={14} style={{ color: '#4facfe' }} />;
    return <Target size={14} style={{ color: 'var(--color-text-muted)' }} />;
  };

  const formatDue = (d: string | null) => {
    if (!d) return null;
    const due = new Date(d);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
    if (diff === 0) return { text: 'Due today', overdue: false };
    if (diff === 1) return { text: 'Due tomorrow', overdue: false };
    return { text: `${diff}d left`, overdue: false };
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">COMMAND CENTER</h1>
          <p className="eyebrow text-secondary">NORTH STAR PRIORITIES :: SOVEREIGN EXECUTION</p>
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
            <span className="stat-label">ACTIVE TASKS</span>
            <span className="stat-value">{activeTasks.length}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">COMPLETED</span>
            <span className="stat-value">{completedTasks.length}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">OVERDUE</span>
            <span className="stat-value" style={{ color: tasks.filter(t => { const d = formatDue(t.due_date); return d && d.overdue && t.status !== 'Complete'; }).length > 0 ? 'var(--color-accent-danger, #e74c3c)' : undefined }}>
              {tasks.filter(t => { const d = formatDue(t.due_date); return d && d.overdue && t.status !== 'Complete'; }).length}
            </span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-content">
            <span className="stat-label">PLAN</span>
            <a href="https://app.clickup.com/90141025752/home" target="_blank" rel="noopener noreferrer" className="stat-value" style={{ color: '#4facfe', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              CLICKUP <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>

      {/* TASKS + NOTES GRID */}
      <div className="productivity-grid">
        <div className="card task-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="h2-display" style={{ margin: 0 }}>NORTH STAR TASKS</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>CLICK STATUS TO CYCLE</span>
          </div>

          <div className="task-list">
            {activeTasks.map(task => {
              const due = formatDue(task.due_date);
              return (
                <div key={task.id} className="task-row">
                  <div className="task-status" onClick={() => cycleStatus(task)} title="Click to cycle status">
                    {statusIcon(task.status)}
                  </div>
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="task-category">{task.category}</span>
                      <span className="task-priority" style={{ color: priorityColor(task.priority) }}>{task.priority}</span>
                      {due && (
                        <span className={`task-due ${due.overdue ? 'overdue' : ''}`}>
                          {due.overdue && <AlertCircle size={10} />}
                          {due.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {activeTasks.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                All tasks complete. Load the next batch.
              </p>
            )}
          </div>

          {completedTasks.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '20px 0', opacity: 0.3 }}></div>
              <div className="task-list completed-list">
                {completedTasks.map(task => (
                  <div key={task.id} className="task-row completed" onClick={() => cycleStatus(task)}>
                    <div className="task-status">{statusIcon(task.status)}</div>
                    <div className="task-info">
                      <div className="task-title">{task.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="side-panels">
          <div className="card notes-section">
            <h2 className="h3-display mb-4">ARCHITECT NOTES</h2>
            <textarea
              className="textarea"
              placeholder="Strategic thoughts, breakthrough insights, decisions made..."
              value={note}
              onChange={(e) => saveNote(e.target.value)}
              onBlur={persistNote}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
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

        .productivity-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        .task-section { padding: 24px; }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .task-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 12px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .task-row:hover { background: rgba(255, 255, 255, 0.03); }
        .task-row.completed { opacity: 0.4; }
        .task-row.completed .task-title { text-decoration: line-through; }

        .task-status {
          cursor: pointer;
          padding-top: 2px;
          flex-shrink: 0;
        }
        .task-status:hover { opacity: 0.7; }

        .task-info { flex: 1; min-width: 0; }
        .task-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--color-text-primary);
        }
        .task-meta {
          display: flex;
          gap: 12px;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.05em;
        }
        .task-category {
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .task-priority { font-weight: 700; }
        .task-due {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-text-muted);
        }
        .task-due.overdue {
          color: var(--color-accent-danger, #e74c3c);
          font-weight: 700;
        }

        .completed-list { opacity: 0.6; }

        .side-panels {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .textarea {
          width: 100%;
          min-height: 300px;
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
