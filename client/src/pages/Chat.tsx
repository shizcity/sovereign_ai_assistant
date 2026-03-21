import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Download, DollarSign, LogOut, MessageSquare, Plus, RefreshCw, Search, Send, Settings, Trash2, X, Folder, Tag, ChevronDown, ChevronRight, FolderPlus, TagIcon, Mic, MicOff, FileText, Sparkles, Pencil, Loader2, Users, Brain, TrendingUp, Wand2 } from "lucide-react";
import { UsageWidget } from "@/components/UsageWidget";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { SentinelSelector } from "@/components/SentinelSelector";
import { MultiSentinelManager } from "@/components/MultiSentinelManager";
import { MessageSuggestions } from "@/components/MessageSuggestions";

import { VoiceRecorder } from "@/components/VoiceRecorder";
import { UnifiedVoiceInput } from "@/components/UnifiedVoiceInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { AudioPlayer } from "@/components/AudioPlayer";
import { SentinelBadge } from "@/components/SentinelBadge";
import { SentinelAvatar } from "@/components/SentinelAvatar";
import { GlowLogo } from "@/components/GlowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { voiceService } from "@/lib/voice";
import { toast } from "sonner";
import { useBackgroundWakePhrase } from "@/hooks/useBackgroundWakePhrase";
import { useUpgradeToast } from "@/hooks/useUpgradeToast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  useUpgradeToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedSentinel, setSelectedSentinel] = useState<number | undefined>();
  const [targetSentinelId, setTargetSentinelId] = useState<number | undefined>(); // Manual Sentinel selection for next message
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  
  // Dialog states
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3B82F6");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#10B981");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [backgroundListeningEnabled, setBackgroundListeningEnabled] = useState(() => {
    return localStorage.getItem('backgroundWakePhrase') === 'true';
  });
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplateForUse, setSelectedTemplateForUse] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [voiceMode, setVoiceMode] = useState<"off" | "manual" | "continuous">("off");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = messageInputRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (max 12 lines, ~24px per line)
    const maxHeight = 24 * 12; // 12 lines max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [inputMessage]);

  const utils = trpc.useUtils();

  // Fetch available models
  const { data: modelsData } = trpc.models.available.useQuery();
  const availableModels = modelsData?.models || [];

  // Fetch conversations, folders, and tags
  const { data: conversations = [] } = trpc.conversations.list.useQuery();
  const { data: folders = [] } = trpc.folders.list.useQuery();
  const { data: tags = [] } = trpc.tags.list.useQuery();
  
  // Fetch messages for selected conversation
  const { data: messages = [] } = trpc.messages.list.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );

  // Fetch tags for selected conversation
  const { data: conversationTags = [] } = trpc.tags.getForConversation.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );

  // Fetch all Sentinels
  const { data: allSentinels = [] } = trpc.sentinels.list.useQuery();

  // Fetch Sentinels for selected conversation
  const { data: conversationSentinels = [] } = trpc.sentinels.getConversationSentinels.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );

  // Derive active sentinel from selectedSentinel
  const activeSentinel = allSentinels.find((s: any) => s.id === selectedSentinel);

  // Background wake phrase listening
  const { isListening: isBackgroundListening } = useBackgroundWakePhrase({
    enabled: backgroundListeningEnabled,
    onWakePhrase: () => {
      // Focus the message input when wake phrase is detected
      messageInputRef.current?.focus();
      toast.success('Wake phrase detected! Start speaking...');
      // Open voice dialog
      setVoiceDialogOpen(true);
    },
  });

  // Set selected Sentinel when conversation changes
  useEffect(() => {
    const primarySentinel = conversationSentinels.find((cs: any) => cs.role === 'primary');
    if (primarySentinel) {
      setSelectedSentinel(primarySentinel.sentinelId);
    } else {
      setSelectedSentinel(undefined);
    }
  }, [conversationSentinels]);

  // Fetch templates
  const { data: templates = [] } = trpc.templates.list.useQuery();
  
  // Check for templateId URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('templateId');
    if (templateId && templates.length > 0) {
      // Find and activate the template
      const template = templates.find(t => t.id === parseInt(templateId));
      if (template) {
        handleSelectTemplate(template);
        // Clear the URL parameter
        window.history.replaceState({}, '', '/chat');
      }
    }
  }, [templates]); // Run when templates are loaded

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Cmd/Ctrl+N: New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createConversation.mutate({ title: "New Conversation", defaultModel: selectedModel });
      }
      
      // Esc: Clear search or unfocus input
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        } else if (document.activeElement === messageInputRef.current) {
          messageInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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

  // Cleanup empty conversations mutation
  const cleanupEmpty = trpc.conversations.cleanupEmpty.useMutation({
    onSuccess: (data) => {
      utils.conversations.list.invalidate();
      toast.success(`Deleted ${data.deletedCount} empty conversation${data.deletedCount !== 1 ? 's' : ''}`);
    },
  });

  // Send message mutation
  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.list.invalidate({ conversationId: selectedConversation! });
      setInputMessage("");
      toast.success("Message sent");
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  // Regenerate message mutation
  const regenerateMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.list.invalidate({ conversationId: selectedConversation! });
      toast.success("Response regenerated");
    },
  });

  // Edit and regenerate mutation
  const editAndRegenerate = trpc.messages.editAndRegenerate.useMutation({
    onSuccess: () => {
      utils.messages.list.invalidate({ conversationId: selectedConversation! });
      setEditingMessageId(null);
      setEditingContent("");
      toast.success("Message updated and response regenerated");
    },
  });

  // Add Sentinel to conversation mutation
  const addSentinelToConversation = trpc.sentinels.addToConversation.useMutation({
    onSuccess: () => {
      utils.sentinels.getConversationSentinels.invalidate({ conversationId: selectedConversation! });
    },
  });

  // Export conversation mutations
  const exportJSON = trpc.conversations.exportJSON.useQuery(
    { conversationId: selectedConversation! },
    { enabled: false }
  );

  const exportMarkdown = trpc.conversations.exportMarkdown.useQuery(
    { conversationId: selectedConversation! },
    { enabled: false }
  );

  const exportPDF = trpc.conversations.exportPDF.useQuery(
    { conversationId: selectedConversation! },
    { enabled: false }
  );

  const exportAll = trpc.conversations.exportAll.useQuery(undefined, { enabled: false });

  const importConversation = trpc.conversations.import.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate();
      toast.success("Conversation imported successfully");
    },
  });

  // Folder mutations
  const createFolder = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      setNewFolderName("");
      setNewFolderColor("#3B82F6");
      setFolderDialogOpen(false);
      toast.success("Folder created");
    },
  });

  const deleteFolder = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      utils.conversations.list.invalidate();
      toast.success("Folder deleted");
    },
  });

  const assignFolder = trpc.conversations.assignFolder.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate();
      toast.success("Folder assigned");
    },
  });

  // Tag mutations
  const createTag = trpc.tags.create.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      setNewTagName("");
      setNewTagColor("#10B981");
      setTagDialogOpen(false);
      toast.success("Tag created");
    },
  });

  const deleteTag = trpc.tags.delete.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      utils.conversations.list.invalidate();
      toast.success("Tag deleted");
    },
  });

  const assignTag = trpc.tags.assign.useMutation({
    onSuccess: () => {
      utils.tags.getForConversation.invalidate({ conversationId: selectedConversation! });
      toast.success("Tag assigned");
    },
  });

  const removeTag = trpc.tags.remove.useMutation({
    onSuccess: () => {
      utils.tags.getForConversation.invalidate({ conversationId: selectedConversation! });
      toast.success("Tag removed");
    },
  });

  // Set default model when available models are loaded
  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      setSelectedModel(availableModels[0]?.value || "");
    }
  }, [availableModels, selectedModel]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedConversation) return;
    sendMessage.mutate({
      conversationId: selectedConversation,
      content: inputMessage,
      model: selectedModel,
      targetSentinelId: targetSentinelId, // Include manual Sentinel selection if set
    }, {
      onSuccess: (data) => {
        // Reset target Sentinel selection after sending
        setTargetSentinelId(undefined);
        // Automatically speak the AI response if a Sentinel is active
        if (activeSentinel && data.content) {
          voiceService.speak(data.content, {
            sentinelName: activeSentinel.name,
          });
        }
      },
    });
  };

  const handleRegenerateMessage = () => {
    if (!selectedConversation || messages.length < 2) return;
    
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) return;
    
    regenerateMessage.mutate({
      conversationId: selectedConversation,
      content: lastUserMessage.content,
      model: selectedModel,
    });
  };

  const handleStartEdit = (messageId: number, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = (messageId: number) => {
    if (!editingContent.trim()) return;
    
    editAndRegenerate.mutate({
      messageId,
      content: editingContent,
      model: selectedModel,
    });
  };

  const handleExportJSON = async () => {
    if (!selectedConversation) return;
    
    const result = await exportJSON.refetch();
    if (result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation_${selectedConversation}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Conversation exported as JSON");
    }
  };

  const handleExportPDF = async () => {
    if (!selectedConversation) return;
    
    toast.info("Generating PDF...");
    const result = await exportPDF.refetch();
    if (result.data) {
      // Decode base64 PDF data
      const binaryString = atob(result.data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Conversation exported as PDF");
    }
  };

  const handleExportMarkdown = async () => {
    if (!selectedConversation) return;
    
    const result = await exportMarkdown.refetch();
    if (result.data) {
      const conversation = conversations?.find((c: { id: number; title: string }) => c.id === selectedConversation);
      const filename = `${conversation?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'conversation'}_${Date.now()}.md`;
      const blob = new Blob([result.data], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Conversation exported as Markdown");
    }
  };

  const handleExportAll = async () => {
    const result = await exportAll.refetch();
    if (result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all_conversations_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("All conversations exported");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          importConversation.mutate({ data });
        } catch (error) {
          toast.error("Invalid JSON file");
        }
      }
    };
    input.click();
  };

  const handleSelectTemplate = (template: any) => {
    // Extract variables from template content (e.g., [TOPIC], [AUDIENCE])
    const variableRegex = /\[([A-Z_]+)\]/g;
    const matches = [...template.prompt.matchAll(variableRegex)];
    const variables = Array.from(new Set(matches.map(m => m[1])));
    
    if (variables.length > 0) {
      // Show variable input dialog
      setSelectedTemplateForUse(template);
      setTemplateVariables(Object.fromEntries(variables.map(v => [v, ""])));
    } else {
      // No variables, use template directly
      setInputMessage(template.prompt);
      setIsTemplateDialogOpen(false);
      toast.success("Template applied");
    }
  };

  const handleApplyTemplateWithVariables = () => {
    if (!selectedTemplateForUse) return;
    
    let content = selectedTemplateForUse.prompt;
    Object.entries(templateVariables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    });
    
    setInputMessage(content);
    setIsTemplateDialogOpen(false);
    setSelectedTemplateForUse(null);
    setTemplateVariables({});
    toast.success("Template applied with variables");
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    return new Promise<void>((resolve) => {
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Stop all tracks to release microphone
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        setIsTranscribing(true);
        toast.info("Transcribing audio...");

        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];

            // Send to backend for transcription
            const response = await fetch("/api/trpc/voice.transcribe", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                json: {
                  audio: base64Data,
                  mimeType: audioBlob.type,
                },
              }),
            });

            if (!response.ok) {
              throw new Error("Transcription failed");
            }

            const data = await response.json();
            const transcribedText = data?.result?.data?.text;
            
            if (transcribedText && transcribedText.trim()) {
              // Insert transcribed text into message input
              setInputMessage(prev => prev ? `${prev}\n${transcribedText}` : transcribedText);
              toast.success("Transcription complete!");
              messageInputRef.current?.focus();
            } else {
              toast.error("Transcription returned empty result");
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error("Transcription error:", error);
          toast.error("Failed to transcribe audio");
        } finally {
          setIsTranscribing(false);
        }

        resolve();
      };

      mediaRecorder.stop();
    });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = conv.title.toLowerCase();
      const dateStr = new Date(conv.updatedAt).toLocaleDateString().toLowerCase();
      
      // Search in title or date
      if (!title.includes(query) && !dateStr.includes(query)) {
        return false;
      }
    }
    
    // Folder filter
    if (selectedFolder !== null && conv.folderId !== selectedFolder) {
      return false;
    }
    
    return true;
  });

  // Group conversations by folder
  const conversationsByFolder: Record<number | string, typeof conversations> = {
    unfiled: filteredConversations.filter(c => !c.folderId),
  };
  
  folders.forEach(folder => {
    conversationsByFolder[folder.id] = filteredConversations.filter(c => c.folderId === folder.id);
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Please log in</h1>
          <p className="text-gray-400">You need to be logged in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex relative overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 animate-gradient" 
        style={{
          backgroundImage: 'linear-gradient(135deg, #000000 0%, #0a0e27 25%, #0f172a 50%, #0c1e3a 75%, #000000 100%)'
        }} 
      />
      
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      {/* Background Listening Indicator */}
      {isBackgroundListening && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
          <div className="relative">
            <Mic className="w-4 h-4 text-green-400" />
            <div className="absolute inset-0 animate-ping">
              <Mic className="w-4 h-4 text-green-400 opacity-75" />
            </div>
          </div>
          <span className="text-xs text-green-300 font-medium">Listening for "Hey Glow"</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-green-500/20"
            onClick={() => {
              setBackgroundListeningEnabled(false);
              localStorage.setItem('backgroundWakePhrase', 'false');
              toast.info('Background listening disabled');
            }}
          >
            <X className="w-3 h-3 text-green-300" />
          </Button>
        </div>
      )}
      
      {/* Background Listening Toggle (when disabled) */}
      {!isBackgroundListening && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 z-50 border-white/20 bg-black/40 backdrop-blur-sm hover:bg-white/10"
          onClick={() => {
            setBackgroundListeningEnabled(true);
            localStorage.setItem('backgroundWakePhrase', 'true');
            toast.success('Background listening enabled. Say "Hey Glow" to start.');
          }}
        >
          <MicOff className="w-4 h-4 mr-2" />
          Enable Wake Phrase
        </Button>
      )}
      {/* Sidebar */}
      <div className="w-80 flex flex-col sidebar-glass overflow-hidden relative z-10">
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/8 flex-shrink-0">
          <GlowLogo size="md" showWordmark showTagline />
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-white/8 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search conversations… (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-white/5 border-white/10 focus:border-cyan-500/50 focus:bg-white/8 transition-all placeholder:text-white/25 input-glow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="px-4 py-3 border-b border-white/8 space-y-2 flex-shrink-0">
          <Button
            onClick={() => createConversation.mutate({ title: "New Conversation", defaultModel: selectedModel })}
            className="button-lift w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all duration-200 font-semibold"
            disabled={createConversation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
          <Button
            onClick={() => {
              if (confirm('Delete all empty conversations?')) {
                cleanupEmpty.mutate();
              }
            }}
            variant="outline"
            className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/8 text-xs"
            disabled={cleanupEmpty.isPending}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Clear Empty
          </Button>
        </div>

        {/* Chat List Header */}
        <div className="px-4 pt-3 pb-1 flex-shrink-0">
          <span className="text-[10px] font-semibold tracking-widest text-white/30 uppercase">Conversations</span>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  selectedConversation === conv.id
                    ? "nav-item-active"
                    : "hover:bg-white/6 border-l-2 border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{conv.title}</p>
                  <p className="text-[11px] text-white/35">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation.mutate({ id: conv.id });
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Usage Widget */}
        <UsageWidget />

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0">
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="flex-1 text-gray-300 hover:text-white border-white/10"
              title="Import conversation from JSON"
            >
              <Download className="w-4 h-4 mr-1 rotate-180" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              className="flex-1 text-gray-300 hover:text-white border-white/10"
              title="Export all conversations"
            >
              <Download className="w-4 h-4 mr-1" />
              Export All
            </Button>
          </div>
          {([
            { href: '/analytics', icon: DollarSign, label: 'Analytics' },
            { href: '/templates', icon: FileText, label: 'Templates' },
            { href: '/sentinels', icon: Sparkles, label: 'Meet the Sentinels' },
            { href: '/my-sentinels', icon: Wand2, label: 'My Sentinels' },
            { href: '/memories', icon: Brain, label: 'Memories' },
            { href: '/insights', icon: TrendingUp, label: 'Insights' },
            { href: '/voice', icon: Mic, label: 'Voice Chat' },
          ] as const).map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <Button variant="ghost" className="w-full justify-start text-white/55 hover:text-white/90 hover:bg-white/6 transition-all duration-150 text-sm font-normal h-9">
                <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                {label}
              </Button>
            </Link>
          ))}
          <div className="border-t border-white/8 pt-1 mt-1">
            <div className="flex items-center justify-between px-1 py-0.5">
              <Link href="/settings" className="flex-1">
                <Button variant="ghost" className="w-full justify-start text-white/55 hover:text-white/90 hover:bg-white/6 transition-all duration-150 text-sm font-normal h-9">
                  <Settings className="w-4 h-4 mr-2.5 shrink-0" />
                  Settings
                </Button>
              </Link>
              <ThemeToggle variant="icon" className="flex-shrink-0" />
            </div>
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 text-sm font-normal h-9">
                <LogOut className="w-4 h-4 mr-2.5 shrink-0" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-white/10 backdrop-blur-xl bg-black/20 p-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">{selectedConv?.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {conversationTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                        style={{ backgroundColor: tag.color + "40", borderColor: tag.color, borderWidth: 1 }}
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTag.mutate({ conversationId: selectedConversation, tagId: tag.id })}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-400 hover:text-white">
                          <Plus className="w-3 h-3 mr-1" />
                          Tag
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-white/10">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add Tag</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-white">Existing Tags</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tags.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    assignTag.mutate({ conversationId: selectedConversation, tagId: tag.id });
                                    setTagDialogOpen(false);
                                  }}
                                  className="px-3 py-1 rounded-full text-sm text-white hover:opacity-80"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="border-t border-white/10 pt-4">
                            <Label htmlFor="tag-name" className="text-white">Create New Tag</Label>
                            <Input
                              id="tag-name"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              placeholder="Urgent, Important, etc."
                              className="bg-white/5 border-white/10 text-white mt-2"
                            />
                            <Label htmlFor="tag-color" className="text-white mt-4 block">Color</Label>
                            <div className="flex gap-2 items-center mt-2">
                              <input
                                id="tag-color"
                                type="color"
                                value={newTagColor}
                                onChange={(e) => setNewTagColor(e.target.value)}
                                className="h-10 w-20 rounded border border-white/10 bg-transparent cursor-pointer"
                              />
                              <span className="text-gray-400 text-sm">{newTagColor}</span>
                            </div>
                            <Button
                              onClick={() => {
                                createTag.mutate({ name: newTagName, color: newTagColor });
                              }}
                              disabled={!newTagName.trim() || createTag.isPending}
                              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600"
                            >
                              Create & Assign Tag
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SentinelSelector
                    value={selectedSentinel}
                    onChange={(sentinelId) => {
                      setSelectedSentinel(sentinelId);
                      // Persist Sentinel selection to conversation
                      if (selectedConversation) {
                        addSentinelToConversation.mutate({
                          conversationId: selectedConversation,
                          sentinelId,
                          role: 'primary',
                        });
                      }
                    }}
                  />
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="text-white">
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Multi-Sentinel Manager */}
                  {selectedConversation && (
                    <MultiSentinelManager conversationId={selectedConversation} />
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportPDF}
                      className="text-gray-400 hover:text-white"
                      title="Export as PDF"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportJSON}
                      className="text-gray-400 hover:text-white"
                      title="Export as JSON"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportMarkdown}
                      className="text-gray-400 hover:text-white"
                      title="Export as Markdown"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      MD
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-5">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex msg-fade-in ${
                      message.role === "user" ? "justify-end" : "justify-start gap-3"
                    }`}
                    style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
                  >
                    {/* Sentinel avatar for assistant messages */}
                    {message.role === "assistant" && (
                      <SentinelAvatar sentinelId={(message as any).sentinelId} />
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "chat-bubble-user text-white"
                          : "chat-bubble-assistant text-white/90"
                      }`}
                    >
                      {editingMessageId === message.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(message.id)}
                              disabled={editAndRegenerate.isPending}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500"
                            >
                              {editAndRegenerate.isPending ? (
                                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Regenerating...</>
                              ) : (
                                'Save & Regenerate'
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingContent('');
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-invert max-w-none">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                          {message.role === "user" && (
                            <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
                              <button
                                onClick={() => handleStartEdit(message.id, message.content)}
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-xs"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {message.role === "assistant" && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-3">
                            <SentinelBadge sentinelId={(message as any).sentinelId} />
                            {message.model && <span>Model: {message.model}</span>}
                            {message.totalTokens && <span>{message.totalTokens} tokens</span>}
                            {message.costUsd && <span>${message.costUsd}</span>}
                          </div>
                          {index === messages.length - 1 && (
                            <button
                              onClick={handleRegenerateMessage}
                              disabled={regenerateMessage.isPending}
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <RefreshCw className={`w-3 h-3 ${regenerateMessage.isPending ? "animate-spin" : ""}`} />
                              Regenerate
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Memory Suggestions */}
                    {message.role === "assistant" && (
                      <MessageSuggestions messageId={message.id} />
                    )}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {sendMessage.isPending && (
                  <div className="flex justify-start animate-slide-in-left">
                    <div className="glass-strong rounded-2xl">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 backdrop-blur-xl bg-black/20 p-4">
              <div className="max-w-4xl mx-auto space-y-4">

                {/* Message Input */}
                <div className="flex gap-3">
                  <Dialog open={voiceDialogOpen} onOpenChange={setVoiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        disabled={sendMessage.isPending}
                        className="button-lift bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed px-4"
                        title="Voice input"
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Voice Input</DialogTitle>
                        <DialogDescription>
                          Choose between manual recording or continuous listening mode.
                        </DialogDescription>
                      </DialogHeader>
                      <UnifiedVoiceInput
                        onTranscriptionComplete={(text) => {
                          setInputMessage(prev => prev ? `${prev}\n${text}` : text);
                          setVoiceDialogOpen(false);
                          messageInputRef.current?.focus();
                        }}
                        disabled={sendMessage.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  {/* Manual Sentinel Selector - only show if multiple Sentinels */}
                  {conversationSentinels.length > 1 && (
                    <Select
                      value={targetSentinelId?.toString() || "auto"}
                      onValueChange={(value) => setTargetSentinelId(value === "auto" ? undefined : parseInt(value))}
                    >
                      <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white hover:bg-white/10">
                        <SelectValue placeholder="Auto-rotate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">🔄 Auto-rotate</SelectItem>
                        {conversationSentinels.map((cs: any) => (
                          <SelectItem key={cs.sentinelId} value={cs.sentinelId.toString()}>
                            {cs.emoji} {cs.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <textarea
                    ref={messageInputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter: Send message (Shift+Enter for new line)
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                      // Cmd/Ctrl+Enter: Also send message
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message... (⏎ to send, ⇧⏎ for new line)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 hover:bg-white/10 overflow-y-auto"
                    rows={3}
                    style={{ minHeight: '80px', maxHeight: '288px' }}
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sendMessage.isPending}
                    className="button-lift bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
              <MessageSquare className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Welcome to Glow
              </h2>
              <p className="text-gray-400">
                Select a conversation from the sidebar or create a new one to get started.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={isTemplateDialogOpen && !selectedTemplateForUse} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Template</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a prompt template to get started quickly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No templates available</p>
                <Link href="/templates">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Create Templates
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="bg-white/5 border-white/10 p-4 hover:bg-white/10 cursor-pointer transition-all"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-500 bg-black/30 p-2 rounded line-clamp-2 font-mono">
                          {template.prompt}
                        </p>
                      </div>
                      {template.categoryId && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 ml-3">
                          Category {template.categoryId}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Variables Dialog */}
      <Dialog open={!!selectedTemplateForUse} onOpenChange={(open) => {
        if (!open) {
          setSelectedTemplateForUse(null);
          setTemplateVariables({});
        }
      }}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Fill Template Variables</DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide values for the template placeholders
            </DialogDescription>
          </DialogHeader>
          {selectedTemplateForUse && (
            <div className="space-y-4">
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Template:</p>
                <p className="text-sm text-white font-semibold">{selectedTemplateForUse.name}</p>
              </div>
              {Object.keys(templateVariables).map((variable) => (
                <div key={variable}>
                  <Label htmlFor={`var-${variable}`} className="text-white">
                    {variable.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={`var-${variable}`}
                    value={templateVariables[variable]}
                    onChange={(e) =>
                      setTemplateVariables({ ...templateVariables, [variable]: e.target.value })
                    }
                    placeholder={`Enter ${variable.toLowerCase().replace(/_/g, ' ')}`}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTemplateForUse(null);
                setTemplateVariables({});
              }}
              className="border-white/10 text-gray-300 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyTemplateWithVariables}
              disabled={Object.values(templateVariables).some(v => !v.trim())}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
