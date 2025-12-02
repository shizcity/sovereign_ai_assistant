import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { DollarSign, LogOut, MessageSquare, Plus, Send, Settings, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function Chat() {
  const { user, loading: authLoading, logout } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Fetch available models
  const { data: availableModels } = trpc.models.available.useQuery();
  
  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } =
    trpc.conversations.list.useQuery(undefined, {
      enabled: !!user,
    });
  
  // Set default model when available models are loaded
  useEffect(() => {
    if (availableModels && availableModels.models.length > 0 && !selectedModel) {
      setSelectedModel(availableModels.models[0].value);
    }
  }, [availableModels, selectedModel]);

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } =
    trpc.messages.list.useQuery(
      { conversationId: selectedConversation! },
      {
        enabled: !!selectedConversation,
      }
    );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create conversation mutation
  const createConversation = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      utils.conversations.list.invalidate();
      setSelectedConversation(data.id);
      toast.success("New conversation created");
    },
  });

  // Delete conversation mutation
  const deleteConversation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate();
      setSelectedConversation(null);
      toast.success("Conversation deleted");
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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-blue-950 flex items-center justify-center">
        <div className="text-blue-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-blue-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">Welcome to {APP_TITLE}</h1>
          <p className="text-gray-400">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-gray-950 to-blue-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/10 backdrop-blur-xl bg-black/30 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {APP_TITLE}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Your AI. Your Identity. Your Sovereignty.</p>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={() => createConversation.mutate({ title: "New Conversation", defaultModel: selectedModel })}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-blue-500/70 hover:scale-[1.02]"
            disabled={createConversation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {conversationsLoading ? (
            <div className="text-center text-gray-400 py-8">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedConversation === conv.id
                    ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/50 shadow-lg shadow-blue-500/20"
                    : "hover:bg-white/5 border border-transparent"
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm truncate">{conv.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation.mutate({ id: conv.id });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/analytics">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <DollarSign className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => logout()}
            className="w-full justify-start text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-white/10 backdrop-blur-xl bg-black/20 p-4">
              <div className="flex items-center justify-between max-w-5xl mx-auto">
                <h2 className="text-xl font-semibold">
                  {conversations.find((c) => c.id === selectedConversation)?.title}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Model:</span>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-48 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels?.models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {messagesLoading ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="animate-pulse">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 backdrop-blur-sm">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                      <p className="text-lg text-gray-300 mb-2">No messages yet. Start the conversation below.</p>
                      <p className="text-sm text-gray-500">Ask anything about Sovereign AI Assistant!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-5 shadow-xl ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-blue-500/30"
                            : "bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 shadow-black/50"
                        }`}
                      >
                        <div className="prose prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-4 pt-3 border-t border-white/10">
                            {msg.model && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-blue-400">{availableModels?.models.find((m) => m.value === msg.model)?.label || msg.model}</span>
                              </div>
                            )}
                            {msg.totalTokens && msg.totalTokens > 0 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span>{msg.totalTokens.toLocaleString()} tokens</span>
                              </>
                            )}
                            {msg.costUsd && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="text-green-400">${msg.costUsd}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 backdrop-blur-xl bg-black/20 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 hover:bg-white/10"
                    rows={1}
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sendMessage.isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-blue-500/70 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed px-6"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 p-8">
              <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 backdrop-blur-sm">
                <MessageSquare className="w-24 h-24 mx-auto mb-6 text-blue-400" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  Welcome to Sovereign AI
                </h2>
                <p className="text-gray-400 text-lg max-w-md">
                  Select a conversation from the sidebar or create a new one to get started.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
