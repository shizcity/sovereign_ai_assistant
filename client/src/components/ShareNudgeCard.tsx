import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Copy, Check, Share2, Twitter } from "lucide-react";

interface ShareNudgeCardProps {
  /** Called when the user dismisses the card */
  onDismiss: () => void;
  /** The URL to share — defaults to the current page origin */
  shareUrl?: string;
}

const SHARE_TEXT =
  "Just upgraded to Glow Pro 🚀 — command a whole team of specialized AI Sentinels that think differently and debate perspectives. Check it out:";

export function ShareNudgeCard({ onDismiss, shareUrl }: ShareNudgeCardProps) {
  const [copied, setCopied] = useState(false);

  const url = shareUrl ?? window.location.origin;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      SHARE_TEXT
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 fade-in duration-500"
      role="dialog"
      aria-label="Share Glow with a friend"
    >
      {/* Card */}
      <div
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(30,10,60,0.97) 0%, rgba(45,16,96,0.97) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
          boxShadow:
            "0 8px 32px rgba(139,92,246,0.25), 0 2px 8px rgba(0,0,0,0.5)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Subtle mesh gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 80% 20%, #ec4899 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #8b5cf6 0%, transparent 60%)",
          }}
        />

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Content */}
        <div className="relative space-y-3.5">
          {/* Header */}
          <div className="flex items-start gap-3 pr-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                boxShadow: "0 4px 12px rgba(139,92,246,0.4)",
              }}
            >
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm leading-snug">
                Loving Glow? Share it!
              </p>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Help a friend discover their perfect AI Sentinel team.
              </p>
            </div>
          </div>

          {/* URL display */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 truncate"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="truncate flex-1">{url}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Copy link */}
            <Button
              onClick={handleCopy}
              size="sm"
              className="flex-1 h-8 text-xs font-semibold transition-all active:scale-95"
              style={
                copied
                  ? {
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                    }
                  : {
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                    }
              }
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Link
                </>
              )}
            </Button>

            {/* Twitter/X share */}
            <Button
              onClick={handleTwitterShare}
              size="sm"
              className="flex-1 h-8 text-xs font-semibold text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #1d9bf0, #0d7bc4)",
                boxShadow: "0 4px 12px rgba(29,155,240,0.3)",
              }}
            >
              <Twitter className="w-3.5 h-3.5 mr-1.5" />
              Share on X
            </Button>
          </div>

          {/* Subtle dismiss link */}
          <button
            onClick={onDismiss}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
