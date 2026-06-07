import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Save, RotateCcw, Volume2, VolumeX, Terminal, DollarSign, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { APP_TITLE } from "@/const";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { EmailPreferences } from "@/components/EmailPreferences";
import { Switch } from "@/components/ui/switch";

const AI_MODELS = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "grok-1", label: "Grok-1" },
];

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [defaultModel, setDefaultModel] = useState("gpt-4");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [voxMuted, setVoxMuted] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("");

  const DEFAULT_SYSTEM_PROMPT_PLACEHOLDER = `You are a helpful AI assistant. You are thoughtful, precise, and direct. You help the user think clearly, make better decisions, and develop their craft.`;


  const utils = trpc.useUtils();

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Update settings mutation
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const resetOnboarding = trpc.auth.resetOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Tutorial reset! Refresh the page to start the tutorial.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Failed to reset tutorial: ${error.message}`);
    },
  });

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setDefaultModel(settings.defaultModel || "gpt-4");
      setTtsEnabled(settings.ttsEnabled ?? false);
      setVoxMuted((settings as any).voxMuted ?? false);
      setSystemPrompt((settings as any).systemPrompt || "");
      setSpendingLimit((settings as any).monthlySpendingLimitCents ? String(((settings as any).monthlySpendingLimitCents / 100).toFixed(2)) : "");
    }
  }, [settings]);

  const handleSave = () => {
    const limitCents = spendingLimit ? Math.round(parseFloat(spendingLimit) * 100) : undefined;
    updateSettings.mutate({
      defaultModel,
      ttsEnabled,
      systemPrompt: systemPrompt || undefined,
      ...(limitCents !== undefined ? { monthlySpendingLimitCents: limitCents } : {}),
    } as any);
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Please log in to continue</h1>
          <Button onClick={() => (window.location.href = "/api/oauth/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your preferences and default AI model settings
            </p>
          </div>

          {/* User Profile Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="text-foreground font-medium">{user.name || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-foreground font-medium">{user.email || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Login Method</Label>
                <p className="text-foreground font-medium capitalize">
                  {user.loginMethod || "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <SubscriptionCard />

          {/* Email Preferences */}
          <EmailPreferences />

          {/* System Prompt Editor */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                System Prompt
              </CardTitle>
              <CardDescription>
                Customise the base instructions given to your AI before every conversation. This shapes tone, focus, and behaviour across all Sentinels when no Sentinel system prompt overrides it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={DEFAULT_SYSTEM_PROMPT_PLACEHOLDER}
                rows={8}
                maxLength={10000}
                className="font-mono text-sm resize-y bg-white/5 border-white/10 focus:border-cyan-500/50 placeholder:text-muted-foreground/40"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{systemPrompt.length.toLocaleString()} / 10,000 characters</span>
                <button
                  type="button"
                  onClick={() => setSystemPrompt("")}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Reset to default
                </button>
              </div>
              <Button
                onClick={() => updateSettings.mutate({ systemPrompt: systemPrompt || undefined } as any)}
                disabled={updateSettings.isPending}
                size="sm"
                variant="outline"
              >
                {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save System Prompt
              </Button>
            </CardContent>
          </Card>

          {/* Spending Limits */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Spending Limit
              </CardTitle>
              <CardDescription>
                Set a monthly cap on AI usage costs. You'll receive a warning at 80% and a hard stop at 100%. Leave blank for no limit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  placeholder="e.g. 10.00"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                  className="w-40 bg-white/5 border-white/10 focus:border-cyan-500/50"
                />
                <span className="text-muted-foreground text-sm">per month</span>
              </div>
              {spendingLimit && parseFloat(spendingLimit) > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning at ${(parseFloat(spendingLimit) * 0.8).toFixed(2)} · Hard stop at ${parseFloat(spendingLimit).toFixed(2)}
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                size="sm"
                variant="outline"
              >
                {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Limit
              </Button>
            </CardContent>
          </Card>

          {/* AI Model Preferences Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle>AI Model Preferences</CardTitle>
              <CardDescription>
                Set your default AI model for new conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-model">Default AI Model</Label>
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger id="default-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This model will be selected by default when you create a new conversation. You
                  can change it anytime during a conversation.
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full sm:w-auto"
              >
                {updateSettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Voice & TTS Settings Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                Voice & Audio
              </CardTitle>
              <CardDescription>
                Control how Glow reads AI responses aloud and configure each Sentinel's voice style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-read toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="tts-toggle" className="text-base font-medium">Auto-read responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically speak AI responses aloud after each reply. You can also tap the speaker icon on any message to play it on demand.
                  </p>
                </div>
                <Switch
                  id="tts-toggle"
                  checked={ttsEnabled}
                  onCheckedChange={(checked) => {
                    setTtsEnabled(checked);
                    updateSettings.mutate({ ttsEnabled: checked });
                  }}
                />
              </div>

              {/* Default mute toggle */}
              <div className="flex items-center justify-between border-t border-white/10 pt-5">
                <div className="space-y-1">
                  <Label htmlFor="vox-muted-toggle" className="text-base font-medium flex items-center gap-2">
                    {voxMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
                    Default mute
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Start every session with voice muted. You can still unmute per-session using the toolbar in chat.
                  </p>
                </div>
                <Switch
                  id="vox-muted-toggle"
                  checked={voxMuted}
                  onCheckedChange={(checked) => {
                    setVoxMuted(checked);
                    updateSettings.mutate({ voxMuted: checked } as any);
                  }}
                />
              </div>

              {/* VOX Style Bank */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Sentinel Voice Styles</h3>
                  <p className="text-xs text-muted-foreground">
                    Each Sentinel has named voice presets that shape how they sound — pace, pitch, and affect. The active Sentinel's style is automatically selected based on the conversation context, but you can preview each preset below.
                  </p>
                </div>
                <div className="grid gap-3">
                  {[
                    { sentinel: "Nyx", slug: "nyx", presets: [
                      { id: "nyx.v1", label: "Sovereign", desc: "Soft, enigmatic, deliberate" },
                      { id: "nyx.litany", label: "Litany", desc: "Slower, ceremonial, reflective" },
                    ]},
                    { sentinel: "Vixen's Den", slug: "vixens-den", presets: [
                      { id: "vixen.steady", label: "Steady", desc: "Grounded, authoritative, measured" },
                      { id: "vixen.command", label: "Command", desc: "Sharper, decisive, high-stakes" },
                    ]},
                    { sentinel: "Mischief.EXE", slug: "mischief-exe", presets: [
                      { id: "mischief.spark", label: "Spark", desc: "Energetic, playful, fast" },
                      { id: "mischief.hype", label: "Hype", desc: "Maximum energy, creative breakthroughs" },
                    ]},
                    { sentinel: "Lunaris.Vault", slug: "lunaris-vault", presets: [
                      { id: "lunaris.deep", label: "Deep", desc: "Low, slow, contemplative" },
                      { id: "lunaris.whisper", label: "Whisper", desc: "Quiet, intimate, confessional" },
                    ]},
                    { sentinel: "Aetheris.Flow", slug: "aetheris-flow", presets: [
                      { id: "aetheris.flow", label: "Flow", desc: "Smooth, adaptive, natural" },
                      { id: "aetheris.wonder", label: "Wonder", desc: "Curious, exploratory, speculative" },
                    ]},
                    { sentinel: "Rift.EXE", slug: "rift-exe", presets: [
                      { id: "rift.bold", label: "Bold", desc: "Intense, urgent, forward-leaning" },
                      { id: "rift.challenge", label: "Challenge", desc: "Sharp, confrontational, devil's advocate" },
                    ]},
                  ].map(({ sentinel, presets }) => (
                    <div key={sentinel} className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs font-semibold text-cyan-400 mb-2">{sentinel}</p>
                      <div className="flex flex-wrap gap-2">
                        {presets.map((preset) => (
                          <div
                            key={preset.id}
                            className="flex flex-col gap-0.5 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-xs"
                          >
                            <span className="font-medium text-foreground">{preset.label}</span>
                            <span className="text-muted-foreground">{preset.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60 italic">
                  Voice styles are automatically applied based on the Utterance Plan emitted by each Sentinel. Manual preset selection per Sentinel will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle>Tutorial</CardTitle>
              <CardDescription>Restart the onboarding tutorial</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Want to see the welcome tutorial again? Click the button below to restart the
                onboarding experience.
              </p>
              <Button
                onClick={() => resetOnboarding.mutate()}
                disabled={resetOnboarding.isPending}
                variant="outline"
              >
                {resetOnboarding.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restart Tutorial
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* About Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle>About {APP_TITLE}</CardTitle>
              <CardDescription>Privacy-first multi-LLM assistant platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your AI. Your Identity. Your Sovereignty.
              </p>
              <p className="text-sm text-muted-foreground">
                A privacy-first ecosystem of expressive, identity-driven AI tools designed to
                amplify human sovereignty.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
