import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Pencil, Trash2, Sparkles, Lock, Wand2, X, Check,
  ChevronRight, Loader2, Crown, RefreshCw
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomSentinel {
  id: number;
  name: string;
  slug: string;
  archetype: string;
  primaryFunction: string;
  personalityTraits: string;
  communicationStyle: string;
  specializationDomains: string;
  primaryColor: string;
  symbolEmoji: string;
  systemPrompt: string;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SentinelFormData {
  name: string;
  archetype: string;
  primaryFunction: string;
  personalityTraits: string[];
  communicationStyle: string;
  specializationDomains: string[];
  primaryColor: string;
  symbolEmoji: string;
  systemPrompt: string;
}

const EMPTY_FORM: SentinelFormData = {
  name: "",
  archetype: "",
  primaryFunction: "",
  personalityTraits: [],
  communicationStyle: "",
  specializationDomains: [],
  primaryColor: "#8b5cf6",
  symbolEmoji: "✨",
  systemPrompt: "",
};

const PRESET_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#3b82f6", "#f97316",
];

const PRESET_EMOJIS = ["✨", "🔮", "⚡", "🌙", "🔥", "🌊", "🎯", "🧠", "🦋", "🌟", "💡", "🎭"];

// ─── Upgrade Card ─────────────────────────────────────────────────────────────

