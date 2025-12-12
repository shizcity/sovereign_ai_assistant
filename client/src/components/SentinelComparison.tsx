import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { X, Filter } from "lucide-react";

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
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Extract all unique traits and specialties
  const allTraits = useMemo(() => {
    const traits = new Set<string>();
    sentinels.forEach(s => s.personalityTraits.forEach(t => traits.add(t)));
    return Array.from(traits).sort();
  }, [sentinels]);

  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    sentinels.forEach(s => s.specialties.forEach(sp => specialties.add(sp)));
    return Array.from(specialties).sort();
  }, [sentinels]);

  // Filter sentinels based on selected traits and specialties
  const filteredSentinels = useMemo(() => {
    if (selectedTraits.length === 0 && selectedSpecialties.length === 0) {
      return sentinels;
    }

    return sentinels.filter(sentinel => {
      const matchesTraits = selectedTraits.length === 0 || 
        selectedTraits.some(trait => sentinel.personalityTraits.includes(trait));
      const matchesSpecialties = selectedSpecialties.length === 0 || 
        selectedSpecialties.some(specialty => sentinel.specialties.includes(specialty));
      return matchesTraits && matchesSpecialties;
    });
  }, [sentinels, selectedTraits, selectedSpecialties]);

  const handleStartChat = (sentinelId: number) => {
    setLocation(`/?sentinel=${sentinelId}`);
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    );
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
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
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
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
            {allTraits.map(trait => (
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
            {allSpecialties.map(specialty => (
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
            {filteredSentinels.map((sentinel) => (
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
            {filteredSentinels.map((sentinel) => (
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
            {filteredSentinels.map((sentinel) => (
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
            {filteredSentinels.map((sentinel) => (
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
            {filteredSentinels.map((sentinel) => (
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
    </div>
  );
}
