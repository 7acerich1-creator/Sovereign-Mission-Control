"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CheckSquare,
  Bot,
  User,
  Plus,
  X,
  Calendar,
  Zap,
  Clock,
  Activity,
  Target,
  ArrowRight,
  UserCircle,
  Trash2,
  Flag,
  MessageCircle,
  Send,
  ChevronRight,
  ArrowLeft,
  Pencil,
  Save
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Complete';
  priority: 'High' | 'Medium' | 'Low';
  assigned_agent?: string;
  category?: string;
  due_date?: string;
  created_at?: string;
};

type AgentAction = {
  id: string;
  event_type: string;
  title: string;
  description: string;
  created_at: string;
};

const CREW_AGENTS = [
  { name: 'Sapphire', role: 'Orchestration', color: '#4facfe' },
  { name: 'Yuki', role: 'Creative & Content', color: '#fddb92' },
  { name: 'Anita', role: 'Outreach & Nurture', color: '#ebedee' },
  { name: 'Alfred', role: 'Ops & Automation', color: '#C0392B' },
  { name: 'Veritas', role: 'Research & Truth', color: '#43e97b' },
  { name: 'Vector', role: 'Analytics & Intel', color: '#E67E22' },
];

const AGENT_COLORS: Record<string, string> = {
  sapphire: '#4facfe',
  yuki: '#fddb92',
  anita: '#ebedee',
  alfred: '#C0392B',
  veritas: '#43e97b',
  vector: '#E67E22',
};

const MISSION_CATEGORIES = [
  { name: 'Revenue', icon: '💰' },
  { name: 'Content', icon: '📡' },
  { name: 'Outreach', icon: '🎯' },
  { name: 'Infrastructure', icon: '⚙️' },
  { name: 'Research', icon: '🔍' },
  { name: 'Analytics', icon: '📊' },
];

// Auto-assign agent based on task category
const CATEGORY_AGENT_MAP: Record<string, string> = {
  Revenue: 'Sapphire',
  Content: 'Yuki',
  Outreach: 'Anita',
  Infrastructure: 'Alfred',
  Research: 'Veritas',
  Analytics: 'Vector',
};

