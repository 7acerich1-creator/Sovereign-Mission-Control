"use client";

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

      <div className="agent-status-card">
        <div className="status-header">
          <div className="status-dot"></div>
          <span className="status-text">AGENT ONLINE</span>
        </div>
        <div className="status-details">
          <span>Railway :: Gemini 3.1 Pro</span>
        </div>
      </div>

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
