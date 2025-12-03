import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Brain,
  Target,
  Sparkles,
  Calendar,
  Users,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  insight: "#8b5cf6",
  decision: "#3b82f6",
  milestone: "#10b981",
  preference: "#f59e0b",
  goal: "#ef4444",
  achievement: "#06b6d4",
  challenge: "#ec4899",
  pattern: "#6366f1",
};

const CATEGORY_LABELS: Record<string, string> = {
  insight: "Insights",
  decision: "Decisions",
  milestone: "Milestones",
  preference: "Preferences",
  goal: "Goals",
  achievement: "Achievements",
  challenge: "Challenges",
  pattern: "Patterns",
};

export default function Insights() {
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("week");
  const [selectedSentinel, setSelectedSentinel] = useState<number | undefined>();

  const { data: timeline, isLoading: timelineLoading } = trpc.sentinels.memories.timeline.useQuery({
    granularity,
  });

  const { data: categoryStats, isLoading: categoryLoading } = trpc.sentinels.memories.categoryStats.useQuery({
    sentinelId: selectedSentinel,
  });

  const { data: sentinelStats, isLoading: sentinelLoading } = trpc.sentinels.memories.sentinelStats.useQuery();

  const { data: evolutionPaths, isLoading: evolutionLoading } = trpc.sentinels.memories.evolutionPaths.useQuery({
    minMemories: 2,
  });

  const { data: insights, isLoading: insightsLoading } = trpc.sentinels.memories.insights.useQuery();

  const { data: sentinels } = trpc.sentinels.list.useQuery();

  // Prepare timeline data for line chart
  const timelineChartData = timeline
    ? Object.values(
        timeline.reduce((acc, point) => {
          if (!acc[point.date]) {
            acc[point.date] = { date: point.date };
          }
          acc[point.date][point.category] = (acc[point.date][point.category] || 0) + point.count;
          return acc;
        }, {} as Record<string, any>)
      )
    : [];

  // Prepare category data for pie chart
  const categoryPieData = categoryStats?.map((stat) => ({
    name: CATEGORY_LABELS[stat.category] || stat.category,
    value: stat.count,
    percentage: stat.percentage,
  }));

  // Prepare Sentinel data for bar chart
  const sentinelBarData = sentinelStats?.map((stat) => ({
    name: stat.sentinelName,
    memories: stat.memoryCount,
    avgImportance: stat.avgImportance,
    emoji: stat.symbolEmoji,
  }));

  if (timelineLoading || categoryLoading || sentinelLoading || evolutionLoading || insightsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Brain className="h-10 w-10 text-primary" />
          Memory Insights
        </h1>
        <p className="text-muted-foreground text-lg">
          Visualize how your goals and preferences evolve over time across all Sentinel interactions
        </p>
      </div>

      {/* Key Insights Cards */}
      {insights && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <Card key={idx} className="border-l-4" style={{ borderLeftColor: CATEGORY_COLORS[insight.type] || "#8b5cf6" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {insight.type === "pattern" && <Sparkles className="h-5 w-5" />}
                  {insight.type === "collaboration" && <Users className="h-5 w-5" />}
                  {insight.type === "progress" && <TrendingUp className="h-5 w-5" />}
                  {insight.type === "preference" && <Lightbulb className="h-5 w-5" />}
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {(insight.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Dashboard */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Target className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="sentinels">
            <Users className="h-4 w-4 mr-2" />
            Sentinels
          </TabsTrigger>
          <TabsTrigger value="evolution">
            <TrendingUp className="h-4 w-4 mr-2" />
            Evolution
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Memory Timeline</CardTitle>
                  <CardDescription>Track memory creation over time by category</CardDescription>
                </div>
                <Select value={granularity} onValueChange={(v: any) => setGranularity(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {timelineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.keys(CATEGORY_COLORS).map((category) => (
                      <Line
                        key={category}
                        type="monotone"
                        dataKey={category}
                        stroke={CATEGORY_COLORS[category]}
                        name={CATEGORY_LABELS[category]}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No timeline data available yet. Start creating memories!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Breakdown of your memories by type</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryPieData && categoryPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(CATEGORY_COLORS)[index % Object.values(CATEGORY_COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>Statistics for each memory category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats?.map((stat) => (
                    <div key={stat.category} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[stat.category] }}
                        />
                        <div>
                          <p className="font-medium">{CATEGORY_LABELS[stat.category]}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.count} memories • {stat.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Avg: {stat.avgImportance.toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sentinels Tab */}
        <TabsContent value="sentinels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentinel Collaboration</CardTitle>
              <CardDescription>See which Sentinels you work with most</CardDescription>
            </CardHeader>
            <CardContent>
              {sentinelBarData && sentinelBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sentinelBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="memories" fill="#8b5cf6" name="Memory Count" />
                    <Bar dataKey="avgImportance" fill="#3b82f6" name="Avg Importance" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No Sentinel collaboration data available
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sentinelStats?.map((stat) => (
              <Card key={stat.sentinelId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{stat.symbolEmoji}</span>
                    {stat.sentinelName}
                  </CardTitle>
                  <CardDescription>{stat.memoryCount} memories created</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Top Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stat.categories)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([category, count]) => (
                          <Badge key={category} variant="secondary">
                            {CATEGORY_LABELS[category]}: {count}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Top Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {stat.topTags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Evolution Paths</CardTitle>
              <CardDescription>Track how topics progress from ideas to achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {evolutionPaths && evolutionPaths.length > 0 ? (
                <div className="space-y-6">
                  {evolutionPaths.map((path) => (
                    <div key={path.topic} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">#{path.topic}</h3>
                        <Badge>{path.memories.length} memories</Badge>
                      </div>

                      {/* Progression Indicators */}
                      <div className="flex items-center gap-2">
                        <Badge variant={path.progression.hasIdea ? "default" : "outline"}>
                          Idea
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={path.progression.hasGoal ? "default" : "outline"}>
                          Goal
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={path.progression.hasMilestone ? "default" : "outline"}>
                          Milestone
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={path.progression.hasAchievement ? "default" : "outline"}>
                          Achievement
                        </Badge>
                      </div>

                      {/* Memory Timeline */}
                      <div className="space-y-2">
                        {path.memories.slice(0, 3).map((memory) => (
                          <div key={memory.id} className="flex items-start gap-3 text-sm">
                            <Badge variant="secondary" className="mt-0.5">
                              {CATEGORY_LABELS[memory.category]}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-muted-foreground">{memory.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {memory.sentinelName} • {new Date(memory.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {path.memories.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{path.memories.length - 3} more memories
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No evolution paths found. Create memories with shared tags to track progress!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
