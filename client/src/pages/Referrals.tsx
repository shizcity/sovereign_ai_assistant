import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Gift,
  Copy,
  Check,
  Users,
  Zap,
  ArrowLeft,
  Star,
  Trophy,
  ChevronRight,
  Share2,
  Medal,
  Crown,
  Twitter,
} from "lucide-react";

export default function Referrals() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [copied, setCopied] = useState(false);
  const [rankCopied, setRankCopied] = useState(false);

  const { data: linkData, isLoading: linkLoading } = trpc.referral.getMyLink.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: stats, isLoading: statsLoading } = trpc.referral.getStats.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: leaderboard, isLoading: lbLoading } = trpc.referral.getLeaderboard.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Derive the current user's rank & invite count from leaderboard data
  const myEntry = leaderboard?.entries.find((e) => e.isCurrentUser)
    ?? leaderboard?.currentUserRank
    ?? null;

  const buildShareText = () => {
    if (!myEntry || !linkData) return "";
    const rank = myEntry.rank;
    const invites = myEntry.referralCount;
    const code = linkData.code ?? "";
    const url = code ? `glow.manus.space?ref=${code}` : "glow.manus.space";
    return `I'm #${rank} on the Glow leaderboard with ${invites} ${invites === 1 ? "invite" : "invites"} 🏆 ${url}`;
  };

  const handleCopy = async () => {
    if (!linkData?.link) return;
    await navigator.clipboard.writeText(linkData.link);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!linkData?.link) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join me on Glow",
        text: `I've been using Glow — an AI assistant with multiple Sentinels that think differently. Join with my link and get ${linkData.refereeXp} bonus XP!`,
        url: linkData.link,
      });
    } else {
      handleCopy();
    }
  };

  const handleShareRankCopy = async () => {
    const text = buildShareText();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setRankCopied(true);
    toast.success("Share text copied to clipboard!");
    setTimeout(() => setRankCopied(false), 2500);
  };

  const handleShareRankTweet = () => {
    const text = buildShareText();
    if (!text) return;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 py-4 flex items-center gap-4">
        <Link href="/chat">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Chat
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-semibold">Invite & Earn</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 mb-2">
            <Gift className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Invite Friends, Earn XP
          </h2>
          <p className="text-white/55 max-w-md mx-auto">
            Share your unique invite link. When a friend signs up, you both earn bonus XP — turning your network into a growth engine.
          </p>
        </div>

        {/* XP reward cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">You earn</span>
            </div>
            <p className="text-4xl font-bold text-cyan-300">
              +{linkData?.referrerXp ?? 250}
            </p>
            <p className="text-sm text-white/50">XP per successful invite</p>
          </div>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-indigo-400 mb-2">
              <Star className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Friend earns</span>
            </div>
            <p className="text-4xl font-bold text-indigo-300">
              +{linkData?.refereeXp ?? 100}
            </p>
            <p className="text-sm text-white/50">XP welcome bonus</p>
          </div>
        </div>

        {/* Invite link card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <Share2 className="w-4 h-4" />
            Your unique invite link
          </div>

          {linkLoading ? (
            <div className="h-12 rounded-lg bg-white/5 animate-pulse" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-4 py-3 rounded-lg bg-black/40 border border-white/10 font-mono text-sm text-cyan-300 truncate">
                {linkData?.link}
              </div>
              <Button
                onClick={handleCopy}
                size="sm"
                className={`flex-shrink-0 h-11 px-4 transition-all ${
                  copied
                    ? "bg-green-600 hover:bg-green-600 text-white"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white"
                }`}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 border-white/10 text-white/70 hover:text-white hover:border-white/20"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <Users className="w-4 h-4" />
              Your referral stats
            </div>
            <Link href="/achievements">
              <span className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer">
                View achievements <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {statsLoading ? (
            <div className="space-y-3">
              <div className="h-8 rounded bg-white/5 animate-pulse" />
              <div className="h-8 rounded bg-white/5 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-black/30 border border-white/8">
                  <p className="text-3xl font-bold text-white">{stats?.totalInvited ?? 0}</p>
                  <p className="text-xs text-white/45 mt-1">Friends invited</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-black/30 border border-white/8">
                  <p className="text-3xl font-bold text-cyan-400">+{stats?.totalXpEarned ?? 0}</p>
                  <p className="text-xs text-white/45 mt-1">XP earned from referrals</p>
                </div>
              </div>

              {stats && stats.referees.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Recent invites</p>
                  {stats.referees.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 flex items-center justify-center text-xs font-bold text-cyan-300">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-white/70">{r.name}</span>
                      </div>
                      <span className="text-xs text-cyan-400 font-medium">+{r.xpAwarded} XP</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-white/30 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No invites claimed yet — share your link to get started!
                </div>
              )}
            </>
          )}
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white/80">Top Inviters</span>
            <span className="text-xs text-white/30 ml-auto">Global leaderboard</span>
          </div>

          {lbLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : !leaderboard || leaderboard.entries.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No referrals yet — be the first on the board!
            </div>
          ) : (
            <div className="space-y-1">
              {leaderboard.entries.map((entry) => {
                const rankColors = [
                  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
                  "text-slate-300 bg-slate-500/10 border-slate-500/20",
                  "text-amber-600 bg-amber-700/10 border-amber-700/20",
                ];
                const rankStyle = rankColors[entry.rank - 1] ?? "text-white/40 bg-white/5 border-white/8";
                const isMe = entry.isCurrentUser;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      isMe
                        ? "bg-cyan-950/40 border-cyan-500/30 ring-1 ring-cyan-500/20"
                        : "bg-white/3 border-white/6 hover:bg-white/5"
                    }`}
                  >
                    {/* Rank badge */}
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankStyle}`}>
                      {entry.rank <= 3 ? (
                        entry.rank === 1 ? <Crown className="w-3.5 h-3.5" /> :
                        entry.rank === 2 ? <Medal className="w-3.5 h-3.5" /> :
                        <Star className="w-3.5 h-3.5" />
                      ) : (
                        entry.rank
                      )}
                    </div>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isMe ? "bg-cyan-500/30 text-cyan-300" : "bg-white/10 text-white/60"
                    }`}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isMe ? "text-cyan-300" : "text-white/80"
                      }`}>
                        {isMe ? `${entry.name} (you)` : entry.name}
                      </p>
                    </div>
                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white">{entry.referralCount}</p>
                      <p className="text-xs text-white/35">{entry.referralCount === 1 ? "invite" : "invites"}</p>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[56px]">
                      <p className="text-xs font-medium text-cyan-400">+{entry.totalXp}</p>
                      <p className="text-xs text-white/25">XP</p>
                    </div>
                  </div>
                );
              })}

              {/* Current user rank if outside top 10 */}
              {leaderboard.currentUserRank && (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-xs text-white/25">your position</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-cyan-950/40 border-cyan-500/30 ring-1 ring-cyan-500/20">
                    <div className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-xs font-bold text-white/40 flex-shrink-0">
                      #{leaderboard.currentUserRank.rank}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-cyan-500/30 flex items-center justify-center text-sm font-bold text-cyan-300 flex-shrink-0">
                      {user?.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cyan-300 truncate">{user?.name} (you)</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white">{leaderboard.currentUserRank.referralCount}</p>
                      <p className="text-xs text-white/35">invites</p>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[56px]">
                      <p className="text-xs font-medium text-cyan-400">+{leaderboard.currentUserRank.totalXp}</p>
                      <p className="text-xs text-white/25">XP</p>
                    </div>
                  </div>
                </>
              )}

              {/* Share my rank card — shown whenever the user has a rank (top 10 or outside) */}
              {myEntry && linkData && (
                <div className="mt-4 rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 to-amber-950/20 p-4 space-y-3">
                  {/* Preview text */}
                  <div className="flex items-start gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/70 leading-relaxed font-mono break-all">
                      {buildShareText()}
                    </p>
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleShareRankCopy}
                      variant="outline"
                      size="sm"
                      className={`flex-1 border-yellow-500/25 text-yellow-300/80 hover:text-yellow-200 hover:border-yellow-500/40 transition-all ${
                        rankCopied ? "bg-green-900/30 border-green-500/30 text-green-300" : ""
                      }`}
                    >
                      {rankCopied ? (
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {rankCopied ? "Copied!" : "Copy text"}
                    </Button>
                    <Button
                      onClick={handleShareRankTweet}
                      size="sm"
                      className="flex-1 bg-[#1d9bf0]/20 hover:bg-[#1d9bf0]/30 border border-[#1d9bf0]/30 hover:border-[#1d9bf0]/50 text-[#1d9bf0] transition-all"
                    >
                      <Twitter className="w-3.5 h-3.5 mr-1.5" />
                      Post on X
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
          <p className="text-sm font-medium text-white/60 uppercase tracking-wider">How it works</p>
          <div className="space-y-3">
            {[
              { step: "1", text: "Copy your unique invite link above" },
              { step: "2", text: "Share it with friends via any channel" },
              { step: "3", text: "When they sign up, you both earn XP instantly" },
              { step: "4", text: "XP counts toward your level and achievements" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">
                  {step}
                </div>
                <p className="text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
