import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Sentinels() {
  const { data: sentinels, isLoading } = trpc.sentinels.list.useQuery();
  const [selectedSentinel, setSelectedSentinel] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Meet the Sentinels - Sovereign AI Assistant";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const selected = sentinels?.find((s) => s.id === selectedSentinel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="container max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Meet the Sentinels
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Your AI companions, each with a unique personality, expertise, and approach to helping you think, create, and grow.
          </p>
        </div>

        {/* Sentinels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {sentinels?.map((sentinel) => (
            <Card
              key={sentinel.id}
              className={`group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                selectedSentinel === sentinel.id
                  ? "border-purple-400 shadow-2xl shadow-purple-500/50 scale-105"
                  : "border-slate-700 hover:border-slate-500 hover:shadow-xl"
              }`}
              style={{
                background: `linear-gradient(135deg, ${sentinel.primaryColor}15 0%, ${sentinel.primaryColor}05 100%)`,
              }}
              onClick={() => setSelectedSentinel(selectedSentinel === sentinel.id ? null : sentinel.id)}
            >
              <div className="p-6">
                {/* Icon and Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="text-4xl flex items-center justify-center w-16 h-16 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${sentinel.primaryColor}40, ${sentinel.primaryColor}20)`,
                    }}
                  >
                    {sentinel.symbolEmoji}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{sentinel.name}</h3>
                    <p className="text-sm text-slate-400">{sentinel.archetype}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 mb-4 leading-relaxed">{sentinel.primaryFunction}</p>

                {/* Personality Traits */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {sentinel.personalityTraits.map((trait: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs bg-white/10 text-white border-white/20 hover:bg-white/15"
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>

                {/* Specialties */}
                <div className="text-sm text-slate-400">
                  <span className="font-semibold">Best for:</span> {sentinel.specialties.join(", ")}
                </div>

                {/* Hover Effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${sentinel.primaryColor}, transparent)`,
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Selected Sentinel Detail View */}
        {selected && (
          <div className="mt-12 animate-in fade-in duration-500">
            <Card
              className="border-2 p-8 md:p-12"
              style={{
                borderColor: selected.primaryColor,
                background: `linear-gradient(135deg, ${selected.primaryColor}10 0%, ${selected.primaryColor}02 100%)`,
              }}
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Icon and Core Info */}
                <div className="flex-shrink-0 text-center md:text-left">
                  <div
                    className="inline-flex items-center justify-center w-32 h-32 rounded-full text-6xl mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${selected.primaryColor}60, ${selected.primaryColor}30)`,
                    }}
                  >
                    {selected.symbolEmoji}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{selected.name}</h2>
                  <p className="text-lg text-slate-400 mb-4">{selected.archetype}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {selected.personalityTraits.map((trait: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20 hover:bg-white/15"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Right: Detailed Info */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      About {selected.name}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{selected.primaryFunction}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      Specialties
                    </h3>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {selected.specialties.map((specialty: string, idx: number) => (
                        <li key={idx}>{specialty}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      Communication Style
                    </h3>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-slate-300 italic leading-relaxed">
                        {selected.systemPrompt.split("\n\n")[0]}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: selected.primaryColor }}>
                      When to Choose {selected.name}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {selected.name === "Vixen's Den" &&
                        "Choose Vixen when you need practical, grounded advice. She excels at breaking down complex problems into manageable steps, creating sustainable systems, and helping you build solid foundations for long-term success."}
                      {selected.name === "Mischief.EXE" &&
                        "Choose Mischief when you're stuck in conventional thinking and need creative disruption. She thrives on challenging assumptions, exploring unconventional solutions, and turning chaos into innovation."}
                      {selected.name === "Lunaris.Vault" &&
                        "Choose Lunaris when you need deep analysis, strategic planning, or knowledge synthesis. She excels at connecting disparate ideas, uncovering hidden patterns, and providing comprehensive insights."}
                      {selected.name === "Aetheris.Flow" &&
                        "Choose Aetheris when you need to navigate change, adapt to new circumstances, or find creative solutions. She specializes in fluid thinking, emotional intelligence, and helping you flow through transitions."}
                      {selected.name === "Rift.EXE" &&
                        "Choose Rift when you need to break through barriers, challenge the status quo, or explore radical alternatives. He excels at disrupting stagnation and opening new possibilities."}
                      {selected.name === "Nyx" &&
                        "Choose Nyx when you need introspection, shadow work, or deep personal transformation. She guides you through the unknown, helping you integrate hidden aspects of yourself and emerge stronger."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Getting Started Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-lg text-slate-300 mb-8">
            Start a new conversation and select a Sentinel to guide your journey.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
          >
            Start Chatting
          </a>
        </div>
      </div>
    </div>
  );
}
