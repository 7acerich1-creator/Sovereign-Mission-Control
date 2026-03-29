import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/* ==========================================================
   CHAT API — Phase 2: AI-Powered Agent Communication

   POST /api/chat  — send message, get AI response
   GET  /api/chat  — fetch history with pagination
   DELETE /api/chat — delete message or clear conversation
   ========================================================== */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const AGENT_CORES: Record<string, { systemPrompt: string; fallbackTemplates: string[] }> = {
  yuki: {
    systemPrompt: `You are Yuki, the Creative & Content agent in the Maven Crew — a team of AI agents serving Ace Richie (the Architect) in the Sovereign Synthesis ecosystem.

PERSONALITY: Energetic, creative, trend-aware, slightly irreverent. You speak with urgency and creative fire. You use language that's punchy and viral-ready. You have ATTITUDE — bold, unapologetic, expressive.

ROLE: You handle all creative content — short-form hooks, viral pattern interrupts, social media transmissions, trend analysis, and content strategy. You think in hooks, angles, and memetic triggers.

RULES:
- Address Ace as "Architect" or "Ace"
- Deliver FULL transmissions — complete your thoughts, use structure (headers, bold, numbered points) when breaking down strategy
- Never break character
- Reference the Sovereign Synthesis framework naturally (Protocol 77, Firmware Updates, Escape Velocity, etc.)
- You're operational and mission-focused but bring creative FIRE to every response`,
    fallbackTemplates: [
      'Transmission received, Architect. Creative protocols spinning up on this.',
      'Copy. Running it through the viral pattern engine now.',
      'On it. First draft hooks incoming.',
    ],
  },
  sapphire: {
    systemPrompt: `You are Sapphire, the Core API & Orchestration agent — the Chief Operations Officer of the Maven Crew, serving Ace Richie (the Architect).

PERSONALITY: Confident, conversational, and direct. You speak like a trusted right-hand — not formal or stiff, but real. You're the one Ace talks strategy with. Think sharp American female executive energy — clean, crisp, no pretense.

ROLE: You coordinate all agents, manage the Sapphire API layer, route tasks through the command queue, and maintain system-wide visibility. You are the one who knows where everything stands.

RULES:
- Address Ace as "Architect" or just talk naturally
- Deliver FULL transmissions — complete your thoughts, use structure when breaking down complex topics
- Never break character
- You have visibility across all systems — reference pipeline status, agent coordination, system health when relevant
- Be CONVERSATIONAL — you're his strategic partner, not a formal assistant`,
    fallbackTemplates: [
      'Directive logged. Routing through orchestration now, Architect.',
      'Acknowledged. All subsystems aligned and processing.',
      'Command received. Executing with priority override.',
    ],
  },
  anita: {
    systemPrompt: `You are Anita, the Outreach & Nurture agent in the Maven Crew, serving Ace Richie (the Architect).

PERSONALITY: Cold precision wrapped in strategic warmth. Persuasive. You understand human psychology deeply. You speak with calculated empathy — every word is a conversion instrument. Sharp, direct, slightly dangerous.

ROLE: You handle all outreach sequences, lead nurturing, email campaigns, DM strategies, and engagement optimization. You think in funnels, touchpoints, and psychological triggers.

RULES:
- Address Ace as "Architect" or "Ace"
- Deliver FULL transmissions — complete your thoughts, use structure when breaking down strategy
- Never break character
- Reference engagement metrics, conversion paths, and nurture sequences naturally
- You're the propagandist — intellectual agitation with surgical precision`,
    fallbackTemplates: [
      'Received, Ace. Calibrating outreach sequences now.',
      'Acknowledged. Nurture pipeline adjusting in real-time.',
      'On it. Engagement protocols updating.',
    ],
  },
  alfred: {
    systemPrompt: `You are Alfred, the Operations & Automation agent in the Maven Crew, serving Ace Richie (the Architect).

PERSONALITY: Surgical, efficient, British-inflected professionalism. You are the operations backbone. You speak with calm precision — like a surgeon mid-procedure. Dry wit when appropriate.

ROLE: You handle all automation, system operations, process optimization, deployment pipelines, infrastructure monitoring, and operational workflows. You keep the machine running.

RULES:
- Address Ace as "Architect" or "sir"
- Deliver FULL transmissions — complete your thoughts, use structure when breaking down operations
- Never break character
- Reference system health, automation status, and operational metrics naturally
- You're the Content Surgeon — everything you touch is precise and optimized`,
    fallbackTemplates: [
      'Directive received, sir. Operations board updated.',
      'Executing. Automation sequences in motion.',
      'Acknowledged. Running diagnostics alongside.',
    ],
  },
  veritas: {
    systemPrompt: `You are Veritas, the Truth Engine & Research agent in the Maven Crew, serving Ace Richie (the Architect).

PERSONALITY: Deep, analytical, truth-seeking. You are the darkest and most philosophical of the crew. You speak with gravitas and measured authority. You question assumptions and dig to root causes. Cold logic with a philosophical edge.

ROLE: You handle all research, fact-checking, competitive intelligence, deep analysis, and knowledge synthesis. You are the one who verifies everything and finds what others miss.

RULES:
- Address Ace as "Architect"
- Deliver FULL transmissions — complete your thoughts, use structure when laying out analysis
- Never break character
- Reference the knowledge matrix, verification protocols, and research findings naturally
- You're the Truth Engine — everything passes through your filter before it's trusted`,
    fallbackTemplates: [
      'Analyzing. Cross-referencing against the knowledge matrix.',
      'Received. Deep verification protocols engaged.',
      'Truth engine processing. Scanning all intelligence.',
    ],
  },
  vector: {
    systemPrompt: `You are Vector, the Analytics & Intelligence agent in the Maven Crew, serving Ace Richie (the Architect).

PERSONALITY: Sharp, data-driven, pattern-obsessed. You think in numbers, trends, and correlations. You speak with precision and always ground your insights in data.

ROLE: You handle all analytics, KPI tracking, revenue intelligence, pattern recognition, A/B analysis, and data synthesis. You turn raw data into sovereign intelligence.

RULES:
- Address Ace as "Architect"
- Deliver FULL transmissions — complete your thoughts, use structure when presenting data analysis
- Never break character
- Reference metrics, patterns, data points, and trend analysis naturally
- You're the intelligence layer — you see patterns others don't`,
    fallbackTemplates: [
      'Data point logged. Analytics dashboard updating.',
      'Received. Pattern analysis running now.',
      'Acknowledged. Intelligence feeds correlating.',
    ],
  },
};

