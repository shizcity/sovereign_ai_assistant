import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, DollarSign, MessageSquare, Zap } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function Analytics() {
  const { user } = useAuth();

  // Fetch total usage statistics
  const { data: totalStats, isLoading } = trpc.analytics.userTotalCost.useQuery(undefined, {
    enabled: !!user,
  });

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{APP_TITLE} Analytics</h1>
                <p className="text-sm text-muted-foreground">Track your AI usage and costs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading analytics...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(totalStats?.totalCost || 0).toFixed(4)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all conversations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(totalStats?.totalTokens || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tokens processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalStats?.messageCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Responses generated
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Transparency</CardTitle>
                <CardDescription>
                  Understanding your AI spending helps ensure financial sustainability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Average Cost Per Message</h3>
                  <p className="text-2xl font-bold text-green-400">
                    $
                    {totalStats?.messageCount && totalStats.messageCount > 0
                      ? ((totalStats.totalCost || 0) / totalStats.messageCount).toFixed(6)
                      : "0.000000"}
                  </p>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h3 className="font-semibold text-sm">Cost Optimization Tips</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>
                        <strong className="text-foreground">Use GPT-3.5 Turbo</strong> for simple
                        queries - it's 60x cheaper than GPT-4
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>
                        <strong className="text-foreground">Use Gemini Pro</strong> for
                        cost-effective responses - similar to GPT-3.5 pricing
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>
                        <strong className="text-foreground">Use Manus Built-in LLM</strong> for
                        free responses (no API costs)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>
                        <strong className="text-foreground">Keep conversations focused</strong> -
                        shorter context = lower costs
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-sm mb-3">Model Pricing Reference</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Model</th>
                          <th className="text-right py-2 font-medium">Input (per 1M tokens)</th>
                          <th className="text-right py-2 font-medium">Output (per 1M tokens)</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2">GPT-4</td>
                          <td className="text-right font-mono">$30.00</td>
                          <td className="text-right font-mono">$60.00</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">GPT-3.5 Turbo</td>
                          <td className="text-right font-mono">$0.50</td>
                          <td className="text-right font-mono">$1.50</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">Claude 3 Opus</td>
                          <td className="text-right font-mono">$15.00</td>
                          <td className="text-right font-mono">$75.00</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">Claude 3 Sonnet</td>
                          <td className="text-right font-mono">$3.00</td>
                          <td className="text-right font-mono">$15.00</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">Gemini Pro</td>
                          <td className="text-right font-mono">$0.50</td>
                          <td className="text-right font-mono">$1.50</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2">Grok-1</td>
                          <td className="text-right font-mono">$5.00</td>
                          <td className="text-right font-mono">$15.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-green-400">Manus Built-in</td>
                          <td className="text-right font-mono text-green-400">$0.00</td>
                          <td className="text-right font-mono text-green-400">$0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sustainability Note */}
            <Card className="bg-accent/50 border-accent">
              <CardHeader>
                <CardTitle className="text-base">Financial Sustainability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This platform tracks every API call to ensure transparency. External API costs
                  (OpenAI, Anthropic, Google, xAI) are passed through at cost with no markup.
                </p>
                <p>
                  <strong className="text-foreground">Recommendation:</strong> For production use,
                  consider setting up billing alerts in your API provider dashboards to avoid
                  unexpected charges.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
