import { trpc } from "@/lib/trpc";
import { MemorySuggestionCard } from "./MemorySuggestionCard";

interface MessageSuggestionsProps {
  messageId: number;
}

export function MessageSuggestions({ messageId }: MessageSuggestionsProps) {
  const { data: suggestions, refetch } = trpc.sentinels.memories.suggestions.byMessage.useQuery(
    { messageId },
    {
      // Only fetch if messageId is valid
      enabled: messageId > 0,
      // Refetch every 5 seconds to catch new suggestions
      refetchInterval: 5000,
    }
  );

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleSuggestionUpdate = () => {
    refetch();
  };

  return (
    <div className="mt-4 space-y-2">
      {suggestions.map((suggestion) => (
        <MemorySuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onAccepted={handleSuggestionUpdate}
          onDismissed={handleSuggestionUpdate}
        />
      ))}
    </div>
  );
}
