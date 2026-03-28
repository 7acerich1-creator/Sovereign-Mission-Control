import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/* ══════════════════════════════════════════════════════════
   CHAT API — Direct Mission Control ↔ Agent Communication

   POST /api/chat
   Body: { agent_name: string, content: string }

   This is the Path B sovereign endpoint. Messages go directly
   to the Sapphire layer — no Telegram middleman.

   Phase 1: Stores architect message + generates placeholder
            agent response (wired to Supabase realtime).
   Phase 2: Will route to actual agent orchestration via
            Sapphire API for real AI-powered responses.
   ══════════════════════════════════════════════════════════ */

// Agent personality cores for Phase 1 responses
const AGENT_PERSONALITIES: Record<string, { tone: string; templates: string[] }> = {
  yuki: {
    tone: 'creative, energetic, trend-aware',
    templates: [
      'Transmission received. Already spinning up content threads on this.',
      'Copy that, Architect. Running this through the viral pattern engine now.',
      'On it. Expect first draft hooks within the hour.',
      'Received. Cross-referencing with current trend vectors.',
      'Acknowledged. Creative protocols engaged.',
    ],
  },
  sapphire: {
    tone: 'precise, commanding, systematic',
    templates: [
      'Directive logged. Routing through the orchestration layer now.',
      'Acknowledged, Architect. All subsystems aligned.',
      'Processing. I have full visibility on the pipeline.',
      'Command received. Executing with priority override.',
      'Confirmed. Sapphire core online and processing.',
    ],
  },
  anita: {
    tone: 'warm, strategic, persuasive',
    templates: [
      'Message received. Calibrating outreach sequences accordingly.',
      'On it, Ace. Nurture pipeline adjusting in real-time.',
      'Acknowledged. Updating engagement protocols now.',
      'Copy. Running sentiment analysis on current leads.',
      'Received. Outreach vectors are being recalibrated.',
    ],
  },
  alfred: {
    tone: 'surgical, efficient, operational',
    templates: [
      'Directive received. Operations board updated.',
      'Executing. Automation sequences are in motion.',
      'Acknowledged. Running system diagnostics alongside.',
      'Copy that. Process optimization underway.',
      'Confirmed. Operational protocols engaged.',
    ],
  },
  veritas: {
    tone: 'deep, analytical, truth-seeking',
    templates: [
      'Analyzing. Cross-referencing against the knowledge matrix.',
      'Received. Running deep verification protocols.',
      'Acknowledged. Truth engine processing your query.',
      'Directive logged. Initiating research synthesis.',
      'Processing. Scanning all available intelligence.',
    ],
  },
  vector: {
    tone: 'sharp, data-driven, intelligence-focused',
    templates: [
      'Data point logged. Updating analytics dashboard.',
      'Received. Running pattern analysis now.',
      'Acknowledged. Intelligence feeds are being correlated.',
      'Processing. Metrics engine recalibrating.',
      'Copy. Vector analysis in progress.',
    ],
  },
};

export async function POST(req: Request) {
  try {
    const { agent_name, content } = await req.json();

    if (!agent_name || !content) {
      return NextResponse.json(
        { error: 'Missing agent_name or content' },
        { status: 400 }
      );
    }

    const agentKey = agent_name.toLowerCase();

    // 1. Store the architect's message
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        agent_name: agentKey,
        sender: 'architect',
        content: content.trim(),
      });

    if (insertError) throw insertError;

    // 2. Generate agent response (Phase 1: template-based)
    //    Phase 2: This will call Sapphire API orchestration
    const personality = AGENT_PERSONALITIES[agentKey];
    let agentResponse = 'Transmission received.';

    if (personality) {
      const templates = personality.templates;
      agentResponse = templates[Math.floor(Math.random() * templates.length)];
    }

    // Small delay to make it feel like processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 3. Store agent response
    const { error: responseError } = await supabase
      .from('chat_messages')
      .insert({
        agent_name: agentKey,
        sender: 'agent',
        content: agentResponse,
      });

    if (responseError) throw responseError;

    return NextResponse.json({
      success: true,
      response: agentResponse,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/chat?agent=yuki&limit=20
// Fetch chat history for a specific agent
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agent = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!agent) {
      return NextResponse.json(
        { error: 'Missing agent parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_name', agent.toLowerCase())
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ messages: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
