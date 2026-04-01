import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/* ==========================================================
   CHAT API — Phase 3: Webhook Bridge to Railway Agents

   POST /api/chat  — send message, get response via Railway bridge
   GET  /api/chat  — fetch history with pagination
   DELETE /api/chat — delete message or clear conversation

   Messages route through the Railway Sentinel Bot's /api/chat-bridge
   endpoint, hitting the REAL agent loops with full personality blueprints,
   tools, Pinecone memory, and Supabase context. No more raw LLM shells.
   ========================================================== */

const RAILWAY_BRIDGE_URL = process.env.RAILWAY_BRIDGE_URL || 'https://gravity-claw-production-d849.up.railway.app/api/chat-bridge';
const BRIDGE_TIMEOUT_MS = 60000; // 60s — agents may run tools

const FALLBACK_TEMPLATES: Record<string, string[]> = {
  yuki: ['Transmission received, Architect. Creative protocols spinning up on this.', 'Copy. Running it through the viral pattern engine now.'],
  sapphire: ['Directive logged. Routing through orchestration now, Architect.', 'Command received. Executing with priority override.'],
  anita: ['Received, Ace. Calibrating outreach sequences now.', 'On it. Engagement protocols updating.'],
  alfred: ['Directive received, sir. Operations board updated.', 'Acknowledged. Running diagnostics alongside.'],
  veritas: ['Analyzing. Cross-referencing against the knowledge matrix.', 'Truth engine processing. Scanning all intelligence.'],
  vector: ['Data point logged. Analytics dashboard updating.', 'Acknowledged. Intelligence feeds correlating.'],
};

async function getAgentResponse(agentKey: string, userMessage: string, recentHistory: any[]): Promise<string> {
  const templates = FALLBACK_TEMPLATES[agentKey] || ['Transmission received.'];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT_MS);

    console.log(`[CHAT-BRIDGE] Routing to Railway: ${agentKey} ← "${userMessage.slice(0, 60)}..."`);

    const response = await fetch(RAILWAY_BRIDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_name: agentKey,
        content: userMessage,
        history: recentHistory.slice(-10).map(msg => ({
          sender: msg.sender,
          content: msg.content,
        })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[CHAT-BRIDGE] Railway error ${response.status}:`, errBody);
      return templates[Math.floor(Math.random() * templates.length)];
    }

    const data = await response.json();
    // Railway webhook returns { status: "ok", result: JSON.stringify({ agent, response }) }
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

    console.log(`[CHAT-BRIDGE] ${agentKey} → "${agentResponse.slice(0, 60)}..."`);
    return agentResponse;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`[CHAT-BRIDGE] Timeout — ${agentKey} did not respond within ${BRIDGE_TIMEOUT_MS}ms`);
    } else {
      console.error(`[CHAT-BRIDGE] Failed:`, err.message);
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

export async function POST(req: Request) {
  try {
    const { agent_name, content } = await req.json();
    if (!agent_name || !content) {
      return NextResponse.json({ error: 'Missing agent_name or content' }, { status: 400 });
    }
    const agentKey = agent_name.toLowerCase();

    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({ agent_name: agentKey, sender: 'architect', content: content.trim() });
    if (insertError) throw insertError;

    const { data: history } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_name', agentKey)
      .order('created_at', { ascending: false })      .limit(10);
    const recentHistory = (history || []).reverse();

    const agentResponse = await getAgentResponse(agentKey, content.trim(), recentHistory);

    const { error: responseError } = await supabase
      .from('chat_messages')
      .insert({ agent_name: agentKey, sender: 'agent', content: agentResponse });
    if (responseError) throw responseError;

    return NextResponse.json({ success: true, response: agentResponse });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/chat?agent=yuki&limit=50&before=2026-03-29T00:00:00Z
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agent = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    if (!agent) {
      return NextResponse.json({ error: 'Missing agent parameter' }, { status: 400 });
    }

    let query = supabase
      .from('chat_messages')      .select('*')
      .eq('agent_name', agent.toLowerCase());

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

// DELETE /api/chat — delete single message or clear all for agent
export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    if (body.clear_all && body.agent_name) {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('agent_name', body.agent_name.toLowerCase());
      if (error) throw error;
      return NextResponse.json({ success: true, cleared: body.agent_name });
    }

    if (body.id) {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', body.id);
      if (error) throw error;
      return NextResponse.json({ success: true, deleted: body.id });
    }

    return NextResponse.json({ error: 'Missing id or clear_all + agent_name' }, { status: 400 });
  } catch (error: any) {
    console.error('Chat DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
