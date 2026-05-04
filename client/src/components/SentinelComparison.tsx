import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { X, Filter, Lock, Crown, BarChart3, Zap, TrendingDown } from "lucide-react";

interface Sentinel {
  id: number;
  slug: string;
  name: string;
  symbolEmoji: string;
  archetype: string;
  primaryFunction: string;
  personalityTraits: string[];
  specialties: string[];
  primaryColor: string;
}

interface SentinelStat {
  sentinelName: string;
  sentinelEmoji: string;
  totalRounds: number;
  avgConfidence: number;
  avgLatencyMs: number;
  dissentRate: number;
}

interface SentinelComparisonProps {
  sentinels: Sentinel[];
  /** Whether the current user has Pro or Creator tier */
  isPro?: boolean;
  /** Slugs that require Pro to use */
  proOnlySlugs?: string[];
  /** Called when user clicks "Unlock Pro" on a locked column */
  onUpgrade?: () => void;
  /** Track Record stats from Round Table sessions */
  sentinelStats?: SentinelStat[];
}

export function SentinelComparison({
  sentinels,
  isPro = false,
  proOnlySlugs = [],
  onUpgrade,
  sentinelStats = [],
}: SentinelComparisonProps) {
  const [, setLocation] = useLocation();
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const isLocked = (sentinel: Sentinel) =>
    !isPro && proOnlySlugs.includes(sentinel.slug);

  // Extract all unique traits and specialties
  const allTraits = useMemo(() => {
    const traits = new Set<string>();
    sentinels.forEach((s) => s.personalityTraits.forEach((t) => traits.add(t)));
    return Array.from(traits).sort();
  }, [sentinels]);

  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    sentinels.forEach((s) => s.specialties.forEach((sp) => specialties.add(sp)));
    return Array.from(specialties).sort();
  }, [sentinels]);

  // Filter sentinels based on selected traits and specialties
  const filteredSentinels = useMemo(() => {
    if (selectedTraits.length === 0 && selectedSpecialties.length === 0) {
      return sentinels;
    }
    return sentinels.filter((sentinel) => {
      const matchesTraits =
        selectedTraits.length === 0 ||
        selectedTraits.some((trait) => sentinel.personalityTraits.includes(trait));
      const matchesSpecialties =
        selectedSpecialties.length === 0 ||
        selectedSpecialties.some((specialty) => sentinel.specialties.includes(specialty));
      return matchesTraits && matchesSpecialties;
    });
  }, [sentinels, selectedTraits, selectedSpecialties]);

  const handleStartChat = (sentinelId: number) => {
    setLocation(`/?sentinel=${sentinelId}`);
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    );
  };

  const clearFilters = () => {
    setSelectedTraits([]);
    setSelectedSpecialties([]);
  };

  const activeFilterCount = selectedTraits.length + selectedSpecialties.length;

  return (
    <div className="w-full space-y-4">
      {/* Filter Section */}
      <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-200">Filter Sentinels</h3>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-blue-500/20 text-blue-300 border-blue-500/30"
              >
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Personality Traits Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Personality Traits</label>
          <div className="flex flex-wrap gap-2">
            {allTraits.map((trait) => (
              <Badge
                key={trait}
                variant={selectedTraits.includes(trait) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedTraits.includes(trait)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700 hover:border-slate-500"
                }`}
                onClick={() => toggleTrait(trait)}
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        {/* Specialties Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Specialties</label>
          <div className="flex flex-wrap gap-2">
            {allSpecialties.map((specialty) => (
              <Badge
                key={specialty}
                variant={selectedSpecialties.includes(specialty) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedSpecialties.includes(specialty)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700 hover:border-slate-500"
                }`}
                onClick={() => toggleSpecialty(specialty)}
              >
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {activeFilterCount > 0 && (
          <div className="text-sm text-slate-400">
            Showing {filteredSentinels.length} of {sentinels.length} Sentinels
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-4 text-slate-400 font-semibold sticky left-0 bg-slate-900/95 backdrop-blur-sm z-10">
                Characteristic
              </th>
              {filteredSentinels.map((sentinel) => {
                const locked = isLocked(sentinel);
                return (
                  <th
                    key={sentinel.id}
                    className={`text-center p-4 min-w-[200px] transition-opacity ${
                      locked ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {/* Emoji with optional grayscale */}
                      <div
                        className={`text-4xl transition-all ${
                          locked ? "grayscale" : ""
                        }`}
                      >
                        {sentinel.symbolEmoji}
                      </div>

                      <div className="font-bold text-lg">{sentinel.name}</div>
                      <div className="text-sm text-slate-400">{sentinel.archetype}</div>

                      {/* Pro lock badge */}
                      {locked && (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
                          <Lock className="w-3 h-3" />
                          Pro Only
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Track Record Row — shown first if stats exist */}
            {sentinelStats.length > 0 && (
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Track Record
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">Round Table performance</p>
                </td>
                {filteredSentinels.map((sentinel) => {
                  const locked = isLocked(sentinel);
                  const stat = sentinelStats.find(s => s.sentinelName === sentinel.name);
                  return (
                    <td key={sentinel.id} className={`p-4 text-center transition-opacity ${locked ? "opacity-40" : ""}`}>
                      {stat ? (
                        <div className="space-y-3">
                          {/* Confidence */}
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Confidence</span>
                            <span className={`text-xl font-bold font-mono ${
                              stat.avgConfidence >= 80 ? "text-emerald-400" :
                              stat.avgConfidence >= 60 ? "text-cyan-400" : "text-amber-400"
                            }`}>{stat.avgConfidence}%</span>
                            <div className="w-24 h-1.5 rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${stat.avgConfidence}%`,
                                  background: stat.avgConfidence >= 80 ? "#34d399" : stat.avgConfidence >= 60 ? "#22d3ee" : "#fbbf24",
                                }}
                              />
                            </div>
                          </div>
                          {/* Latency + Dissent */}
                          <div className="flex items-center justify-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-white/40">
                              <Zap className="w-3 h-3" />
                              {stat.avgLatencyMs >= 1000
                                ? `${(stat.avgLatencyMs / 1000).toFixed(1)}s`
                                : stat.avgLatencyMs > 0 ? `${stat.avgLatencyMs}ms` : "—"}
                            </span>
                            <span className={`flex items-center gap-1 ${
                              stat.dissentRate >= 40 ? "text-red-400" :
                              stat.dissentRate >= 20 ? "text-amber-400" : "text-white/35"
                            }`}>
                              <TrendingDown className="w-3 h-3" />
                              {stat.dissentRate}% dissent
                            </span>
                          </div>
                          <span className="text-xs text-white/25">
                            {stat.totalRounds} round{stat.totalRounds !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/20 italic">No data yet</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Primary Function Row */}
            <tr className="border-b border-slate-800">
              <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm">
                Primary Function
              </td>
              {filteredSentinels.map((sentinel) => {
                const locked = isLocked(sentinel);
                return (
                  <td
                    key={sentinel.id}
                    className={`p-4 text-sm text-center transition-opacity ${
                      locked ? "opacity-40 text-slate-500" : "text-slate-300"
                    }`}
                  >
                    {sentinel.primaryFunction}
                  </td>
                );
              })}
            </tr>

            {/* Personality Traits Row */}
            <tr className="border-b border-slate-800">
              <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm">
                Personality Traits
              </td>
              {filteredSentinels.map((sentinel) => {
                const locked = isLocked(sentinel);
                return (
                  <td
                    key={sentinel.id}
                    className={`p-4 transition-opacity ${locked ? "opacity-40" : ""}`}
                  >
                    <div className="flex flex-col gap-1.5">
                      {sentinel.personalityTraits.map((trait, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={`text-xs justify-center ${
                            locked
                              ? "bg-white/5 text-slate-500 border-white/10 grayscale"
                              : "bg-white/10 text-white border-white/20"
                          }`}
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Specialties Row */}
            <tr className="border-b border-slate-800">
              <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm">
                Best For
              </td>
              {filteredSentinels.map((sentinel) => {
                const locked = isLocked(sentinel);
                return (
                  <td
                    key={sentinel.id}
                    className={`p-4 transition-opacity ${locked ? "opacity-40" : ""}`}
                  >
                    <ul
                      className={`text-sm space-y-1.5 ${
                        locked ? "text-slate-500" : "text-slate-300"
                      }`}
                    >
                      {sentinel.specialties.map((specialty, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 ${locked ? "text-slate-600" : "text-blue-400"}`}
                          >
                            •
                          </span>
                          <span>{specialty}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="p-4 sticky left-0 bg-slate-900/95 backdrop-blur-sm" />
              {filteredSentinels.map((sentinel) => {
                const locked = isLocked(sentinel);
                return (
                  <td key={sentinel.id} className="p-4 text-center">
                    {locked ? (
                      <Button
                        onClick={onUpgrade}
                        className="w-full font-semibold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #f59e0b, #ea580c)",
                          boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                        }}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Unlock Pro
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleStartChat(sentinel.id)}
                        className="w-full"
                        variant="default"
                      >
                        Start Chat
                      </Button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
