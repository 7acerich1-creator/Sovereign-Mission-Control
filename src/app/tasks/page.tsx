"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckSquare, 
  Bot, 
  User, 
  Plus, 
  MoreVertical,
  Calendar,
  Zap,
  Clock,
  Activity
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Complete';
  priority: 'High' | 'Medium' | 'Low';
  due_date?: string;
};

type AgentAction = {
  id: string;
  event_type: string;
  title: string;
  description: string;
  created_at: string;
};

export default function Tasks() {
  const [activeTab, setActiveTab] = useState<'Human' | 'AI'>('Human');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        if (activeTab === 'Human') fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, () => {
        if (activeTab === 'AI') fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    if (activeTab === 'Human') {
      const { data } = await supabase.from('tasks').select('*');
      if (data) setTasks(data as Task[]);
    } else {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setActions(data as AgentAction[]);
    }
    setLoading(false);
  }

  const renderKanban = () => {
    const columns = ['To Do', 'In Progress', 'Complete'];
    return (
      <div className="kanban-board">
        {columns.map(col => (
          <div key={col} className="kanban-column">
            <div className="column-header">
              <span className="column-title">{col.toUpperCase()}</span>
              <span className="column-count">{tasks.filter(t => t.status === col).length}</span>
            </div>
            <div className="column-content">
              {tasks.filter(t => t.status === col).map(task => (
                <div key={task.id} className="card task-card fade-in">
                  <div className="task-priority">
                    <div className={`priority-dot ${task.priority?.toLowerCase()}`}></div>
                    <span>{task.priority || 'Medium'}</span>
                  </div>
                  <h3 className="task-title">{task.title}</h3>
                  <div className="task-meta">
                    <Calendar size={12} />
                    <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>
              ))}
              <div className="add-task-ghost">
                <Plus size={16} />
                <span>Add Task</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAgentActions = () => {
    return (
      <div className="actions-list">
        {actions.map((action, idx) => (
          <div key={action.id} className={`card action-card fade-in stagger-${(idx % 3) + 1}`}>
            <div className="action-icon">
              <Activity size={18} />
            </div>
            <div className="action-body">
              <div className="action-header">
                <span className="action-type">{action.event_type}</span>
                <span className="action-time">
                  {new Date(action.created_at).toLocaleString()}
                </span>
              </div>
              {action.title && <p className="action-title" style={{fontWeight:600, marginBottom:4, color:'var(--color-text-primary)'}}>{action.title}</p>}
              <p className="action-description">{action.description}</p>
            </div>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="empty-state">
            <Bot size={48} className="empty-icon" />
            <p>NO AGENT ACTIONS LOGGED</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">TASKS & PROJECTS</h1>
          <p className="eyebrow text-secondary">EXECUTION ARCHITECTURE</p>
        </div>
        
        <div className="tab-switcher">
          <button 
            className={`tab-btn ${activeTab === 'Human' ? 'active' : ''}`}
            onClick={() => setActiveTab('Human')}
          >
            <User size={16} />
            <span>HUMAN TASKS</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'AI' ? 'active' : ''}`}
            onClick={() => setActiveTab('AI')}
          >
            <Bot size={16} />
            <span>AGENT ACTIONS</span>
          </button>
        </div>
      </header>

      {activeTab === 'Human' ? renderKanban() : renderAgentActions()}

      <style jsx>{`
        .tab-switcher {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .tab-btn.active {
          background: var(--color-bg-surface);
          color: var(--color-accent-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .kanban-board {
          display: grid;
          grid-template-cols: repeat(3, 1fr);
          gap: 24px;
        }

        .kanban-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 8px;
        }

        .column-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--color-text-muted);
          letter-spacing: 0.1em;
        }

        .column-count {
          font-size: 10px;
          font-family: var(--font-mono);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 10px;
          color: var(--color-text-secondary);
        }

        .column-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .task-card {
          padding: 20px;
          cursor: grab;
        }

        .task-card:active { cursor: grabbing; }

        .task-priority {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-family: var(--font-mono);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .priority-dot { width: 6px; height: 6px; border-radius: 50%; }
        .priority-dot.high { background: var(--color-accent-danger); box-shadow: 0 0 8px var(--color-accent-danger); }
        .priority-dot.medium { background: var(--color-accent-primary); }
        .priority-dot.low { background: var(--color-accent-success); }

        .task-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 16px;
          color: var(--color-text-primary);
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .add-task-ghost {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border: 1px dashed var(--border-color);
          border-radius: 12px;
          color: var(--color-text-muted);
          font-size: 12px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .add-task-ghost:hover {
          border-color: var(--color-accent-secondary);
          color: var(--color-accent-secondary);
          background: rgba(124, 92, 252, 0.05);
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 800px;
        }

        .action-card {
          display: flex;
          gap: 20px;
          padding: 20px;
        }

        .action-icon {
          width: 40px;
          height: 40px;
          background: rgba(124, 92, 252, 0.1);
          color: var(--color-accent-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(124, 92, 252, 0.2);
        }

        .action-body { flex: 1; }
        .action-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .action-type { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .action-time { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); }
        .action-description { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }

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
