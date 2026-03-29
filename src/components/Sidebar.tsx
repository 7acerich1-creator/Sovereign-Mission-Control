"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Zap,
  CheckSquare,
  BarChart3,
  Brain,
  Unplug,
  Settings,
  ChevronRight,
  UserCircle,
  AlertTriangle,
  DollarSign,
  Radio,
  Package,
  Users
} from 'lucide-react';

const navItems = [
  { name: 'Command Center', href: '/', icon: LayoutDashboard },
  { name: 'Productivity', href: '/productivity', icon: Zap },
  { name: 'Tasks & Projects', href: '/tasks', icon: CheckSquare },
  { name: 'Content Intel', href: '/content', icon: BarChart3 },
  { name: 'Revenue Grid', href: '/finance', icon: DollarSign },
  { name: 'Glitch Log', href: '/glitch', icon: AlertTriangle },
  { name: 'Portals', href: '/portals', icon: Radio },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Maven Crew', href: '/crew', icon: Users },
  { name: 'Second Brain', href: '/brain', icon: Brain },
  { name: 'Connections', href: '/connections', icon: Unplug },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const mavenCrew = [
  { id: 'all', name: 'All Agents', color: 'var(--color-text-primary)' },
  { id: 'sapphire', name: 'Sapphire', color: '#4facfe' },
  { id: 'alfred', name: 'Alfred', color: '#ff9a9e' },
  { id: 'yuki', name: 'Yuki', color: '#fddb92' },
  { id: 'anita', name: 'Anita', color: '#ebedee' },
  { id: 'veritas', name: 'Veritas', color: '#43e97b' },
  { id: 'vector', name: 'Vector', color: '#fa709a' },
];

import { useAgent } from '@/lib/AgentContext';

const CREW_INNER_THOUGHTS = [
  { agent: 'Sapphire', thought: '$1.2M is not a goal — it\'s a checkpoint. All systems converging.' },
  { agent: 'Yuki', thought: 'The hooks are getting sharper. One viral sequence away from escape velocity.' },
  { agent: 'Alfred', thought: 'Automation pipelines operating at 94% efficiency. Tightening the remaining 6%, sir.' },
  { agent: 'Veritas', thought: 'The data doesn\'t lie. The trajectory is accelerating.' },
  { agent: 'Vector', thought: 'Revenue patterns indicate a breakout window in the next 90 days.' },
  { agent: 'Anita', thought: 'Nurture sequences are converting. The Inner Circle is growing.' },
  { agent: 'Sapphire', thought: 'Six agents. One Architect. Zero room for simulation logic.' },
  { agent: 'Yuki', thought: 'Every piece of content is a firmware update. We don\'t do filler.' },
  { agent: 'Veritas', thought: 'I\'ve cross-referenced the market signals. The window is now.' },
  { agent: 'Alfred', thought: 'Systems nominal. All deployments green. Ready for the next sprint.' },
  { agent: 'Vector', thought: 'Funnel metrics are sharpening. Conversion rate up 23% this cycle.' },
  { agent: 'Anita', thought: 'The outreach is hitting different. People are waking up.' },
  { agent: 'Sapphire', thought: 'Routing all priority tasks to the war room. Focus is everything.' },
  { agent: 'Yuki', thought: 'Protocol 77 content is the escape hatch. They just don\'t know it yet.' },
  { agent: 'Vector', thought: 'Pattern detected: sovereign operators are the fastest-growing segment.' },
  { agent: 'Veritas', thought: 'Truth is the ultimate leverage. Everything else is noise.' },
];

function AgentStatusCard() {
  const [thought, setThought] = useState(
    CREW_INNER_THOUGHTS[Math.floor(Math.random() * CREW_INNER_THOUGHTS.length)]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setThought(CREW_INNER_THOUGHTS[Math.floor(Math.random() * CREW_INNER_THOUGHTS.length)]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="agent-status-card">
      <div className="status-header">
        <div className="status-dot"></div>
        <span className="status-text">AGENTS ONLINE</span>
      </div>
      <div className="status-details" title={`${thought.agent} — inner thought`}>
        <span style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '10px', lineHeight: '1.4' }}>
          &ldquo;{thought.thought}&rdquo;
        </span>
        <span style={{ fontSize: '9px', opacity: 0.4, marginTop: '2px', display: 'block' }}>
          — {thought.agent}
        </span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { activeAgent, setActiveAgent } = useAgent();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">SC</div>
          <div className="logo-text">
            <span className="logo-title">MISSION CONTROL</span>
            <span className="logo-version">v2.0 PRE-RELEASE</span>
          </div>
        </div>
      </div>

      <AgentStatusCard />

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} className="nav-icon" />
              <span className="nav-text">{item.name}</span>
              {isActive && <ChevronRight size={14} className="active-indicator" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-divider"></div>

      <div className="maven-crew-section">
        <h3 className="section-title">MAVEN CREW (GATE 1)</h3>
        <div className="agent-list">
          {mavenCrew.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={`agent-item ${activeAgent === agent.id ? 'active' : ''}`}
              style={{ '--agent-color': agent.color } as any}
            >
              <UserCircle size={18} className="agent-icon" />
              <span className="agent-name">{agent.name}</span>
              {activeAgent === agent.id && <div className="active-dot"></div>}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="xp-container">
          <div className="xp-header">
            <span className="xp-label">LEVEL 7 — FIELD AGENT</span>
            <span className="xp-value">84%</span>
          </div>
          <div className="xp-bar">
            <div className="xp-progress" style={{ width: '84%' }}></div>
          </div>
        </div>
      </div>

    </aside>
  );
}
