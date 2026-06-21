import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Globe,
  Lock,
  Code2,
  Eye,
  Calendar,
  ExternalLink,
  Share2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
<<<<<<< Updated upstream

=======
import DashboardLayout from "@/components/DashboardLayout";
>>>>>>> Stashed changes
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
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: blueprints, isLoading, refetch } = trpc.blueprints.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteMutation = trpc.blueprints.delete.useMutation({
    onSuccess: () => { toast.success("Blueprint deleted"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.blueprints.toggleVisibility.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(err.message),
  });

  const handleCopyLink = (shareToken: string, id: number) => {
    const url = `${window.location.origin}/blueprint/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Share link copied!");
    });
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-white/40">Please sign in to view your blueprints.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">My Blueprints</h1>
            <p className="text-sm text-white/40">Shareable agent code blueprints you have created</p>
          </div>
          <div className="flex-1" />
          <Link href="/code-playground">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2 text-sm">
              <Code2 className="w-4 h-4" />Create Blueprint
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !blueprints || blueprints.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-white/60 font-semibold">No blueprints yet</h3>
            <p className="text-white/30 text-sm max-w-xs mx-auto">
              Open the Code Playground, write or paste agent code, and click Share as Blueprint to create your first shareable blueprint.
            </p>
            <Link href="/code-playground">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2 mt-2">
                <Code2 className="w-4 h-4" />Open Code Playground
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {blueprints.map((bp: { id: number; title: string; description: string | null; code: string; language: string; framework: string; shareToken: string; isPublic: boolean; viewCount: number; createdAt: Date; updatedAt: Date }) => {
              const frameworkColor = FRAMEWORK_COLORS[bp.framework] ?? "bg-white/10 text-white/50 border-white/20";
              const createdDate = new Date(bp.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });
              return (
                <div key={bp.id} className="p-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Code2 className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm truncate">{bp.title}</h3>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${frameworkColor}`}>{bp.framework.toUpperCase()}</Badge>
                        <Badge className="bg-white/5 text-white/30 border-white/10 text-[10px] px-1.5 py-0">{bp.language}</Badge>
                        {bp.isPublic ? (
                          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] px-1.5 py-0">
                            <Globe className="w-2.5 h-2.5 mr-0.5" />Public
                          </Badge>
                        ) : (
                          <Badge className="bg-white/5 text-white/30 border-white/10 text-[10px] px-1.5 py-0">
                            <Lock className="w-2.5 h-2.5 mr-0.5" />Private
                          </Badge>
                        )}
                      </div>
                      {bp.description && (
                        <p className="text-xs text-white/40 mt-1 line-clamp-1">{bp.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/25">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{bp.viewCount} views</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{createdDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {bp.isPublic && (
                        <>
                          <button
                            onClick={() => handleCopyLink(bp.shareToken, bp.id)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                            title="Copy share link"
                          >
                            {copiedId === bp.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                          </button>
                          <Link href={`/blueprint/${bp.shareToken}`}>
                            <button className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors" title="View blueprint">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => toggleMutation.mutate({ id: bp.id, isPublic: !bp.isPublic })}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                        title={bp.isPublic ? "Make private" : "Make public"}
                      >
                        {bp.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this blueprint?")) deleteMutation.mutate({ id: bp.id }); }}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
