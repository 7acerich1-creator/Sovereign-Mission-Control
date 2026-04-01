import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/* ==========================================================
   GROUP CHAT API — Maven Crew War Room (Phase 3: Railway Bridge)

   POST /api/chat-group  — send message, get responses from
                           rotating crew via Railway agent loops
   GET  /api/chat-group  — fetch group chat history
   DELETE /api/chat-group — delete or clear group chat

   Routes through Railway /api/chat-bridge for REAL agent loops.
   ========================================================== */

const RAILWAY_BRIDGE_URL = process.env.RAILWAY_BRIDGE_URL || 'https://gravity-claw-production-d849.up.railway.app/api/chat-bridge';
const BRIDGE_TIMEOUT_MS = 60000;

const CREW_AGENTS = ['yuki', 'sapphire', 'anita', 'alfred', 'veritas', 'vector'] as const;

const FALLBACK_TEMPLATES: Record<string, string[]> = {
  yuki: ['Signal received, Architect. Creative engines spinning.', 'On it. Hooks incoming.'],
  sapphire: ['Logged. Routing through the system now.', 'All nodes aligned. Processing.'],
  anita: ['Received, Ace. Adjusting engagement protocols.', 'Copy. Nurture sequences updating.'],
  alfred: ['Directive acknowledged, sir. Systems responding.', 'Executing. Diagnostics running alongside.'],
  veritas: ['Analyzing. Cross-referencing the matrix.', 'Truth engine engaged. Scanning.'],
  vector: ['Data point captured. Patterns updating.', 'Intelligence feeds correlating now.'],
};

function pickMultipleResponders(recentHistory: any[], count: number): string[] {
  const recentAgents = recentHistory
    .filter(m => m.sender !== 'architect')
    .slice(-4)
    .map(m => m.responder_agent)
    .filter(Boolean);

  const shuffled = [...CREW_AGENTS].sort(() => Math.random() - 0.5);
  const fresh = shuffled.filter(a => !recentAgents.includes(a));
  const stale = shuffled.filter(a => recentAgents.includes(a));
  const ordered = [...fresh, ...stale];
  return ordered.slice(0, count);
}

async function getBridgeResponse(agentKey: string, userMessage: string, recentHistory: any[]): Promise<string> {
  const templates = FALLBACK_TEMPLATES[agentKey] || ['Transmission received.'];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT_MS);

    // Inject group context so the agent knows other agents have spoken
    const groupContext = recentHistory
      .filter(m => m.sender !== 'architect' && m.responder_agent)
      .slice(-4)
      .map(m => `[${m.responder_agent.toUpperCase()}]: ${m.content}`)
      .join('\n');

    const contextualMessage = groupContext
      ? `[GROUP WAR ROOM] The Architect said: "${userMessage}"\n\nOther agents have responded:\n${groupContext}\n\nNow give YOUR take — concise (1-3 sentences), mission-focused, stay in character.`
      : `[GROUP WAR ROOM] The Architect said: "${userMessage}"\n\nYou're the first to respond. Give a concise take (1-3 sentences), mission-focused, stay in character.`;

    const response = await fetch(RAILWAY_BRIDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_name: agentKey, content: contextualMessage }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[GROUP-BRIDGE] Railway error ${response.status} for ${agentKey}`);
      return templates[Math.floor(Math.random() * templates.length)];
    }

    const data = await response.json();
    let agentResponse: string;
    if (data.result) {
      try {
        const parsed = JSON.parse(data.result);
        agentResponse = parsed.response || data.result;
      } catch {
        agentResponse = data.result;
      }
    } else {
      agentResponse = data.response || templates[0];
    }

    return agentResponse;
  } catch (err: any) {
    console.error(`[GROUP-BRIDGE] ${agentKey} failed:`, err.message);
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // Insert architect's message
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({ agent_name: 'crew', sender: 'architect', content: content.trim() });
    if (insertError) throw insertError;

    // Get recent history for context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_name', 'crew')
      .order('created_at', { ascending: false })
      .limit(10);
    const recentHistory = (history || []).reverse();

    // Pick 2-3 agents to respond (makes it feel like a real group chat)
    const responderCount = Math.random() > 0.5 ? 3 : 2;
    const responders = pickMultipleResponders(recentHistory, responderCount);

    const responses: { agent: string; content: string }[] = [];

    // Generate responses sequentially so each agent can see what the previous said
    for (const responder of responders) {
      const agentResponse = await getBridgeResponse(responder, content.trim(), [
        ...recentHistory,
        ...responses.map(r => ({ sender: 'agent', responder_agent: r.agent, content: r.content })),
      ]);

      const { error: responseError } = await supabase
        .from('chat_messages')
        .insert({
          agent_name: 'crew',
          sender: 'agent',
          content: agentResponse,
          responder_agent: responder,
        });
      if (responseError) console.error(`[GROUP-CHAT] Insert error for ${responder}:`, responseError);

      responses.push({ agent: responder, content: agentResponse });
    }

    return NextResponse.json({ success: true, responses });
  } catch (error: any) {
    console.error('Group Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_name', 'crew');

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ messages: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    if (body.clear_all) {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('agent_name', 'crew');
      if (error) throw error;
      return NextResponse.json({ success: true, cleared: 'crew' });
    }

    if (body.id) {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', body.id);
      if (error) throw error;
      return NextResponse.json({ success: true, deleted: body.id });
    }

    return NextResponse.json({ error: 'Missing id or clear_all' }, { status: 400 });
  } catch (error: any) {
    console.error('Group Chat DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
