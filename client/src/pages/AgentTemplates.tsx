import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Bot, Copy, Check, ArrowLeft, ArrowRight, X, Workflow,
  Terminal, Code2, Sparkles, Search, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  AGENT_TEMPLATES,
  FRAMEWORK_LABELS,
  FRAMEWORK_COLORS,
  FRAMEWORK_BG,
  DIFFICULTY_COLORS,
  type AgentTemplate,
  type Framework,
  type Difficulty,
} from "@/data/agentTemplates";

// ─── Framework icon helper ────────────────────────────────────────────────────

function FrameworkIcon({ framework, className = "w-4 h-4" }: { framework: Framework; className?: string }) {
  if (framework === "n8n") return <Workflow className={className} />;
  if (framework === "crewai") return <Bot className={className} />;
  return <Code2 className={className} />;
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ template, onClick }: { template: AgentTemplate; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-5 rounded-2xl border border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/6 transition-all duration-200 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${FRAMEWORK_COLORS[template.framework]} flex items-center justify-center text-white flex-shrink-0`}>
          <FrameworkIcon framework={template.framework} />
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${FRAMEWORK_BG[template.framework]}`}>
            {FRAMEWORK_LABELS[template.framework]}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[template.difficulty]}`}>
            {template.difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 className="font-semibold text-white text-sm leading-snug">{template.title}</h3>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-3">{template.description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{template.sentinelEmoji}</span>
          <span className="text-xs text-gray-500">{template.sentinelName}</span>
        </div>
        <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          View template <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

// ─── Template Detail Modal ────────────────────────────────────────────────────

function TemplateModal({
  template,
  onClose,
  onLaunch,
  launching,
}: {
  template: AgentTemplate;
  onClose: () => void;
  onLaunch: (template: AgentTemplate) => void;
  launching: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "code" | "setup">("overview");
  const [, setLocation] = useLocation();

  const handleCopy = () => {
    navigator.clipboard.writeText(template.code).then(() => {
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[oklch(0.10_0.014_268)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${FRAMEWORK_COLORS[template.framework]} flex items-center justify-center text-white flex-shrink-0`}>
              <FrameworkIcon framework={template.framework} className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">{template.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${FRAMEWORK_BG[template.framework]}`}>
                  {FRAMEWORK_LABELS[template.framework]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[template.difficulty]}`}>
                  {template.difficulty}
                </span>
                <span className="text-xs text-gray-500">{template.category}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          {(["overview", "code", "setup"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <p className="text-gray-300 leading-relaxed">{template.longDescription}</p>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.sentinelEmoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{template.sentinelName} will guide you</div>
                    <div className="text-xs text-gray-400">Your assigned Sentinel for this template</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "code" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {template.framework === "n8n" ? "Workflow JSON — import into n8n" : "Python — save and run locally"}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy code"}
                </button>
              </div>
              <pre className="text-xs text-gray-300 bg-black/40 rounded-xl p-4 overflow-x-auto border border-white/5 leading-relaxed max-h-96 overflow-y-auto">
                <code>{template.code}</code>
              </pre>
            </div>
          )}

          {activeTab === "setup" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Follow these steps to get the template running:</p>
              <ol className="space-y-3">
                {template.setupSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-300 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-2 bg-transparent border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </Button>
            <Button
              onClick={() => onLaunch(template)}
              disabled={launching}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2"
            >
              {launching ? (
                <span className="animate-pulse">Launching...</span>
              ) : (
                <>
                  <span>{template.sentinelEmoji}</span>
                  Build this with {template.sentinelName}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              try { localStorage.setItem("glow_playground_code", template.code); } catch {}
              onClose();
              setLocation("/code-playground");
            }}
            className="w-full flex items-center justify-center gap-2 bg-transparent border-white/15 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm"
          >
            <Terminal className="w-3.5 h-3.5" />
            Try in Code Playground
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentTemplates() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedFramework, setSelectedFramework] = useState<Framework | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [launching, setLaunching] = useState(false);

  const createConversation = trpc.conversations.create.useMutation();

  const filteredTemplates = useMemo(() => {
    return AGENT_TEMPLATES.filter((t) => {
      if (selectedFramework !== "all" && t.framework !== selectedFramework) return false;
      if (selectedDifficulty !== "all" && t.difficulty !== selectedDifficulty) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedFramework, selectedDifficulty, searchQuery]);

  const handleLaunch = async (template: AgentTemplate) => {
    if (!user) return;
    setLaunching(true);
    try {
      const conv = await createConversation.mutateAsync({
        title: `Agent: ${template.title}`,
        defaultModel: "gemini-pro",
      });

      try {
        localStorage.setItem("glow_agent_mode", "true");
        localStorage.setItem("glow_agent_builder_starter", template.starterPrompt);
        localStorage.setItem("glow_agent_builder_sentinel", String(template.sentinelId));
        localStorage.setItem("glow_agent_builder_conv", String(conv.id));
        localStorage.setItem("glow_agent_template_code", template.code);
        localStorage.setItem("glow_agent_template_title", template.title);
      } catch {}

      setLocation(`/chat?conv=${conv.id}&sentinel=${template.sentinelId}&agentMode=1`);
    } catch (err) {
      toast.error("Failed to launch — please try again");
      setLaunching(false);
    }
  };

  const frameworks: Array<{ id: Framework | "all"; label: string }> = [
    { id: "all", label: "All Frameworks" },
    { id: "n8n", label: "n8n" },
    { id: "crewai", label: "CrewAI" },
    { id: "openai-agents", label: "OpenAI Agents SDK" },
  ];

  const difficulties: Array<{ id: Difficulty | "all"; label: string }> = [
    { id: "all", label: "All Levels" },
    { id: "Beginner", label: "Beginner" },
    { id: "Intermediate", label: "Intermediate" },
    { id: "Advanced", label: "Advanced" },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.012_268)] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setLocation("/chat")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Chat
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white">Agent Templates</span>
        </div>
        <button
          onClick={() => setLocation("/agent-builder")}
          className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Bot className="w-4 h-4" /> Build Custom
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-4xl font-bold text-white">Agent Templates</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Pre-built, copy-and-run agent templates across n8n, CrewAI, and OpenAI Agents SDK.
            Pick one, launch it with your Sentinel, and go from idea to running agent in minutes.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Workflow className="w-4 h-4 text-orange-400" /> 3 n8n workflows</span>
            <span className="flex items-center gap-1.5"><Bot className="w-4 h-4 text-purple-400" /> 3 CrewAI crews</span>
            <span className="flex items-center gap-1.5"><Code2 className="w-4 h-4 text-cyan-400" /> 3 OpenAI Agents</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value as Framework | "all")}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50"
            >
              {frameworks.map((f) => (
                <option key={f.id} value={f.id} className="bg-gray-900">{f.label}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | "all")}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50"
            >
              {difficulties.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 mb-4">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
        </div>

        {/* Template Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-400">No templates match your filters</p>
            <p className="text-sm mt-1">Try adjusting the framework or difficulty filter</p>
            <button
              onClick={() => { setSelectedFramework("all"); setSelectedDifficulty("all"); setSearchQuery(""); }}
              className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* CTA to custom builder */}
        <div className="mt-12 p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 text-center">
          <Bot className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-1">Don't see what you need?</h3>
          <p className="text-sm text-gray-400 mb-4">Use the Agent Builder to design a custom agent from scratch — your Sentinel will walk you through every step.</p>
          <Button
            onClick={() => setLocation("/agent-builder")}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
          >
            Build a Custom Agent
          </Button>
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onLaunch={handleLaunch}
          launching={launching}
        />
      )}
    </div>
  );
}
