import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bot, Zap, BookOpen, Heart, Code2, Network, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Workflow, Terminal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { saveOnboardingStep } from "@/components/OnboardingChecklist";

// ─── Types ────────────────────────────────────────────────────────────────────

type Goal = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  examplePrompt: string;
};

type SkillLevel = {
  id: "no-code" | "some-code" | "code-first";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
};

type FrameworkRec = {
  name: string;
  tagline: string;
  why: string;
  difficulty: string;
  color: string;
  icon: React.ReactNode;
  sentinelId: number;
  sentinelName: string;
  sentinelSlug: string;
  starterPrompt: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const GOALS: Goal[] = [
  {
    id: "email",
    icon: <span className="text-2xl">📧</span>,
    title: "Email Automation",
    description: "Monitor, summarise, draft, or respond to emails automatically",
    examplePrompt: "Build an agent that reads my Gmail every morning, summarises unread emails, and drafts replies for the most important ones",
  },
  {
    id: "research",
    icon: <span className="text-2xl">🔬</span>,
    title: "Research Assistant",
    description: "Gather, analyse, and synthesise information from the web",
    examplePrompt: "Build a research agent that monitors a topic daily, finds new articles, and sends me a concise briefing",
  },
  {
    id: "support",
    icon: <span className="text-2xl">💬</span>,
    title: "Customer Support",
    description: "Answer questions, route tickets, and handle FAQs automatically",
    examplePrompt: "Build an agent that answers common customer questions from a knowledge base and escalates complex issues to me",
  },
  {
    id: "productivity",
    icon: <span className="text-2xl">⚡</span>,
    title: "Personal Productivity",
    description: "Morning briefings, habit tracking, goal monitoring, and daily planning",
    examplePrompt: "Build a personal assistant agent that gives me a morning briefing with my priorities, weather, and one motivational insight",
  },
  {
    id: "data",
    icon: <span className="text-2xl">📊</span>,
    title: "Data Pipeline",
    description: "Collect, clean, analyse, and report on data automatically",
    examplePrompt: "Build an agent that pulls sales data from a spreadsheet, analyses trends, and sends a weekly summary report",
  },
  {
    id: "custom",
    icon: <span className="text-2xl">🎯</span>,
    title: "Something Custom",
    description: "I have a specific idea in mind — help me design it from scratch",
    examplePrompt: "I want to build a custom AI agent. Help me design it step by step.",
  },
];

const SKILL_LEVELS: SkillLevel[] = [
  {
    id: "no-code",
    icon: <Workflow className="w-6 h-6" />,
    title: "No Code",
    subtitle: "Visual drag-and-drop",
    description: "You prefer to connect apps visually without writing code. Perfect for beginners — powerful enough for pros.",
  },
  {
    id: "some-code",
    icon: <BookOpen className="w-6 h-6" />,
    title: "Some Code",
    subtitle: "Python basics",
    description: "You can follow a Python tutorial and modify examples. You understand variables, functions, and how to run a script.",
  },
  {
    id: "code-first",
    icon: <Terminal className="w-6 h-6" />,
    title: "Code First",
    subtitle: "Comfortable with code",
    description: "You write code regularly and want production-grade agents with full control over logic, tools, and deployment.",
  },
];

// Framework recommendations matrix: [goalId][skillLevel]
const FRAMEWORK_MATRIX: Record<string, Record<string, FrameworkRec>> = {
  "no-code": {
    default: {
      name: "n8n",
      tagline: "Visual AI Agent Builder",
      why: "n8n lets you build powerful AI agent workflows by connecting nodes visually — no code required. It supports 400+ app integrations and has native AI agent nodes powered by LLMs.",
      difficulty: "Beginner-friendly",
      color: "from-orange-500 to-amber-500",
      icon: <Workflow className="w-5 h-5" />,
      sentinelId: 2,
      sentinelName: "Mischief.EXE",
      sentinelSlug: "mischief-exe",
      starterPrompt: "",
    },
  },
  "some-code": {
    default: {
      name: "CrewAI",
      tagline: "Role-Based Agent Crews in Python",
      why: "CrewAI is the most beginner-friendly Python agent framework. You define agents as roles (Researcher, Analyst, Writer) and give them tasks — the framework handles the orchestration. Clean, readable, and well-documented.",
      difficulty: "Intermediate",
      color: "from-purple-500 to-violet-500",
      icon: <Network className="w-5 h-5" />,
      sentinelId: 3,
      sentinelName: "Lunaris.Vault",
      sentinelSlug: "lunaris-vault",
      starterPrompt: "",
    },
  },
  "code-first": {
    default: {
      name: "OpenAI Agents SDK",
      tagline: "Production-Grade Tool-Calling Agents",
      why: "The OpenAI Agents SDK gives you full control over tool definitions, multi-agent handoffs, and production deployment. It is the most powerful framework for building agents that integrate with real APIs and handle complex workflows.",
      difficulty: "Intermediate-Advanced",
      color: "from-cyan-500 to-blue-500",
      icon: <Code2 className="w-5 h-5" />,
      sentinelId: 5,
      sentinelName: "Rift.EXE",
      sentinelSlug: "rift-exe",
      starterPrompt: "",
    },
  },
};

// Special overrides for specific goal+skill combinations
const FRAMEWORK_OVERRIDES: Record<string, Partial<FrameworkRec>> = {
  "research-some-code": {
    sentinelId: 3,
    sentinelName: "Lunaris.Vault",
    sentinelSlug: "lunaris-vault",
  },
  "productivity-some-code": {
    sentinelId: 4,
    sentinelName: "Aetheris.Flow",
    sentinelSlug: "aetheris-flow",
  },
  "productivity-no-code": {
    sentinelId: 4,
    sentinelName: "Aetheris.Flow",
    sentinelSlug: "aetheris-flow",
  },
  "email-no-code": {
    sentinelId: 1,
    sentinelName: "Vixen's Den",
    sentinelSlug: "vixens-den",
  },
  "data-some-code": {
    sentinelId: 3,
    sentinelName: "Lunaris.Vault",
    sentinelSlug: "lunaris-vault",
  },
  "custom-code-first": {
    sentinelId: 6,
    sentinelName: "Nyx",
    sentinelSlug: "nyx",
  },
};

function getFrameworkRec(goalId: string, skillLevel: "no-code" | "some-code" | "code-first", goalTitle: string, examplePrompt: string): FrameworkRec {
  const base = FRAMEWORK_MATRIX[skillLevel]?.default ?? FRAMEWORK_MATRIX["no-code"].default;
  const overrideKey = `${goalId}-${skillLevel}`;
  const override = FRAMEWORK_OVERRIDES[overrideKey] ?? {};
  return {
    ...base,
    ...override,
    starterPrompt: `I want to build an agent for: ${goalTitle}.\n\nHere's what I have in mind: ${examplePrompt}\n\nI'm a ${skillLevel === "no-code" ? "no-code" : skillLevel === "some-code" ? "beginner-to-intermediate Python" : "code-first"} user. Please walk me through building this step by step using ${base.name}.`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentBuilder() {
  // Mark onboarding step when user visits Agent Builder
  useEffect(() => {
    saveOnboardingStep("build_agent");
  }, []);

  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillLevel | null>(null);

  const createConversation = trpc.conversations.create.useMutation();

  const frameworkRec = selectedGoal && selectedSkill
    ? getFrameworkRec(selectedGoal.id, selectedSkill.id, selectedGoal.title, selectedGoal.examplePrompt)
    : null;

  const handleLaunch = async () => {
    if (!frameworkRec || !user) return;

    // Create a new conversation and route to Chat with the matched Sentinel
    const conv = await createConversation.mutateAsync({
      title: `Agent: ${selectedGoal?.title}`,
      defaultModel: "manus",
    });

    // Persist agent mode and the starter prompt
    try {
      localStorage.setItem("glow_agent_mode", "true");
      localStorage.setItem("glow_agent_builder_starter", frameworkRec.starterPrompt);
      localStorage.setItem("glow_agent_builder_sentinel", String(frameworkRec.sentinelId));
      localStorage.setItem("glow_agent_builder_conv", String(conv.id));
    } catch {}

    setLocation(`/chat?conv=${conv.id}&sentinel=${frameworkRec.sentinelId}&agentMode=1`);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.012_268)] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setLocation("/chat")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Chat
        </button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white">Agent Builder</span>
        </div>
        <div className="w-24" /> {/* spacer */}
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-center gap-2 px-6 py-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step > s ? "bg-cyan-500 text-white" : step === s ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-300" : "bg-white/5 border border-white/10 text-gray-500"
            }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`w-16 h-0.5 transition-all ${step > s ? "bg-cyan-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-16">

        {/* ── Step 1: Goal Picker ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pt-4">
              <h1 className="text-3xl font-bold text-white">What do you want your agent to do?</h1>
              <p className="text-gray-400">Choose the goal that best matches your idea. You can customise it in the next step.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => { setSelectedGoal(goal); setStep(2); }}
                  className={`text-left p-4 rounded-xl border transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5 ${
                    selectedGoal?.id === goal.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/10 bg-white/3"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{goal.icon}</div>
                    <div>
                      <div className="font-semibold text-white">{goal.title}</div>
                      <div className="text-sm text-gray-400 mt-0.5">{goal.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Skill Level ── */}
        {step === 2 && selectedGoal && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pt-4">
              <h1 className="text-3xl font-bold text-white">What's your comfort level with code?</h1>
              <p className="text-gray-400">We'll match you with the right framework and the best Sentinel for your skill level.</p>
            </div>
            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => { setSelectedSkill(level); setStep(3); }}
                  className={`w-full text-left p-5 rounded-xl border transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5 ${
                    selectedSkill?.id === level.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/10 bg-white/3"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      level.id === "no-code" ? "from-orange-500/20 to-amber-500/20 text-orange-400" :
                      level.id === "some-code" ? "from-purple-500/20 to-violet-500/20 text-purple-400" :
                      "from-cyan-500/20 to-blue-500/20 text-cyan-400"
                    } flex items-center justify-center flex-shrink-0`}>
                      {level.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{level.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">{level.subtitle}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{level.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* ── Step 3: Framework Recommendation + Sentinel Handoff ── */}
        {step === 3 && selectedGoal && selectedSkill && frameworkRec && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Perfect match found
              </div>
              <h1 className="text-3xl font-bold text-white">Your recommended framework</h1>
            </div>

            {/* Framework card */}
            <div className={`p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${frameworkRec.color} bg-opacity-10 relative overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${frameworkRec.color} opacity-5`} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${frameworkRec.color} flex items-center justify-center text-white`}>
                    {frameworkRec.icon}
                  </div>
                  <div>
                    <div className="font-bold text-xl text-white">{frameworkRec.name}</div>
                    <div className="text-sm text-gray-400">{frameworkRec.tagline}</div>
                  </div>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">{frameworkRec.difficulty}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{frameworkRec.why}</p>
              </div>
            </div>

            {/* Sentinel handoff card */}
            <div className="p-5 rounded-xl border border-white/10 bg-white/3">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Your Agent Architect</div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/30 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{frameworkRec.sentinelName}</div>
                  <div className="text-sm text-gray-400">Will guide you through building your {selectedGoal.title.toLowerCase()} agent using {frameworkRec.name}</div>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/2 text-sm text-gray-400 space-y-1.5">
              <div className="text-white font-medium mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> What happens next</div>
              <p>A new conversation opens with <strong className="text-white">{frameworkRec.sentinelName}</strong> in Agent Builder Mode.</p>
              <p>Your goal is pre-loaded as the first message — just hit Send and the build begins.</p>
              <p>The Sentinel will ask clarifying questions, design the architecture, and generate complete runnable code step by step.</p>
            </div>

            {/* Design with Round Table alternative CTA */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm mb-1">Want multiple perspectives first?</div>
                  <p className="text-xs text-gray-400 leading-relaxed">Bring your agent challenge to the Round Table — all 6 Sentinels will debate the best framework, architecture, and risks before you start building.</p>
                  <button
                    onClick={() => {
                      const q = `I want to build an agent for: ${selectedGoal?.title}. Here's my goal: ${selectedGoal?.examplePrompt}. I'm a ${selectedSkill?.id === "no-code" ? "no-code" : selectedSkill?.id === "some-code" ? "beginner-to-intermediate" : "code-first"} user. Please debate the best framework (n8n, CrewAI, or OpenAI Agents SDK), architecture, and risks for my use case.`;
                      try { localStorage.setItem("glow_rt_agent_design_question", q); } catch {}
                      setLocation("/round-table?agentDesign=1");
                    }}
                    className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Users className="w-3 h-3" /> Design with Round Table <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <Button
                onClick={handleLaunch}
                disabled={createConversation.isPending}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {createConversation.isPending ? (
                  <span className="animate-pulse">Launching...</span>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Launch Agent Builder with {frameworkRec.sentinelName}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