function CreatorUpgradeCard() {
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data: { url: string | null }) => {
      if (data.url) window.open(data.url, "_blank");
      toast.info("Redirecting to checkout…");
    },
    onError: () => toast.error("Could not start checkout. Please try again."),
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4">
            <Crown className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Creator Tier</h1>
          <p className="text-gray-400">Build your own AI Sentinels with custom personalities, expertise, and communication styles.</p>
        </div>

        <Card className="bg-white/5 border-amber-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              What you get
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Create up to 5 custom AI Sentinels",
              "Full personality & system prompt control",
              "Custom name, emoji, and color identity",
              "All Pro features included (voice, unlimited messages, 6 built-in Sentinels)",
              "Custom Sentinels available in every conversation",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                {f}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <div className="text-center w-full">
              <span className="text-3xl font-bold text-white">$29</span>
              <span className="text-gray-400">/month</span>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
              onClick={() => createCheckout.mutate()}
              disabled={createCheckout.isPending}
            >
              {createCheckout.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening checkout…</>
              ) : (
                <><Crown className="w-4 h-4 mr-2" />Upgrade to Creator</>
              )}
            </Button>
            <Link href="/chat">
              <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  label,
  placeholder,
  values,
  onChange,
  max = 10,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed) && values.length < max) {
      onChange([...values, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-gray-300">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={values.length >= max} className="border-white/20 text-gray-300 hover:text-white bg-transparent">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="bg-white/10 text-gray-200 border-white/20 flex items-center gap-1">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ─── Sentinel Form ────────────────────────────────────────────────────────────

function SentinelForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial: SentinelFormData;
  onSubmit: (data: SentinelFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<SentinelFormData>(initial);
  const set = (key: keyof SentinelFormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [hasGenerated, setHasGenerated] = useState(false);

  const generatePrompt = trpc.sentinels.custom.generatePrompt.useMutation({
    onSuccess: (data) => {
      set("systemPrompt", data.prompt);
      setHasGenerated(true);
      toast.success(hasGenerated ? "Prompt regenerated!" : "System prompt generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const canGenerate =
    form.name.length >= 2 &&
    form.archetype.length >= 2 &&
    form.primaryFunction.length >= 10;

  const valid =
    form.name.length >= 2 &&
    form.archetype.length >= 2 &&
    form.primaryFunction.length >= 10 &&
    form.personalityTraits.length >= 1 &&
    form.communicationStyle.length >= 5 &&
    form.specializationDomains.length >= 1 &&
    form.systemPrompt.length >= 20;

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Nexus"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Archetype *</Label>
          <Input
            value={form.archetype}
            onChange={(e) => set("archetype", e.target.value)}
            placeholder="e.g. Strategic Analyst"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Visual identity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Symbol Emoji</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => set("symbolEmoji", e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  form.symbolEmoji === e
                    ? "bg-white/20 ring-2 ring-white/40"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                {e}
              </button>
            ))}
            <Input
              value={form.symbolEmoji}
              onChange={(e) => set("symbolEmoji", e.target.value.slice(0, 2))}
              placeholder="or type"
              className="w-20 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-center"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Color</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("primaryColor", c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  form.primaryColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
              title="Custom color"
            />
          </div>
        </div>
      </div>

      {/* Primary function */}
      <div className="space-y-2">
        <Label className="text-gray-300">Primary Function * <span className="text-gray-500 font-normal">(what this Sentinel does)</span></Label>
        <Textarea
          value={form.primaryFunction}
          onChange={(e) => set("primaryFunction", e.target.value)}
          placeholder="e.g. Analyzes complex data patterns and provides strategic recommendations based on quantitative insights."
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none h-20"
        />
      </div>

      {/* Communication style */}
      <div className="space-y-2">
        <Label className="text-gray-300">Communication Style * <span className="text-gray-500 font-normal">(how it speaks)</span></Label>
        <Input
          value={form.communicationStyle}
          onChange={(e) => set("communicationStyle", e.target.value)}
          placeholder="e.g. Precise, data-driven, uses structured frameworks"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Tags */}
      <TagInput
        label="Personality Traits * (press Enter to add)"
        placeholder="e.g. analytical"
        values={form.personalityTraits}
        onChange={(v) => set("personalityTraits", v)}
      />
      <TagInput
        label="Specialization Domains * (press Enter to add)"
        placeholder="e.g. finance"
        values={form.specializationDomains}
        onChange={(v) => set("specializationDomains", v)}
      />

      {/* System prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-300">System Prompt * <span className="text-gray-500 font-normal">(the core instruction)</span></Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              generatePrompt.mutate({
                name: form.name,
                archetype: form.archetype,
                primaryFunction: form.primaryFunction,
                personalityTraits: form.personalityTraits,
                communicationStyle: form.communicationStyle,
                specializationDomains: form.specializationDomains,
              })
            }
            disabled={!canGenerate || generatePrompt.isPending}
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 bg-transparent text-xs h-7 px-2.5"
          >
            {generatePrompt.isPending ? (
              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generating…</>
            ) : (
              <><Sparkles className="w-3 h-3 mr-1.5" />Generate for me</>
            )}
          </Button>
        </div>
        <Textarea
          value={form.systemPrompt}
          onChange={(e) => set("systemPrompt", e.target.value)}
          placeholder="You are [Name], a [archetype] who specializes in... Your communication style is... You always..."
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none h-32"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Fill in Name, Archetype, and Primary Function above to unlock AI generation.</p>
          {hasGenerated && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                generatePrompt.mutate({
                  name: form.name,
                  archetype: form.archetype,
                  primaryFunction: form.primaryFunction,
                  personalityTraits: form.personalityTraits,
                  communicationStyle: form.communicationStyle,
                  specializationDomains: form.specializationDomains,
                })
              }
              disabled={!canGenerate || generatePrompt.isPending}
              className="text-xs text-gray-400 hover:text-amber-400 transition-colors h-6 px-2"
            >
              {generatePrompt.isPending ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Regenerating…</>
              ) : (
                <><RefreshCw className="w-3 h-3 mr-1" />Try again</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      {form.name && (
        <div className="rounded-xl p-4 bg-white/5 border border-white/10 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${form.primaryColor}22`, border: `1px solid ${form.primaryColor}55` }}
          >
            {form.symbolEmoji}
          </div>
          <div>
            <p className="font-semibold text-white">{form.name || "Unnamed"}</p>
            <p className="text-sm text-gray-400">{form.archetype || "Archetype"}</p>
            {form.personalityTraits.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {form.personalityTraits.slice(0, 3).map((t) => (
                  <Badge key={t} variant="outline" className="text-xs border-white/20 text-gray-400">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={!valid || isLoading}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Wand2 className="w-4 h-4 mr-2" />Save Sentinel</>}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-gray-300 hover:text-white bg-transparent">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MySentinels() {
  const { user } = useAuth();
  const tier = (user?.subscriptionTier ?? "free").toLowerCase();
  const isCreator = tier === "creator";

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomSentinel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomSentinel | null>(null);

  const utils = trpc.useUtils();

  const { data: sentinels = [], isLoading } = trpc.sentinels.custom.list.useQuery(undefined, {
    enabled: isCreator,
  });

  const createMutation = trpc.sentinels.custom.create.useMutation({
    onSuccess: () => {
      toast.success("Sentinel created!");
      utils.sentinels.custom.list.invalidate();
      utils.sentinels.list.invalidate();
      setShowCreate(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.sentinels.custom.update.useMutation({
    onSuccess: () => {
      toast.success("Sentinel updated!");
      utils.sentinels.custom.list.invalidate();
      utils.sentinels.list.invalidate();
      setEditTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.sentinels.custom.delete.useMutation({
    onSuccess: () => {
      toast.success("Sentinel deleted.");
      utils.sentinels.custom.list.invalidate();
      utils.sentinels.list.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isCreator) return <CreatorUpgradeCard />;

  const parseTraits = (raw: string): string[] => {
    try { return JSON.parse(raw); } catch { return raw.split(",").map((s) => s.trim()).filter(Boolean); }
  };

  const toFormData = (s: CustomSentinel): SentinelFormData => ({
    name: s.name,
    archetype: s.archetype,
    primaryFunction: s.primaryFunction,
    personalityTraits: parseTraits(s.personalityTraits),
    communicationStyle: s.communicationStyle,
    specializationDomains: parseTraits(s.specializationDomains),
    primaryColor: s.primaryColor,
    symbolEmoji: s.symbolEmoji,
    systemPrompt: s.systemPrompt,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h1 className="text-lg font-semibold">My Sentinels</h1>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">Creator</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{sentinels.length} / 5 created</span>
            <Button
              onClick={() => setShowCreate(true)}
              disabled={sentinels.length >= 5}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Sentinel
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-[#0f0f1a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-amber-400" />
                Create a New Sentinel
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Define your Sentinel's identity, personality, and expertise.
              </DialogDescription>
            </DialogHeader>
            <SentinelForm
              initial={EMPTY_FORM}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowCreate(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editTarget && (
          <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
            <DialogContent className="bg-[#0f0f1a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-400" />
                  Edit {editTarget.name}
                </DialogTitle>
              </DialogHeader>
              <SentinelForm
                initial={toFormData(editTarget)}
                onSubmit={(data) => updateMutation.mutate({ id: editTarget.id, ...data })}
                onCancel={() => setEditTarget(null)}
                isLoading={updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirm Dialog */}
        {deleteTarget && (
          <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
            <DialogContent className="bg-[#0f0f1a] border-white/10 text-white max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget.name}?</DialogTitle>
                <DialogDescription className="text-gray-400">
                  This Sentinel will be permanently removed. Conversations that used it will keep their message history.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-white/20 text-gray-300 bg-transparent">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate({ id: deleteTarget.id })}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : sentinels.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <Sparkles className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No custom Sentinels yet</h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Create your first Sentinel — give it a unique personality, expertise, and communication style.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Sentinel
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sentinels.map((s) => {
              const traits = parseTraits(s.personalityTraits);
              const domains = parseTraits(s.specializationDomains);
              return (
                <Card key={s.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: `${s.primaryColor}22`, border: `1px solid ${s.primaryColor}55` }}
                        >
                          {s.symbolEmoji}
                        </div>
                        <div>
                          <CardTitle className="text-white text-base">{s.name}</CardTitle>
                          <CardDescription className="text-gray-400 text-xs">{s.archetype}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-white"
                          onClick={() => setEditTarget(s)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-400"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-3">
                    <p className="text-sm text-gray-300 line-clamp-2">{s.primaryFunction}</p>
                    <div className="flex flex-wrap gap-1">
                      {traits.slice(0, 4).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs border-white/20 text-gray-400">{t}</Badge>
                      ))}
                    </div>
                    {domains.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {domains.slice(0, 3).map((d) => (
                          <Badge
                            key={d}
                            className="text-xs"
                            style={{ backgroundColor: `${s.primaryColor}22`, color: s.primaryColor, borderColor: `${s.primaryColor}44` }}
                          >
                            {d}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link href="/chat">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">
                        Use in Chat
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}

            {/* Slot placeholders */}
            {Array.from({ length: Math.max(0, 5 - sentinels.length) }).map((_, i) => (
              <button
                key={`slot-${i}`}
                onClick={() => setShowCreate(true)}
                className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-400 hover:border-white/20 transition-all group"
              >
                <Plus className="w-8 h-8 group-hover:text-amber-400 transition-colors" />
                <span className="text-sm">Empty slot</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
