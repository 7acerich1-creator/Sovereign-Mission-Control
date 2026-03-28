"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  Terminal,
  TrendingUp,
  Users,
  Clock,
  Wifi,
  WifiOff,
  Bot,
  AlertTriangle,
  DollarSign,
  Play,
  FileText,
  Layers,
  Target,
  Send,
  Volume2,
  X,
  MessageCircle,
} from "lucide-react";

/* ──────────────────── TYPES ──────────────────── */

type MissionMetrics = {
  liberation_count: number;
  total_leads: number;
  p77_conversions: number;
  manifesto_conversions: number;
  inner_circle_conversions: number;
};

type RevenueEntry = {
  id: string;
  amount: number;
  source: string;
  product_id: string;
  timestamp: string;
};

type AgentHistoryEntry = {
  id: string;
  agent_name: string;
  role: string;
  content: string;
  created_at: string;
};

type CommandQueueEntry = {
  id: string;
  command: string;
  status: string;
  agent_name: string;
  created_at: string;
};

type ContentTransmission = {
  id: string;
  intent_tag: string;
  source: string;
  status: string;
  created_at: string;
};

type VidRushEntry = {
  id: string;
  topic: string;
  status: string;
  created_at: string;
};

type GlitchEntry = {
  id: string;
  severity: string;
  description: string;
  detected_at: string;
};

/* ──────────────── AGENT CONFIG ──────────────── */

const MAVEN_CREW = [
  { name: "Yuki", role: "Creative & Content", color: "#fddb92", avatar: "/crew/yuki.png" },
  { name: "Sapphire", role: "Core API & Orchestration", color: "#4facfe", avatar: "/crew/sapphire.png" },
  { name: "Anita", role: "Outreach & Nurture", color: "#ebedee", avatar: "/crew/anita.png" },
  { name: "Alfred", role: "Operations & Automation", color: "#ff9a9e", avatar: "/crew/alfred.png" },
  { name: "Veritas", role: "Truth Engine & Research", color: "#43e97b", avatar: "/crew/veritas.png" },
  { name: "Vector", role: "Analytics & Intelligence", color: "#fa709a", avatar: "/crew/vector.png" },
];

/* ──────────────── HELPERS ──────────────── */

function daysUntil(target: string): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(target).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isOnline(lastSeen: string): boolean {
  return Date.now() - new Date(lastSeen).getTime() < 24 * 60 * 60 * 1000;
}

/* ──────────────── ORB CANVAS ──────────────── */

const ORB_COLORS = [
  { r: 201, g: 168, b: 76 },   // gold
  { r: 124, g: 92, b: 252 },   // violet
  { r: 62, g: 247, b: 232 },   // cyan
  { r: 201, g: 128, b: 76 },   // amber
];

type Orb = {
  x: number; y: number; r: number;
  vx: number; vy: number;
  color: typeof ORB_COLORS[number];
  alpha: number; pulse: number; pulseSpeed: number;
};

function createOrbs(count: number, w: number, h: number): Orb[] {
  return Array.from({ length: count }, () => {
    const color = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color,
      alpha: 0.15 + Math.random() * 0.35,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.015,
    };
  });
}

function useOrbCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, count = 350) {
  const orbsRef = useRef<Orb[]>([]);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const w = cvs.width;
    const h = cvs.height;

    ctx.clearRect(0, 0, w, h);

    for (const orb of orbsRef.current) {
      orb.x += orb.vx;
      orb.y += orb.vy;
      orb.pulse += orb.pulseSpeed;

      if (orb.x < -10) orb.x = w + 10;
      if (orb.x > w + 10) orb.x = -10;
      if (orb.y < -10) orb.y = h + 10;
      if (orb.y > h + 10) orb.y = -10;

      const glow = orb.alpha * (0.7 + 0.3 * Math.sin(orb.pulse));
      const { r: cr, g: cg, b: cb } = orb.color;

      ctx.beginPath();
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * 3);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${glow})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = grad;
      ctx.arc(orb.x, orb.y, orb.r * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [canvasRef]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      orbsRef.current = createOrbs(count, cvs.width, cvs.height);
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, count, draw]);
}

/* ══════════════════════════════════════════════════
   CEO MISSION CONTROL — SINGLE PANE OF GLASS
   ══════════════════════════════════════════════════ */

