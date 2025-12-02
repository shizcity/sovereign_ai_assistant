import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { APP_TITLE } from "@/const";

const AI_MODELS = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "grok-1", label: "Grok-1" },
];

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [defaultModel, setDefaultModel] = useState("gpt-4");

  const utils = trpc.useUtils();

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Update settings mutation
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setDefaultModel(settings.defaultModel || "gpt-4");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({ defaultModel });
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your preferences and default AI model settings
            </p>
          </div>

          {/* User Profile Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="text-foreground font-medium">{user.name || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-foreground font-medium">{user.email || "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Login Method</Label>
                <p className="text-foreground font-medium capitalize">
                  {user.loginMethod || "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Model Preferences Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle>AI Model Preferences</CardTitle>
              <CardDescription>
                Set your default AI model for new conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-model">Default AI Model</Label>
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger id="default-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This model will be selected by default when you create a new conversation. You
                  can change it anytime during a conversation.
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full sm:w-auto"
              >
                {updateSettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* About Card */}
          <Card className="bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle>About {APP_TITLE}</CardTitle>
              <CardDescription>Privacy-first multi-LLM assistant platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your AI. Your Identity. Your Sovereignty.
              </p>
              <p className="text-sm text-muted-foreground">
                A privacy-first ecosystem of expressive, identity-driven AI tools designed to
                amplify human sovereignty.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
