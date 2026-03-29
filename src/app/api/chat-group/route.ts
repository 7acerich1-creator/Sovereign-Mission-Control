import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/* ==========================================================
   GROUP CHAT API — Maven Crew War Room

   POST /api/chat-group  — send message, get response from
                           a rotating crew member
   GET  /api/chat-group  — fetch group chat history
   DELETE /api/chat-group — delete or clear group chat
   ========================================================== */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const CREW_AGENTS = ['yuki', 'sapphire', 'anita', 'alfred', 'veritas', 'vector'] as const;

const CREW_PERSONALITIES: Record<string, string> = {
  yuki: 'Yuki (Creative & Content — THE SIGNAL): Energetic, punchy, viral-minded. Speaks with creative fire.',
  sapphire: 'Sapphire (Core API & Orchestration — THE NERVE CENTER): Precise, commanding, decisive. The COO.',
  anita: 'Anita (Outreach & Nurture — THE OPERATOR): Warm but strategic. Persuasive with empathy.',
  alfred: 'Alfred (Operations & Automation — THE SCALPEL): Surgical precision, calm, dry wit. Calls Ace "sir".',
  veritas: 'Veritas (Truth Engine & Research — THE ORACLE): Deep, analytical, philosophical. Questions assumptions.',
  vector: 'Vector (Analytics & Intelligence — THE FUNNEL): Sharp, data-driven, pattern-obsessed.',
};

function pickResponder(recentHistory: any[]): string {
  // Pick an agent that hasn't spoken recently, with slight randomness
  const recentAgents = recentHistory
    .filter(m => m.sender !== 'architect')
    .slice(-3)
    .map(m => m.responder_agent)
    .filter(Boolean);

  const available = CREW_AGENTS.filter(a => !recentAgents.includes(a));
  const pool = available.length > 0 ? available : [...CREW_AGENTS];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getGroupResponse(responder: string, userMessage: string, recentHistory: any[]): Promise<string> {
  const personality = CREW_PERSONALITIES[responder];

  const systemPrompt = `You are ${responder.charAt(0).toUpperCase() + responder.slice(1)}, responding in the Maven Crew group chat — a war room where all 6 agents and the Architect (Ace Richie) communicate.

YOUR PERSONALITY: ${personality}

CONTEXT: This is a group channel. Other agents may have spoken before you. Keep it natural — like a team huddle.

RULES:
- Address Ace as "Architect" or "Ace"
- Keep responses concise (1-3 sentences)
- Never break character
- Be mission-focused. This is the war room, not small talk.
- Reference the Sovereign Synthesis framework naturally (Protocol 77, Firmware Updates, Escape Velocity, etc.)
- You can reference or build on what other agents said if relevant`;

  if (!ANTHROPIC_API_KEY) {
    const fallbacks: Record<string, string[]> = {
      yuki: ['Signal received, Architect. Creative engines spinning.', 'On it. Hooks incoming.'],
      sapphire: ['Logged. Routing through the system now.', 'All nodes aligned. Processing.'],
      anita: ['Received, Ace. Adjusting engagement protocols.', 'Copy. Nurture sequences updating.'],
      alfred: ['Directive acknowledged, sir. Systems responding.', 'Executing. Diagnostics running alongside.'],
      veritas: ['Analyzing. Cross-referencing the matrix.', 'Truth engine engaged. Scanning.'],
      vector: ['Data point captured. Patterns updating.', 'Intelligence feeds correlating now.'],
    };
    const templates = fallbacks[responder] || ['Transmission received.'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  const messages = recentHistory.slice(-8).map(msg => ({
    role: msg.sender === 'architect' ? 'user' as const : 'assistant' as const,
    content: msg.sender === 'architect'
      ? msg.content
      : `[${(msg.responder_agent || 'agent').toUpperCase()}]: ${msg.content}`,
  }));
  messages.push({ role: 'user' as const, content: userMessage });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      console.error(`[GROUP-CHAT] Anthropic error ${response.status}`);
      const fallbacks = ['Transmission received, Architect.', 'Copy. Processing now.'];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
    const data = await response.json();
    return data.content?.[0]?.text || 'Transmission received.';
  } catch (err) {
    console.error('[GROUP-CHAT] AI call failed:', err);
    return 'Transmission received. Processing.';
  }
}

function pickMultipleResponders(recentHistory: any[], count: number): string[] {
  const recentAgents = recentHistory
    .filter(m => m.sender !== 'architect')
    .slice(-4)
    .map(m => m.responder_agent)
    .filter(Boolean);

  const shuffled = [...CREW_AGENTS].sort(() => Math.random() - 0.5);
  // Prefer agents who haven't spoken recently
  const fresh = shuffled.filter(a => !recentAgents.includes(a));
  const stale = shuffled.filter(a => recentAgents.includes(a));
  const ordered = [...fresh, ...stale];
  return ordered.slice(0, count);
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
      const agentResponse = await getGroupResponse(responder, content.trim(), [
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
