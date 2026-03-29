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
    voiceId: 'EXAVITQu4vr4xnSDxMaL',  // "Sarah" — youthful, energetic female
    stability: 0.35,
    similarity: 0.80,
  },
  sapphire: {
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',  // "Lily" — authoritative, polished female
    stability: 0.55,
    similarity: 0.85,
  },  anita: {
    voiceId: 'XB0fDUnXU5powFXDhCwa',  // "Charlotte" — warm, strategic female
    stability: 0.50,
    similarity: 0.80,
  },
  alfred: {
    voiceId: 'onwK4e9ZLuTAKqWW03F9',  // "Daniel" — British, surgical male
    stability: 0.60,
    similarity: 0.85,
  },
  veritas: {
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',  // "Callum" — deep, analytical male
    stability: 0.70,
    similarity: 0.80,
  },
  vector: {
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',  // "Liam" — sharp, data-driven male
    stability: 0.50,
    similarity: 0.85,
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
