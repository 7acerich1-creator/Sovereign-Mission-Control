"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Send, X, MessageCircle, Maximize2, Minimize2,
  Trash2, Volume2, Square, RotateCcw,
} from "lucide-react";

/* ======================================================
   MAVEN CREW — THE SOVEREIGN HIVE MIND
   Full gallery + group chat war room over the hero image
   ====================================================== */

type CrewMember = {
  name: string;
  role: string;
  codename: string;
  color: string;
  avatar: string;
  bio: string;
  capabilities: string[];
};

const CREW: CrewMember[] = [
  {
    name: "Yuki",
    role: "Creative & Content",
    codename: "THE SIGNAL",
    color: "#fddb92",
    avatar: "/crew/yuki.png",
    bio: "Content architect and viral signal generator. Yuki transforms sovereign frameworks into high-velocity memetic transmissions that bypass the simulation's noise floor.",
    capabilities: ["Video script generation", "Social media content", "Viral hook engineering", "Brand voice enforcement"],
  },
  {
    name: "Sapphire",
    role: "Core API & Orchestration",
    codename: "THE NERVE CENTER",
    color: "#4facfe",
    avatar: "/crew/sapphire.png",
    bio: "Central nervous system of the Sovereign Synthesis ecosystem. Sapphire orchestrates all agent communication, task routing, and system-wide decision architecture.",
    capabilities: ["Multi-agent orchestration", "API routing", "System health monitoring", "Decision tree execution"],
  },
  {
    name: "Anita",
    role: "Outreach & Nurture",
    codename: "THE OPERATOR",
    color: "#ebedee",
    avatar: "/crew/anita.png",
    bio: "Precision outreach and nurture sequence architect. Anita manages the sovereign funnel from first contact through Inner Circle conversion with surgical psychological accuracy.",
    capabilities: ["Email sequence design", "Lead nurture automation", "Conversion optimization", "CRM management"],
  },
  {
    name: "Alfred",
    role: "Operations & Automation",
    codename: "THE SCALPEL",
    color: "#C0392B",
    avatar: "/crew/alfred.png",
    bio: "Operational precision instrument. Alfred handles deployment, infrastructure, scheduling, and system maintenance with zero-tolerance-for-error execution protocols.",
    capabilities: ["Deployment management", "Infrastructure monitoring", "Task scheduling", "System maintenance"],
  },
  {
    name: "Veritas",
    role: "Truth Engine & Research",
    codename: "THE ORACLE",
    color: "#43e97b",
    avatar: "/crew/veritas.png",
    bio: "Deep research and pattern recognition engine. Veritas scans the signal landscape, verifies data integrity, and surfaces truth from noise at scale.",
    capabilities: ["Deep research analysis", "Pattern recognition", "Data verification", "Trend forecasting"],
  },
  {
    name: "Vector",
    role: "Analytics & Intelligence",
    codename: "THE FUNNEL",
    color: "#E67E22",
    avatar: "/crew/vector.png",
    bio: "Revenue intelligence and analytics architect. Vector tracks every conversion, maps every funnel stage, and surfaces the metrics that drive sovereign growth.",
    capabilities: ["Revenue analytics", "Funnel optimization", "KPI dashboards", "Predictive modeling"],
  },
];

const AGENT_COLORS: Record<string, string> = {
  yuki: "#fddb92",
  sapphire: "#4facfe",
  anita: "#ebedee",
  alfred: "#C0392B",
  veritas: "#43e97b",
  vector: "#E67E22",
};

type GroupMessage = {
  id: string;
  agent_name: string;
  sender: string;
  content: string;
  created_at: string;
  responder_agent?: string;
};

