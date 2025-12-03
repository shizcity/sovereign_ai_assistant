import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Edit, Lightbulb, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface MemorySuggestionCardProps {
  suggestion: {
    id: number;
    content: string;
    category: string;
    importance: number;
    tags: string[];
    reasoning?: string;
  };
  onAccepted?: () => void;
  onDismissed?: () => void;
}

export function MemorySuggestionCard({ suggestion, onAccepted, onDismissed }: MemorySuggestionCardProps) {

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(suggestion.content);
  const [editedTags, setEditedTags] = useState(suggestion.tags.join(", "));

  const acceptMutation = trpc.sentinels.memories.suggestions.accept.useMutation({
    onSuccess: () => {
      toast.success("Memory saved!", {
        description: "This moment has been added to your memories.",
      });
      onAccepted?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const dismissMutation = trpc.sentinels.memories.suggestions.dismiss.useMutation({
    onSuccess: () => {
      toast.info("Suggestion dismissed", {
        description: "This suggestion has been removed.",
      });
      onDismissed?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const editAndAcceptMutation = trpc.sentinels.memories.suggestions.editAndAccept.useMutation({
    onSuccess: () => {
      toast.success("Memory saved!", {
        description: "Your edited memory has been saved.",
      });
      setIsEditDialogOpen(false);
      onAccepted?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleAccept = () => {
    acceptMutation.mutate({
      suggestionId: suggestion.id,
      saveAsMemory: true,
    });
  };

  const handleDismiss = () => {
    dismissMutation.mutate({
      suggestionId: suggestion.id,
    });
  };

  const handleEditAndAccept = () => {
    editAndAcceptMutation.mutate({
      suggestionId: suggestion.id,
      content: editedContent,
      tags: editedTags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      insight: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      decision: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      goal: "bg-green-500/10 text-green-500 border-green-500/20",
      milestone: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      achievement: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      preference: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      challenge: "bg-red-500/10 text-red-500 border-red-500/20",
      pattern: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    };
    return colors[category] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const getImportanceLabel = (importance: number) => {
    if (importance >= 80) return "Very Important";
    if (importance >= 60) return "Important";
    if (importance >= 40) return "Useful";
    return "Minor";
  };

  return (
    <>
      <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={getCategoryColor(suggestion.category)}>
                    {suggestion.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getImportanceLabel(suggestion.importance)}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">{suggestion.content}</p>
                {suggestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {suggestion.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {suggestion.reasoning && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Why save this?
                    </summary>
                    <p className="mt-1 pl-4">{suggestion.reasoning}</p>
                  </details>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={dismissMutation.isPending}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={4}
                placeholder="Edit the memory content..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
              <input
                type="text"
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="productivity, goals, planning"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditAndAccept}
              disabled={editAndAcceptMutation.isPending || !editedContent.trim()}
            >
              Save Memory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
