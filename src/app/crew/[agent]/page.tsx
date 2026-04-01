"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Send,
  Volume2,
  Square,
  Trash2,
  RotateCcw,
  MessageCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

/* ────────── AGENT REGISTRY ────────── */

const MAVEN_CREW: Record<string, { name: string; role: string; color: string; avatar: string }> = {
  yuki: { name: "Yuki", role: "Creative & Content", color: "#fddb92", avatar: "/crew/yuki.png" },
  sapphire: { name: "Sapphire", role: "Core API & Orchestration", color: "#4facfe", avatar: "/crew/sapphire.png" },
  anita: { name: "Anita", role: "Outreach & Nurture", color: "#ebedee", avatar: "/crew/anita.png" },
  alfred: { name: "Alfred", role: "Operations & Automation", color: "#C0392B", avatar: "/crew/alfred.png" },
  veritas: { name: "Veritas", role: "Truth Engine & Research", color: "#43e97b", avatar: "/crew/veritas.png" },
  vector: { name: "Vector", role: "Analytics & Intelligence", color: "#E67E22", avatar: "/crew/vector.png" },
};

type ChatMessage = {
  id: string;
  agent_name: string;
  sender: string;
  content: string;
  created_at: string;
};

const CHAT_PAGE_SIZE = 50;

/* ────────── TTS ────────── */

let currentUtterance: SpeechSynthesisUtterance | null = null;

function speakText(agentName: string, text: string, id: string, setSpeakingId: (id: string | null) => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
  setSpeakingId(id);
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.05;
  utt.pitch = 1.0;
  utt.onend = () => setSpeakingId(null);
  utt.onerror = () => setSpeakingId(null);
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
}

