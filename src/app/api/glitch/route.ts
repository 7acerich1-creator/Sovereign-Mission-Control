import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════════
   GLITCH LOG API — Autonomous Crew Glitch Reporting

   POST /api/glitch
   Body: { title, description?, severity?, source?, reported_by? }

   Allows crew agents (via Gravity Claw or Sapphire API) to
   autonomously log glitches when they detect issues in the
   funnel, system errors, or anomalies that need attention.

   GET /api/glitch
   Returns recent glitches (limit 50)
   ══════════════════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data, error } = await supabase
    .from('glitch_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ glitches: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, severity, source, reported_by } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const validSeverities = ['Critical', 'Warning', 'Info'];
    const glitchSeverity = validSeverities.includes(severity) ? severity : 'Warning';

    const { data, error } = await supabase
      .from('glitch_log')
      .insert({
        title: title.trim(),
        description: (description || '').trim(),
        severity: glitchSeverity,
        source: source || (reported_by ? `CREW :: ${reported_by.toUpperCase()}` : 'CREW FLAGGED'),
        resolved: false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, glitch: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