export default function MissionControl() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useOrbCanvas(canvasRef, 350);
  const [metrics, setMetrics] = useState<MissionMetrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [agentHistory, setAgentHistory] = useState<AgentHistoryEntry[]>([]);
  const [commandQueue, setCommandQueue] = useState<CommandQueueEntry[]>([]);
  const [contentTransmissions, setContentTransmissions] = useState<ContentTransmission[]>([]);
  const [vidRush, setVidRush] = useState<VidRushEntry[]>([]);
  const [glitches, setGlitches] = useState<GlitchEntry[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ id: string; agent_name: string; sender: string; content: string; created_at: string; voice_played?: boolean }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  /* ── CHAT: fetch history when agent selected ── */
  useEffect(() => {
    if (!selectedAgent) { setChatMessages([]); return; }
    const agentKey = selectedAgent.toLowerCase();
    fetch(`/api/chat?agent=${agentKey}&limit=30`)
      .then(r => r.json())
      .then(d => { if (d.messages) setChatMessages(d.messages); })
      .catch(() => {});

    // Realtime subscription for new chat messages
    const channel = supabase
      .channel(`chat-${agentKey}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `agent_name=eq.${agentKey}`,
      }, (payload) => {
        setChatMessages(prev => [...prev, payload.new as any]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedAgent]);

  // Auto-scroll chat feed
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const [speakingId, setSpeakingId] = useState<string | null>(null);

  async function speakText(agentName: string, text: string, messageId: string) {
    if (speakingId) return; // prevent overlapping
    setSpeakingId(messageId);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: agentName, text }),
      });
      if (!res.ok) {
        console.error('TTS error:', await res.text());
        setSpeakingId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      audio.play();
    } catch (err) {
      console.error('TTS failed:', err);
      setSpeakingId(null);
    }
  }

  async function sendMessage() {
    if (!selectedAgent || !messageInput.trim() || isSending) return;
    setIsSending(true);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: selectedAgent, content: messageInput.trim() }),
      });
      setMessageInput("");
    } catch (err) {
      console.error('Send failed:', err);
    }
    setIsSending(false);
  }

  /* ── FETCH FUNCTIONS ── */

  async function fetchMetrics() {
    const { data } = await supabase
      .from("mission_metrics")
      .select("*")
      .limit(1)
      .single();
    if (data) setMetrics(data);
  }

  async function fetchRevenue() {
    const { data } = await supabase
      .from("revenue_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);
    if (data) {
      setRevenue(data);
    }
    // Also get total
    const { data: allRev } = await supabase
      .from("revenue_log")
      .select("amount");
    if (allRev) {
      setTotalRevenue(allRev.reduce((s, r) => s + Number(r.amount), 0));
    }
  }

  async function fetchAgentHistory() {
    const { data } = await supabase
      .from("agent_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAgentHistory(data);
  }

  async function fetchCommandQueue() {
    const { data } = await supabase
      .from("command_queue")
      .select("*")
      .in("status", ["pending", "active", "Pending", "Active"])
      .order("created_at", { ascending: false });
    if (data) setCommandQueue(data);
  }

  async function fetchContentPipeline() {
    const { data: ct } = await supabase
      .from("content_transmissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    if (ct) setContentTransmissions(ct);

    const { data: vr } = await supabase
      .from("vid_rush_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    if (vr) setVidRush(vr);
  }

  async function fetchGlitches() {
    const { data } = await supabase
      .from("glitch_log")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(10);
    if (data) setGlitches(data);
  }

  /* ── INITIAL FETCH + REALTIME ── */

  useEffect(() => {
    fetchMetrics();
    fetchRevenue();
    fetchAgentHistory();
    fetchCommandQueue();
    fetchContentPipeline();
    fetchGlitches();

    const ch = supabase
      .channel("ceo-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "mission_metrics" }, () => fetchMetrics())
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_log" }, () => fetchRevenue())
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_history" }, () => fetchAgentHistory())
      .on("postgres_changes", { event: "*", schema: "public", table: "command_queue" }, () => fetchCommandQueue())
      .on("postgres_changes", { event: "*", schema: "public", table: "content_transmissions" }, () => fetchContentPipeline())
      .on("postgres_changes", { event: "*", schema: "public", table: "vid_rush_queue" }, () => fetchContentPipeline())
      .on("postgres_changes", { event: "*", schema: "public", table: "glitch_log" }, () => fetchGlitches())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  /* ── DERIVED STATE ── */

  const daysRemaining = daysUntil("2027-01-01");
  const revenuePercent = Math.min((totalRevenue / 1200000) * 100, 100);
  const liberationCount = metrics?.liberation_count ?? 0;
  const liberationPercent = Math.min((liberationCount / 100000) * 100, 100);

  // Build agent cards from history
  const agentCards = useMemo(() => {
    return MAVEN_CREW.map((agent) => {
      const history = agentHistory.filter(
        (h) => h.agent_name?.toLowerCase() === agent.name.toLowerCase()
      );
      const lastEntry = history[0];
      const task = commandQueue.find(
        (q) => q.agent_name?.toLowerCase() === agent.name.toLowerCase()
      );
      return {
        ...agent,
        online: lastEntry ? isOnline(lastEntry.created_at) : false,
        lastAction: lastEntry?.content ?? "No activity recorded",
        lastSeen: lastEntry?.created_at,
        currentTask: task?.command ?? null,
      };
    });
  }, [agentHistory, commandQueue]);

  /* ══════════════════ RENDER ══════════════════ */

  return (
    <div className="fade-in ceo-dashboard" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* ═══════ SECTION 1 — MISSION STATUS BAR ═══════ */}
      <header className="mission-status-bar">
        <div className="msb-header">
          <div>
            <h1 className="msb-title">SOVEREIGN SYNTHESIS — MISSION CONTROL</h1>
            <p className="msb-subtitle">ARCHITECT: ACE RICHIE // FREQUENCY: SOVEREIGN</p>
          </div>
          <div className="msb-countdown">
            <span className="countdown-number">{daysRemaining}</span>
            <span className="countdown-label">DAYS TO TARGET</span>
          </div>
        </div>

        <div className="msb-tracks">
          <div className="msb-track">
            <div className="track-header">
              <span className="track-label">NET LIQUID SUM</span>
              <span className="track-value">${totalRevenue.toLocaleString()} <span className="track-target">/ $1,200,000</span></span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill revenue-fill" style={{ width: `${revenuePercent}%` }} />
            </div>
            <span className="track-percent">{revenuePercent.toFixed(1)}%</span>
          </div>

          <div className="msb-track">
            <div className="track-header">
              <span className="track-label">MINDS LIBERATED</span>
              <span className="track-value">{liberationCount.toLocaleString()} <span className="track-target">/ 100,000</span></span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill liberation-fill" style={{ width: `${liberationPercent}%` }} />
            </div>
            <span className="track-percent">{liberationPercent.toFixed(1)}%</span>
          </div>
        </div>
      </header>

      {/* ═══════ SECTION 2 — MAVEN CREW STATUS ═══════ */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h2 className="section-heading">MAVEN CREW STATUS</h2>
          <Link href="/crew" className="section-link">VIEW FULL CREW &rarr;</Link>
        </div>

        {/* HERO PANEL — shown when an agent is clicked */}
        {selectedAgent && (() => {
          const agent = agentCards.find(a => a.name === selectedAgent);
          if (!agent) return null;
          const agentHistoryFiltered = agentHistory
            .filter(h => h.agent_name?.toLowerCase() === agent.name.toLowerCase())
            .slice(0, 8);
          return (
            <div className="crew-hero-panel" style={{ "--agent-color": agent.color } as React.CSSProperties}>
              <button className="hero-close" onClick={() => { setSelectedAgent(null); setMessageInput(""); }}>
                <X size={18} />
              </button>
              <div className="hero-top">
                <div className="hero-avatar-wrap">
                  <Image src={agent.avatar} alt={agent.name} width={140} height={140} className="crew-avatar-img" unoptimized />
                  <div className={`avatar-status-dot hero-dot ${agent.online ? "online" : "offline"}`} />
                </div>
                <div className="hero-identity">
                  <h3 className="hero-name">{agent.name}</h3>
                  <span className="hero-role">{agent.role}</span>
                  <div className={`status-indicator ${agent.online ? "online" : "offline"}`}>
                    {agent.online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    <span>{agent.online ? "ONLINE" : "OFFLINE"}</span>
                  </div>
                  {agent.currentTask && (
                    <div className="hero-active-task">
                      <span className="hero-task-label">ACTIVE TASK</span>
                      <p className="hero-task-text">{agent.currentTask}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAT FEED — live conversation */}
              <div className="hero-activity">
                <span className="hero-section-label">TRANSMISSIONS</span>
                <div className="hero-activity-feed" ref={chatFeedRef}>
                  {/* Legacy activity (from agent_history) */}
                  {chatMessages.length === 0 && agentHistoryFiltered.length > 0 && agentHistoryFiltered.map((entry) => (
                    <div key={entry.id} className="hero-feed-item">
                      <span className="feed-time">{timeAgo(entry.created_at)}</span>
                      <p className="feed-content">{entry.content}</p>
                      <button
                        className={`feed-speak-btn ${speakingId === entry.id ? 'speaking' : ''}`}
                        title="Speak this transmission"
                        onClick={(e) => { e.stopPropagation(); speakText(agent.name, entry.content, entry.id); }}
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Live chat messages */}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`hero-feed-item ${msg.sender === 'architect' ? 'msg-architect' : 'msg-agent'}`}>
                      <span className="feed-sender">{msg.sender === 'architect' ? 'ACE' : agent.name.toUpperCase()}</span>
                      <p className="feed-content">{msg.content}</p>
                      <button
                        className={`feed-speak-btn ${speakingId === msg.id ? 'speaking' : ''}`}
                        title="Speak this transmission"
                        onClick={(e) => { e.stopPropagation(); speakText(agent.name, msg.content, msg.id); }}
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>
                  ))}
                  {chatMessages.length === 0 && agentHistoryFiltered.length === 0 && (
                    <div className="hero-feed-empty">No transmissions yet. Send the first message.</div>
                  )}
                </div>
              </div>

              {/* MESSAGE INPUT — live wired */}
              <div className="hero-message-bar">
                <MessageCircle size={16} className="msg-icon" />
                <input
                  type="text"
                  className="hero-msg-input"
                  placeholder={`Transmit to ${agent.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  disabled={isSending}
                />
                <button
                  className="hero-send-btn"
                  disabled={!messageInput.trim() || isSending}
                  onClick={sendMessage}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* CREW GRID — cards with hover expand + click to hero */}
        <div className={`crew-grid ${selectedAgent ? "crew-grid-dimmed" : ""}`}>
          {agentCards.map((agent) => (
            <div
              key={agent.name}
              className={`card crew-card-v2 ${selectedAgent === agent.name ? "crew-card-selected" : ""}`}
              style={{ "--agent-color": agent.color } as React.CSSProperties}
              onClick={() => { setSelectedAgent(selectedAgent === agent.name ? null : agent.name); setMessageInput(""); }}
            >
              {/* AVATAR + IDENTITY */}
              <div className="crew-avatar-row">
                <div className="crew-avatar-wrap">
                  <Image
                    src={agent.avatar}
                    alt={agent.name}
                    width={56}
                    height={56}
                    className="crew-avatar-img"
                    unoptimized
                  />
                  <div className={`avatar-status-dot ${agent.online ? "online" : "offline"}`} />
                </div>
                <div className="crew-id-col">
                  <span className="crew-name">{agent.name}</span>
                  <span className="crew-role">{agent.role}</span>
                  <div className={`status-indicator ${agent.online ? "online" : "offline"}`}>
                    {agent.online ? <Wifi size={10} /> : <WifiOff size={10} />}
                    <span>{agent.online ? "ONLINE" : "OFFLINE"}</span>
                  </div>
                </div>
              </div>
              {/* HOVER EXPAND — details slide in */}
              <div className="crew-details-expand">
                <div className="crew-last-action">
                  <span className="crew-action-label">LAST ACTION</span>
                  <p className="crew-action-text">{agent.lastAction.length > 80 ? agent.lastAction.slice(0, 80) + "…" : agent.lastAction}</p>
                  {agent.lastSeen && <span className="crew-time">{timeAgo(agent.lastSeen)}</span>}
                </div>
                {agent.currentTask && (
                  <div className="crew-current-task">
                    <span className="crew-task-label">ACTIVE TASK</span>
                    <p className="crew-task-text">{agent.currentTask}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ SECTION 3 — ACTIVE GOALS & TASKS ═══════ */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <h2 className="section-heading">ACTIVE GOALS & TASKS</h2>
          <span className="section-badge">{commandQueue.length} ACTIVE</span>
        </div>
        <div className="card table-card">
          <div className="table-head">
            <span>AGENT</span>
            <span>TASK</span>
            <span>STATUS</span>
            <span>CREATED</span>
          </div>
          {commandQueue.length > 0 ? (
            commandQueue.map((task) => (
              <div key={task.id} className="table-row">
                <span className="cell-agent">{task.agent_name || "Unassigned"}</span>
                <span className="cell-command">{task.command}</span>
                <span className={`cell-status ${task.status?.toLowerCase()}`}>{task.status}</span>
                <span className="cell-time">{timeAgo(task.created_at)}</span>
              </div>
            ))
          ) : (
            <div className="table-empty">
              <Terminal size={24} />
              <span>NO PENDING TASKS IN QUEUE</span>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ TWO-COLUMN LAYOUT ═══════ */}
      <div className="two-col-layout">
        {/* ═══════ SECTION 4 — CONTENT PIPELINE ═══════ */}
        <section className="dashboard-section">
          <h2 className="section-heading">CONTENT PIPELINE</h2>

          {/* Vid Rush Queue */}
          <div className="pipeline-sub">
            <div className="sub-header">
              <Play size={14} />
              <span>VID RUSH QUEUE</span>
              <span className="sub-count">{vidRush.length}</span>
            </div>
            {vidRush.length > 0 ? (
              vidRush.map((v) => (
                <div key={v.id} className="pipeline-item">
                  <span className="pi-topic">{v.topic}</span>
                  <span className={`pi-status ${v.status?.toLowerCase().replace(/\s/g, "-")}`}>{v.status}</span>
                  <span className="pi-time">{timeAgo(v.created_at)}</span>
                </div>
              ))
            ) : (
              <div className="pipeline-empty">No items in vid rush queue</div>
            )}
          </div>

          {/* Content Transmissions */}
          <div className="pipeline-sub">
            <div className="sub-header">
              <FileText size={14} />
              <span>CONTENT TRANSMISSIONS</span>
              <span className="sub-count">{contentTransmissions.length}</span>
            </div>
            {contentTransmissions.length > 0 ? (
              contentTransmissions.map((ct) => (
                <div key={ct.id} className="pipeline-item">
                  <span className="pi-topic">{ct.intent_tag}</span>
                  <span className={`pi-status ${ct.status?.toLowerCase().replace(/\s/g, "-")}`}>{ct.status}</span>
                  <span className="pi-source">{ct.source}</span>
                  <span className="pi-time">{timeAgo(ct.created_at)}</span>
                </div>
              ))
            ) : (
              <div className="pipeline-empty">No content transmissions</div>
            )}
          </div>
        </section>

        {/* ═══════ RIGHT COLUMN ═══════ */}
        <div className="right-stack">
          {/* ═══════ SECTION 5 — RECENT REVENUE ═══════ */}
          <section className="dashboard-section">
            <div className="section-header-row">
              <h2 className="section-heading">RECENT REVENUE</h2>
              <DollarSign size={16} className="section-icon" />
            </div>
            <div className="card revenue-list-card">
              {revenue.length > 0 ? (
                <>
                  {revenue.map((r) => (
                    <div key={r.id} className="revenue-row">
                      <div className="rev-left">
                        <span className="rev-amount">${Number(r.amount).toLocaleString()}</span>
                        <span className="rev-product">{r.product_id || "—"}</span>
                      </div>
                      <div className="rev-right">
                        <span className="rev-source">{r.source || "Direct"}</span>
                        <span className="rev-time">{r.timestamp ? timeAgo(r.timestamp) : "—"}</span>
                      </div>
                    </div>
                  ))}
                  <div className="revenue-total">
                    <span>RUNNING TOTAL</span>
                    <span className="total-amount">${totalRevenue.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="table-empty">
                  <DollarSign size={24} />
                  <span>NO REVENUE ENTRIES YET</span>
                </div>
              )}
            </div>
          </section>

          {/* ═══════ SECTION 6 — GLITCH LOG ═══════ */}
          <section className="dashboard-section">
            <div className="section-header-row">
              <h2 className="section-heading">GLITCH LOG</h2>
              <AlertTriangle size={16} className="section-icon" />
            </div>
            <div className="card glitch-list-card">
              {glitches.length > 0 ? (
                glitches.map((g) => (
                  <div key={g.id} className="glitch-row">
                    <div className={`glitch-severity-dot ${g.severity?.toLowerCase()}`} />
                    <div className="glitch-body">
                      <span className="glitch-msg">{g.description?.length > 100 ? g.description.slice(0, 100) + "…" : g.description}</span>
                      <div className="glitch-meta">
                        <span className={`glitch-sev-label ${g.severity?.toLowerCase()}`}>{g.severity}</span>
                        <span className="glitch-time">{g.detected_at ? timeAgo(g.detected_at) : "—"}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-empty">
                  <Activity size={24} />
                  <span>NO ANOMALIES — FREQUENCY STABLE</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ═══════ STYLES ═══════ */}
      <style jsx>{`
        .ceo-dashboard {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* ── SECTION 1: MISSION STATUS BAR ── */
        .mission-status-bar {
          background: linear-gradient(135deg, rgba(201, 168, 76, 0.04), rgba(29, 158, 117, 0.04));
          border: 1px solid rgba(201, 168, 76, 0.15);
          border-radius: 16px;
          padding: 32px;
        }

        .msb-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .msb-title {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.01em;
          color: #C9A84C;
        }

        .msb-subtitle {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          margin-top: 6px;
        }

        .msb-countdown {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .countdown-number {
          font-size: 48px;
          font-weight: 900;
          font-family: var(--font-mono);
          line-height: 1;
          color: #C9A84C;
        }

        .countdown-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .msb-tracks {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .msb-track {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .track-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .track-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
        }

        .track-value {
          font-size: 18px;
          font-weight: 800;
          font-family: var(--font-mono);
        }

        .track-target {
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1s ease;
        }

        .revenue-fill {
          background: linear-gradient(90deg, #C9A84C, #E8C56A);
          box-shadow: 0 0 12px rgba(201, 168, 76, 0.4);
        }

        .liberation-fill {
          background: linear-gradient(90deg, #1D9E75, #3EF7E8);
          box-shadow: 0 0 12px rgba(29, 158, 117, 0.4);
        }

        .track-percent {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          font-weight: 700;
          align-self: flex-end;
        }

        /* ── SECTION SHARED ── */
        .dashboard-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-heading {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--color-text-primary);
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-badge {
          font-size: 10px;
          font-family: var(--font-mono);
          font-weight: 700;
          background: rgba(201, 168, 76, 0.1);
          color: #C9A84C;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid rgba(201, 168, 76, 0.2);
        }

        .section-icon {
          color: var(--color-text-muted);
        }

        /* ── SECTION 2: CREW GRID ── */
        .section-link {
          font-size: 10px;
          font-family: var(--font-mono);
          font-weight: 700;
          color: #7C5CFC;
          text-decoration: none;
          letter-spacing: 0.1em;
          transition: color 0.2s;
        }
        .section-link:hover { color: #9B7EFF; }

        .crew-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .crew-card-v2 {
          padding: 16px !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-left: 3px solid var(--agent-color);
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .crew-card-v2:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 32px rgba(124, 92, 252, 0.08);
        }

        .crew-avatar-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .crew-avatar-wrap {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid var(--agent-color);
          box-shadow: 0 0 16px color-mix(in srgb, var(--agent-color) 25%, transparent);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .crew-card-v2:hover .crew-avatar-wrap {
          width: 72px;
          height: 72px;
          box-shadow: 0 0 32px color-mix(in srgb, var(--agent-color) 40%, transparent);
        }

        .crew-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .avatar-status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--bg-primary, #0e0e0e);
        }
        .avatar-status-dot.online { background: #1D9E75; box-shadow: 0 0 8px rgba(29, 158, 117, 0.5); }
        .avatar-status-dot.offline { background: #555; }

        .crew-id-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        /* HOVER EXPAND — details slide in */
        .crew-details-expand {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        }
        .crew-card-v2:hover .crew-details-expand {
          max-height: 200px;
          opacity: 1;
        }

        .crew-card-v2 { cursor: pointer; }
        .crew-card-selected {
          border-color: var(--agent-color) !important;
          box-shadow: 0 0 40px color-mix(in srgb, var(--agent-color) 30%, transparent) !important;
        }
        .crew-grid-dimmed .crew-card-v2:not(.crew-card-selected) {
          opacity: 0.4;
          transform: scale(0.97);
        }

        /* ── HERO PANEL — full agent command bridge ── */
        .crew-hero-panel {
          background: linear-gradient(135deg, rgba(14, 14, 14, 0.98), rgba(20, 18, 30, 0.95));
          border: 1px solid var(--agent-color);
          border-left: 4px solid var(--agent-color);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 20px;
          position: relative;
          box-shadow: 0 0 60px color-mix(in srgb, var(--agent-color) 15%, transparent),
                      inset 0 0 80px rgba(0, 0, 0, 0.4);
          animation: heroSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes heroSlideIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .hero-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--color-text-muted);
          padding: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-close:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--agent-color);
        }

        .hero-top {
          display: flex;
          align-items: flex-start;
          gap: 28px;
          margin-bottom: 28px;
        }

        .hero-avatar-wrap {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 3px solid var(--agent-color);
          box-shadow: 0 0 50px color-mix(in srgb, var(--agent-color) 35%, transparent);
        }
        .hero-dot {
          width: 16px;
          height: 16px;
          bottom: 6px;
          right: 6px;
          border-width: 3px;
        }

        .hero-identity {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 8px;
        }
        .hero-name {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: var(--agent-color);
          text-shadow: 0 0 30px color-mix(in srgb, var(--agent-color) 30%, transparent);
        }
        .hero-role {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .hero-active-task {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }
        .hero-task-label {
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 4px;
        }
        .hero-task-text {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        /* ── ACTIVITY FEED ── */
        .hero-activity {
          margin-bottom: 20px;
        }
        .hero-section-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 12px;
        }
        .hero-activity-feed {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .hero-feed-item {
          display: grid;
          grid-template-columns: 64px 1fr 32px;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          transition: border-color 0.2s;
        }
        .hero-feed-item:hover {
          border-color: color-mix(in srgb, var(--agent-color) 30%, transparent);
        }
        .feed-time {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text-muted);
          letter-spacing: 0.05em;
        }
        .feed-content {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }
        .feed-speak-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          color: var(--color-text-muted);
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .feed-speak-btn:hover {
          color: var(--agent-color);
          border-color: var(--agent-color);
          background: color-mix(in srgb, var(--agent-color) 10%, transparent);
          box-shadow: 0 0 12px color-mix(in srgb, var(--agent-color) 20%, transparent);
        }
        .feed-speak-btn.speaking {
          color: var(--agent-color);
          border-color: var(--agent-color);
          animation: speakPulse 1s ease-in-out infinite;
        }
        @keyframes speakPulse {
          0%, 100% { box-shadow: 0 0 8px color-mix(in srgb, var(--agent-color) 20%, transparent); }
          50% { box-shadow: 0 0 20px color-mix(in srgb, var(--agent-color) 50%, transparent); }
        }
        .hero-feed-empty {
          font-size: 12px;
          color: var(--color-text-muted);
          text-align: center;
          padding: 24px;
          font-style: italic;
        }

        /* Chat message variants */
        .feed-sender {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.2em;
          grid-column: 1;
        }
        .msg-architect {
          border-left: 2px solid #C9A84C;
        }
        .msg-architect .feed-sender { color: #C9A84C; }
        .msg-agent {
          border-left: 2px solid var(--agent-color);
          background: color-mix(in srgb, var(--agent-color) 4%, transparent) !important;
        }
        .msg-agent .feed-sender { color: var(--agent-color); }
        .msg-architect .feed-content,
        .msg-agent .feed-content {
          grid-column: 2;
        }

        /* ── MESSAGE BAR ── */
        .hero-message-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          transition: border-color 0.2s;
        }
        .hero-message-bar:focus-within {
          border-color: var(--agent-color);
          box-shadow: 0 0 20px color-mix(in srgb, var(--agent-color) 10%, transparent);
        }
        .msg-icon {
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
        .hero-msg-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--color-text-primary);
          letter-spacing: 0.02em;
        }
        .hero-msg-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.6;
        }
        .hero-send-btn {
          background: var(--agent-color);
          border: none;
          border-radius: 8px;
          color: #0e0e0e;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-weight: 700;
        }
        .hero-send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .hero-send-btn:not(:disabled):hover {
          box-shadow: 0 0 20px color-mix(in srgb, var(--agent-color) 40%, transparent);
          transform: scale(1.05);
        }

        .crew-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .crew-identity {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .crew-name {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .status-indicator.online {
          color: #1D9E75;
          background: rgba(29, 158, 117, 0.1);
          border: 1px solid rgba(29, 158, 117, 0.2);
        }

        .status-indicator.offline {
          color: var(--color-text-muted);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .crew-role {
          font-size: 10px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
        }

        .crew-last-action {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-top: 8px;
          border-top: 1px solid var(--border-color);
        }

        .crew-action-label, .crew-task-label {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
        }

        .crew-action-text, .crew-task-text {
          font-size: 11px;
          color: var(--color-text-secondary);
          line-height: 1.4;
          font-family: var(--font-mono);
        }

        .crew-time {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .crew-current-task {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: rgba(201, 168, 76, 0.04);
          border: 1px solid rgba(201, 168, 76, 0.1);
          padding: 8px 10px;
          border-radius: 8px;
        }

        /* ── SECTION 3: TASKS TABLE ── */
        .table-card {
          padding: 0 !important;
          overflow: hidden;
        }

        .table-head {
          display: grid;
          grid-template-columns: 1fr 3fr 1fr 1fr;
          padding: 12px 20px;
          font-size: 10px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          letter-spacing: 0.1em;
          border-bottom: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 3fr 1fr 1fr;
          padding: 14px 20px;
          font-size: 12px;
          border-bottom: 1px solid var(--border-color);
          align-items: center;
          transition: background 0.15s ease;
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .cell-agent {
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cell-command {
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .cell-status {
          font-size: 10px;
          font-weight: 800;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cell-status.active, .cell-status.Active { color: #1D9E75; }
        .cell-status.pending, .cell-status.Pending { color: #C9A84C; }

        .cell-time {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .table-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: var(--color-text-muted);
          font-size: 11px;
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
        }

        /* ── TWO COLUMN LAYOUT ── */
        .two-col-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .right-stack {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* ── SECTION 4: CONTENT PIPELINE ── */
        .pipeline-sub {
          background: var(--color-bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
        }

        .sub-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 10px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-color);
        }

        .sub-count {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 9px;
        }

        .pipeline-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-color);
          font-size: 11px;
        }

        .pipeline-item:last-child {
          border-bottom: none;
        }

        .pi-topic {
          flex: 1;
          font-weight: 600;
          font-size: 12px;
        }

        .pi-status {
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pi-status.siege_active, .pi-status.active { color: #1D9E75; border-color: rgba(29,158,117,0.3); background: rgba(29,158,117,0.08); }
        .pi-status.synthesized, .pi-status.complete { color: var(--color-accent-secondary); border-color: rgba(124,92,252,0.3); background: rgba(124,92,252,0.08); }
        .pi-status.pending, .pi-status.draft { color: #C9A84C; border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.08); }

        .pi-source {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .pi-time {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .pipeline-empty {
          padding: 24px 16px;
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          text-align: center;
        }

        /* ── SECTION 5: REVENUE LIST ── */
        .revenue-list-card {
          padding: 0 !important;
          overflow: hidden;
        }

        .revenue-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.15s ease;
        }

        .revenue-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .rev-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rev-amount {
          font-size: 14px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: #C9A84C;
        }

        .rev-product {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .rev-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .rev-source {
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--color-text-secondary);
        }

        .rev-time {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .revenue-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: rgba(201, 168, 76, 0.05);
          font-size: 11px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }

        .total-amount {
          color: #C9A84C;
          font-size: 16px;
        }

        /* ── SECTION 6: GLITCH LOG ── */
        .glitch-list-card {
          padding: 0 !important;
          overflow: hidden;
        }

        .glitch-row {
          display: flex;
          gap: 12px;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-color);
          align-items: flex-start;
        }

        .glitch-severity-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
        }

        .glitch-severity-dot.critical { background: var(--color-accent-danger); box-shadow: 0 0 8px var(--color-accent-danger); }
        .glitch-severity-dot.warning { background: #C9A84C; box-shadow: 0 0 8px rgba(201,168,76,0.5); }
        .glitch-severity-dot.info { background: var(--color-accent-cyan); }

        .glitch-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .glitch-msg {
          font-size: 11px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        .glitch-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .glitch-sev-label {
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .glitch-sev-label.critical { color: var(--color-accent-danger); }
        .glitch-sev-label.warning { color: #C9A84C; }
        .glitch-sev-label.info { color: var(--color-accent-cyan); }

        .glitch-time {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1200px) {
          .crew-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col-layout { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .crew-grid { grid-template-columns: 1fr; }
          .msb-header { flex-direction: column; gap: 16px; }
          .msb-title { font-size: 20px; }
          .countdown-number { font-size: 32px; }
        }
      `}</style>
    </div>
  );
}