/* ────────── PAGE COMPONENT ────────── */

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentKey = (params.agent as string)?.toLowerCase();
  const agent = MAVEN_CREW[agentKey];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  const chatFeedRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Load chat history
  useEffect(() => {
    if (!agentKey) return;
    fetch(`/api/chat?agent=${agentKey}&limit=${CHAT_PAGE_SIZE}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) {
          setChatMessages(d.messages);
          setHasMoreMessages(d.messages.length >= CHAT_PAGE_SIZE);
        }
      })
      .catch(() => {});

    // Check online status from agent_history
    supabase
      .from("agent_history")
      .select("created_at")
      .eq("agent_name", agentKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const lastSeen = new Date(data[0].created_at).getTime();
          setIsOnline(Date.now() - lastSeen < 24 * 60 * 60 * 1000);
        }
      });
  }, [agentKey]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatFeedRef.current && shouldAutoScroll.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMore || !chatMessages.length) return;
    setIsLoadingMore(true);
    const oldest = chatMessages[0]?.created_at;
    try {
      const res = await fetch(`/api/chat?agent=${agentKey}&limit=${CHAT_PAGE_SIZE}&before=${encodeURIComponent(oldest)}`);
      const d = await res.json();
      if (d.messages?.length) {
        setChatMessages((prev) => [...d.messages, ...prev]);
        setHasMoreMessages(d.messages.length >= CHAT_PAGE_SIZE);
      } else {
        setHasMoreMessages(false);
      }
    } catch {}
    setIsLoadingMore(false);
  }, [agentKey, chatMessages, isLoadingMore]);

  async function sendMessage() {
    if (!messageInput.trim() || isSending) return;
    setIsSending(true);
    shouldAutoScroll.current = true;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: agentKey, content: messageInput.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        setMessageInput("");
        // Reload full history to stay in sync
        const histRes = await fetch(`/api/chat?agent=${agentKey}&limit=${CHAT_PAGE_SIZE}`);
        const histData = await histRes.json();
        if (histData.messages) {
          setChatMessages(histData.messages);
          setHasMoreMessages(histData.messages.length >= CHAT_PAGE_SIZE);
        }
      }
    } catch {}
    setIsSending(false);
  }

  async function deleteMessage(id: string) {
    await fetch("/api/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
  }

  async function clearAll() {
    await fetch("/api/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear_all: true, agent_name: agentKey }),
    });
    setChatMessages([]);
  }

  async function regenerate() {
    const lastAgentMsg = [...chatMessages].reverse().find((m) => m.sender === "agent");
    const lastArchitectMsg = [...chatMessages].reverse().find((m) => m.sender === "architect");
    if (lastAgentMsg && lastArchitectMsg) {
      await fetch("/api/chat", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lastAgentMsg.id }) });
      await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent_name: agentKey, content: lastArchitectMsg.content }) });
      const histRes = await fetch(`/api/chat?agent=${agentKey}&limit=${CHAT_PAGE_SIZE}`);
      const histData = await histRes.json();
      if (histData.messages) setChatMessages(histData.messages);
    }
  }

  if (!agent) {
    return (
      <div style={{ padding: 40, color: "#fff", fontFamily: "var(--font-mono)" }}>
        <p>Agent not found: {agentKey}</p>
        <Link href="/" style={{ color: "#E5850F" }}>← Return to Command Center</Link>
      </div>
    );
  }

  return (
    <div className="agent-chat-page" style={{ "--agent-color": agent.color } as React.CSSProperties}>
      {/* HEADER BAR */}
      <header className="acp-header">
        <Link href="/" className="acp-back-btn">
          <ArrowLeft size={16} />
          <span>Return to Command Center</span>
        </Link>
        <div className="acp-agent-id">
          <div className="acp-avatar-wrap">
            <Image src={agent.avatar} alt={agent.name} width={48} height={48} unoptimized />
          </div>
          <div className="acp-agent-meta">
            <span className="acp-name">{agent.name}</span>
            <span className="acp-role">{agent.role}</span>
          </div>
          <div className={`acp-status ${isOnline ? "online" : "offline"}`}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
          </div>
        </div>
        <div className="acp-controls">
          <button className="acp-ctrl-btn" onClick={regenerate} title="Regenerate last response">
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* CHAT FEED */}
      <div
        className="acp-feed"
        ref={chatFeedRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop < 40 && hasMoreMessages && !isLoadingMore) loadOlderMessages();
        }}
      >
        {isLoadingMore && <div className="acp-loading">Loading older transmissions...</div>}
        {hasMoreMessages && !isLoadingMore && chatMessages.length > 0 && (
          <button className="acp-load-more" onClick={loadOlderMessages}>Load older messages</button>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`acp-msg ${msg.sender === "architect" ? "acp-msg-arch" : "acp-msg-agent"}`}>
            {msg.sender !== "architect" && (
              <div className="acp-msg-avatar">
                <Image src={agent.avatar} alt={agent.name} width={32} height={32} unoptimized />
              </div>
            )}
            <div className="acp-msg-body">
              <span className="acp-msg-sender">{msg.sender === "architect" ? "ACE" : agent.name.toUpperCase()}</span>
              <p className="acp-msg-text">{msg.content}</p>
            </div>
            <div className="acp-msg-actions">
              <button
                className={`acp-speak-btn ${speakingId === msg.id ? "speaking" : ""}`}
                onClick={() => speakText(agent.name, msg.content, msg.id, setSpeakingId)}
              >
                {speakingId === msg.id ? <Square size={10} /> : <Volume2 size={12} />}
              </button>
              <button className="acp-delete-btn" onClick={() => deleteMessage(msg.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {chatMessages.length === 0 && (
          <div className="acp-empty">No transmissions yet. Send the first message below.</div>
        )}
      </div>

      {/* CLEAR BUTTON */}
      {chatMessages.length > 0 && (
        <button className="acp-clear-btn" onClick={clearAll}>
          <Trash2 size={12} /> Clear conversation
        </button>
      )}

      {/* MESSAGE BAR */}
      <div className="acp-input-bar">
        <MessageCircle size={16} className="acp-input-icon" />
        <textarea
          className="acp-input"
          placeholder={`Transmit to ${agent.name}...`}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          rows={1}
          disabled={isSending}
        />
        <button className="acp-send-btn" disabled={!messageInput.trim() || isSending} onClick={sendMessage}>
          <Send size={16} />
        </button>
      </div>

      <style jsx>{`
        .agent-chat-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--color-bg-deepest);
          color: var(--color-text-primary);
          font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif);
        }

        /* HEADER */
        .acp-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          background: var(--color-bg-surface);
          border-bottom: 1px solid var(--border-color, rgba(26,26,46,0.1));
          flex-shrink: 0;
        }
        .acp-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #E5850F;
          text-decoration: none;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.06em;
          padding: 8px 14px;
          border: 1px solid rgba(229, 133, 15, 0.2);
          border-radius: 8px;
          background: rgba(229, 133, 15, 0.05);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .acp-back-btn:hover {
          background: rgba(229, 133, 15, 0.12);
          border-color: #E5850F;
        }
        .acp-agent-id {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .acp-avatar-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid var(--agent-color);
          box-shadow: 0 0 20px color-mix(in srgb, var(--agent-color) 30%, transparent);
          flex-shrink: 0;
        }
        .acp-avatar-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .acp-agent-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .acp-name {
          font-size: 18px;
          font-weight: 800;
          color: var(--agent-color);
          letter-spacing: 0.06em;
        }
        .acp-role {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: var(--color-text-muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .acp-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.1em;
          padding: 4px 8px;
          border-radius: 4px;
          margin-left: 8px;
        }
        .acp-status.online { color: #1D9E75; background: rgba(29, 158, 117, 0.08); }
        .acp-status.offline { color: var(--color-text-muted); background: var(--color-bg-panel); }
        .acp-controls { display: flex; gap: 6px; }
        .acp-ctrl-btn {
          background: var(--color-bg-panel);
          border: 1px solid var(--border-color, rgba(26,26,46,0.1));
          border-radius: 8px;
          color: var(--color-text-muted);
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .acp-ctrl-btn:hover {
          color: var(--color-text-primary);
          border-color: var(--agent-color);
        }

        /* FEED */
        .acp-feed {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: var(--color-text-disabled) transparent;
        }
        .acp-loading, .acp-load-more, .acp-empty {
          text-align: center;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: var(--color-text-muted);
          padding: 12px;
        }
        .acp-load-more {
          cursor: pointer;
          border: 1px solid var(--border-color, rgba(26,26,46,0.1));
          border-radius: 6px;
          background: var(--color-bg-panel);
          transition: all 0.2s;
        }
        .acp-load-more:hover { border-color: var(--agent-color); color: var(--agent-color); }

        /* MESSAGES */
        .acp-msg {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          transition: background 0.2s;
        }
        .acp-msg:hover { background: var(--color-bg-panel); }
        .acp-msg-arch {
          border-left: 3px solid #E5850F;
          background: rgba(229, 133, 15, 0.04);
        }
        .acp-msg-agent {
          border-left: 3px solid var(--agent-color);
          background: var(--color-bg-surface);
        }
        .acp-msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid var(--agent-color);
        }
        .acp-msg-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .acp-msg-body { flex: 1; min-width: 0; }
        .acp-msg-sender {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 4px;
        }
        .acp-msg-arch .acp-msg-sender { color: #E5850F; }
        .acp-msg-agent .acp-msg-sender { color: var(--agent-color); }
        .acp-msg-text {
          font-size: 13px;
          line-height: 1.65;
          color: var(--color-text-primary);
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .acp-msg-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .acp-msg:hover .acp-msg-actions { opacity: 1; }
        .acp-speak-btn, .acp-delete-btn {
          background: none;
          border: none;
          color: var(--color-text-disabled);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .acp-speak-btn:hover { color: var(--agent-color); }
        .acp-speak-btn.speaking { color: #E5850F; }
        .acp-delete-btn:hover { color: #D95555; }

        /* CLEAR */
        .acp-clear-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 24px 8px;
          padding: 6px 12px;
          background: none;
          border: 1px solid var(--border-color, rgba(26,26,46,0.1));
          border-radius: 6px;
          color: var(--color-text-muted);
          font-size: 11px;
          font-family: var(--font-mono, monospace);
          cursor: pointer;
          transition: all 0.2s;
          align-self: flex-start;
        }
        .acp-clear-btn:hover { color: #D95555; border-color: rgba(217, 85, 85, 0.3); }

        /* INPUT BAR */
        .acp-input-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 24px;
          background: var(--color-bg-surface);
          border-top: 1px solid var(--border-color, rgba(26,26,46,0.1));
          flex-shrink: 0;
        }
        .acp-input-icon { color: var(--agent-color); opacity: 0.5; flex-shrink: 0; }
        .acp-input {
          flex: 1;
          background: var(--color-bg-panel);
          border: 1px solid var(--border-color, rgba(26,26,46,0.1));
          border-radius: 10px;
          color: var(--color-text-primary);
          padding: 12px 16px;
          font-size: 13px;
          resize: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .acp-input:focus {
          outline: none;
          border-color: var(--agent-color);
        }
        .acp-input::placeholder { color: var(--color-text-disabled); }
        .acp-send-btn {
          background: var(--agent-color);
          border: none;
          border-radius: 10px;
          padding: 12px;
          cursor: pointer;
          color: #fff;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .acp-send-btn:hover { opacity: 0.85; transform: scale(1.05); }
        .acp-send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
}
