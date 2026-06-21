import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  CheckCircle2,
  Eye,
  Calendar,
  Code2,
  Terminal,
  ArrowLeft,
  Sparkles,
  Share2,
  ExternalLink,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const FRAMEWORK_COLORS: Record<string, string> = {
  crewai: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "openai-agents": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  langchain: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  autogen: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  n8n: "bg-red-500/20 text-red-300 border-red-500/30",
  custom: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  unknown: "bg-white/10 text-white/50 border-white/20",
};

export default function BlueprintView() {
  const [, params] = useRoute("/blueprint/:token");
  const token = params?.token ?? "";
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: blueprint, isLoading, error } = trpc.blueprints.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const handleCopyCode = () => {
    if (!blueprint?.code) return;
    navigator.clipboard.writeText(blueprint.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success("Code copied to clipboard!");
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Share link copied!");
    });
  };

  const handleOpenInPlayground = () => {
    if (!blueprint) return;
    try {
      localStorage.setItem("glow_playground_code", blueprint.code);
      localStorage.setItem("glow_playground_language", blueprint.language);
    } catch {}
    window.location.href = "/code-playground";
  };

  const handleBuildWithSentinel = () => {
    if (!blueprint) return;
    const prompt = `I found this ${blueprint.language} agent blueprint called "${blueprint.title}":\n\`\`\`${blueprint.language}\n${blueprint.code}\n\`\`\`\n\nI want to understand how it works and extend it. Can you explain the architecture and help me customize it for my use case?`;
    try {
      localStorage.setItem("glow_agent_mode", "true");
      localStorage.setItem("glow_agent_builder_starter", prompt);
    } catch {}
    window.location.href = "/chat?agentMode=1";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mx-auto">
            <Code2 className="w-6 h-6 text-cyan-400/60 animate-pulse" />
          </div>
          <p className="text-white/40">Loading blueprint...</p>
        </div>
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Code2 className="w-8 h-8 text-red-400/60" />
          </div>
          <h1 className="text-xl font-bold text-white">Blueprint not found</h1>
          <p className="text-white/40 text-sm">
            This blueprint may have been deleted or made private by its creator.
          </p>
          <Link href="/">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Glow
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const frameworkColor = FRAMEWORK_COLORS[blueprint.framework] ?? FRAMEWORK_COLORS.unknown;
  const createdDate = new Date(blueprint.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">Glow</span>
            <span className="text-white/30">/</span>
            <span className="text-white/60 text-sm">Agent Blueprint</span>
          </div>
          <div className="flex-1" />
          <Button
            onClick={handleCopyLink}
            size="sm"
            variant="ghost"
            className="text-white/50 hover:text-white/80 text-xs gap-1.5"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? "Copied!" : "Share"}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Blueprint header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={`text-[10px] px-2 py-0.5 border ${frameworkColor}`}>
                  {blueprint.framework.toUpperCase()}
                </Badge>
                <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px]">
                  {blueprint.language}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {blueprint.title}
              </h1>
              {blueprint.description && (
                <p className="text-white/50 mt-2 leading-relaxed">{blueprint.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3 h-3" />
                  {blueprint.viewCount} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {createdDate}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleCopyCode}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2"
            >
              {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? "Copied!" : "Copy Code"}
            </Button>
            <Button
              onClick={handleOpenInPlayground}
              variant="outline"
              className="border-white/20 text-white/70 hover:text-white hover:bg-white/5 gap-2"
            >
              <Terminal className="w-4 h-4" />
              Open in Playground
            </Button>
            <Button
              onClick={handleBuildWithSentinel}
              variant="outline"
              className="border-cyan-500/30 text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-500/10 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Build with a Sentinel
            </Button>
          </div>
        </div>

        {/* Code block */}
        <div className="rounded-xl border border-white/10 bg-[#0d0d14] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-xs text-white/25 font-mono ml-2">
                {blueprint.title.toLowerCase().replace(/\s+/g, "_")}.{blueprint.language === "python" ? "py" : blueprint.language === "javascript" ? "js" : "ts"}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="p-5 overflow-x-auto text-sm text-white/85 font-mono leading-relaxed whitespace-pre">
            {blueprint.code}
          </pre>
        </div>

        {/* Footer CTA */}
        <div className="p-6 rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-950/20 to-blue-950/20 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg">Build your own agents with Glow</h3>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Glow gives you AI Sentinels that help you design, build, and run agents like this one. 
            Start for free — no credit card required.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2 mt-2">
              <ExternalLink className="w-4 h-4" />
              Try Glow Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
