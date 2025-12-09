import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface Sentinel {
  id: number;
  name: string;
  symbolEmoji: string;
  archetype: string;
  primaryFunction: string;
  personalityTraits: string[];
  specialties: string[];
  primaryColor: string;
}

interface SentinelComparisonProps {
  sentinels: Sentinel[];
}

export function SentinelComparison({ sentinels }: SentinelComparisonProps) {
  const [, setLocation] = useLocation();

  const handleStartChat = (sentinelId: number) => {
    setLocation(`/?sentinel=${sentinelId}`);
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-[1200px]">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-4 text-slate-400 font-semibold sticky left-0 bg-slate-900/95 backdrop-blur-sm z-10">
              Characteristic
            </th>
            {sentinels.map((sentinel) => (
              <th
                key={sentinel.id}
                className="text-center p-4 min-w-[200px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl">{sentinel.symbolEmoji}</div>
                  <div className="font-bold text-lg">{sentinel.name}</div>
                  <div className="text-sm text-slate-400">{sentinel.archetype}</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Primary Function Row */}
          <tr className="border-b border-slate-800">
            <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm">
              Primary Function
            </td>
            {sentinels.map((sentinel) => (
              <td key={sentinel.id} className="p-4 text-sm text-slate-300 text-center">
                {sentinel.primaryFunction}
              </td>
            ))}
          </tr>

          {/* Personality Traits Row */}
          <tr className="border-b border-slate-800">
            <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm">
              Personality Traits
            </td>
            {sentinels.map((sentinel) => (
              <td key={sentinel.id} className="p-4">
                <div className="flex flex-col gap-1.5">
                  {sentinel.personalityTraits.map((trait, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs bg-white/10 text-white border-white/20 justify-center"
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </td>
            ))}
          </tr>

          {/* Specialties Row */}
          <tr className="border-b border-slate-800">
            <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm">
              Best For
            </td>
            {sentinels.map((sentinel) => (
              <td key={sentinel.id} className="p-4">
                <ul className="text-sm text-slate-300 space-y-1.5">
                  {sentinel.specialties.map((specialty, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{specialty}</span>
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>

          {/* Action Row */}
          <tr>
            <td className="p-4 sticky left-0 bg-slate-900/95 backdrop-blur-sm"></td>
            {sentinels.map((sentinel) => (
              <td key={sentinel.id} className="p-4 text-center">
                <Button
                  onClick={() => handleStartChat(sentinel.id)}
                  className="w-full"
                  variant="default"
                >
                  Start Chat
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
