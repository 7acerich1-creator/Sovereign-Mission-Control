"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Wifi, WifiOff, Zap } from "lucide-react";

/* ======================================================
   MAVEN CREW — THE SOVEREIGN HIVE MIND
   Full gallery with hover-expand portraits + group shot
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
    color: "#ff9a9e",
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
    color: "#fa709a",
    avatar: "/crew/vector.png",
    bio: "Revenue intelligence and analytics architect. Vector tracks every conversion, maps every funnel stage, and surfaces the metrics that drive sovereign growth.",
    capabilities: ["Revenue analytics", "Funnel optimization", "KPI dashboards", "Predictive modeling"],
  },
];

export default function CrewPage() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

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

      {/* ======= GROUP SHOT — HERO ======= */}
      <section style={{ marginBottom: 40, position: "relative" }}>
        <div style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(124, 92, 252, 0.15)",
          background: "rgba(5, 5, 8, 0.8)",
          boxShadow: "0 0 60px rgba(124, 92, 252, 0.08)",
        }}>
          <Image
            src="/crew/maven-crew-group.png"
            alt="The Maven Crew — Sovereign Synthesis Command"
            width={1200}
            height={600}
            style={{ width: "100%", height: "auto", display: "block", opacity: 0.95 }}
            unoptimized
          />
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "40px 32px 24px",
            background: "linear-gradient(to top, rgba(5,5,8,0.95) 0%, transparent 100%)",
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

      <style jsx>{`
        @media (max-width: 768px) {
          section > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
