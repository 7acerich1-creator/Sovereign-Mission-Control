"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type AgentContextType = {
  activeAgent: string;
  setActiveAgent: (agent: string) => void;
};

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [activeAgent, setActiveAgent] = useState('all');

  return (
    <AgentContext.Provider value={{ activeAgent, setActiveAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
