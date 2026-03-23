import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Pencil, Eye, Brain, Mic, LayoutTemplate, Users, TrendingUp } from "lucide-react";

// ─── Changelog ────────────────────────────────────────────────────────────────
// Bump CURRENT_VERSION whenever you ship a new release that should trigger the
// modal for all users. Add a new entry at the TOP of CHANGELOG_ENTRIES.
// ──────────────────────────────────────────────────────────────────────────────
export const CURRENT_VERSION = "2025.03";

export type ChangelogEntry = {
  icon: React.ReactNode;
  label: "New" | "Improved" | "Fix";
  title: string;
  description: string;
  color: string;
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    icon: <Eye className="w-5 h-5" />,
    label: "New",
    title: "Sentinel Preview Modal",
    description:
      "Curious about a locked Pro Sentinel? Click any locked card on the Sentinels page to preview their personality, specialties, and a sample conversation before upgrading.",
    color: "#8b5cf6",
  },
  {
    icon: <Pencil className="w-5 h-5" />,
    label: "New",
    title: "Inline Conversation Renaming",
    description:
      "Double-click any conversation title in the sidebar — or hover and click the pencil icon — to rename it on the spot. Press Enter to save or Escape to cancel.",
    color: "#06b6d4",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Improved",
    title: "Conversation Search & Date Grouping",
    description:
      "The chat sidebar now groups conversations by Today, Yesterday, and Earlier, and a search bar lets you filter by keyword instantly.",
    color: "#10b981",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    label: "New",
    title: "Smart Memory Suggestions",
    description:
      "Glow now surfaces memory suggestions during your conversations — key insights, decisions, and patterns worth remembering — so your Sentinels keep getting smarter over time.",
    color: "#f59e0b",
  },
  {
    icon: <Mic className="w-5 h-5" />,
    label: "New",
    title: "Voice-First Experience",
    description:
      "Speak directly to your Sentinels using the microphone button. Supports manual push-to-talk, continuous listening mode, and wake-phrase activation.",
    color: "#ec4899",
  },
];

// ─── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = "glow_whats_new_seen";

export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function markVersionSeen(version: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // ignore storage errors (private browsing, quota exceeded)
  }
}

export function shouldShowWhatsNew(): boolean {
  return getLastSeenVersion() !== CURRENT_VERSION;
}

// ─── Component ────────────────────────────────────────────────────────────────
const LABEL_STYLES: Record<ChangelogEntry["label"], string> = {
  New: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Improved: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Fix: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WhatsNewModal({ open, onClose }: Props) {
  const handleDismiss = () => {
    markVersionSeen(CURRENT_VERSION);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleDismiss()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto border-0 p-0"
        style={{
          background: "linear-gradient(160deg, #0d0d1a 0%, #1a0d2e 50%, #0d0d1a 100%)",
          boxShadow: "0 0 80px rgba(139,92,246,0.25), 0 25px 50px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                  boxShadow: "0 0 20px rgba(139,92,246,0.5)",
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white leading-tight">
                  What's New in Glow
                </DialogTitle>
                <p className="text-xs text-white/40 mt-0.5">Release {CURRENT_VERSION}</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Feature list */}
        <div className="px-7 py-5 space-y-4">
          {CHANGELOG_ENTRIES.map((entry, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-xl transition-colors"
              style={{
                background: `${entry.color}0d`,
                border: `1px solid ${entry.color}22`,
              }}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                style={{
                  background: `${entry.color}22`,
                  color: entry.color,
                }}
              >
                {entry.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{entry.title}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 font-semibold border ${LABEL_STYLES[entry.label]}`}
                  >
                    {entry.label}
                  </Badge>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{entry.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-7 py-5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}
        >
          <p className="text-xs text-white/30">More updates coming soon ✦</p>
          <Button
            onClick={handleDismiss}
            className="font-semibold text-white px-6"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              boxShadow: "0 4px 15px rgba(139,92,246,0.4)",
            }}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
