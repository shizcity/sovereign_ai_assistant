<<<<<<< Updated upstream
import { useState, useCallback } from "react";
=======
import { useState } from "react";
>>>>>>> Stashed changes
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
<<<<<<< Updated upstream
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GitBranch,
  Loader2,
  Save,
  Play,
  Link2,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
=======
  ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, GitBranch,
  Loader2, Save, Play, Link2,
} from "lucide-react";

>>>>>>> Stashed changes
interface PipelineStep {
  token: string;
  title: string;
  description: string | null;
  language: string;
  framework: string | null;
}

<<<<<<< Updated upstream
// ─── OrchestrationBuilder ─────────────────────────────────────────────────────
export default function OrchestrationBuilder() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // The blueprint this orchestration belongs to (selected from user's blueprints)
=======
export default function OrchestrationBuilder() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
>>>>>>> Stashed changes
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<number | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [tokenInput, setTokenInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [saved, setSaved] = useState(false);

<<<<<<< Updated upstream
  // Fetch user's blueprints
  const { data: userBlueprints, isLoading: loadingBlueprints } = trpc.blueprints.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Resolve a blueprint by share token
  const resolveTokens = trpc.blueprints.resolveOrchestration.useQuery(
    { tokens: pipeline.map((s) => s.token) },
    { enabled: false }
  );

  // Save orchestration mutation
=======
  const { data: userBlueprints, isLoading: loadingBlueprints } = trpc.blueprints.list.useQuery(
    undefined, { enabled: !!user }
  );

  const utils = trpc.useUtils();

>>>>>>> Stashed changes
  const saveOrchestration = trpc.blueprints.saveOrchestration.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Orchestration pipeline saved!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });

<<<<<<< Updated upstream
  // Resolve a single token and add to pipeline
=======
>>>>>>> Stashed changes
  async function handleAddToken() {
    const token = tokenInput.trim();
    if (!token) return;
    if (pipeline.some((s) => s.token === token)) {
      toast.error("This blueprint is already in the pipeline.");
      return;
    }
    setResolving(true);
    try {
<<<<<<< Updated upstream
      const result = await trpc.useUtils().blueprints.resolveOrchestration.fetch({ tokens: [token] });
=======
      const result = await utils.blueprints.resolveOrchestration.fetch({ tokens: [token] });
>>>>>>> Stashed changes
      if (!result || result.length === 0) {
        toast.error("Blueprint not found. Make sure it is public and the token is correct.");
        return;
      }
      const bp = result[0];
      setPipeline((prev) => [
        ...prev,
<<<<<<< Updated upstream
        { token: bp.shareToken, title: bp.title, description: bp.description, language: bp.language, framework: bp.framework },
=======
        { token: bp.shareToken, title: bp.title, description: bp.description ?? null, language: bp.language, framework: bp.framework ?? null },
>>>>>>> Stashed changes
      ]);
      setTokenInput("");
    } catch {
      toast.error("Failed to resolve blueprint token.");
    } finally {
      setResolving(false);
    }
  }

  function moveStep(index: number, direction: "up" | "down") {
    const newPipeline = [...pipeline];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPipeline.length) return;
    [newPipeline[index], newPipeline[targetIndex]] = [newPipeline[targetIndex], newPipeline[index]];
    setPipeline(newPipeline);
  }

  function removeStep(index: number) {
    setPipeline((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!selectedBlueprintId) {
      toast.error("Please select a blueprint to attach this orchestration to.");
      return;
    }
    if (pipeline.length < 2) {
      toast.error("An orchestration pipeline needs at least 2 steps.");
      return;
    }
    saveOrchestration.mutate({
      blueprintId: selectedBlueprintId,
      subAgentTokens: pipeline.map((s) => s.token),
    });
  }

  const LANG_COLORS: Record<string, string> = {
    python: "text-yellow-400",
    javascript: "text-amber-400",
    typescript: "text-blue-400",
    bash: "text-emerald-400",
    sql: "text-violet-400",
  };

  return (
    <div className="min-h-screen bg-[#050810] text-white">
<<<<<<< Updated upstream
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0a0e1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/my-blueprints")}
            className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
=======
      <div className="border-b border-white/8 bg-[#0a0e1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/my-blueprints")} className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors">
