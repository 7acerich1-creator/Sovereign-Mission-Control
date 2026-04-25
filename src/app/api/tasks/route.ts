import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════════
   TASKS API — Mission Control human/ai task board

   GET  /api/tasks              — list, ordered by created_at DESC
   POST /api/tasks              — body: { title, priority?, type?, status? }
                                  defaults: priority=medium, type=human, status=todo

   Reads/writes Supabase `tasks` table in project wzthxohtgojenukmdubz.
   Schema:
     id uuid, title text, description text,
     type 'human' | 'ai',
     status 'todo' | 'in-progress' | 'done'
       (existing data may use 'To Do' / 'In Progress' / 'Complete' — normalized on read)
     priority 'low' | 'medium' | 'high',
     created_at timestamptz
   ══════════════════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type CanonicalStatus = 'todo' | 'in-progress' | 'done';
export type CanonicalPriority = 'low' | 'medium' | 'high';
export type TaskType = 'human' | 'ai';

export type CanonicalTask = {
  id: string;
  title: string;
  description: string | null;
  status: CanonicalStatus;
  status_raw: string;
  priority: CanonicalPriority;
  type: TaskType;
  created_at: string;
};

function normalizeStatus(s: string | null | undefined): CanonicalStatus {
  if (!s) return 'todo';
  const lower = s.toLowerCase().trim();
  if (lower === 'complete' || lower === 'done' || lower === 'closed') return 'done';
  if (
    lower === 'in progress' ||
    lower === 'in_progress' ||
    lower === 'in-progress' ||
    lower === 'doing'
  )
    return 'in-progress';
  return 'todo';
}

function normalizePriority(p: string | null | undefined): CanonicalPriority {
  if (!p) return 'medium';
  const lower = p.toLowerCase().trim();
  if (lower === 'high' || lower === 'urgent' || lower === '1') return 'high';
  if (lower === 'low' || lower === '4') return 'low';
  return 'medium';
}

function normalizeType(t: string | null | undefined): TaskType {
  return t === 'ai' ? 'ai' : 'human';
}

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('id,title,description,status,priority,type,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const tasks: CanonicalTask[] = rows.map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ''),
    description: (row.description as string) ?? null,
    status: normalizeStatus(row.status as string | null),
    status_raw: String(row.status ?? ''),
    priority: normalizePriority(row.priority as string | null),
    type: normalizeType(row.type as string | null),
    created_at: String(row.created_at),
  }));

  return NextResponse.json({ tasks, updated_at: new Date().toISOString() });
}

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const priority = normalizePriority(body?.priority);
    const type = normalizeType(body?.type);
    const status = normalizeStatus(body?.status);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description: typeof body?.description === 'string' ? body.description : null,
        priority,
        type,
        status,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    );
  }
}
