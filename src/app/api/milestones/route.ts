import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════════
   CHANNEL MILESTONES API — server-side mirror

   GET /api/milestones

   Reads `channel_milestones` (Sentinel S117 ship 2026-04-25):
   per-channel milestone ladder with parent tiers + sub-milestones.
   Sentinel-side milestone-sync cron updates current_value every 6h
   from YouTube Data API + YT Analytics + initiates table.

   MC reads only — Sentinel owns the writes.

   Per the S117 spec: only `status='active'` rows. Future tiers
   and future sub-milestones are deliberately hidden.
   ══════════════════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type MilestoneRow = {
  id: string;
  channel: 'sovereign_synthesis' | 'containment_field';
  tier: number;
  parent_id: string | null;
  name: string;
  description: string | null;
  target_metric: string;
  target_value: number;
  current_value: number;
  status: 'active';
  display_order: number;
};

// 60s cache — Sentinel cron only writes every 6h, so 60s is plenty.
export const revalidate = 60;

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('channel_milestones')
      .select(
        'id,channel,tier,parent_id,name,description,target_metric,target_value,current_value,status,display_order',
      )
      .eq('status', 'active')
      .order('channel', { ascending: true })
      .order('tier', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw new Error(`channel_milestones: ${error.message}`);

    const rows: MilestoneRow[] = (data ?? []).map((r) => ({
      id: r.id as string,
      channel: r.channel as MilestoneRow['channel'],
      tier: typeof r.tier === 'number' ? r.tier : parseInt(String(r.tier), 10) || 0,
      parent_id: (r.parent_id as string | null) ?? null,
      name: (r.name as string) ?? '',
      description: (r.description as string | null) ?? null,
      target_metric: (r.target_metric as string) ?? '',
      target_value: toNum(r.target_value as number | string | null),
      current_value: toNum(r.current_value as number | string | null),
      status: 'active',
      display_order:
        typeof r.display_order === 'number'
          ? r.display_order
          : parseInt(String(r.display_order), 10) || 0,
    }));

    return NextResponse.json({
      rows,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    );
  }
}
