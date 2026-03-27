import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || 'https://hook.us2.make.com/leksfv66mebrys6lz9kklpgos7sp3lii';
const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || 'https://gravity-claw-production-d849.up.railway.app/api/notify';

export async function POST(req: Request) {
  try {
    const { id, payload } = await req.json();

    if (!id) return NextResponse.json({ error: 'Missing payload ID' }, { status: 400 });

    // 1. Update Supabase record status to "Released"
    const { error } = await supabase
      .from('agent_payloads')
      .update({ status: 'Released', released_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // 2. Send payload to Make.com webhook pipeline
    await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Make Webhook Error:', err));

    // 3. Send Heartbeat to Antigravity Telegram Bot
    await fetch(BOT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'reality_override_live',
        message: 'Ace, the Reality Override is live'
      })
    }).catch(err => console.error('Bot Webhook Error:', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