>>>>>>> Stashed changes
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-bold text-white">Orchestration Builder</h1>
          </div>
<<<<<<< Updated upstream
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saveOrchestration.isPending || pipeline.length < 2 || !selectedBlueprintId}
              size="sm"
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {saveOrchestration.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
=======
          <div className="ml-auto">
            <Button onClick={handleSave} disabled={saveOrchestration.isPending || pipeline.length < 2 || !selectedBlueprintId} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">
              {saveOrchestration.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
>>>>>>> Stashed changes
              {saved ? "Saved!" : "Save Pipeline"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
<<<<<<< Updated upstream
        {/* Explainer */}
=======
>>>>>>> Stashed changes
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-4">
          <h2 className="text-sm font-semibold text-violet-300 mb-1">What is Orchestration?</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Chain multiple agent blueprints into a sequential pipeline. Each step receives the output of the
            previous step as its input — enabling complex, multi-stage AI workflows without writing glue code.
          </p>
        </div>

<<<<<<< Updated upstream
        {/* Step 1: Select parent blueprint */}
=======
>>>>>>> Stashed changes
        <section>
          <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-xs flex items-center justify-center font-bold">1</span>
            Attach to a Blueprint
          </h3>
          {loadingBlueprints ? (
<<<<<<< Updated upstream
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your blueprints…
            </div>
          ) : !userBlueprints?.length ? (
            <div className="text-sm text-white/40">
              You have no blueprints yet.{" "}
              <button onClick={() => navigate("/code-playground")} className="text-violet-400 hover:underline">
                Create one in the Playground
              </button>
              .
=======
            <div className="flex items-center gap-2 text-white/40 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : !userBlueprints?.length ? (
            <div className="text-sm text-white/40">
              No blueprints yet.{" "}
              <button onClick={() => navigate("/code-playground")} className="text-violet-400 hover:underline">Create one in the Playground</button>.
>>>>>>> Stashed changes
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {userBlueprints.map((bp) => (
<<<<<<< Updated upstream
                <button
                  key={bp.id}
                  onClick={() => setSelectedBlueprintId(bp.id === selectedBlueprintId ? null : bp.id)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    bp.id === selectedBlueprintId
                      ? "border-violet-500/60 bg-violet-500/10 text-white"
                      : "border-white/8 bg-white/3 text-white/60 hover:border-white/15 hover:text-white/80"
                  }`}
                >
=======
                <button key={bp.id} onClick={() => setSelectedBlueprintId(bp.id === selectedBlueprintId ? null : bp.id)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${bp.id === selectedBlueprintId ? "border-violet-500/60 bg-violet-500/10 text-white" : "border-white/8 bg-white/3 text-white/60 hover:border-white/15 hover:text-white/80"}`}>
>>>>>>> Stashed changes
                  <div className="font-medium text-sm truncate">{bp.title}</div>
                  <div className="text-xs text-white/40 mt-0.5 capitalize">{bp.language}</div>
                </button>
              ))}
            </div>
          )}
        </section>

<<<<<<< Updated upstream
        {/* Step 2: Build pipeline */}
=======
>>>>>>> Stashed changes
        <section>
          <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-xs flex items-center justify-center font-bold">2</span>
            Build the Pipeline
          </h3>
<<<<<<< Updated upstream

          {/* Add step by token */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddToken()}
                placeholder="Paste a blueprint share token…"
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50"
              />
            </div>
            <Button
              onClick={handleAddToken}
              disabled={resolving || !tokenInput.trim()}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0"
            >
=======
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddToken()}
                placeholder="Paste a blueprint share token…"
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50" />
            </div>
            <Button onClick={handleAddToken} disabled={resolving || !tokenInput.trim()} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0">
>>>>>>> Stashed changes
              {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Step
            </Button>
          </div>

<<<<<<< Updated upstream
          {/* Pipeline visualization */}
=======
>>>>>>> Stashed changes
          {pipeline.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
              <GitBranch className="w-8 h-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/30">No steps yet. Add a blueprint share token above to start building.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pipeline.map((step, index) => (
                <div key={step.token} className="flex items-stretch gap-2">
<<<<<<< Updated upstream
                  {/* Connector */}
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      index === 0 ? "bg-cyan-600/30 text-cyan-400 border border-cyan-500/30" :
                      index === pipeline.length - 1 ? "bg-emerald-600/30 text-emerald-400 border border-emerald-500/30" :
                      "bg-violet-600/30 text-violet-400 border border-violet-500/30"
                    }`}>
                      {index + 1}
                    </div>
                    {index < pipeline.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 my-1" />
                    )}
                  </div>

                  {/* Step card */}
                  <div className="flex-1 rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{step.title}</div>
                      {step.description && (
                        <div className="text-xs text-white/40 mt-0.5 truncate">{step.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-mono capitalize ${LANG_COLORS[step.language] ?? "text-white/40"}`}>
                          {step.language}
                        </span>
                        {step.framework && step.framework !== "custom" && (
                          <span className="text-xs text-white/30">{step.framework}</span>
                        )}
                      </div>
                    </div>
                    {/* Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveStep(index, "down")}
                        disabled={index === pipeline.length - 1}
                        className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeStep(index)}
                        className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
=======
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${index === 0 ? "bg-cyan-600/30 text-cyan-400 border border-cyan-500/30" : index === pipeline.length - 1 ? "bg-emerald-600/30 text-emerald-400 border border-emerald-500/30" : "bg-violet-600/30 text-violet-400 border border-violet-500/30"}`}>
                      {index + 1}
                    </div>
                    {index < pipeline.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}
                  </div>
                  <div className="flex-1 rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{step.title}</div>
                      {step.description && <div className="text-xs text-white/40 mt-0.5 truncate">{step.description}</div>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-mono capitalize ${LANG_COLORS[step.language] ?? "text-white/40"}`}>{step.language}</span>
                        {step.framework && step.framework !== "custom" && <span className="text-xs text-white/30">{step.framework}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveStep(index, "up")} disabled={index === 0} className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveStep(index, "down")} disabled={index === pipeline.length - 1} className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeStep(index)} className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
>>>>>>> Stashed changes
                    </div>
                  </div>
                </div>
              ))}
<<<<<<< Updated upstream

              {/* Pipeline summary */}
              <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {pipeline.length} step{pipeline.length !== 1 ? "s" : ""} in pipeline
                  {pipeline.length >= 2 ? " — ready to save" : " — add at least 2 steps"}
                </span>
=======
              <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{pipeline.length} step{pipeline.length !== 1 ? "s" : ""} in pipeline{pipeline.length >= 2 ? " — ready to save" : " — add at least 2 steps"}</span>
>>>>>>> Stashed changes
              </div>
            </div>
          )}
        </section>

<<<<<<< Updated upstream
        {/* Step 3: Save */}
=======
>>>>>>> Stashed changes
        {pipeline.length >= 2 && selectedBlueprintId && (
          <section>
            <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-xs flex items-center justify-center font-bold">3</span>
              Save &amp; Share
            </h3>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-300 font-medium">Pipeline ready</p>
<<<<<<< Updated upstream
                <p className="text-xs text-white/40 mt-0.5">
                  This orchestration will be saved to your blueprint and visible in the Marketplace.
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saveOrchestration.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
              >
                {saveOrchestration.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
=======
                <p className="text-xs text-white/40 mt-0.5">This orchestration will be saved to your blueprint and visible in the Marketplace.</p>
              </div>
              <Button onClick={handleSave} disabled={saveOrchestration.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0">
                {saveOrchestration.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
>>>>>>> Stashed changes
                Save Pipeline
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
