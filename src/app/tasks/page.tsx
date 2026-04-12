"use client";

import { useState, useEffect } from 'react';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Flame,
  FolderOpen
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  list_name: string;
  folder_name: string;
  folder_id: string;
  url: string;
};

type FolderGroup = {
  name: string;
  id: string;
  color: string;
  tasks: Task[];
};

const FOLDER_COLORS: Record<string, string> = {
  'Revenue Engine': '#43e97b',
  'Content Pipeline': '#fddb92',
  'Infrastructure': '#4facfe',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'complete'>('active');

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/clickup/tasks');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        setLastSync(data.updated_at);
      }
    } catch (e) {
      console.error('Failed to fetch ClickUp tasks:', e);
    }
    setLoading(false);
  }

  const now = new Date();

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'Complete';
    if (filter === 'complete') return t.status === 'Complete';
    return true;
  });

  // Group by folder
  const folderMap = new Map<string, Task[]>();
  for (const t of filtered) {
    const key = t.folder_name || 'Uncategorized';
    if (!folderMap.has(key)) folderMap.set(key, []);
    folderMap.get(key)!.push(t);
  }

  const folders: FolderGroup[] = Array.from(folderMap.entries()).map(([name, tasks]) => ({
    name,
    id: tasks[0]?.folder_id || '',
    color: FOLDER_COLORS[name] || '#888',
    tasks: tasks.sort((a, b) => {
      // Urgent/High first, then by due date
      const pOrder: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3, none: 4 };
      const pDiff = (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
      if (pDiff !== 0) return pDiff;
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      return 1;
    }),
  }));

  const statusIcon = (s: string) => {
    if (s === 'Complete') return <CheckCircle2 size={13} style={{ color: 'var(--color-accent-success)' }} />;
    if (s === 'In Progress') return <Clock size={13} style={{ color: '#4facfe' }} />;
    return <Target size={13} style={{ color: 'var(--color-text-muted)' }} />;
  };

  const priorityColor = (p: string) => {
    if (p === 'Urgent') return '#ff4757';
    if (p === 'High') return 'var(--color-accent-danger, #e74c3c)';
    if (p === 'Medium') return 'var(--color-accent-primary)';
    return 'var(--color-text-muted)';
  };

  const formatDue = (d: string | null) => {
    if (!d) return null;
    const due = new Date(d);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
    if (diff === 0) return { text: 'Today', overdue: false };
    if (diff === 1) return { text: 'Tomorrow', overdue: false };
    return { text: `${diff}d`, overdue: false };
  };

  const totalActive = tasks.filter(t => t.status !== 'Complete').length;
  const totalComplete = tasks.filter(t => t.status === 'Complete').length;
  const totalOverdue = tasks.filter(t => {
    if (t.status === 'Complete' || !t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">TASKS & PROJECTS</h1>
          <p className="eyebrow text-secondary">
            CLICKUP LIVE MIRROR :: ALL EDITING IN CLICKUP
            {lastSync && (
              <span style={{ marginLeft: 12, opacity: 0.5, fontSize: 9 }}>
                synced {new Date(lastSync).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* TOP BAR */}
      <div className="top-bar">
        <div className="filter-tabs">
          {(['active', 'complete', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? 'active' : ''}`}>
              {f === 'active' ? `Active (${totalActive})` : f === 'complete' ? `Complete (${totalComplete})` : `All (${tasks.length})`}
            </button>
          ))}
        </div>
        <div className="top-actions">
          {totalOverdue > 0 && (
            <span className="overdue-badge">
              <AlertCircle size={11} /> {totalOverdue} overdue
            </span>
          )}
          <button onClick={fetchTasks} className="sync-btn" title="Refresh from ClickUp">
            <RefreshCw size={11} className={loading ? 'spin' : ''} /> SYNC
          </button>
          <a href="https://app.clickup.com/90141025752/home" target="_blank" rel="noopener noreferrer" className="clickup-btn">
            Open ClickUp <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* BOARD VIEW */}
      {loading && tasks.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Pulling tasks from ClickUp...</p>
        </div>
      ) : folders.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {filter === 'complete' ? 'No completed tasks yet.' : 'No active tasks. Add some in ClickUp.'}
          </p>
        </div>
      ) : (
        <div className="board-grid">
          {folders.map(folder => (
            <div key={folder.name} className="card folder-column">
              <div className="folder-header">
                <FolderOpen size={14} style={{ color: folder.color }} />
                <span className="folder-name" style={{ color: folder.color }}>{folder.name}</span>
                <span className="folder-count">{folder.tasks.length}</span>
              </div>

              <div className="folder-tasks">
                {folder.tasks.map(task => {
                  const due = formatDue(task.due_date);
                  return (
                    <a key={task.id} href={task.url} target="_blank" rel="noopener noreferrer" className="task-card">
                      <div className="tc-top">
                        {statusIcon(task.status)}
                        <span className="tc-title">{task.title}</span>
                      </div>
                      <div className="tc-bottom">
                        <span className="tc-list">{task.list_name}</span>
                        <span className="tc-priority" style={{ color: priorityColor(task.priority) }}>
                          {task.priority === 'Urgent' && <Flame size={9} />}
                          {task.priority !== 'none' && task.priority}
                        </span>
                        {due && (
                          <span className={`tc-due ${due.overdue ? 'overdue' : ''}`}>
                            {due.overdue && <AlertCircle size={9} />}
                            {due.text}
                          </span>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .filter-tabs {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 3px;
          border: 1px solid var(--border-color);
        }
        .filter-btn {
          background: none;
          border: none;
          padding: 7px 14px;
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .filter-btn.active {
          background: rgba(255, 255, 255, 0.08);
          color: var(--color-text-primary);
        }
        .filter-btn:hover { color: var(--color-text-primary); }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .overdue-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: #ff4757;
          padding: 5px 10px;
          background: rgba(255, 71, 87, 0.1);
          border-radius: 6px;
        }
        .sync-btn, .clickup-btn {
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          transition: all 0.15s;
        }
        .sync-btn:hover, .clickup-btn:hover {
          border-color: var(--color-text-muted);
          color: var(--color-text-primary);
        }
        .clickup-btn { color: #7B68EE; border-color: rgba(123, 104, 238, 0.3); }
        .clickup-btn:hover { border-color: #7B68EE; }

        .board-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }
        .folder-column { padding: 20px; }
        .folder-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .folder-name {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .folder-count {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .folder-tasks {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .task-card {
          display: block;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.015);
          text-decoration: none;
          color: inherit;
          transition: all 0.15s;
          cursor: pointer;
        }
        .task-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .tc-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }
        .tc-title {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1.4;
        }
        .tc-bottom {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.04em;
          padding-left: 23px;
        }
        .tc-list {
          color: var(--color-text-muted);
          opacity: 0.6;
        }
        .tc-priority {
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .tc-due {
          display: flex;
          align-items: center;
          gap: 3px;
          color: var(--color-text-muted);
        }
        .tc-due.overdue {
          color: #ff4757;
          font-weight: 700;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 768px) {
          .board-grid { grid-template-columns: 1fr; }
          .top-bar { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  );
}
