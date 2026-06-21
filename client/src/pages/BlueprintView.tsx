import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  CheckCircle2,
  Terminal,
  Code2,
  Calendar,
  Eye,
  ArrowLeft,
  Zap,
  Globe,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

const FRAMEWORK_COLORS: Record<string, string> = {
  crewai: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "openai-agents": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  langchain: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  autogen: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  n8n: "bg-red-500/20 text-red-300 border-red-500/30",
  custom: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

export default function BlueprintView() {
  const [, params] = useRoute("/blueprint/:token");
  const shareToken = params?.token ?? "";
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: blueprint, isLoading, error } = trpc.blueprints.getByToken.useQuery(
    { shareToken },
    { enabled: !!shareToken }
  );

  const handleCopyCode = () => {
    if (!blueprint?.code) return;
    navigator.clipboard.writeText(blueprint.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mx-auto animate-pulse">
            <Code2 className="w-5 h-5 text-cyan-400/50" />
          </div>
          <p className="text-white/40 text-sm">Loading blueprint...</p>
        </div>
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Code2 className="w-8 h-8 text-red-400/50" />
          </div>
          <h2 className="text-lg font-semibold text-white">Blueprint not found</h2>
          <p className="text-white/40 text-sm">
            This blueprint may have been deleted or made private by its author.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go to Glow
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const frameworkColor = FRAMEWORK_COLORS[blueprint.framework] ?? "bg-white/10 text-white/50 border-white/20";
  const createdDate = new Date(blueprint.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">Glow Blueprint</span>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
            <Globe className="w-2.5 h-2.5 mr-1" />Public
          </Badge>
          <div className="flex-1" />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-white/10"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? "Copied!" : "Share"}
          </button>
          <Link href="/code-playground">
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-1.5 text-xs">
              <Zap className="w-3 h-3" />Try in Playground
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Blueprint header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] px-2 py-0.5 border ${frameworkColor}`}>
              {blueprint.framework.toUpperCase()}
            </Badge>
            <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px]">
              {blueprint.language}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-white">{blueprint.title}</h1>
          {blueprint.description && (
            <p className="text-white/50 text-sm leading-relaxed">{blueprint.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {blueprint.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {createdDate}
            </span>
          </div>
        </div>

        {/* Code block */}
        <div className="rounded-xl border border-white/10 bg-[#0d0d14] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-white/2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-xs text-white/25 font-mono ml-2">
              agent.{blueprint.language === "python" ? "py" : blueprint.language === "javascript" ? "js" : "ts"}
            </span>
            <div className="flex-1" />
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <pre className="p-4 text-white/85 font-mono text-sm leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre">
            {blueprint.code}
          </pre>
        </div>

        {/* CTA */}
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Want to run or modify this agent?</p>
            <p className="text-xs text-white/40 mt-0.5">Open it in the Glow Code Playground to analyse, execute, and debug it with AI assistance.</p>
          </div>
          <Link href="/code-playground">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold gap-2 shrink-0">
              <Zap className="w-4 h-4" />Open in Playground
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
