import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════════
   FUNNEL SNAPSHOT API — Hero Band Data Source

   GET /api/funnel-snapshot

   Returns the bottom-line "are we moving toward $1.2M" view:
     - YT views combined (this/last week)
     - Landing visitors (this/last week, target 500/wk)
     - Email signups via `initiates` (this/last week, target 50/wk)
     - Paid conversions via `revenue_log` (this/last week, target 1/wk)

   Reads from Supabase project wzthxohtgojenukmdubz.
   Tables: landing_analytics, initiates, youtube_analytics, revenue_log
   ══════════════════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 30;

type WindowedNumber = {
  this_wk: number;
  last_wk: number;
};

function pctDelta(thisWk: number, lastWk: number): number | null {
  if (lastWk <= 0) return thisWk > 0 ? 100 : null;
  return ((thisWk - lastWk) / lastWk) * 100;
}

async function sumColumn(
  table: string,
  column: string,
  fetchedAtCol: string,
): Promise<WindowedNumber> {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  // This week: rows from now-7d to now
  const { data: thisWkRows, error: e1 } = await supabase
    .from(table)
    .select(column)
    .gte(fetchedAtCol, sevenDaysAgo);
  if (e1) throw new Error(`${table} this_wk: ${e1.message}`);

  // Last week: rows from now-14d to now-7d
  const { data: lastWkRows, error: e2 } = await supabase
    .from(table)
    .select(column)
    .gte(fetchedAtCol, fourteenDaysAgo)
    .lt(fetchedAtCol, sevenDaysAgo);
  if (e2) throw new Error(`${table} last_wk: ${e2.message}`);

  const sum = (rows: Record<string, unknown>[] | null) => {
    if (!rows) return 0;
    let total = 0;
    for (const r of rows) {
      const v = r[column];
      if (typeof v === 'number') total += v;
      else if (typeof v === 'string') {
        const n = parseFloat(v);
        if (Number.isFinite(n)) total += n;
      }
    }
    return total;
  };

  return {
    this_wk: sum(thisWkRows as unknown as Record<string, unknown>[]),
    last_wk: sum(lastWkRows as unknown as Record<string, unknown>[]),
  };
}

async function countRows(
  table: string,
  createdAtCol: string,
): Promise<WindowedNumber> {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { count: thisWk, error: e1 } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .gte(createdAtCol, sevenDaysAgo);
  if (e1) throw new Error(`${table} this_wk: ${e1.message}`);

  const { count: lastWk, error: e2 } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .gte(createdAtCol, fourteenDaysAgo)
    .lt(createdAtCol, sevenDaysAgo);
  if (e2) throw new Error(`${table} last_wk: ${e2.message}`);

  return { this_wk: thisWk ?? 0, last_wk: lastWk ?? 0 };
}

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase env vars missing' },
      { status: 500 },
    );
  }

  try {
    const [landing, signups, ytViews, conversions] = await Promise.all([
      sumColumn('landing_analytics', 'visitors', 'fetched_at').catch((e) => {
        console.error('[funnel-snapshot] landing fail:', e);
        return { this_wk: 0, last_wk: 0 };
      }),
      countRows('initiates', 'created_at').catch((e) => {
        console.error('[funnel-snapshot] signups fail:', e);
        return { this_wk: 0, last_wk: 0 };
      }),
      sumColumn('youtube_analytics', 'views', 'fetched_at').catch((e) => {
        console.error('[funnel-snapshot] yt fail:', e);
        return { this_wk: 0, last_wk: 0 };
      }),
      countRows('revenue_log', 'created_at').catch((e) => {
        console.error('[funnel-snapshot] revenue fail:', e);
        return { this_wk: 0, last_wk: 0 };
      }),
    ]);

    const targets = {
      yt_views: 10000,
      landing: 500,
      signups: 50,
      conversions: 1,
    };

    return NextResponse.json({
      updated_at: new Date().toISOString(),
      headline: {
        landing_this_wk: landing.this_wk,
        target: targets.landing,
        progress_pct: Math.min(100, (landing.this_wk / targets.landing) * 100),
      },
      metrics: [
        {
          key: 'yt_views',
          label: 'Top-of-funnel attention (YT views combined)',
          this_wk: ytViews.this_wk,
          last_wk: ytViews.last_wk,
          target: targets.yt_views,
          delta_pct: pctDelta(ytViews.this_wk, ytViews.last_wk),
        },
        {
          key: 'landing',
          label: 'Landing visitors',
          this_wk: landing.this_wk,
          last_wk: landing.last_wk,
          target: targets.landing,
          delta_pct: pctDelta(landing.this_wk, landing.last_wk),
        },
        {
          key: 'signups',
          label: 'Email signups (initiates)',
          this_wk: signups.this_wk,
          last_wk: signups.last_wk,
          target: targets.signups,
          delta_pct: pctDelta(signups.this_wk, signups.last_wk),
        },
        {
          key: 'conversions',
          label: 'Paid conversions (Stripe)',
          this_wk: conversions.this_wk,
          last_wk: conversions.last_wk,
          target: targets.conversions,
          delta_pct: pctDelta(conversions.this_wk, conversions.last_wk),
        },
      ],
    });
  } catch (err) {
    console.error('[funnel-snapshot] fatal:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    );
  }
}
