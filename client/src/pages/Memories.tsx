import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Plus, Search, Brain, Sparkles, List, Network } from "lucide-react";
import MemoryGraph from "@/components/MemoryGraph";
import { showAchievementToasts } from "@/hooks/useAchievementToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MemoryCategory = "insight" | "decision" | "milestone" | "preference" | "goal" | "achievement" | "challenge" | "pattern";

const categoryColors: Record<MemoryCategory, string> = {
  insight: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  decision: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  milestone: "bg-green-500/20 text-green-300 border-green-500/30",
  preference: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  goal: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  achievement: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  challenge: "bg-red-500/20 text-red-300 border-red-500/30",
  pattern: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};

export default function Memories() {
  const [selectedSentinel, setSelectedSentinel] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMemory, setEditingMemory] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [selectedGraphNode, setSelectedGraphNode] = useState<any>(null);

  const { data: graphData } = trpc.sentinels.memories.getGraph.useQuery(undefined, {
    enabled: viewMode === "graph",
  });

  const { data: sentinels } = trpc.sentinels.list.useQuery();
  const { data: allMemories, refetch } = trpc.sentinels.memories.listAll.useQuery();
  
  const deleteMemoryMutation = trpc.sentinels.memories.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateMemoryMutation = trpc.sentinels.memories.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingMemory(null);
    },
  });

  const createMemoryMutation = trpc.sentinels.memories.create.useMutation({
    onSuccess: (data) => {
      refetch();
      setIsCreateDialogOpen(false);
      showAchievementToasts(data?.newAchievements);
    },
  });

  // Filter memories
  const filteredMemories = allMemories?.filter((memory) => {
    const matchesSentinel = !selectedSentinel || memory.sentinelId === selectedSentinel;
    const matchesSearch =
      !searchTerm ||
      memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSentinel && matchesSearch;
  });

  // Group memories by Sentinel
  const memoriesBySentinel = filteredMemories?.reduce((acc, memory) => {
    if (!acc[memory.sentinelId]) {
      acc[memory.sentinelId] = [];
    }
    acc[memory.sentinelId].push(memory);
    return acc;
  }, {} as Record<number, any[]>);

  const handleDeleteMemory = (memoryId: number) => {
    if (confirm("Are you sure you want to delete this memory?")) {
      deleteMemoryMutation.mutate({ memoryId });
    }
  };

  const handleUpdateMemory = (memoryId: number, updates: any) => {
    updateMemoryMutation.mutate({
      memoryId,
      ...updates,
    });
  };

  const handleCreateMemory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMemoryMutation.mutate({
      sentinelId: Number(formData.get("sentinelId")),
      category: formData.get("category") as MemoryCategory,
      content: formData.get("content") as string,
      context: formData.get("context") as string,
      importance: Number(formData.get("importance")),
      tags: (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold">Sentinel Memories</h1>
            </div>
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode("graph")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "graph"
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Graph
              </button>
            </div>
          </div>
          <p className="text-gray-300 text-lg">
            View and manage memories that your Sentinels have formed through your conversations.
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sentinel Filter */}
            <div>
              <Label className="text-gray-300 mb-2 block">Filter by Sentinel</Label>
              <Select
                value={selectedSentinel?.toString() || "all"}
                onValueChange={(value) => setSelectedSentinel(value === "all" ? null : Number(value))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="All Sentinels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentinels</SelectItem>
                  {sentinels?.map((sentinel) => (
                    <SelectItem key={sentinel.id} value={sentinel.id.toString()}>
                      {sentinel.symbolEmoji} {sentinel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <Label className="text-gray-300 mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search memories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600"
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="flex items-end">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Memory
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <form onSubmit={handleCreateMemory}>
                    <DialogHeader>
                      <DialogTitle>Create New Memory</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Manually create a memory for a Sentinel.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label>Sentinel</Label>
                        <Select name="sentinelId" required>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue placeholder="Select Sentinel" />
                          </SelectTrigger>
                          <SelectContent>
                            {sentinels?.map((sentinel) => (
                              <SelectItem key={sentinel.id} value={sentinel.id.toString()}>
                                {sentinel.symbolEmoji} {sentinel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select name="category" required>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="insight">Insight</SelectItem>
                            <SelectItem value="decision">Decision</SelectItem>
                            <SelectItem value="milestone">Milestone</SelectItem>
                            <SelectItem value="preference">Preference</SelectItem>
                            <SelectItem value="goal">Goal</SelectItem>
                            <SelectItem value="achievement">Achievement</SelectItem>
                            <SelectItem value="challenge">Challenge</SelectItem>
                            <SelectItem value="pattern">Pattern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          name="content"
                          placeholder="What should the Sentinel remember?"
                          required
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label>Context (Optional)</Label>
                        <Input
                          name="context"
                          placeholder="When/why is this important?"
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label>Importance (0-100)</Label>
                        <Input
                          name="importance"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue="50"
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          name="tags"
                          placeholder="productivity, goals, habits"
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                        Create Memory
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {/* Memory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Memories</p>
                <p className="text-3xl font-bold">{allMemories?.length || 0}</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Insights</p>
                <p className="text-3xl font-bold">
                  {allMemories?.filter((m) => m.category === "insight").length || 0}
                </p>
              </div>
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Milestones</p>
                <p className="text-3xl font-bold">
                  {allMemories?.filter((m) => m.category === "milestone").length || 0}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Goals</p>
                <p className="text-3xl font-bold">
                  {allMemories?.filter((m) => m.category === "goal").length || 0}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
          </Card>
        </div>

        {/* Graph View */}
        {viewMode === "graph" && (
          <div className="mb-8">
            <Card className="bg-slate-800/50 border-slate-700 p-2 overflow-hidden" style={{ height: 560 }}>
              {graphData && graphData.nodes.length > 0 ? (
                <MemoryGraph
                  data={graphData}
                  onNodeClick={(node) => setSelectedGraphNode(node)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Network className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No memories yet — start chatting to build your memory graph.</p>
                </div>
              )}
            </Card>
            {/* Selected node detail */}
            {selectedGraphNode && (
              <Card className="mt-4 bg-slate-800/70 border-purple-500/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {selectedGraphNode.category}
                      </Badge>
                      <span className="text-xs text-slate-400">Importance: {selectedGraphNode.importance}</span>
                    </div>
                    <p className="text-white mb-2">{selectedGraphNode.content}</p>
                    {selectedGraphNode.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGraphNode.tags.map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/8 text-white/50">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSelectedGraphNode(null)} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Memories List */}
        {viewMode === "list" && memoriesBySentinel && Object.keys(memoriesBySentinel).length > 0 ? (
          Object.entries(memoriesBySentinel).map(([sentinelId, memories]) => {
            const sentinel = sentinels?.find((s) => s.id === Number(sentinelId));
            if (!sentinel) return null;

            return (
              <div key={sentinelId} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{sentinel.symbolEmoji}</span>
                  <h2 className="text-2xl font-bold">{sentinel.name}</h2>
                  <Badge variant="outline" className="ml-auto">
                    {memories.length} {memories.length === 1 ? "memory" : "memories"}
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {memories.map((memory) => (
                    <Card
                      key={memory.id}
                      className="bg-slate-800/50 border-slate-700 p-6 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={categoryColors[memory.category as MemoryCategory]}>
                              {memory.category}
                            </Badge>
                            <Badge variant="outline" className="text-gray-400">
                              Importance: {memory.importance}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(memory.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-200 mb-2">{memory.content}</p>
                          {memory.context && (
                            <p className="text-sm text-gray-400 italic mb-2">Context: {memory.context}</p>
                          )}
                          {memory.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {memory.tags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingMemory(memory)}
                            className="hover:bg-slate-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMemory(memory.id)}
                            className="hover:bg-red-900/50 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No memories yet</h3>
            <p className="text-gray-500">
              Start conversations with your Sentinels to build memories, or create one manually.
            </p>
          </Card>
        )}

        {/* Edit Memory Dialog */}
        {editingMemory && (
          <Dialog open={!!editingMemory} onOpenChange={() => setEditingMemory(null)}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white flex flex-col" style={{maxHeight: '90vh'}}>
              <form
                className="flex flex-col flex-1 overflow-hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateMemory(editingMemory.id, {
                    content: formData.get("content"),
                    context: formData.get("context"),
                    importance: Number(formData.get("importance")),
                    tags: (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean),
                  });
                }}
              >
                <DialogHeader className="shrink-0">
                  <DialogTitle>Edit Memory</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 overflow-y-auto flex-1">
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      name="content"
                      defaultValue={editingMemory.content}
                      required
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Context</Label>
                    <Input
                      name="context"
                      defaultValue={editingMemory.context || ""}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Importance (0-100)</Label>
                    <Input
                      name="importance"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={editingMemory.importance}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      name="tags"
                      defaultValue={editingMemory.tags.join(", ")}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
                <DialogFooter className="shrink-0 pt-2">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
