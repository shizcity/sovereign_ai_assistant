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

interface SentinelSelectorProps {
  value?: number;
  onChange: (sentinelId: number) => void;
  disabled?: boolean;
}

// Custom Sentinels are merged into the list with id >= 100001 (offset applied on server)
// They also carry an `isCustom: true` flag when returned from the Creator-tier list path.
const isCustomSentinel = (sentinel: { id: number; isCustom?: boolean }) =>
  sentinel.isCustom === true || sentinel.id >= 100001;

export function SentinelSelector({ value, onChange, disabled }: SentinelSelectorProps) {
  const { data: sentinels, isLoading } = trpc.sentinels.list.useQuery();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!sentinels || sentinels.length === 0) {
    return null;
  }

  const builtIn = sentinels.filter((s) => !isCustomSentinel(s));
  const custom = sentinels.filter((s) => isCustomSentinel(s));

  const selectedSentinel = sentinels.find((s) => s.id === value);
  const selectedIsCustom = selectedSentinel ? isCustomSentinel(selectedSentinel) : false;

  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(parseInt(val))}
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
            {custom.length > 0 && (
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
        {custom.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground px-2 py-1">
              My Sentinels
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
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
