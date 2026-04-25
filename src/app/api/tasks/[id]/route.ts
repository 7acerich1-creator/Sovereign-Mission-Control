import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════════
   PATCH /api/tasks/[id]
   Body: { status?, priority?, title?, description? }
   Updates a single row in Supabase `tasks`.
   ══════════════════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_STATUS = new Set(['todo', 'in-progress', 'done']);
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high']);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.status === 'string') {
    const s = body.status.toLowerCase();
    if (!ALLOWED_STATUS.has(s)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    update.status = s;
  }
  if (typeof body.priority === 'string') {
    const p = body.priority.toLowerCase();
    if (!ALLOWED_PRIORITY.has(p)) {
      return NextResponse.json({ error: 'invalid priority' }, { status: 400 });
    }
    update.priority = p;
  }
  if (typeof body.title === 'string') update.title = body.title.trim();
  if (typeof body.description === 'string') update.description = body.description;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data });
}
