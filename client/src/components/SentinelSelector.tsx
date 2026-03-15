import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Plus, Wand2 } from "lucide-react";

const MAX_CUSTOM_SENTINELS = 5;

interface SentinelSelectorProps {
  value?: number;
  onChange: (sentinelId: number) => void;
  disabled?: boolean;
}

// Custom Sentinels are merged into the list with id >= 100001 (offset applied on server)
// They also carry an `isCustom: true` flag when returned from the Creator-tier list path.
const isCustomSentinel = (sentinel: { id: number; isCustom?: boolean }) =>
  sentinel.isCustom === true || sentinel.id >= 100001;

// Sentinel value used as a sentinel (pun intended) for the quick-create action
const QUICK_CREATE_VALUE = "__quick_create__";

export function SentinelSelector({ value, onChange, disabled }: SentinelSelectorProps) {
  const { data: sentinels, isLoading } = trpc.sentinels.list.useQuery();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const tier = (user?.subscriptionTier ?? "free").toLowerCase();
  const isCreator = tier === "creator";

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!sentinels || sentinels.length === 0) {
    return null;
  }

  const builtIn = sentinels.filter((s) => !isCustomSentinel(s));
  const custom = sentinels.filter((s) => isCustomSentinel(s));
  const canCreateMore = isCreator && custom.length < MAX_CUSTOM_SENTINELS;

  const selectedSentinel = sentinels.find((s) => s.id === value);
  const selectedIsCustom = selectedSentinel ? isCustomSentinel(selectedSentinel) : false;

  const handleValueChange = (val: string) => {
    if (val === QUICK_CREATE_VALUE) {
      navigate("/my-sentinels");
      return;
    }
    onChange(parseInt(val));
  };

  return (
    <Select
      value={value?.toString()}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-52">
        <SelectValue>
          {selectedSentinel ? (
            <span className="flex items-center gap-2">
              <span>{selectedSentinel.symbolEmoji}</span>
              <span>{selectedSentinel.name}</span>
              {selectedIsCustom && (
                <Badge
                  className="text-[10px] px-1.5 py-0 h-4 leading-none"
                  style={{
                    backgroundColor: `${selectedSentinel.primaryColor}33`,
                    color: selectedSentinel.primaryColor,
                    borderColor: `${selectedSentinel.primaryColor}66`,
                  }}
                >
                  Custom
                </Badge>
              )}
            </span>
          ) : (
            "Select Sentinel"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Built-in Sentinels */}
        {builtIn.length > 0 && (
          <SelectGroup>
            {(custom.length > 0 || canCreateMore) && (
              <SelectLabel className="text-xs text-muted-foreground px-2 py-1">
                Sentinels
              </SelectLabel>
            )}
            {builtIn.map((sentinel) => (
              <SelectItem key={sentinel.id} value={sentinel.id.toString()}>
                <span className="flex items-center gap-2">
                  <span>{sentinel.symbolEmoji}</span>
                  <span>{sentinel.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* Custom Sentinels — only visible to Creator-tier users */}
        {(custom.length > 0 || canCreateMore) && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1.5">
              <Wand2 className="h-3 w-3 text-amber-400" />
              My Sentinels
              {isCreator && (
                <span className="ml-auto text-[10px] text-gray-500">
                  {custom.length}/{MAX_CUSTOM_SENTINELS}
                </span>
              )}
            </SelectLabel>

            {custom.map((sentinel) => (
              <SelectItem key={sentinel.id} value={sentinel.id.toString()}>
                <span className="flex items-center gap-2">
                  <span>{sentinel.symbolEmoji}</span>
                  <span>{sentinel.name}</span>
                  <Badge
                    className="text-[10px] px-1.5 py-0 h-4 leading-none ml-1"
                    style={{
                      backgroundColor: `${sentinel.primaryColor}33`,
                      color: sentinel.primaryColor,
                      borderColor: `${sentinel.primaryColor}66`,
                    }}
                  >
                    Custom
                  </Badge>
                </span>
              </SelectItem>
            ))}

            {/* Quick-create shortcut — shown when under the 5-Sentinel cap */}
            {canCreateMore && (
              <SelectItem
                value={QUICK_CREATE_VALUE}
                className="text-amber-400 hover:text-amber-300 focus:text-amber-300 cursor-pointer border-t border-white/5 mt-1 pt-1"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-sm">Create new Sentinel</span>
                </span>
              </SelectItem>
            )}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
