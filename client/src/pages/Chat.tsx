import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Plus, Send, Trash2, Loader2, Settings as SettingsIcon, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

const AI_MODELS = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "grok-1", label: "Grok-1" },
];

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [inputMessage, setInputMessage] = useState("");

  const utils = trpc.useUtils();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } =
    trpc.conversations.list.useQuery(undefined, {
      enabled: !!user,
    });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } =
    trpc.messages.list.useQuery(
      { conversationId: selectedConversation! },
      {
        enabled: !!selectedConversation,
      }
    );

  // Create conversation mutation
  const createConversation = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      utils.conversations.list.invalidate();
      setSelectedConversation(data.id);
      toast.success("New conversation created");
    },
    onError: (error) => {
      toast.error(`Failed to create conversation: ${error.message}`);
    },
  });

  // Delete conversation mutation
  const deleteConversation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate();
      setSelectedConversation(null);
      toast.success("Conversation deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete conversation: ${error.message}`);
    },
  });

  // Send message mutation
  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.list.invalidate();
      setInputMessage("");
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  const handleCreateConversation = () => {
    const title = `New Chat ${new Date().toLocaleDateString()}`;
    createConversation.mutate({ title, defaultModel: selectedModel });
  };

  const handleDeleteConversation = (id: number) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation.mutate({ id });
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedConversation) return;

    sendMessage.mutate({
      conversationId: selectedConversation,
      content: inputMessage,
      model: selectedModel,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading) {
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
          <Button onClick={() => window.location.href = "/api/oauth/login"}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-2">{APP_TITLE}</h1>
          <p className="text-sm text-muted-foreground">Your AI. Your Identity. Your Sovereignty.</p>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={handleCreateConversation}
            disabled={createConversation.isPending}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conv.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-secondary text-card-foreground"
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{conv.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* User Info */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = "/analytics"}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = "/settings"}
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <div className="text-sm text-muted-foreground">
            Logged in as <span className="text-foreground font-medium">{user.name || user.email}</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header with Model Selector */}
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {conversations.find((c) => c.id === selectedConversation)?.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Model:</span>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-48">
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
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation below.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border border-border"
                        }`}
                      >
                        <div className="prose prose-invert max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
                            {msg.model && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{AI_MODELS.find((m) => m.value === msg.model)?.label || msg.model}</span>
                              </div>
                            )}
                            {msg.totalTokens && msg.totalTokens > 0 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span>{msg.totalTokens.toLocaleString()} tokens</span>
                              </>
                            )}
                            {msg.costUsd && parseFloat(msg.costUsd) > 0 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="font-mono font-medium text-green-400">${parseFloat(msg.costUsd).toFixed(5)}</span>
                              </>
                            )}
                            {msg.provider && msg.provider !== "manus" && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="capitalize opacity-70">{msg.provider}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {sendMessage.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="max-w-4xl mx-auto flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sendMessage.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Welcome to {APP_TITLE}</p>
              <p className="text-sm">Create a new conversation to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
