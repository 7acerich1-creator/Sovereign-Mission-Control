"use client";

/**
 * TasksKanban
 * -----------
 * 3-column kanban-lite for the Mission Control dashboard.
 * Keeps human work visible alongside the autonomous (AI) work the bot logs.
 *
 * Columns: To Do · In Progress · Done (last 7d)
 * Source: GET/POST /api/tasks  +  PATCH /api/tasks/[id]
 *
 * Quick-add input lives at the top of the To Do column. Default priority=medium,
 * type=human, status=todo on submit.
 */

import { useEffect, useState, useCallback, FormEvent } from "react";

type Status = "todo" | "in-progress" | "done";
type Priority = "low" | "medium" | "high";
type TaskType = "human" | "ai";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  status_raw: string;
  priority: Priority;
  type: TaskType;
  created_at: string;
};

const COLS: { key: Status; label: string; sub?: string }[] = [
  { key: "todo", label: "TO DO" },
  { key: "in-progress", label: "IN PROGRESS" },
  { key: "done", label: "DONE", sub: "last 7d" },
];

const PRIORITY_COLOR: Record<Priority, string> = {
  high: "#D95555",
  medium: "#C9A84C",
  low: "#1D9E75",
};

const TYPE_COLOR: Record<TaskType, string> = {
  human: "#3EF7E8",
  ai: "#7C5CFC",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  return `${wk}w ago`;
}