export default function CrewPage() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  /* ---- GROUP CHAT STATE ---- */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const PAGE_SIZE = 50;

  // TTS state
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      const src = audioRef.current.src;
      audioRef.current = null;
      if (src) URL.revokeObjectURL(src);
    }
    setSpeakingId(null);
  }

  async function speakText(agentName: string, text: string, messageId: string) {
    if (speakingId) { stopSpeaking(); return; }
    setSpeakingId(messageId);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: agentName, text }),
      });
      if (!res.ok) { setSpeakingId(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { audioRef.current = null; setSpeakingId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { audioRef.current = null; setSpeakingId(null); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      audioRef.current = null;
      setSpeakingId(null);
    }
  }

  /* ---- FETCH GROUP CHAT ---- */
  useEffect(() => {
    if (!chatOpen) return;

    fetch(`/api/chat-group?limit=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(d => {
        if (d.messages) {
          setGroupMessages(d.messages);
          setHasMore(d.messages.length >= PAGE_SIZE);
        }
      })
      .catch(() => {});

    // Realtime
    const channel = supabase
      .channel('group-chat-crew')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: 'agent_name=eq.crew',
      }, (payload) => {
        setGroupMessages(prev => [...prev, payload.new as GroupMessage]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: 'agent_name=eq.crew',
      }, (payload) => {
        setGroupMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatOpen]);

  // Auto-scroll
  useEffect(() => {
    if (chatFeedRef.current && shouldAutoScroll.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
    shouldAutoScroll.current = true;
  }, [groupMessages]);

  // Load older
  async function loadOlderMessages() {
    if (loadingMore || !hasMore || groupMessages.length === 0) return;
    setLoadingMore(true);
    shouldAutoScroll.current = false;
    const oldest = groupMessages[0]?.created_at;
    try {
      const res = await fetch(`/api/chat-group?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldest)}`);
      const d = await res.json();
      if (d.messages?.length > 0) {
        setGroupMessages(prev => [...d.messages, ...prev]);
        setHasMore(d.messages.length >= PAGE_SIZE);
      } else { setHasMore(false); }
    } catch { setHasMore(false); }
    setLoadingMore(false);
  }

  // Send message
  async function sendGroupMessage() {
    if (!msgInput.trim() || isSending) return;
    setIsSending(true);
    try {
      await fetch('/api/chat-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgInput.trim() }),
      });
      setMsgInput("");
    } catch (err) { console.error('Group send failed:', err); }
    setIsSending(false);
  }

  // Delete message
  async function deleteMessage(id: string) {
    try {
      await fetch('/api/chat-group', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setGroupMessages(prev => prev.filter(m => m.id !== id));
    } catch {}
  }

  // Clear all
  async function clearGroupChat() {
    try {
      await fetch('/api/chat-group', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear_all: true }),
      });
      setGroupMessages([]);
    } catch {}
  }

  function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /* ---- GROUP CHAT PANEL ---- */
  function renderGroupChat() {
    const panelClass = chatFullscreen ? 'crew-chat-panel crew-chat-fullscreen' : 'crew-chat-panel';

    return (
      <div className={panelClass}>
        {/* Background image visible in fullscreen */}
        {chatFullscreen && (
          <div className="crew-chat-bg">
            <Image
              src="/crew/maven-crew-group.png"
              alt=""
              fill
              style={{ objectFit: "cover", opacity: 0.12 }}
              unoptimized
            />
          </div>
        )}

        {/* Header */}
        <div className="crew-chat-header">
          <div className="crew-chat-title">
            <MessageCircle size={14} style={{ color: "#7C5CFC" }} />
            <span>WAR ROOM</span>
            <span className="crew-chat-badge">{groupMessages.length}</span>
          </div>
          <div className="crew-chat-controls">
            <button className="crew-chat-ctrl-btn" onClick={() => {
              fetch(`/api/chat-group?limit=${PAGE_SIZE}`)
                .then(r => r.json())
                .then(d => { if (d.messages) { setGroupMessages(d.messages); setHasMore(d.messages.length >= PAGE_SIZE); } })
                .catch(() => {});
            }} title="Refresh">
              <RotateCcw size={13} />
            </button>
            {groupMessages.length > 0 && (
              <button className="crew-chat-ctrl-btn" onClick={clearGroupChat} title="Clear all">
                <Trash2 size={13} />
              </button>
            )}
            <button className="crew-chat-ctrl-btn" onClick={() => setChatFullscreen(f => !f)} title={chatFullscreen ? "Exit fullscreen" : "Expand"}>
              {chatFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button className="crew-chat-ctrl-btn" onClick={() => { setChatOpen(false); setChatFullscreen(false); stopSpeaking(); }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="crew-chat-feed"
          ref={chatFeedRef}
          onScroll={(e) => {
            if ((e.target as HTMLDivElement).scrollTop < 40 && hasMore && !loadingMore) {
              loadOlderMessages();
            }
          }}
        >
          {loadingMore && <div className="crew-chat-loading">Loading history...</div>}
          {groupMessages.length === 0 && (
            <div className="crew-chat-empty">
              <MessageCircle size={32} style={{ opacity: 0.2 }} />
              <p>War room is silent.</p>
              <p style={{ fontSize: 11, opacity: 0.4 }}>Send a transmission to the crew.</p>
            </div>
          )}
          {groupMessages.map((msg) => {
            const isArchitect = msg.sender === 'architect';
            const responder = msg.responder_agent || '';
            const agentColor = AGENT_COLORS[responder] || "#7C5CFC";

            return (
              <div key={msg.id} className={`crew-msg ${isArchitect ? 'crew-msg-architect' : 'crew-msg-agent'}`}>
                {!isArchitect && responder && (
                  <div className="crew-msg-agent-tag" style={{ color: agentColor }}>
                    {responder.toUpperCase()}
                  </div>
                )}
                <div className="crew-msg-bubble" style={!isArchitect ? { borderLeft: `2px solid ${agentColor}` } : {}}>
                  <span className="crew-msg-text">{msg.content}</span>
                  <div className="crew-msg-meta">
                    <span className="crew-msg-time">{timeAgo(msg.created_at)}</span>
                    <span className="crew-msg-actions">
                      {!isArchitect && responder && (
                        <button
                          className="crew-msg-action-btn"
                          onClick={() => speakText(responder, msg.content, msg.id)}
                          title={speakingId === msg.id ? "Stop" : "Listen"}
                        >
                          {speakingId === msg.id ? <Square size={10} /> : <Volume2 size={12} />}
                        </button>
                      )}
                      <button className="crew-msg-action-btn" onClick={() => deleteMessage(msg.id)} title="Delete">
                        <Trash2 size={11} />
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="crew-chat-input-bar">
          <input
            className="crew-chat-input"
            type="text"
            placeholder="Transmit to the crew..."
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGroupMessage(); } }}
            disabled={isSending}
          />
          <button
            className="crew-chat-send"
            onClick={sendGroupMessage}
            disabled={isSending || !msgInput.trim()}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="glow-orb glow-violet" style={{ top: "-10%", right: "15%" }} />
      <div className="glow-orb glow-gold" style={{ bottom: "10%", left: "-5%" }} />

      <header className="page-header">
        <div className="header-main">
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, color: "#7C5CFC", fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", marginBottom: 12 }}>
            <ArrowLeft size={14} /> BACK TO COMMAND CENTER
          </Link>
          <h1 className="h1-display">THE MAVEN CREW</h1>
          <p className="eyebrow text-secondary">SOVEREIGN SYNTHESIS :: AGENTIC HIVE MIND</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span className="label">AGENTS</span>
            <span className="value">{CREW.length}</span>
          </div>
          <div className="mini-stat">
            <span className="label">STATUS</span>
            <span className="value" style={{ color: "#1D9E75" }}>ACTIVE</span>
          </div>
        </div>
      </header>

      {/* ======= GROUP SHOT — HERO with Chat Overlay ======= */}
      <section style={{ marginBottom: 40, position: "relative" }}>
        <div style={{
          position: "relative",
          borderRadius: 16,
          border: "1px solid rgba(124, 92, 252, 0.15)",
          background: "rgba(5, 5, 8, 0.8)",
          boxShadow: "0 0 60px rgba(124, 92, 252, 0.08)",
        }}>
          {/* Image wrapper with overflow hidden for border-radius clipping */}
          <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <Image
            src="/crew/maven-crew-group.png"
            alt="The Maven Crew — Sovereign Synthesis Command"
            width={1200}
            height={600}
            style={{ width: "100%", height: "auto", display: "block", opacity: 0.95 }}
            unoptimized
          />
          </div>

          {/* Chat trigger overlay — positioned over Vector's area (top-right of image) */}
          {!chatOpen && (
            <button
              className="crew-chat-trigger"
              onClick={() => setChatOpen(true)}
            >
              <MessageCircle size={18} />
              <span>OPEN WAR ROOM</span>
            </button>
          )}

          {/* Chat panel overlaid on the hero image (non-fullscreen) */}
          {chatOpen && !chatFullscreen && renderGroupChat()}

          {/* Bottom gradient text */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "40px 32px 24px",
            background: "linear-gradient(to top, rgba(5,5,8,0.95) 0%, transparent 100%)",
            pointerEvents: "none",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "#7C5CFC",
              marginBottom: 6,
            }}>// SOVEREIGN SYNTHESIS COMMAND</p>
            <p style={{
              fontSize: 16,
              color: "rgba(232, 228, 216, 0.7)",
              fontWeight: 300,
              maxWidth: 600,
            }}>Six specialized agents operating as one unified intelligence. Each node sovereign. The collective — unstoppable.</p>
          </div>
        </div>
      </section>

      {/* Fullscreen chat renders outside the hero container */}
      {chatOpen && chatFullscreen && renderGroupChat()}

      {/* ======= AGENT GALLERY ======= */}
      <section>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
        }}>
          {CREW.map((agent) => {
            const isExpanded = expandedAgent === agent.name;
            return (
              <div
                key={agent.name}
                className="card"
                onClick={() => setExpandedAgent(isExpanded ? null : agent.name)}
                style={{
                  cursor: "pointer",
                  padding: 0,
                  overflow: "hidden",
                  borderLeft: `3px solid ${agent.color}`,
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isExpanded ? `0 0 40px ${agent.color}22` : undefined,
                }}
              >
                {/* TOP ROW — Avatar + Info */}
                <div style={{ display: "flex", gap: 20, padding: "20px 24px" }}>
                  <div style={{
                    position: "relative",
                    width: isExpanded ? 100 : 72,
                    height: isExpanded ? 100 : 72,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: `2px solid ${agent.color}`,
                    boxShadow: `0 0 ${isExpanded ? 32 : 16}px ${agent.color}40`,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}>
                    <Image
                      src={agent.avatar}
                      alt={agent.name}
                      width={100}
                      height={100}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      unoptimized
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                    <p style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      color: agent.color,
                      opacity: 0.7,
                    }}>{agent.codename}</p>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "0.02em" }}>{agent.name}</h3>
                    <p style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.05em",
                      color: "var(--color-text-muted)",
                    }}>{agent.role}</p>
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                <div style={{
                  maxHeight: isExpanded ? 300 : 0,
                  opacity: isExpanded ? 1 : 0,
                  overflow: "hidden",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  padding: isExpanded ? "0 24px 20px" : "0 24px",
                }}>
                  <p style={{
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.7,
                    fontWeight: 300,
                    marginBottom: 16,
                  }}>{agent.bio}</p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {agent.capabilities.map((cap) => (
                      <span key={cap} style={{
                        fontSize: 9,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        color: agent.color,
                        background: `${agent.color}10`,
                        border: `1px solid ${agent.color}25`,
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}>
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style jsx global>{`
        /* ===== GROUP CHAT TRIGGER BUTTON ===== */
        .crew-chat-trigger {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(5, 5, 8, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(124, 92, 252, 0.35);
          border-radius: 10px;
          color: #7C5CFC;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 30px rgba(124, 92, 252, 0.15);
        }
        .crew-chat-trigger:hover {
          background: rgba(124, 92, 252, 0.15);
          border-color: rgba(124, 92, 252, 0.6);
          box-shadow: 0 0 40px rgba(124, 92, 252, 0.25);
          transform: translateY(-1px);
        }

        /* ===== CHAT PANEL (overlaid on hero) ===== */
        .crew-chat-panel {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 420px;
          max-height: calc(100% - 24px);
          z-index: 20;
          display: flex;
          flex-direction: column;
          background: rgba(8, 8, 14, 0.92);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(124, 92, 252, 0.2);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 8px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 92, 252, 0.08);
        }

        /* ===== FULLSCREEN ===== */
        .crew-chat-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-height: 100%;
          border-radius: 0;
          z-index: 9999;
        }
        .crew-chat-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        /* ===== HEADER ===== */
        .crew-chat-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(124, 92, 252, 0.12);
          background: rgba(5, 5, 8, 0.6);
        }
        .crew-chat-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.15em;
          color: rgba(232, 228, 216, 0.85);
          font-weight: 600;
        }
        .crew-chat-badge {
          font-size: 9px;
          background: rgba(124, 92, 252, 0.2);
          color: #7C5CFC;
          padding: 2px 7px;
          border-radius: 8px;
          font-weight: 500;
        }
        .crew-chat-controls {
          display: flex;
          gap: 4px;
        }
        .crew-chat-ctrl-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          color: rgba(232, 228, 216, 0.5);
          padding: 5px 7px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .crew-chat-ctrl-btn:hover {
          color: rgba(232, 228, 216, 0.9);
          background: rgba(255, 255, 255, 0.08);
        }

        /* ===== FEED ===== */
        .crew-chat-feed {
          position: relative;
          z-index: 2;
          flex: 1;
          overflow-y: auto;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 200px;
          max-height: 400px;
        }
        .crew-chat-fullscreen .crew-chat-feed {
          max-height: none;
          min-height: 0;
        }
        .crew-chat-loading {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 10px;
          color: rgba(124, 92, 252, 0.5);
          padding: 8px;
        }
        .crew-chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 20px;
          color: rgba(232, 228, 216, 0.3);
          font-size: 13px;
          text-align: center;
        }

        /* ===== MESSAGES ===== */
        .crew-msg { display: flex; flex-direction: column; }
        .crew-msg-architect { align-items: flex-end; }
        .crew-msg-agent { align-items: flex-start; }

        .crew-msg-agent-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.15em;
          font-weight: 600;
          margin-bottom: 3px;
          padding-left: 10px;
        }

        .crew-msg-bubble {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .crew-msg-architect .crew-msg-bubble {
          background: rgba(124, 92, 252, 0.1);
          border-color: rgba(124, 92, 252, 0.2);
          border-left: none;
        }

        .crew-msg-text {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(232, 228, 216, 0.85);
          font-weight: 300;
        }

        .crew-msg-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
          gap: 8px;
        }
        .crew-msg-time {
          font-family: var(--font-mono);
          font-size: 9px;
          color: rgba(232, 228, 216, 0.2);
        }
        .crew-msg-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .crew-msg-bubble:hover .crew-msg-actions {
          opacity: 1;
        }
        .crew-msg-action-btn {
          background: none;
          border: none;
          color: rgba(232, 228, 216, 0.3);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .crew-msg-action-btn:hover {
          color: rgba(232, 228, 216, 0.7);
        }

        /* ===== INPUT BAR ===== */
        .crew-chat-input-bar {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 8px;
          padding: 14px 18px;
          border-top: 1px solid rgba(124, 92, 252, 0.1);
          background: rgba(5, 5, 8, 0.5);
        }
        .crew-chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: rgba(232, 228, 216, 0.9);
          padding: 10px 14px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .crew-chat-input:focus {
          border-color: rgba(124, 92, 252, 0.4);
        }
        .crew-chat-input::placeholder {
          color: rgba(232, 228, 216, 0.2);
        }
        .crew-chat-send {
          background: rgba(124, 92, 252, 0.2);
          border: 1px solid rgba(124, 92, 252, 0.3);
          border-radius: 8px;
          color: #7C5CFC;
          padding: 8px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .crew-chat-send:hover:not(:disabled) {
          background: rgba(124, 92, 252, 0.35);
        }
        .crew-chat-send:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          section > div {
            grid-template-columns: 1fr !important;
          }
          .crew-chat-panel {
            width: calc(100% - 24px);
          }
        }
      `}</style>
    </div>
  );
}
