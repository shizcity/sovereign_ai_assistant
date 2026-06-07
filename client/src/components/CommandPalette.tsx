import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { MessageSquare, Search, Clock } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Search conversations via tRPC
  const { data: results, isFetching } = trpc.conversations.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.trim().length >= 2 }
  );

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSelect = (conversationId: number) => {
    navigate(`/chat/${conversationId}`);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette modal */}
      <div className="fixed inset-x-0 top-[15vh] z-50 mx-auto max-w-xl px-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]/95 shadow-2xl shadow-black/60 ring-1 ring-cyan-500/10">
          <Command shouldFilter={false} className="bg-transparent">
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
              <Search className="w-4 h-4 text-cyan-400/70 shrink-0" />
              <CommandInput
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Search conversations…"
                className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none border-0 p-0 h-auto"
              />
              {isFetching && (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 animate-spin shrink-0" />
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30 font-sans shrink-0">
                ESC
              </kbd>
            </div>

            <CommandList className="max-h-[60vh] overflow-y-auto p-2">
              {/* Empty / hint states */}
              {debouncedQuery.trim().length < 2 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/25">
                  <MessageSquare className="w-8 h-8" />
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              )}

              {debouncedQuery.trim().length >= 2 && !isFetching && (!results || results.length === 0) && (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/25">
                    <Search className="w-8 h-8" />
                    <p className="text-sm">No conversations found for "{debouncedQuery}"</p>
                  </div>
                </CommandEmpty>
              )}

              {results && results.length > 0 && (
                <CommandGroup
                  heading={
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 px-2">
                      {results.length} result{results.length !== 1 ? "s" : ""}
                    </span>
                  }
                >
                  {results.map((result) => (
                    <CommandItem
                      key={result.conversationId}
                      value={`conv-${result.conversationId}`}
                      onSelect={() => handleSelect(result.conversationId)}
                      className="group flex flex-col items-start gap-1 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-white/6 aria-selected:bg-cyan-500/10 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400/60 shrink-0" />
                        <span className="text-sm text-white/90 font-medium truncate flex-1">
                          {result.conversationTitle || "Untitled Conversation"}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-white/25 shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(result.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {result.snippet && (
                        <p className="text-xs text-white/40 pl-5.5 leading-relaxed line-clamp-2">
                          {result.snippet}
                        </p>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator className="bg-white/5 my-1" />

              {/* Footer hint */}
              <div className="flex items-center justify-center gap-4 py-2 px-3">
                <span className="text-[10px] text-white/20 flex items-center gap-1">
                  <kbd className="font-sans bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px]">↵</kbd>
                  to open
                </span>
                <span className="text-[10px] text-white/20 flex items-center gap-1">
                  <kbd className="font-sans bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px]">↑↓</kbd>
                  to navigate
                </span>
                <span className="text-[10px] text-white/20 flex items-center gap-1">
                  <kbd className="font-sans bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px]">ESC</kbd>
                  to close
                </span>
              </div>
            </CommandList>
          </Command>
        </div>
      </div>
    </>
  );
}