export default function TasksKanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTasks((json.tasks ?? []) as Task[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const title = newTitle.trim();
      if (!title || submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            priority: newPriority,
            type: "human",
            status: "todo",
          }),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error ?? `HTTP ${res.status}`);
        }
        setNewTitle("");
        setNewPriority("medium");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add");
      } finally {
        setSubmitting(false);
      }
    },
    [newTitle, newPriority, submitting, load],
  );

  const updateStatus = useCallback(
    async (id: string, status: Status) => {
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      try {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
        await load();
      }
    },
    [load],
  );

  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const grouped: Record<Status, Task[]> = {
    todo: [],
    "in-progress": [],
    done: [],
  };
  for (const t of tasks) {
    if (t.status === "done") {
      const created = new Date(t.created_at).getTime();
      if (created >= sevenDaysAgoMs) grouped.done.push(t);
    } else {
      grouped[t.status].push(t);
    }
  }

  return (
    <section className="dashboard-section tk-section">
      <div className="section-header-row">
        <h2 className="section-heading">
          TASKS &amp; PROJECTS
          <span className="tk-sub-tag">human + ai · live from supabase</span>
        </h2>
        <span className="tk-meta">
          {tasks.length} total{loading ? " · loading…" : ""}
        </span>
      </div>

      {error && <div className="tk-error">Error: {error}</div>}

      <div className="tk-grid">
        {COLS.map((col) => {
          const colTasks = grouped[col.key];
          return (
            <div key={col.key} className={`tk-col tk-col-${col.key}`}>
              <div className="tk-col-header">
                <span className="tk-col-label">{col.label}</span>
                {col.sub && <span className="tk-col-sub">· {col.sub}</span>}
                <span className="tk-col-count">{colTasks.length}</span>
              </div>

              {col.key === "todo" && (
                <form className="tk-quickadd" onSubmit={handleSubmit}>
                  <input
                    className="tk-quickadd-input"
                    placeholder="+ add a task…"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={submitting}
                  />
                  <select
                    className="tk-quickadd-priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    disabled={submitting}
                  >
                    <option value="low">low</option>
                    <option value="medium">med</option>
                    <option value="high">high</option>
                  </select>
                  <button
                    className="tk-quickadd-btn"
                    type="submit"
                    disabled={!newTitle.trim() || submitting}
                  >
                    {submitting ? "…" : "+"}
                  </button>
                </form>
              )}

              <div className="tk-cards">
                {colTasks.length === 0 && !loading && (
                  <div className="tk-empty">—</div>
                )}
                {colTasks.map((t) => (
                  <div key={t.id} className="tk-card">
                    <div className="tk-card-title">{t.title}</div>
                    <div className="tk-card-chips">
                      <span
                        className="tk-chip tk-chip-priority"
                        style={{
                          color: PRIORITY_COLOR[t.priority],
                          borderColor: PRIORITY_COLOR[t.priority],
                          backgroundColor: `${PRIORITY_COLOR[t.priority]}14`,
                        }}
                      >
                        {t.priority}
                      </span>
                      <span
                        className="tk-chip tk-chip-type"
                        style={{
                          color: TYPE_COLOR[t.type],
                          borderColor: TYPE_COLOR[t.type],
                          backgroundColor: `${TYPE_COLOR[t.type]}14`,
                        }}
                      >
                        {t.type}
                      </span>
                      <span className="tk-card-time">{relativeTime(t.created_at)}</span>
                    </div>
                    <div className="tk-card-actions">
                      {t.status !== "todo" && (
                        <button onClick={() => updateStatus(t.id, "todo")} title="Move to To Do">
                          ◀
                        </button>
                      )}
                      {t.status !== "in-progress" && (
                        <button
                          onClick={() => updateStatus(t.id, "in-progress")}
                          title="Move to In Progress"
                        >
                          {t.status === "todo" ? "▶" : "◀"}
                        </button>
                      )}
                      {t.status !== "done" && (
                        <button onClick={() => updateStatus(t.id, "done")} title="Mark Done">
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .tk-section {
          margin-top: 0;
        }
        .tk-sub-tag {
          margin-left: 10px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: rgba(232, 228, 240, 0.45);
          text-transform: uppercase;
        }
        .tk-meta {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 10px;
          letter-spacing: 0.08em;
          color: rgba(232, 228, 240, 0.45);
        }
        .tk-error {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 11px;
          color: #D95555;
          margin-bottom: 8px;
        }
        .tk-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .tk-col {
          background: #0a0a0f;
          border: 1px solid #1a1a2e;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 220px;
        }
        .tk-col-todo { border-color: rgba(62, 247, 232, 0.20); }
        .tk-col-in-progress { border-color: rgba(201, 168, 76, 0.22); }
        .tk-col-done { border-color: rgba(29, 158, 117, 0.22); }

        .tk-col-header {
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding-bottom: 8px;
          border-bottom: 1px dashed rgba(124, 92, 252, 0.14);
        }
        .tk-col-label {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--color-text-primary, #E8E4F0);
        }
        .tk-col-sub {
          font-size: 10px;
          color: rgba(232, 228, 240, 0.4);
        }
        .tk-col-count {
          margin-left: auto;
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 11px;
          color: rgba(232, 228, 240, 0.55);
        }

        .tk-quickadd {
          display: flex;
          gap: 6px;
          padding: 6px;
          background: #050508;
          border: 1px solid rgba(62, 247, 232, 0.18);
          border-radius: 8px;
        }
        .tk-quickadd-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text-primary, #E8E4F0);
          font-size: 12px;
          padding: 4px 6px;
          font-family: inherit;
        }
        .tk-quickadd-input::placeholder {
          color: rgba(232, 228, 240, 0.35);
        }
        .tk-quickadd-priority {
          background: #0a0a0f;
          border: 1px solid #1a1a2e;
          border-radius: 4px;
          color: var(--color-text-primary, #E8E4F0);
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 11px;
          padding: 2px 4px;
          cursor: pointer;
        }
        .tk-quickadd-btn {
          background: #3EF7E8;
          color: #050508;
          border: none;
          border-radius: 4px;
          padding: 0 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .tk-quickadd-btn:hover:not(:disabled) {
          background: #6efff3;
        }
        .tk-quickadd-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tk-cards {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tk-empty {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 14px;
          color: rgba(232, 228, 240, 0.25);
          text-align: center;
          padding: 16px 0;
        }
        .tk-card {
          background: #050508;
          border: 1px solid rgba(124, 92, 252, 0.10);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .tk-card:hover {
          border-color: rgba(124, 92, 252, 0.30);
          transform: translateY(-1px);
        }
        .tk-card-title {
          font-size: 12.5px;
          line-height: 1.35;
          color: var(--color-text-primary, #E8E4F0);
          font-weight: 500;
        }
        .tk-card-chips {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .tk-chip {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          padding: 2px 6px;
          border: 1px solid;
          border-radius: 3px;
        }
        .tk-card-time {
          font-family: var(--font-mono, "Space Mono", monospace);
          font-size: 9px;
          color: rgba(232, 228, 240, 0.4);
          margin-left: auto;
        }
        .tk-card-actions {
          display: flex;
          gap: 4px;
          margin-top: 2px;
        }
        .tk-card-actions button {
          flex: 1;
          background: transparent;
          border: 1px solid rgba(124, 92, 252, 0.15);
          border-radius: 4px;
          color: rgba(232, 228, 240, 0.55);
          font-size: 11px;
          padding: 3px 0;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: var(--font-mono, "Space Mono", monospace);
        }
        .tk-card-actions button:hover {
          background: rgba(124, 92, 252, 0.10);
          color: var(--color-text-primary, #E8E4F0);
          border-color: rgba(124, 92, 252, 0.40);
        }

        @media (max-width: 1000px) {
          .tk-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
