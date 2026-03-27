"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Target, Rocket, Zap, ChevronRight, Lock } from 'lucide-react';

const TIER_MAP = {
  'Initiate': {
    priceId: 'price_1R4m0wRNyK9VQwlaY7H7p7h7',
    cost: '$77',
    description: 'Entry-level frequency alignment. Protocol 77 Access.'
  },
  'Agent': {
    priceId: 'price_1R4m1URNyK9VQwlakOkOkO00',
    cost: '$477',
    description: 'Advanced Declassification. Active deployment tools.'
  },
  'Architect': {
    priceId: 'price_1R4m2XRNyK9VQwlarTrTrT99',
    cost: '$3,777',
    description: 'Full Sovereign Synthesis. Reality Architecture Manifesto.'
  }
};

export default function OnboardingIntake() {
  const [email, setEmail] = useState("");
  const [selectedTier, setSelectedTier] = useState<keyof typeof TIER_MAP | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [glitchDetected, setGlitchDetected] = useState(false);

  async function handleIntake() {
    if (!email || !selectedTier) return;
    setIsLoading(true);
    
    try {
      // 1. Log the attempt to Supabase
      const { error: intakeError } = await supabase
        .from('activity_log')
        .insert([{
          event_type: 'INTAKE_ATTEMPT',
          description: `New initiate [${email}] attempting alignment for [${selectedTier}] tier.`,
          status: 'success'
        }]);

      if (intakeError) throw intakeError;

      // 2. Redirect to Stripe Checkout Edge Function
      // Note: This logic assumes the 'stripe-checkout' Edge Function is deployed.
      const { data, error: checkoutError } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          email, 
          priceId: TIER_MAP[selectedTier].priceId,
          tier: selectedTier
        }
      });

      if (checkoutError) throw checkoutError;
      if (data?.url) window.location.href = data.url;

    } catch (err) {
      console.error('Intake Glitch:', err);
      setGlitchDetected(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
      <div className="glow-orb glow-gold" style={{ top: '-10%', left: '10%' }} />
      <div className="glow-orb glow-violet" style={{ bottom: '-10%', right: '10%' }} />

      <main className="max-w-4xl mx-auto px-6 py-24 relative z-10">
        <header className="text-center mb-20 fade-in">
          <div className="inline-block px-4 py-2 border border-gold/30 rounded-full text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-8">
            TRANSMISSION SECURED :: PROTOCOL 77
          </div>
          <h1 className="text-6xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            DECODE YOUR REALITY
          </h1>
          <p className="text-secondary text-lg max-w-xl mx-auto font-medium">
            The simulation is optional. Sovereign Synthesis is the tool for those ready to intentionally architect their financial and behavioral frequency.
          </p>
        </header>

        <section className="card bg-surface-base/30 backdrop-blur-2xl border border-white/5 p-12 rounded-[40px] shadow-2xl fade-in stagger-1">
          <div className="space-y-12">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-4">IDENTIFICATION VECTOR</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER SECURE EMAIL..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 font-mono text-xl focus:border-gold outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-6">SELECT PERSISTENCE TIER</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(TIER_MAP) as Array<keyof typeof TIER_MAP>).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`text-left p-6 rounded-3xl border transition-all relative overflow-hidden group ${
                      selectedTier === tier 
                        ? 'border-gold bg-gold/5 shadow-[0_0_30px_rgba(201,168,76,0.15)]' 
                        : 'border-white/5 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="relative z-10">
                      <div className={`mb-4 w-10 h-10 rounded-lg flex items-center justify-center border ${
                        selectedTier === tier ? 'border-gold text-gold' : 'border-white/10 text-white/40'
                      }`}>
                        {tier === 'Initiate' ? <Zap size={20} /> : tier === 'Agent' ? <Shield size={20} /> : <Target size={20} />}
                      </div>
                      <h3 className="font-black text-xl mb-1">{tier.toUpperCase()}</h3>
                      <p className="text-secondary text-xs mb-4 leading-relaxed font-medium">{TIER_MAP[tier].description}</p>
                      <span className="font-black text-lg text-gold">{TIER_MAP[tier].cost}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleIntake}
              disabled={isLoading || !email || !selectedTier}
              className={`w-full p-8 rounded-3xl font-black text-2xl tracking-tighter flex items-center justify-center gap-4 transition-all duration-700 ${
                isLoading || !email || !selectedTier 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-gold text-black hover:scale-[1.02] active:scale-95 shadow-[0_20px_60px_rgba(201,168,76,0.4)]'
              }`}
            >
              {isLoading ? (
                <>SYNTHESIZING... <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /></>
              ) : (
                <>INITIATE ALIGNMENT <ChevronRight size={24} /></>
              )}
            </button>

            {glitchDetected && (
              <div className="p-6 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-4 animate-shake">
                <Lock className="text-danger" size={24} />
                <p className="text-danger text-sm font-bold tracking-tight">GLITCH DETECTED :: CONTACT COMMAND CENTER OR CHECK NETWORK FREQUENCY.</p>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-16 text-center opacity-30">
          <p className="text-xs font-mono tracking-widest">:: SOVEREIGN SYNTHESIS ENCRYPTION v2.0 ::</p>
        </footer>
      </main>

      <style jsx>{`
        .bg-surface-base { background-color: #0A0A0F; }
        .text-secondary { color: rgba(255,255,255,0.6); }
        .bg-gold { background-color: #C9A84C; }
        .text-gold { color: #C9A84C; }
        .border-gold { border-color: #C9A84C; }
        .text-danger { color: #FF4D4D; }
        .bg-danger { background-color: #FF4D4D; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
