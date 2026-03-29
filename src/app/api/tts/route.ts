import { NextResponse } from 'next/server';

/* ══════════════════════════════════════════════════════════
   TTS API — ElevenLabs Voice Synthesis for Maven Crew

   POST /api/tts
   Body: { agent_name: string, text: string }
   Returns: audio/mpeg stream

   Each agent has a unique ElevenLabs voice ID mapped to
   their personality. Update AGENT_VOICES with your actual
   ElevenLabs voice IDs after selecting them.
   ══════════════════════════════════════════════════════════ */

// ElevenLabs pre-made voice IDs
// Browse at: https://elevenlabs.io/voice-library
// Update these with your preferred voices
const AGENT_VOICES: Record<string, { voiceId: string; stability: number; similarity: number }> = {
  yuki: {
    // Yuki — Creative & Content. Anime-inspired, blue-haired, vibrant, young energy.
    // "Lily" — raspy female narration voice. Edgy, textured, expressive.
    // Matches Yuki's punk-creative aesthetic and fiery personality.
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    stability: 0.25,       // very low = maximum expressiveness, attitude, energy
    similarity: 0.72,      // loose = dynamic, punchy, character-driven
  },
  sapphire: {
    // Sapphire — Orchestration lead. Calm authority, strategic mind, the conductor.
    // "Sarah" — soft American female. Clean, direct, conversational.
    // Perfect for the AI orchestrator who keeps everything running.
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    stability: 0.48,
    similarity: 0.85,
  },
  anita: {
    // Anita — Outreach & Nurture. Warm but sharp, professional closer.
    // "Serena" — pleasant, interactive female. Polished and engaging.
    // Matches Anita's nurture-to-close energy — warm on entry, precise on delivery.
    voiceId: 'pMsXgVXv3BLzUgSXRplE',
    stability: 0.55,       // balanced = warm but controlled
    similarity: 0.88,      // precise articulation for outreach scripts
  },
  alfred: {
    // Alfred — Ops & Automation. Reliable, military precision, the backbone.
    // "Daniel" — deep, authoritative male. Human warmth with command presence.
    // Perfect for the operations chief who keeps the machine running.
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    stability: 0.58,
    similarity: 0.85,
  },
  veritas: {
    // Veritas — Research & Truth. Ancient wisdom, deep thinker, oracle energy.
    // "Brian" — deep male narration. Rich, resonant, documentary gravitas.
    // Deeper and more atmospheric than Bill. Matches the philosopher-sage.
    voiceId: 'nPczCjzI2devNBz1zQrb',
    stability: 0.78,       // high = deliberate, measured, weighty
    similarity: 0.90,      // precise = every word lands with intent
  },
  vector: {
    // Vector — Analytics & Intel. Sharp, calculated, data-driven operative.
    // "Liam" — clean, precise male. Perfect for the numbers agent.
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    stability: 0.45,
    similarity: 0.88,
  },
};

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.elevenlabs || '';

export async function POST(req: Request) {
  try {
    const { agent_name, text } = await req.json();
    if (!agent_name || !text) {
      return NextResponse.json(
        { error: 'Missing agent_name or text' },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      console.error('[TTS] No ELEVENLABS_API_KEY found. Checked ELEVENLABS_API_KEY and elevenlabs env vars.');
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured. Add it to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    console.log(`[TTS] API key present (${ELEVENLABS_API_KEY.slice(0, 6)}...), processing for ${agent_name}`);

    const agentKey = agent_name.toLowerCase();
    const voice = AGENT_VOICES[agentKey];

    if (!voice) {
      return NextResponse.json(
        { error: `Unknown agent: ${agent_name}` },
        { status: 400 }
      );
    }

    // Call ElevenLabs TTS API
    const response = await fetch(      `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text.slice(0, 1000), // Cap at 1000 chars for cost control
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: voice.stability,
            similarity_boost: voice.similarity,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs API error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status} — ${errorText}` },
        { status: response.status }
      );
    }

    console.log(`[TTS] Audio generated successfully for ${agentKey}`);
    // Stream audio back to client
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
