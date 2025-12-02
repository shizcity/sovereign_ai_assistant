import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const REACTION_EMOJIS = ["👍", "👎", "❤️", "😄", "🤔"];

interface MessageReactionsProps {
  messageId: number;
}

export function MessageReactions({ messageId }: MessageReactionsProps) {
  const utils = trpc.useUtils();
  
  // Fetch reactions for this message
  const { data: reactions = [] } = trpc.reactions.list.useQuery({ messageId });
  
  // Get current user's reactions
  const { data: user } = trpc.auth.me.useQuery();
  const userReactions = new Set(
    reactions
      .filter((r) => r.userIds.includes(user?.id || 0))
      .map((r) => r.emoji)
  );

  // Add reaction mutation
  const addReaction = trpc.reactions.add.useMutation({
    onSuccess: () => {
      utils.reactions.list.invalidate({ messageId });
    },
    onError: (error) => {
      toast.error(`Failed to add reaction: ${error.message}`);
    },
  });

  // Remove reaction mutation
  const removeReaction = trpc.reactions.remove.useMutation({
    onSuccess: () => {
      utils.reactions.list.invalidate({ messageId });
    },
    onError: (error) => {
      toast.error(`Failed to remove reaction: ${error.message}`);
    },
  });

  const handleReactionClick = (emoji: string) => {
    if (userReactions.has(emoji)) {
      removeReaction.mutate({ messageId, emoji });
    } else {
      addReaction.mutate({ messageId, emoji });
    }
  };

  const getReactionCount = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    return reaction?.count || 0;
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {REACTION_EMOJIS.map((emoji) => {
        const count = getReactionCount(emoji);
        const isActive = userReactions.has(emoji);
        
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all
              ${
                isActive
                  ? "bg-blue-600/30 border-2 border-blue-500/50 scale-110"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }
            `}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && (
              <span className={`text-xs ${isActive ? "text-blue-300 font-semibold" : "text-gray-400"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
