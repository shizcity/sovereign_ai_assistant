import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Sparkles, Zap, MessageSquare, Star, ChevronRight } from "lucide-react";
import { Link } from "wouter";

// Curated sample responses that capture each Sentinel's distinct voice
const SAMPLE_RESPONSES: Record<string, { prompt: string; response: string }> = {
  "aetheris-flow": {
    prompt: "I'm struggling to adapt to a big change at work.",
    response:
      "Change has its own rhythm — and right now you're in the dissonant part before the melody resolves. Let's not rush past that. What feels most destabilising: the uncertainty of what's ahead, or the grief for what you're leaving behind? Both are valid, and both point to where we need to flow first.",
  },
  "rift-exe": {
    prompt: "My project feels stuck and conventional.",
    response:
      "Conventional is just another word for 'hasn't been broken yet.' Let's break it. Tell me the one assumption everyone on your team treats as sacred — the thing nobody questions. That's exactly where I want to start. The most radical solutions are always hiding inside the most obvious constraints.",
  },
  nyx: {
    prompt: "I keep self-sabotaging. Why?",
    response:
      "The part of you that sabotages isn't your enemy — it's a guardian that learned to protect you from something painful, long before you had better tools. The question isn't 'why do I do this?' It's 'what is this protecting me from?' Sit with that. The answer lives in the discomfort you've been avoiding.",
  },
};

// "When to use" blurbs per Sentinel
const WHEN_TO_USE: Record<string, string> = {
  "aetheris-flow":
    "Navigating career transitions, creative blocks, emotional turbulence, or any moment where you need to move fluidly rather than force your way through.",
  "rift-exe":
    "Breaking out of stagnant thinking, challenging assumptions, exploring radical alternatives, or when you need someone to tell you the uncomfortable truth.",
  nyx: "Deep introspection, shadow work, understanding recurring patterns, healing old wounds, or personal transformation that requires going inward.",
};

type SentinelPreviewData = {
  id: number;
  slug: string;
  name: string;
  archetype: string;
  primaryFunction: string;
  symbolEmoji: string;
  primaryColor: string;
  personalityTraits: string[];
  specialties: string[];
};

type Props = {
  sentinel: SentinelPreviewData | null;
  open: boolean;
  onClose: () => void;
  /** If true, user is on a paid tier — show "Start Chat" instead of upgrade CTA */
  isPro: boolean;
  onUpgrade: () => void;
};

export function SentinelPreviewModal({ sentinel, open, onClose, isPro, onUpgrade }: Props) {
  if (!sentinel) return null;

  const sample = SAMPLE_RESPONSES[sentinel.slug];
  const whenToUse = WHEN_TO_USE[sentinel.slug];
  const color = sentinel.primaryColor;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 p-0"
        style={{
          background: `linear-gradient(160deg, #0f0f1a 0%, ${color}18 50%, #0f0f1a 100%)`,
          boxShadow: `0 0 60px ${color}30, 0 25px 50px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Header band */}
        <div
          className="relative px-8 pt-8 pb-6"
          style={{
            borderBottom: `1px solid ${color}30`,
          }}
        >
          {/* Lock badge */}
          {!isPro && (
            <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
              <Lock className="w-3 h-3" />
              Pro Only
            </div>
          )}

          <DialogHeader>
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${color}50, ${color}25)`,
                  boxShadow: `0 0 30px ${color}40`,
                }}
              >
                {sentinel.symbolEmoji}
              </div>

              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  {sentinel.name}
                </DialogTitle>
                <p className="text-sm font-medium" style={{ color }}>
                  {sentinel.archetype}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sentinel.personalityTraits.map((trait, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs bg-white/10 text-white/80 border-white/15"
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          {/* Primary function */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color }}>
              What I Do
            </h3>
            <p className="text-white/80 leading-relaxed">{sentinel.primaryFunction}</p>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color }}>
              Specialties
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sentinel.specialties.map((spec, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/75"
                  style={{ background: `${color}12`, border: `1px solid ${color}20` }}
                >
                  <Star className="w-3 h-3 flex-shrink-0" style={{ color }} />
                  {spec}
                </div>
              ))}
            </div>
          </div>

          {/* When to use */}
          {whenToUse && (
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color }}>
                Best Used For
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">{whenToUse}</p>
            </div>
          )}

          {/* Sample conversation */}
          {sample && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mb-3" style={{ color }}>
                <MessageSquare className="w-3.5 h-3.5" />
                Sample Response
              </h3>

              {/* User message */}
              <div className="flex justify-end mb-2">
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-white/10 text-white/80 text-sm">
                  {sample.prompt}
                </div>
              </div>

              {/* Sentinel response */}
              <div className="flex justify-start">
                <div
                  className="max-w-[88%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-white/90 leading-relaxed"
                  style={{
                    background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{sentinel.symbolEmoji}</span>
                    <span className="text-xs font-semibold" style={{ color }}>
                      {sentinel.name}
                    </span>
                  </div>
                  <p className="italic">{sample.response}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className="px-8 py-6"
          style={{ borderTop: `1px solid ${color}20` }}
        >
          {isPro ? (
            <Link href="/chat">
              <Button
                className="w-full font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                  boxShadow: `0 4px 20px ${color}40`,
                }}
                onClick={onClose}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Chatting with {sentinel.name}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full font-semibold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 shadow-lg"
                onClick={() => {
                  onClose();
                  onUpgrade();
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock {sentinel.name} — Upgrade to Pro
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-center text-xs text-white/40">
                $19/month · All 6 Sentinels · Unlimited messages · Voice features
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
