import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Copy,
  Trash2,
  Bug,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Loader2,
  Code2,
  Sparkles,
  Package,
  ListChecks,
  Lightbulb,
  ArrowLeft,
  Terminal,
  Zap,
  FlaskConical,
  Share2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

interface AnalysisResult {
  framework: string;
  language: string;
  summary: string;
  issues: { severity: "error" | "warning" | "info"; line: number | null; message: string }[];
  dependencies: string[];
  setupSteps: string[];
  dryRunOutput: string;
  isRunnable: boolean;
  suggestions: string[];
}

const SAMPLE_CREWAI = `from crewai import Agent, Task, Crew, Process

# Define your agents
researcher = Agent(
    role='Research Analyst',
    goal='Uncover cutting-edge developments in AI',
    backstory='You are an expert researcher with a knack for finding the most relevant information.',
    verbose=True,
    allow_delegation=False
)

writer = Agent(
    role='Tech Content Strategist',
    goal='Craft compelling content on tech advancements',
    backstory='You are a renowned Content Strategist, known for your insightful and engaging articles.',
    verbose=True,
    allow_delegation=True
)

# Define tasks
research_task = Task(
    description='Investigate the latest AI trends in 2025. Identify key players, technologies, and potential industry impacts.',
    expected_output='A comprehensive 3-paragraph report on the latest AI trends.',
    agent=researcher
)

write_task = Task(
    description='Compose an insightful article on AI trends based on the research findings.',
    expected_output='A 4-paragraph article formatted as markdown.',
    agent=writer
)

# Assemble the crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential
)

# Run the crew
result = crew.kickoff()
print(result)
`;

const SAMPLE_OPENAI_AGENTS = `from agents import Agent, Runner, function_tool
import asyncio

@function_tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    # In production, call a real weather API here
    return f"The weather in {city} is sunny and 72°F."

@function_tool  
def search_web(query: str) -> str:
    """Search the web for information."""
    # In production, call a search API here
    return f"Search results for '{query}': Found 3 relevant articles about the topic."

# Create a research assistant agent
assistant = Agent(
    name="Research Assistant",
    instructions="""You are a helpful research assistant. 
    Use the available tools to answer questions accurately.
    Always cite your sources and be concise.""",
    tools=[get_weather, search_web],
)

async def main():
    result = await Runner.run(
        assistant,
        "What's the weather in San Francisco and find recent news about AI agents?"
    )
    print(result.final_output)

asyncio.run(main())
`;

const LANGUAGE_OPTIONS = [
  { id: "python" as const, label: "Python 3", icon: "🐍" },
  { id: "javascript" as const, label: "JavaScript", icon: "⚡" },
  { id: "typescript" as const, label: "TypeScript", icon: "🔷" },
];

const FRAMEWORK_COLORS: Record<string, string> = {
  crewai: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "openai-agents": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  langchain: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  autogen: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  n8n: "bg-red-500/20 text-red-300 border-red-500/30",
  custom: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  unknown: "bg-white/10 text-white/50 border-white/20",
};