export default function Tasks() {
  const [activeTab, setActiveTab] = useState<'Human' | 'AI'>('Human');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Task chat state
  const [chatTask, setChatTask] = useState<Task | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editAgent, setEditAgent] = useState('');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editCategory, setEditCategory] = useState('Revenue');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newAgent, setNewAgent] = useState('');
  const [newCategory, setNewCategory] = useState('Revenue');
  const [newDueDate, setNewDueDate] = useState('');

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
      const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (data) setTasks(data as Task[]);
    } else {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setActions(data as AgentAction[]);
    }
    setLoading(false);
  }

  async function createTask() {
    if (!newTitle.trim()) return;
    // Auto-assign agent if none selected
    const assignedAgent = newAgent || CATEGORY_AGENT_MAP[newCategory] || null;
    await supabase.from('tasks').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      status: 'To Do',
      priority: newPriority,
      assigned_agent: assignedAgent,
      category: newCategory,
      due_date: newDueDate || null,
    });
    setNewTitle('');
    setNewDesc('');
    setNewPriority('Medium');
    setNewAgent('');
    setNewCategory('Revenue');
    setNewDueDate('');
    setShowForm(false);
  }

  async function moveTask(id: string, newStatus: 'To Do' | 'In Progress' | 'Complete') {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setEditAgent(task.assigned_agent || '');
    setEditPriority(task.priority);
    setEditCategory(task.category || 'Revenue');
  }

  async function saveEdit() {
    if (!editTask) return;
    const { error } = await supabase.from('tasks').update({
      assigned_agent: editAgent || null,
      priority: editPriority,
      category: editCategory,
    }).eq('id', editTask.id);
    if (error) {
      console.error('Task update failed:', error);
      return;
    }
    setEditTask(null);
    // Force refresh to show changes immediately
    fetchData();
  }

  async function sendTaskChat() {
    if (!chatTask || !chatInput.trim() || chatSending) return;
    const agent = chatTask.assigned_agent || 'sapphire';
    setChatSending(true);
    setChatResponse('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: agent.toLowerCase(),
          content: `[TASK CONTEXT: "${chatTask.title}" — ${chatTask.category || 'General'} — ${chatTask.priority} priority]\n\n${chatInput.trim()}`
        }),
      });
      const data = await res.json();
      setChatResponse(data.response || 'Processing...');
    } catch {
      setChatResponse('Transmission interrupted. Try again.');
    }
    setChatInput('');
    setChatSending(false);
  }

  const columns: { key: Task['status']; label: string; next?: Task['status']; accent: string }[] = [
    { key: 'To Do', label: 'MISSION QUEUE', next: 'In Progress', accent: 'var(--color-accent-secondary)' },
    { key: 'In Progress', label: 'EXECUTING', next: 'Complete', accent: 'var(--color-accent-primary)' },
    { key: 'Complete', label: 'MISSION COMPLETE', accent: 'var(--color-accent-success)' },
  ];

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Complete').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const highPriorityActive = tasks.filter(t => t.priority === 'High' && t.status !== 'Complete').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const renderKanban = () => (
    <div className="kanban-board">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} className="kanban-column">
            <div className="column-header" style={{ borderBottomColor: col.accent }}>
              <div className="column-title-row">
                <div className="column-dot" style={{ background: col.accent, boxShadow: `0 0 8px ${col.accent}` }} />
                <span className="column-title">{col.label}</span>
              </div>
              <span className="column-count" style={{ background: `${col.accent}15`, color: col.accent }}>{colTasks.length}</span>
            </div>
            <div className="column-content">
              {colTasks.map(task => {
                const agentColor = task.assigned_agent ? AGENT_COLORS[task.assigned_agent.toLowerCase()] || '#7C5CFC' : '#7C5CFC';
                const agentInfo = CREW_AGENTS.find(a => a.name === task.assigned_agent);
                return (
                  <div key={task.id} className="task-card fade-in">
                    <div className="task-priority-strip" style={{
                      background: task.priority === 'High' ? 'var(--color-accent-danger)' :
                        task.priority === 'Medium' ? 'var(--color-accent-primary)' : 'var(--color-accent-success)'
                    }} />
                    <div className="task-body">
                      <div className="task-top-row">
                        <div className="task-priority-badge" style={{
                          color: task.priority === 'High' ? 'var(--color-accent-danger)' :
                            task.priority === 'Medium' ? 'var(--color-accent-primary)' : 'var(--color-accent-success)',
                          background: task.priority === 'High' ? 'rgba(217, 85, 85, 0.1)' :
                            task.priority === 'Medium' ? 'rgba(201, 168, 76, 0.1)' : 'rgba(46, 204, 143, 0.1)',
                        }}>
                          <Flag size={9} />
                          {task.priority}
                        </div>
                        {task.category && (
                          <span className="task-category">
                            {MISSION_CATEGORIES.find(c => c.name === task.category)?.icon} {task.category}
                          </span>
                        )}
                      </div>
                      <h3 className="task-title">{task.title}</h3>
                      {task.description && <p className="task-desc">{task.description}</p>}

                      {/* Agent Assignment Block */}
                      {task.assigned_agent ? (
                        <div className="task-agent-block" style={{ borderColor: `${agentColor}30` }}>
                          <div className="task-agent-avatar" style={{ background: `${agentColor}20`, color: agentColor }}>
                            <UserCircle size={14} />
                          </div>
                          <div className="task-agent-info">
                            <span className="task-agent-name" style={{ color: agentColor }}>{task.assigned_agent}</span>
                            <span className="task-agent-role">{agentInfo?.role || ''}</span>
                          </div>
                          <button
                            className="task-chat-btn"
                            style={{ color: agentColor, borderColor: `${agentColor}30` }}
                            onClick={() => { setChatTask(task); setChatResponse(''); }}
                            title={`Message ${task.assigned_agent}`}
                          >
                            <MessageCircle size={12} />
                          </button>
                        </div>
                      ) : (
                        <button className="task-assign-prompt" onClick={() => openEdit(task)}>
                          <UserCircle size={13} />
                          <span>ASSIGN CREW MEMBER</span>
                        </button>
                      )}

                      <div className="task-footer">
                        <div className="task-meta-left">
                          {task.due_date && (
                            <span className="task-date">
                              <Calendar size={10} />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="task-actions">
                          <button className="task-action-btn edit" onClick={() => openEdit(task)} title="Edit Task">
                            <Pencil size={12} />
                          </button>
                          {col.next && (
                            <button className="task-action-btn move" onClick={() => moveTask(task.id, col.next!)} title={`Move to ${col.next}`}>
                              <ArrowRight size={13} />
                            </button>
                          )}
                          <button className="task-action-btn delete" onClick={() => deleteTask(task.id)} title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {col.key === 'To Do' && (
                <button className="add-task-ghost" onClick={() => setShowForm(true)}>
                  <Plus size={16} />
                  <span>Add Mission Task</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAgentActions = () => (
    <div className="actions-list">
      {actions.map((action, idx) => (
        <div key={action.id} className={`card action-card fade-in stagger-${(idx % 3) + 1}`}>
          <div className="action-icon-wrap">
            <Activity size={18} />
          </div>
          <div className="action-body">
            <div className="action-header">
              <span className="action-type">{action.event_type}</span>
              <span className="action-time">{new Date(action.created_at).toLocaleString()}</span>
            </div>
            {action.title && <p className="action-title">{action.title}</p>}
            <p className="action-description">{action.description}</p>
          </div>
        </div>
      ))}
      {actions.length === 0 && (
        <div className="empty-state">
          <Bot size={48} className="empty-icon" />
          <p>NO CREW ACTIONS LOGGED YET</p>
          <p style={{ fontSize: 12, opacity: 0.4, marginTop: 8 }}>Agent activity will appear here as the crew executes.</p>
        </div>
      )}
    </div>
  );

  // Task chat panel
  const renderTaskChat = () => {
    if (!chatTask) return null;
    const agent = chatTask.assigned_agent || 'Sapphire';
    const agentColor = AGENT_COLORS[agent.toLowerCase()] || '#7C5CFC';
    return (
      <div className="task-chat-overlay fade-in">
        <div className="task-chat-panel">
          <div className="task-chat-header" style={{ borderBottomColor: `${agentColor}30` }}>
            <button className="task-chat-back" onClick={() => setChatTask(null)}><ArrowLeft size={16} /></button>
            <div className="task-chat-agent-info">
              <UserCircle size={18} style={{ color: agentColor }} />
              <div>
                <span className="task-chat-agent-name" style={{ color: agentColor }}>{agent}</span>
                <span className="task-chat-task-title">{chatTask.title}</span>
              </div>
            </div>
          </div>
          <div className="task-chat-body" ref={chatRef}>
            <div className="task-chat-context">
              <span className="context-label">TASK CONTEXT</span>
              <p>{chatTask.title}</p>
              {chatTask.description && <p className="context-desc">{chatTask.description}</p>}
              <div className="context-meta">
                {chatTask.category && <span>{MISSION_CATEGORIES.find(c => c.name === chatTask.category)?.icon} {chatTask.category}</span>}
                <span>{chatTask.priority} Priority</span>
              </div>
            </div>
            {chatResponse && (
              <div className="task-chat-response" style={{ borderLeftColor: agentColor }}>
                <span className="response-agent" style={{ color: agentColor }}>{agent.toUpperCase()}</span>
                <p>{chatResponse}</p>
              </div>
            )}
          </div>
          <div className="task-chat-input-bar">
            <input
              type="text"
              placeholder={`Ask ${agent} about this task...`}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendTaskChat()}
              className="task-chat-input"
              autoFocus
            />
            <button className="task-chat-send" style={{ background: `${agentColor}20`, borderColor: `${agentColor}30`, color: agentColor }} onClick={sendTaskChat} disabled={chatSending || !chatInput.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="header-main">
          <h1 className="h1-display">TASKS & PROJECTS</h1>
          <p className="eyebrow text-secondary">MISSION EXECUTION ARCHITECTURE :: $1.2M OBJECTIVE</p>
        </div>
        <div className="tab-switcher">
          <button className={`tab-btn ${activeTab === 'Human' ? 'active' : ''}`} onClick={() => setActiveTab('Human')}>
            <Target size={16} />
            <span>MISSION TASKS</span>
          </button>
          <button className={`tab-btn ${activeTab === 'AI' ? 'active' : ''}`} onClick={() => setActiveTab('AI')}>
            <Bot size={16} />
            <span>CREW ACTIONS</span>
          </button>
        </div>
      </header>

      {activeTab === 'Human' && (
        <>
          {/* STAT CARDS */}
          <section className="metrics-grid">
            <div className="card stat-card" style={{ borderTop: '3px solid var(--color-accent-secondary)' }}>
              <div className="stat-content">
                <span className="stat-label">TOTAL MISSIONS</span>
                <span className="stat-value">{totalTasks}</span>
              </div>
            </div>
            <div className="card stat-card" style={{ borderTop: '3px solid var(--color-accent-primary)' }}>
              <div className="stat-content">
                <span className="stat-label">IN PROGRESS</span>
                <span className="stat-value" style={{ color: 'var(--color-accent-primary)' }}>{inProgress}</span>
              </div>
            </div>
            <div className="card stat-card" style={{ borderTop: '3px solid var(--color-accent-danger)' }}>
              <div className="stat-content">
                <span className="stat-label">HIGH PRIORITY</span>
                <span className="stat-value" style={{ color: 'var(--color-accent-danger)' }}>{highPriorityActive}</span>
              </div>
            </div>
            <div className="card stat-card" style={{ borderTop: '3px solid var(--color-accent-success)' }}>
              <div className="stat-content">
                <span className="stat-label">COMPLETION</span>
                <span className="stat-value" style={{ color: 'var(--color-accent-success)' }}>{completionRate}%</span>
              </div>
            </div>
          </section>

          {/* CREATE BUTTON */}
          <div className="actions-bar">
            <button className="create-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? <X size={14} /> : <Plus size={14} />}
              <span>{showForm ? 'CANCEL' : 'NEW MISSION TASK'}</span>
            </button>
          </div>

          {/* NEW TASK FORM */}
          {showForm && (
            <div className="card task-form fade-in" style={{ borderLeft: '3px solid var(--color-accent-secondary)' }}>
              <h3 className="form-title">
                <Target size={14} style={{ color: 'var(--color-accent-secondary)' }} />
                CREATE MISSION TASK
              </h3>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>OBJECTIVE</label>
                  <input
                    type="text"
                    placeholder="What needs to be executed..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createTask()}
                    className="form-input"
                    autoFocus
                  />
                </div>
                <div className="form-field full-width">
                  <label>DETAILS (OPTIONAL)</label>
                  <textarea
                    placeholder="Context, deliverables, success criteria..."
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="form-textarea"
                    rows={2}
                  />
                </div>
                <div className="form-field">
                  <label>PRIORITY</label>
                  <div className="priority-picker">
                    {(['High', 'Medium', 'Low'] as const).map(p => (
                      <button
                        key={p}
                        className={`prio-btn ${p.toLowerCase()} ${newPriority === p ? 'active' : ''}`}
                        onClick={() => setNewPriority(p)}
                      >
                        <Flag size={11} />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label>MISSION CATEGORY</label>
                  <select className="form-select" value={newCategory} onChange={e => {
                    const cat = e.target.value;
                    setNewCategory(cat);
                    if (!newAgent && CATEGORY_AGENT_MAP[cat]) setNewAgent(CATEGORY_AGENT_MAP[cat]);
                  }}>
                    {MISSION_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>ASSIGN CREW MEMBER</label>
                  <select className="form-select" value={newAgent} onChange={e => setNewAgent(e.target.value)}>
                    <option value="">Auto-assign ({CATEGORY_AGENT_MAP[newCategory] || 'Sapphire'})</option>
                    {CREW_AGENTS.map(a => <option key={a.name} value={a.name}>{a.name} — {a.role}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>DUE DATE</label>
                  <input type="date" className="form-input" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
                </div>
              </div>
              <button className="submit-btn" onClick={createTask} disabled={!newTitle.trim()}>
                <Zap size={14} />
                CREATE MISSION TASK
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'Human' ? renderKanban() : renderAgentActions()}
      {renderTaskChat()}

      {/* EDIT TASK MODAL */}
      {editTask && (
        <div className="edit-overlay fade-in" onClick={() => setEditTask(null)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-header">
              <Pencil size={14} style={{ color: 'var(--color-accent-secondary)' }} />
              <span>EDIT MISSION TASK</span>
              <button className="edit-close" onClick={() => setEditTask(null)}><X size={14} /></button>
            </div>
            <div className="edit-task-title">{editTask.title}</div>
            <div className="edit-form-fields">
              <div className="edit-field">
                <label>ASSIGN CREW MEMBER</label>
                <select className="form-select" value={editAgent} onChange={e => setEditAgent(e.target.value)}>
                  <option value="">Unassigned</option>
                  {CREW_AGENTS.map(a => <option key={a.name} value={a.name}>{a.name} — {a.role}</option>)}
                </select>
              </div>
              <div className="edit-field">
                <label>PRIORITY</label>
                <div className="priority-picker">
                  {(['High', 'Medium', 'Low'] as const).map(p => (
                    <button key={p} className={`prio-btn ${p.toLowerCase()} ${editPriority === p ? 'active' : ''}`} onClick={() => setEditPriority(p)}>
                      <Flag size={11} />{p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="edit-field">
                <label>MISSION CATEGORY</label>
                <select className="form-select" value={editCategory} onChange={e => {
                  const cat = e.target.value;
                  setEditCategory(cat);
                  // Auto-suggest agent when category changes and no agent assigned
                  if (!editAgent && CATEGORY_AGENT_MAP[cat]) {
                    setEditAgent(CATEGORY_AGENT_MAP[cat]);
                  }
                }}>
                  {MISSION_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>
            <button className="submit-btn" onClick={saveEdit}>
              <Save size={14} />
              SAVE CHANGES
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
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
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-fast);
          letter-spacing: 0.06em;
        }
        .tab-btn.active {
          background: var(--color-bg-surface);
          color: var(--color-accent-primary);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .actions-bar { display: flex; justify-content: flex-end; margin-bottom: 24px; }
        .create-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 10px;
          border: 1px solid rgba(124, 92, 252, 0.3);
          background: rgba(124, 92, 252, 0.08);
          color: var(--color-accent-secondary);
          font-family: var(--font-mono); font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; cursor: pointer; transition: var(--transition-fast);
        }
        .create-btn:hover { background: rgba(124, 92, 252, 0.15); border-color: rgba(124, 92, 252, 0.5); }

        /* FORM */
        .task-form { padding: 28px; margin-bottom: 28px; }
        .form-title {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 12px;
          letter-spacing: 0.12em; color: var(--color-accent-secondary); margin-bottom: 24px;
        }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .full-width { grid-column: 1 / -1; }
        .form-field label {
          display: block; font-family: var(--font-mono); font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em; color: var(--color-text-muted); margin-bottom: 8px;
        }
        .form-input, .form-textarea, .form-select {
          width: 100%; background: var(--color-bg-deepest); border: 1px solid var(--border-color);
          border-radius: 8px; padding: 10px 14px; color: var(--color-text-primary);
          font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus { border-color: var(--color-accent-secondary); }
        .form-textarea { resize: vertical; }
        .form-select { cursor: pointer; }
        .priority-picker { display: flex; gap: 8px; }
        .prio-btn {
          display: flex; align-items: center; gap: 5px; padding: 8px 14px;
          border-radius: 8px; border: 1px solid var(--border-color);
          background: transparent; color: var(--color-text-muted);
          font-size: 11px; font-weight: 600; cursor: pointer; transition: var(--transition-fast);
        }
        .prio-btn.high.active { background: rgba(217, 85, 85, 0.12); color: var(--color-accent-danger); border-color: var(--color-accent-danger); }
        .prio-btn.medium.active { background: rgba(201, 168, 76, 0.12); color: var(--color-accent-primary); border-color: var(--color-accent-primary); }
        .prio-btn.low.active { background: rgba(46, 204, 143, 0.1); color: var(--color-accent-success); border-color: var(--color-accent-success); }
        .submit-btn {
          display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 10px;
          border: none; background: var(--color-accent-secondary); color: white;
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; cursor: pointer; transition: var(--transition-fast);
        }
        .submit-btn:hover:not(:disabled) { filter: brightness(1.15); }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* KANBAN */
        .kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .kanban-column { display: flex; flex-direction: column; gap: 12px; }
        .column-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px; background: var(--color-bg-surface); border-radius: 12px;
          border: 1px solid var(--border-color); border-bottom: 2px solid;
        }
        .column-title-row { display: flex; align-items: center; gap: 10px; }
        .column-dot { width: 8px; height: 8px; border-radius: 50%; }
        .column-title {
          font-size: 11px; font-weight: 800; color: var(--color-text-primary);
          letter-spacing: 0.12em; font-family: var(--font-mono);
        }
        .column-count {
          font-size: 11px; font-family: var(--font-mono); font-weight: 700;
          padding: 3px 10px; border-radius: 10px;
        }
        .column-content { display: flex; flex-direction: column; gap: 10px; }

        /* TASK CARDS */
        .task-card {
          display: flex; border-radius: 12px; overflow: hidden;
          background: var(--color-bg-surface); border: 1px solid var(--border-color);
          transition: var(--transition-normal);
        }
        .task-card:hover { border-color: rgba(124, 92, 252, 0.25); transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3); }
        .task-priority-strip { width: 4px; flex-shrink: 0; }
        .task-body { flex: 1; padding: 18px; }

        .task-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .task-priority-badge {
          display: flex; align-items: center; gap: 5px;
          font-family: var(--font-mono); font-size: 9px; font-weight: 700;
          letter-spacing: 0.08em; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;
        }
        .task-category {
          font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted);
          background: rgba(255, 255, 255, 0.04); padding: 3px 8px; border-radius: 4px;
        }
        .task-title { font-size: 14px; font-weight: 700; line-height: 1.4; margin-bottom: 6px; color: var(--color-text-primary); }
        .task-desc { font-size: 12px; color: var(--color-text-muted); line-height: 1.5; margin-bottom: 10px; }

        /* Agent Assignment Block */
        .task-agent-block {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px; border: 1px solid;
          background: rgba(255, 255, 255, 0.02); margin-bottom: 12px;
        }
        .task-agent-avatar {
          width: 28px; height: 28px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .task-agent-info { flex: 1; }
        .task-agent-name { display: block; font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
        .task-agent-role { display: block; font-size: 10px; color: var(--color-text-muted); }
        .task-chat-btn {
          display: flex; align-items: center; padding: 6px 8px;
          border-radius: 6px; border: 1px solid; background: transparent;
          cursor: pointer; transition: var(--transition-fast);
        }
        .task-chat-btn:hover { background: rgba(255, 255, 255, 0.06); }

        .task-footer { display: flex; justify-content: space-between; align-items: center; }
        .task-meta-left { display: flex; align-items: center; gap: 10px; }
        .task-date {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted);
        }
        .task-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
        .task-card:hover .task-actions { opacity: 1; }
        .task-action-btn {
          background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 5px; padding: 5px 7px; cursor: pointer; display: flex; align-items: center;
          transition: var(--transition-fast);
        }
        .task-action-btn.move { color: var(--color-accent-success); }
        .task-action-btn.move:hover { background: rgba(46, 204, 143, 0.1); }
        .task-action-btn.delete { color: var(--color-text-muted); }
        .task-action-btn.delete:hover { color: var(--color-accent-danger); background: rgba(217, 85, 85, 0.1); }

        .add-task-ghost {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px; border: 1px dashed var(--border-color); border-radius: 12px;
          color: var(--color-text-muted); font-size: 12px; cursor: pointer;
          transition: var(--transition-fast); font-family: var(--font-mono);
        }
        .add-task-ghost:hover { border-color: var(--color-accent-secondary); color: var(--color-accent-secondary); background: rgba(124, 92, 252, 0.05); }

        /* TASK CHAT OVERLAY */
        .task-chat-overlay {
          position: fixed; top: 0; right: 0; bottom: 0; width: 420px;
          z-index: 9999; background: rgba(5, 5, 8, 0.97); backdrop-filter: blur(20px);
          border-left: 1px solid var(--border-color);
          display: flex; flex-direction: column;
        }
        .task-chat-panel { display: flex; flex-direction: column; height: 100%; }
        .task-chat-header {
          display: flex; align-items: center; gap: 14px;
          padding: 20px; border-bottom: 1px solid;
        }
        .task-chat-back {
          background: none; border: none; color: var(--color-text-muted);
          cursor: pointer; display: flex; align-items: center; padding: 4px;
        }
        .task-chat-back:hover { color: var(--color-text-primary); }
        .task-chat-agent-info { display: flex; align-items: center; gap: 10px; }
        .task-chat-agent-name {
          display: block; font-family: var(--font-mono); font-size: 12px;
          font-weight: 700; letter-spacing: 0.08em;
        }
        .task-chat-task-title {
          display: block; font-size: 11px; color: var(--color-text-muted);
          max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .task-chat-body { flex: 1; overflow-y: auto; padding: 20px; }
        .task-chat-context {
          padding: 16px; border-radius: 10px; background: rgba(124, 92, 252, 0.06);
          border: 1px solid rgba(124, 92, 252, 0.12); margin-bottom: 20px;
        }
        .context-label {
          display: block; font-family: var(--font-mono); font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em; color: var(--color-accent-secondary); margin-bottom: 8px;
        }
        .task-chat-context p { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
        .context-desc { font-size: 12px !important; font-weight: 400 !important; color: var(--color-text-secondary) !important; margin-top: 6px; }
        .context-meta {
          display: flex; gap: 12px; margin-top: 10px;
          font-family: var(--font-mono); font-size: 10px; color: var(--color-text-muted);
        }
        .task-chat-response {
          padding: 16px; border-radius: 10px; background: rgba(255, 255, 255, 0.03);
          border-left: 3px solid; margin-bottom: 12px;
        }
        .response-agent {
          display: block; font-family: var(--font-mono); font-size: 9px; font-weight: 700;
          letter-spacing: 0.1em; margin-bottom: 8px;
        }
        .task-chat-response p { font-size: 13px; line-height: 1.7; color: var(--color-text-secondary); }
        .task-chat-input-bar {
          display: flex; gap: 8px; padding: 16px 20px;
          border-top: 1px solid var(--border-color); background: rgba(5, 5, 8, 0.8);
        }
        .task-chat-input {
          flex: 1; background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px;
          color: var(--color-text-primary); padding: 10px 14px; font-size: 13px;
          font-family: inherit; outline: none; transition: border-color 0.2s;
        }
        .task-chat-input:focus { border-color: rgba(124, 92, 252, 0.4); }
        .task-chat-input::placeholder { color: rgba(232, 228, 216, 0.2); }
        .task-chat-send {
          border: 1px solid; border-radius: 8px; padding: 8px 14px;
          cursor: pointer; display: flex; align-items: center; transition: var(--transition-fast);
        }
        .task-chat-send:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ASSIGN PROMPT */
        .task-assign-prompt {
          display: flex; align-items: center; gap: 6px; width: 100%;
          padding: 8px 10px; border-radius: 6px; border: 1px dashed rgba(124, 92, 252, 0.3);
          background: rgba(124, 92, 252, 0.04); color: var(--color-accent-secondary);
          font-family: var(--font-mono); font-size: 9px; font-weight: 700;
          letter-spacing: 0.08em; cursor: pointer; transition: var(--transition-fast);
          margin-top: 6px;
        }
        .task-assign-prompt:hover { background: rgba(124, 92, 252, 0.12); border-color: rgba(124, 92, 252, 0.5); }

        /* EDIT BUTTON */
        .task-action-btn.edit { color: var(--color-accent-secondary); }
        .task-action-btn.edit:hover { background: rgba(124, 92, 252, 0.15); }

        /* EDIT MODAL */
        .edit-overlay {
          position: fixed; inset: 0; z-index: 10000;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .edit-modal {
          background: var(--color-bg-surface); border: 1px solid var(--border-color);
          border-radius: 16px; padding: 28px; width: 420px; max-width: 90vw;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        .edit-modal-header {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; color: var(--color-text-primary); margin-bottom: 16px;
        }
        .edit-close {
          margin-left: auto; background: none; border: none; color: var(--color-text-muted);
          cursor: pointer; padding: 4px;
        }
        .edit-close:hover { color: var(--color-text-primary); }
        .edit-task-title {
          font-size: 15px; font-weight: 700; color: var(--color-text-primary);
          margin-bottom: 20px; padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .edit-form-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
        .edit-field label {
          display: block; font-family: var(--font-mono); font-size: 10px;
          font-weight: 700; letter-spacing: 0.08em; color: var(--color-text-muted);
          margin-bottom: 6px;
        }

        /* AGENT ACTIONS */
        .actions-list { display: flex; flex-direction: column; gap: 16px; max-width: 800px; }
        .action-card { display: flex; gap: 20px; padding: 20px; }
        .action-icon-wrap {
          width: 40px; height: 40px; background: rgba(124, 92, 252, 0.1);
          color: var(--color-accent-secondary); display: flex; align-items: center;
          justify-content: center; border-radius: 10px; border: 1px solid rgba(124, 92, 252, 0.2); flex-shrink: 0;
        }
        .action-body { flex: 1; }
        .action-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .action-type { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .action-time { font-size: 10px; font-family: var(--font-mono); color: var(--color-text-muted); }
        .action-title { font-weight: 600; margin-bottom: 4px; color: var(--color-text-primary); font-size: 14px; }
        .action-description { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }

        .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 100px 0; color: var(--color-text-muted);
          border: 1px dashed var(--border-color); border-radius: 16px;
        }
        .empty-icon { opacity: 0.2; margin-bottom: 24px; }

        @media (max-width: 900px) {
          .kanban-board { grid-template-columns: 1fr; }
          .task-chat-overlay { width: 100%; }
        }
      `}</style>
    </div>
  );
}
