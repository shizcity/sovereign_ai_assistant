import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

export function EmailPreferences() {
  const utils = trpc.useUtils();
  
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Your email digest preferences have been updated.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const sendTestDigest = trpc.settings.sendTestDigest.useMutation({
    onSuccess: () => {
      toast.success("Check your email for the digest preview.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const [frequency, setFrequency] = useState<string>(
    settings?.emailDigestFrequency || "weekly"
  );
  
  // Update local state when settings load
  useState(() => {
    if (settings?.emailDigestFrequency) {
      setFrequency(settings.emailDigestFrequency);
    }
  });
  
  const handleSave = () => {
    updateSettings.mutate({
      emailDigestFrequency: frequency as "weekly" | "monthly" | "both" | "off",
    });
  };
  
  const handleTestEmail = (type: "weekly" | "monthly") => {
    sendTestDigest.mutate({ type });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Digest Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Digest Preferences
        </CardTitle>
        <CardDescription>
          Receive regular summaries of your AI conversations and activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Email Frequency</Label>
          <RadioGroup value={frequency} onValueChange={setFrequency}>
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly" className="font-normal cursor-pointer">
                <div>
                  <div className="font-medium">Weekly Digest</div>
                  <div className="text-sm text-muted-foreground">
                    Every Monday at 9 AM - Quick summary of your week
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly" className="font-normal cursor-pointer">
                <div>
                  <div className="font-medium">Monthly Report</div>
                  <div className="text-sm text-muted-foreground">
                    1st of each month - Comprehensive monthly insights
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="font-normal cursor-pointer">
                <div>
                  <div className="font-medium">Both Weekly & Monthly</div>
                  <div className="text-sm text-muted-foreground">
                    Stay informed with both digest types
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="off" id="off" />
              <Label htmlFor="off" className="font-normal cursor-pointer">
                <div>
                  <div className="font-medium">No Emails</div>
                  <div className="text-sm text-muted-foreground">
                    Opt out of all digest emails
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending || frequency === settings?.emailDigestFrequency}
          >
            {updateSettings.isPending ? "Saving..." : "Save Preferences"}
          </Button>
          
          {frequency !== "off" && (
            <Button
              variant="outline"
              onClick={() => handleTestEmail(frequency === "monthly" ? "monthly" : "weekly")}
              disabled={sendTestDigest.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendTestDigest.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          )}
        </div>
        
        {settings?.lastDigestSent && (
          <div className="text-sm text-muted-foreground">
            Last digest sent: {new Date(settings.lastDigestSent).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