const SEVERITY_CONFIG = {
  error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CodePlayground() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState(SAMPLE_CREWAI);
  const [language, setLanguage] = useState<"python" | "javascript" | "typescript">("python");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const analyzeMutation = trpc.agents.analyzeCode.useMutation({
    onSuccess: (data) => {
      setResult(data as AnalysisResult);
      if ((data as AnalysisResult).issues.some(i => i.severity === "error")) {
        toast.error("Issues found in your code — check the analysis below");
      } else {
        toast.success("Analysis complete!");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Analysis failed — please try again");
    },
  });

  const handleAnalyze = () => {
    if (!code.trim()) {
      toast.error("Please paste some agent code first");
      return;
    }
    analyzeMutation.mutate({ code, language });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    textareaRef.current?.focus();
  };

  const handleDebugWithSentinel = () => {
    if (!result) return;
    const errors = result.issues.filter(i => i.severity === "error");
    const errorText = errors.map(e => `- ${e.message}`).join("\n");
    const debugPrompt = `I wrote this ${language} agent code and need help debugging it.\n\nHere is the code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nThe analysis found these issues:\n${errorText || "No specific errors, but the code may not run as expected."}\n\nPlease help me fix these issues and explain what went wrong.`;
    try {
      localStorage.setItem("glow_agent_mode", "true");
      localStorage.setItem("glow_agent_builder_starter", debugPrompt);
    } catch {}
    setLocation("/chat?agentMode=1");
  };

  const hasErrors = result?.issues.some(i => i.severity === "error") ?? false;

  // ─── Blueprint sharing ────────────────────────────────────────────────────
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [blueprintTitle, setBlueprintTitle] = useState("");
  const [blueprintDesc, setBlueprintDesc] = useState("");
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  const createBlueprintMutation = trpc.blueprints.create.useMutation({
    onSuccess: (data) => {
      setSharedUrl(data.shareUrl);
      toast.success("Blueprint created!");
    },
    onError: (err) => toast.error(err.message || "Failed to create blueprint"),
  });

  const handleShareBlueprint = () => {
    if (!code.trim()) { toast.error("No code to share"); return; }
    setBlueprintTitle("");
    setBlueprintDesc("");
    setSharedUrl(null);
    setShowShareDialog(true);
  };

  const handleCreateBlueprint = () => {
    if (!blueprintTitle.trim()) { toast.error("Please enter a title"); return; }
    createBlueprintMutation.mutate({
      title: blueprintTitle.trim(),
      description: blueprintDesc.trim() || undefined,
      code,
      language,
      framework: result?.framework ?? "custom",
    });
  };

  const handleCopyShareUrl = () => {
    if (!sharedUrl) return;
    const full = window.location.origin + sharedUrl;
    navigator.clipboard.writeText(full).then(() => {
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2000);
      toast.success("Share link copied!");
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Code2 className="w-12 h-12 text-cyan-400/60 mx-auto" />
          <p className="text-white/60">Sign in to use the Code Playground</p>
          <Link href="/"><Button className="bg-cyan-500 hover:bg-cyan-400 text-black">Go to Glow</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/chat">
            <button className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">Code Playground</span>
          </div>
          <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[10px]">
            <Zap className="w-2.5 h-2.5 mr-1" />AI-Powered Analysis
          </Badge>
          <div className="flex-1" />
          <Link href="/agent-builder">
            <Button size="sm" variant="ghost" className="text-white/50 hover:text-white/80 text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />Build an Agent
            </Button>
          </Link>
          <Link href="/agent-templates">
            <Button size="sm" variant="ghost" className="text-white/50 hover:text-white/80 text-xs">
              Browse Templates
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left: Editor ── */}
          <div className="space-y-3">
            {/* Editor header */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      language === lang.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    <span>{lang.icon}</span>
                    {lang.label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            {/* Quick load sample buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">Load sample:</span>
              <button
                onClick={() => { setCode(SAMPLE_CREWAI); setLanguage("python"); setResult(null); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-300/70 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
              >
                CrewAI Crew
              </button>
              <button
                onClick={() => { setCode(SAMPLE_OPENAI_AGENTS); setLanguage("python"); setResult(null); }}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300/70 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                OpenAI Agents
              </button>
            </div>

            {/* Code editor */}
            <div className="relative rounded-xl border border-white/10 bg-[#0d0d14] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 bg-white/2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-xs text-white/25 font-mono ml-2">
                  agent.{language === "python" ? "py" : language === "javascript" ? "js" : "ts"}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full h-[480px] bg-transparent text-white/85 font-mono text-sm p-4 resize-none outline-none leading-relaxed"
                placeholder={`# Paste your agent code here...\n# Supports CrewAI, OpenAI Agents SDK, LangChain, and more`}
                spellCheck={false}
              />
            </div>

            {/* Analyse button */}
            <Button
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending || !code.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analysing with AI...</>
              ) : (
                <><Play className="w-4 h-4" />Analyse & Dry Run</>
              )}
            </Button>
          </div>

          {/* ── Right: Output Panel ── */}
          <div className="space-y-3">
            {!result && !analyzeMutation.isPending ? (
              /* Empty state */
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
                  <Terminal className="w-8 h-8 text-cyan-400/60" />
                </div>
                <div>
                  <p className="text-white/50 font-medium">Paste your agent code and click Analyse</p>
                  <p className="text-white/25 text-sm mt-1">The AI will review your code, detect the framework,<br />simulate a dry run, and suggest improvements.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-sm">
                  {[
                    { icon: Code2, label: "Framework detection", color: "text-cyan-400" },
                    { icon: AlertTriangle, label: "Issue scanning", color: "text-amber-400" },
                    { icon: Terminal, label: "Dry run simulation", color: "text-emerald-400" },
                    { icon: Lightbulb, label: "Improvement tips", color: "text-purple-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/8">
                      <Icon className={`w-4 h-4 ${color} shrink-0`} />
                      <span className="text-xs text-white/50">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : analyzeMutation.isPending ? (
              /* Loading state */
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
                <div>
                  <p className="text-white/60 font-medium">Analysing your agent code...</p>
                  <p className="text-white/30 text-sm mt-1">Detecting framework, scanning for issues, simulating dry run</p>
                </div>
              </div>
            ) : result ? (
              /* Results */
              <div className="space-y-4">
                {/* Summary card */}
                <div className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] px-2 py-0.5 border ${FRAMEWORK_COLORS[result.framework] ?? FRAMEWORK_COLORS.unknown}`}>
                          {result.framework.toUpperCase()}
                        </Badge>
                        <Badge className={`text-[10px] px-2 py-0.5 border ${result.isRunnable ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-red-500/15 text-red-300 border-red-500/30"}`}>
                          {result.isRunnable ? "✓ Runnable" : "✗ Has Errors"}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/70 mt-2 leading-relaxed">{result.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {result.issues.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                        Issues ({result.issues.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {result.issues.map((issue, i) => {
                        const cfg = SEVERITY_CONFIG[issue.severity];
                        const Icon = cfg.icon;
                        return (
                          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${cfg.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0 mt-0.5`} />
                            <span className="text-xs text-white/70 leading-relaxed">{issue.message}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dry run output */}
                {result.dryRunOutput && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400/70" />
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Simulated Output</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20 text-[9px]">DRY RUN</Badge>
                    </div>
                    <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-300/80 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {result.dryRunOutput}
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {result.dependencies.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Required Packages</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.dependencies.map(dep => (
                        <code key={dep} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300/70 font-mono">
                          {dep}
                        </code>
                      ))}
                    </div>
                    <p className="text-xs text-white/30 font-mono">pip install {result.dependencies.join(" ")}</p>
                  </div>
                )}

                {/* Setup steps (collapsible) */}
                {result.setupSteps.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowSetup(!showSetup)}
                      className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      Setup Steps ({result.setupSteps.length})
                      {showSetup ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {showSetup && (
                      <div className="space-y-1.5 pl-2">
                        {result.setupSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-white/60 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions (collapsible) */}
                {result.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400/70" />
                      Suggestions ({result.suggestions.length})
                      {showSuggestions ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {showSuggestions && (
                      <div className="space-y-1.5 pl-2">
                        {result.suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                            <span className="text-amber-400/60 shrink-0 mt-0.5">→</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Debug with Sentinel CTA */}
                {hasErrors && (
                  <div className="p-4 rounded-xl border border-red-500/25 bg-gradient-to-br from-red-950/30 to-orange-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Bug className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-300">Errors detected</span>
                    </div>
                    <p className="text-xs text-red-400/60 mb-3 leading-relaxed">
                      A Sentinel can diagnose these errors, explain what went wrong, and guide you through fixing them step by step.
                    </p>
                    <Button
                      onClick={handleDebugWithSentinel}
                      className="w-full bg-gradient-to-r from-red-500/80 to-orange-600/80 hover:from-red-400 hover:to-orange-500 text-white font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Bug className="w-4 h-4" />
                      Debug with a Sentinel
                    </Button>
                  </div>
                )}

                {/* Continue building CTA */}
                {!hasErrors && (
                  <div className="p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-blue-950/20">
                    <p className="text-xs text-cyan-400/60 mb-3 leading-relaxed">
                      Your code looks good. A Sentinel can help you extend it, add error handling, or deploy it to production.
                    </p>
                    <Button
                      onClick={() => {
                        const prompt = `I have this ${language} agent code that I want to improve and extend:\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease help me: 1) Add proper error handling, 2) Make it production-ready, 3) Suggest the best way to deploy and run this agent.`;
                        try {
                          localStorage.setItem("glow_agent_mode", "true");
                          localStorage.setItem("glow_agent_builder_starter", prompt);
                        } catch {}
                        setLocation("/chat?agentMode=1");
                      }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Continue building with a Sentinel
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
