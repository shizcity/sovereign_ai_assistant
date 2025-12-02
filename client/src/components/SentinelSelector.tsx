import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SentinelSelectorProps {
  value?: number;
  onChange: (sentinelId: number) => void;
  disabled?: boolean;
}

export function SentinelSelector({ value, onChange, disabled }: SentinelSelectorProps) {
  const { data: sentinels, isLoading } = trpc.sentinels.list.useQuery();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!sentinels || sentinels.length === 0) {
    return null;
  }

  const selectedSentinel = sentinels.find(s => s.id === value);

  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(parseInt(val))}
      disabled={disabled}
    >
      <SelectTrigger className="w-48">
        <SelectValue>
          {selectedSentinel ? (
            <span className="flex items-center gap-2">
              <span>{selectedSentinel.symbolEmoji}</span>
              <span>{selectedSentinel.name}</span>
            </span>
          ) : (
            "Select Sentinel"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {sentinels.map((sentinel) => (
          <SelectItem key={sentinel.id} value={sentinel.id.toString()}>
            <span className="flex items-center gap-2">
              <span>{sentinel.symbolEmoji}</span>
              <span>{sentinel.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