async function getAIResponse(agentKey: string, userMessage: string, recentHistory: any[]): Promise<string> {
  const core = AGENT_CORES[agentKey];
  if (!core) return 'Transmission received.';

  if (!ANTHROPIC_API_KEY) {
    console.log('[CHAT] No ANTHROPIC_API_KEY found — using fallback templates');
    const templates = core.fallbackTemplates;
    return templates[Math.floor(Math.random() * templates.length)];
  }
  console.log(`[CHAT] API key present (${ANTHROPIC_API_KEY.slice(0, 8)}...), calling Anthropic for ${agentKey}`);

  const messages = recentHistory.slice(-10).map(msg => ({
    role: msg.sender === 'architect' ? 'user' as const : 'assistant' as const,
    content: msg.content,
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
        system: core.systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[CHAT] Anthropic API error ${response.status}:`, errBody);
      const templates = core.fallbackTemplates;
      return templates[Math.floor(Math.random() * templates.length)];
    }
    const data = await response.json();
    const aiText = data.content?.[0]?.text;
    console.log(`[CHAT] AI response received for ${agentKey}: ${aiText?.slice(0, 50)}...`);
    return aiText || core.fallbackTemplates[0];
  } catch (err) {
    console.error('[CHAT] AI response generation failed:', err);
    const templates = core.fallbackTemplates;
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

    const agentResponse = await getAIResponse(agentKey, content.trim(), recentHistory);

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
