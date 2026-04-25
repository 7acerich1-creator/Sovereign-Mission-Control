import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════════
   AESTHETIC PERFORMANCE API — server-side mirror

   GET /api/aesthetic-performance

   Aggregates the 3×2 (brand × aesthetic_style) grid for the
   30-video A/B/C performance test (Sentinel S113+ ship date
   2026-04-24). Same shape as AestheticPerformancePanel reads
   client-side; this route exists for external consumers
   (agents, scheduled tasks, future server components).

   Tables: niche_cooldown ⨝ youtube_analytics on youtube_video_id
   ══════════════════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const S113_CUTOFF = '2026-04-24';

type NicheRow = {
  brand: string | null;
  aesthetic_style: string | null;
  youtube_video_id: string | null;
};

type YtRow = {
  video_id: string;
  ctr: number | string | null;
  retention: number | string | null;
  views: number | null;
  engagement?: number | string | null;
};

type Cell = {
  brand: string;
  aesthetic_style: string;
  video_count: number;
  joined_count: number;
  avg_ctr: number | null;
  avg_retention: number | null;
  avg_views: number | null;
  avg_engagement: number | null;
};

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export const revalidate = 30;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }

  try {
    const { data: ncRows, error: ncErr } = await supabase
      .from('niche_cooldown')
      .select('brand,aesthetic_style,youtube_video_id')
      .not('aesthetic_style', 'is', null)
      .gte('created_at', S113_CUTOFF);
    if (ncErr) throw new Error(`niche_cooldown: ${ncErr.message}`);

    const rows = (ncRows ?? []) as NicheRow[];

    const videoIds = Array.from(
      new Set(rows.map((r) => r.youtube_video_id).filter((v): v is string => !!v)),
    );

    const ytMap = new Map<string, YtRow>();
    if (videoIds.length > 0) {
      const { data: ytRows, error: ytErr } = await supabase
        .from('youtube_analytics')
        .select('video_id,ctr,retention,views,engagement')
        .in('video_id', videoIds);
      if (ytErr) throw new Error(`youtube_analytics: ${ytErr.message}`);
      for (const r of (ytRows ?? []) as YtRow[]) ytMap.set(r.video_id, r);
    }

    const cells = new Map<string, Cell>();
    const sums = new Map<
      string,
      {
        ctr: number; ctrN: number;
        ret: number; retN: number;
        views: number; viewsN: number;
        eng: number; engN: number;
      }
    >();

    for (const row of rows) {
      const brand = (row.brand ?? '').trim();
      const style = (row.aesthetic_style ?? '').trim().toUpperCase();
      if (!brand || !style) continue;
      const key = `${brand}|${style}`;

      let cell = cells.get(key);
      if (!cell) {
        cell = {
          brand,
          aesthetic_style: style,
          video_count: 0,
          joined_count: 0,
          avg_ctr: null,
          avg_retention: null,
          avg_views: null,
          avg_engagement: null,
        };
        cells.set(key, cell);
      }
      cell.video_count += 1;

      let agg = sums.get(key);
      if (!agg) {
        agg = { ctr: 0, ctrN: 0, ret: 0, retN: 0, views: 0, viewsN: 0, eng: 0, engN: 0 };
        sums.set(key, agg);
      }

      if (row.youtube_video_id && ytMap.has(row.youtube_video_id)) {
        cell.joined_count += 1;
        const yt = ytMap.get(row.youtube_video_id)!;
        const ctr = toNum(yt.ctr);
        const ret = toNum(yt.retention);
        const views = toNum(yt.views);
        const eng = toNum(yt.engagement);
        if (ctr !== null && ctr > 0) { agg.ctr += ctr; agg.ctrN += 1; }
        if (ret !== null && ret > 0) { agg.ret += ret; agg.retN += 1; }
        if (views !== null && views > 0) { agg.views += views; agg.viewsN += 1; }
        if (eng !== null && eng > 0) { agg.eng += eng; agg.engN += 1; }
      }
    }

    for (const [key, cell] of cells) {
      const agg = sums.get(key);
      if (!agg) continue;
      cell.avg_ctr = agg.ctrN > 0 ? agg.ctr / agg.ctrN : null;
      cell.avg_retention = agg.retN > 0 ? agg.ret / agg.retN : null;
      cell.avg_views = agg.viewsN > 0 ? agg.views / agg.viewsN : null;
      cell.avg_engagement = agg.engN > 0 ? agg.eng / agg.engN : null;
    }

    return NextResponse.json({
      cutoff: S113_CUTOFF,
      total_videos: rows.length,
      cells: Array.from(cells.values()),
      analytics_scope_note:
        'youtube_analytics.retention and .ctr are 0 across rows pending YouTube Analytics OAuth re-consent with yt-analytics.readonly scope.',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    );
  }
}
