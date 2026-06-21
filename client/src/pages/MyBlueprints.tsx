import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  CheckCircle2,
  Eye,
  Calendar,
  Code2,
  Trash2,
  Globe,
  Lock,
  Share2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const FRAMEWORK_COLORS: Record<string, string> = {
  crewai: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "openai-agents": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  langchain: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  autogen: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  n8n: "bg-red-500/20 text-red-300 border-red-500/30",
  custom: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

export default function MyBlueprints() {
  const { user } = useAuth();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: blueprints = [], isLoading, refetch } = trpc.blueprints.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteMutation = trpc.blueprints.delete.useMutation({
    onSuccess: () => {
      toast.success("Blueprint deleted");
      refetch();
    },
    onError: () => toast.error("Failed to delete blueprint"),
  });

  const toggleMutation = trpc.blueprints.toggleVisibility.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated");
      refetch();
    },
    onError: () => toast.error("Failed to update visibility"),
  });

  const handleCopyLink = (shareToken: string) => {
    const url = `${window.location.origin}/blueprint/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(shareToken);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success("Share link copied!");
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this blueprint? This cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggle = (id: number, current: boolean) => {
    toggleMutation.mutate({ id, isPublic: !current });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Blueprints</h1>
            <p className="text-white/40 text-sm mt-1">
              Shareable agent designs you've published from the Code Playground
            </p>
          </div>
          <Link href="/code-playground">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2">
              <Plus className="w-4 h-4" />
              New Blueprint
            </Button>
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/3 border border-white/8 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && blueprints.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
              <Code2 className="w-8 h-8 text-cyan-400/50" />
            </div>
            <h3 className="text-lg font-semibold text-white">No blueprints yet</h3>
            <p className="text-white/40 text-sm max-w-sm mx-auto">
              Write agent code in the Code Playground and click "Share as Blueprint" to create a shareable link.
            </p>
            <Link href="/code-playground">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2 mt-2">
                <Plus className="w-4 h-4" />
                Open Code Playground
              </Button>
            </Link>
          </div>
        )}

        {/* Blueprint list */}
        {!isLoading && blueprints.length > 0 && (
          <div className="space-y-3">
            {blueprints.map((bp) => {
              const frameworkColor = FRAMEWORK_COLORS[bp.framework] ?? "bg-white/10 text-white/50 border-white/20";
              const createdDate = new Date(bp.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });

              return (
                <div
                  key={bp.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/2 hover:bg-white/4 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-[10px] px-2 py-0.5 border ${frameworkColor}`}>
                          {bp.framework.toUpperCase()}
                        </Badge>
                        <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px]">
                          {bp.language}
                        </Badge>
                        {bp.isPublic ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            Public
                          </Badge>
                        ) : (
                          <Badge className="bg-white/5 text-white/30 border-white/10 text-[10px] gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-white text-sm truncate">{bp.title}</h3>
                      {bp.description && (
                        <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{bp.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-white/25">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {bp.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {createdDate}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {bp.isPublic && (
                        <>
                          <button
                            onClick={() => handleCopyLink(bp.shareToken)}
                            className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                            title="Copy share link"
                          >
                            {copiedToken === bp.shareToken ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                          <Link href={`/blueprint/${bp.shareToken}`} target="_blank">
                            <button
                              className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                              title="View blueprint"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => handleToggle(bp.id, bp.isPublic)}
                        className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                        title={bp.isPublic ? "Make private" : "Make public"}
                      >
                        {bp.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(bp.id)}
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete blueprint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
