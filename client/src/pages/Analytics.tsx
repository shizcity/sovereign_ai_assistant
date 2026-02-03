import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MessageSquare, Calendar, Users, TrendingUp, Sparkles, Crown, Loader2 } from "lucide-react";
import { APP_TITLE } from "@/const";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const isPro = user?.subscriptionTier === "pro";

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.getOverview.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: timeSeries, isLoading: timeSeriesLoading } = trpc.analytics.getMessageTimeSeries.useQuery(
    { days: 30 },
    { enabled: !!user }
  );

  const { data: sentinelStats, isLoading: sentinelStatsLoading } = trpc.analytics.getSentinelStats.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: insights, isLoading: insightsLoading } = trpc.analytics.getConversationInsights.useQuery(undefined, {
    enabled: !!user,
  });

  const isLoading = overviewLoading || timeSeriesLoading || sentinelStatsLoading || insightsLoading;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Please log in to continue</h1>
          <Button onClick={() => (window.location.href = "/api/oauth/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")} className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  {APP_TITLE} Analytics
                </h1>
                <p className="text-sm text-gray-400">Track your AI usage and insights</p>
              </div>
            </div>
            {isPro && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-500 font-medium">Pro Member</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {overview?.totalMessages.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    All-time conversations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {overview?.monthlyMessages || 0}
                    {!isPro && overview?.monthlyLimit && overview.monthlyLimit > 0 && (
                      <span className="text-lg text-gray-400"> / {overview.monthlyLimit}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {isPro ? "Unlimited access" : `${overview?.monthlyLimit ? Math.round((overview.monthlyMessages / overview.monthlyLimit) * 100) : 0}% used`}
                  </p>
                  {!isPro && overview?.monthlyLimit && overview.monthlyLimit > 0 && (
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${Math.min((overview.monthlyMessages / overview.monthlyLimit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Active Days</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {overview?.activeDays || 0}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 border-orange-500/30 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Sentinels</CardTitle>
                  <Users className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {overview?.totalSentinels || 0}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    AI assistants used
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Messages Over Time Chart */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Message Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Your message count over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeSeries && timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    No message activity yet. Start chatting to see your trends!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sentinel Usage Chart */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Sentinel Usage Distribution
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Which AI Sentinels you interact with most
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sentinelStats && sentinelStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sentinelStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="sentinelName" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                      <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'messageCount') return [value, 'Messages'];
                          if (name === 'percentage') return [`${value}%`, 'Share'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="messageCount" fill="#8b5cf6" name="Messages" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    No Sentinel usage data yet. Start conversations to see your preferences!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversation Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Conversation Insights</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your conversation patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400">Average Messages per Conversation</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {insights?.avgMessagesPerConversation || 0}
                    </div>
                  </div>
                  {insights?.longestConversation && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="text-sm text-gray-400">Longest Conversation</div>
                      <div className="text-lg font-semibold text-white mt-1">
                        {insights.longestConversation.title}
                      </div>
                      <div className="text-sm text-gray-400">
                        {insights.longestConversation.messageCount} messages
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm text-gray-400">Total Conversations</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {overview?.totalConversations || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Value Metrics</CardTitle>
                  <CardDescription className="text-gray-400">
                    {isPro ? "Your Pro subscription benefits" : "Upgrade to Pro for unlimited access"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400">Total Tokens Processed</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {insights?.totalTokens.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm text-gray-400">Estimated API Cost Savings</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">
                      ${insights?.estimatedCost || "0.00"}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      vs. direct OpenAI API usage
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm text-gray-400">Memory Entries Created</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {insights?.memoryCount || 0}
                    </div>
                  </div>
                  {!isPro && (
                    <div className="pt-4">
                      <Button
                        onClick={() => (window.location.href = "/settings")}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
