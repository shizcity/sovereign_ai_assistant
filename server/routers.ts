import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Conversation management
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserConversations } = await import("./db");
      return getUserConversations(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        defaultModel: z.string().default("gpt-4"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createConversation } = await import("./db");
        const conversationId = await createConversation({
          userId: ctx.user.id,
          title: input.title,
          defaultModel: input.defaultModel,
        });
        return { id: conversationId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteConversation } = await import("./db");
        await deleteConversation(input.id, ctx.user.id);
        return { success: true };
      }),
    
    updateTitle: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateConversation } = await import("./db");
        await updateConversation(input.id, ctx.user.id, { title: input.title });
        return { success: true };
      }),
    
    assignFolder: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        folderId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { assignFolderToConversation } = await import("./folders-tags-db");
        await assignFolderToConversation(input.conversationId, ctx.user.id, input.folderId);
        return { success: true };
      }),
    
    export: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getConversationById, getConversationMessages } = await import("./db");
        const { TRPCError } = await import("@trpc/server");
        
        const conversation = await getConversationById(input.conversationId, ctx.user.id);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        const messages = await getConversationMessages(input.conversationId, ctx.user.id);
        
        // Format as Markdown
        let markdown = `# ${conversation.title}\n\n`;
        markdown += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
        markdown += `**Last Updated:** ${new Date(conversation.updatedAt).toLocaleString()}\n`;
        markdown += `**Default Model:** ${conversation.defaultModel}\n\n`;
        markdown += `---\n\n`;

        let totalTokens = 0;
        let totalCost = 0;

        for (const msg of messages) {
          const role = msg.role === "user" ? "👤 User" : "🤖 Assistant";
          markdown += `## ${role}\n\n`;
          markdown += `${msg.content}\n\n`;
          
          if (msg.role === "assistant") {
            const metadata: string[] = [];
            if (msg.model) metadata.push(`Model: ${msg.model}`);
            if (msg.totalTokens) {
              metadata.push(`Tokens: ${msg.totalTokens}`);
              totalTokens += msg.totalTokens;
            }
            if (msg.costUsd) {
              metadata.push(`Cost: $${msg.costUsd}`);
              totalCost += parseFloat(msg.costUsd);
            }
            if (metadata.length > 0) {
              markdown += `*${metadata.join(" • ")}*\n\n`;
            }
          }
          
          markdown += `---\n\n`;
        }

        // Add summary
        markdown += `## Summary\n\n`;
        markdown += `- **Total Messages:** ${messages.length}\n`;
        markdown += `- **Total Tokens:** ${totalTokens.toLocaleString()}\n`;
        markdown += `- **Total Cost:** $${totalCost.toFixed(6)}\n`;

        return {
          markdown,
          filename: `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.md`,
        };
      }),
  }),
  
  // Message management
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getConversationMessages } = await import("./db");
        return getConversationMessages(input.conversationId, ctx.user.id);
      }),
    
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1),
        model: z.string().default("gpt-4"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createMessage, getConversationById, updateConversation, getUserSettings, getConversationMessages } = await import("./db");
        const { routeLLMRequest } = await import("./llm-router");
        const { calculateCost, formatCost } = await import("./cost-calculator");
        const { DEFAULT_SYSTEM_PROMPT } = await import("./default-system-prompt");
        
        // Verify conversation ownership
        const conversation = await getConversationById(input.conversationId, ctx.user.id);
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get user's system prompt
        const userSettings = await getUserSettings(ctx.user.id);
        const systemPrompt = userSettings?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        
        // Save user message
        await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
          model: null,
        });
        
        // Get conversation history
        const messages = await getConversationMessages(input.conversationId, ctx.user.id);
        
        // Format messages for LLM with system prompt at the beginning
        const llmMessages = [
          {
            role: "system" as const,
            content: systemPrompt,
          },
          ...messages.map((msg: any) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
        ];
        
        // Route to appropriate LLM provider based on selected model
        const response = await routeLLMRequest(llmMessages, input.model);
        
        // Calculate cost
        const costBreakdown = calculateCost(input.model, response.usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        });
        
        // Save assistant message with cost tracking
        const messageId = await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: response.content,
          model: response.model,
          provider: response.provider,
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
          costUsd: costBreakdown.totalCost.toString(),
        });
        
        // Update conversation timestamp
        await updateConversation(input.conversationId, ctx.user.id, {});
        
        return {
          id: messageId,
          content: response.content,
          model: response.model,
          provider: response.provider,
          usage: response.usage,
          cost: {
            total: costBreakdown.totalCost,
            formatted: formatCost(costBreakdown.totalCost),
            breakdown: costBreakdown,
          },
        };
      }),
  }),
  
  // User settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getUserSettings } = await import("./db");
      const { DEFAULT_SYSTEM_PROMPT } = await import("./default-system-prompt");
      const settings = await getUserSettings(ctx.user.id);
      
      // Return default settings if none exist
      if (!settings) {
        return {
          id: 0,
          userId: ctx.user.id,
          defaultModel: "gemini-pro",
          theme: "dark",
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      return {
        ...settings,
        systemPrompt: settings.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      };
    }),
    
    update: protectedProcedure
      .input(z.object({
        defaultModel: z.string().optional(),
        theme: z.string().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { upsertUserSettings } = await import("./db");
        await upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),
  
  // Usage analytics and cost tracking
  analytics: router({
    conversationCost: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getConversationMessages } = await import("./db");
        const messages = await getConversationMessages(input.conversationId, ctx.user.id);
        
        let totalCost = 0;
        let totalTokens = 0;
        const costsByModel: Record<string, number> = {};
        
        for (const msg of messages) {
          if (msg.role === "assistant" && msg.costUsd) {
            const cost = parseFloat(msg.costUsd);
            totalCost += cost;
            totalTokens += msg.totalTokens || 0;
            
            if (msg.model) {
              costsByModel[msg.model] = (costsByModel[msg.model] || 0) + cost;
            }
          }
        }
        
        return {
          totalCost,
          totalTokens,
          messageCount: messages.filter(m => m.role === "assistant").length,
          costsByModel,
        };
      }),
    
    userTotalCost: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { messages, conversations } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return { totalCost: 0, totalTokens: 0, messageCount: 0 };
      }
      
      // Get all user's conversations
      const userConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, ctx.user.id));
      
      const conversationIds = userConversations.map(c => c.id);
      
      if (conversationIds.length === 0) {
        return { totalCost: 0, totalTokens: 0, messageCount: 0 };
      }
      
      // Get all messages from user's conversations
      const { inArray } = await import("drizzle-orm");
      const userMessages = await db
        .select()
        .from(messages)
        .where(inArray(messages.conversationId, conversationIds));
      
      let totalCost = 0;
      let totalTokens = 0;
      let messageCount = 0;
      
      for (const msg of userMessages) {
        if (msg.role === "assistant" && msg.costUsd) {
          totalCost += parseFloat(msg.costUsd);
          totalTokens += msg.totalTokens || 0;
          messageCount++;
        }
      }
      
      return {
        totalCost,
        totalTokens,
        messageCount,
      };
    }),
  }),
  
  // Folders router
  folders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserFolders } = await import("./folders-tags-db");
      return getUserFolders(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createFolder } = await import("./folders-tags-db");
        return createFolder({
          userId: ctx.user.id,
          name: input.name,
          color: input.color || "#3B82F6",
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateFolder } = await import("./folders-tags-db");
        await updateFolder(input.id, ctx.user.id, {
          name: input.name,
          color: input.color,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteFolder } = await import("./folders-tags-db");
        await deleteFolder(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Tags router
  tags: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserTags } = await import("./folders-tags-db");
      return getUserTags(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9A-F]{6}$/i),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createTag } = await import("./folders-tags-db");
        return createTag({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateTag } = await import("./folders-tags-db");
        await updateTag(input.id, ctx.user.id, {
          name: input.name,
          color: input.color,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteTag } = await import("./folders-tags-db");
        await deleteTag(input.id, ctx.user.id);
        return { success: true };
      }),
    getForConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const { getConversationTags } = await import("./folders-tags-db");
        return getConversationTags(input.conversationId);
      }),
    assign: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { assignTagToConversation } = await import("./folders-tags-db");
        await assignTagToConversation(input.conversationId, input.tagId);
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { removeTagFromConversation } = await import("./folders-tags-db");
        await removeTagFromConversation(input.conversationId, input.tagId);
        return { success: true };
      }),
  }),

  // Prompt templates
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getTemplatesByUser } = await import("./templates-db");
      return getTemplatesByUser(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getTemplateById } = await import("./templates-db");
        return getTemplateById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          prompt: z.string(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createTemplate } = await import("./templates-db");
        return createTemplate({
          ...input,
          userId: ctx.user.id,
          isDefault: 0,
          isPublic: 0,
        }, ctx.user.name || "Anonymous");
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          prompt: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        const { updateTemplate } = await import("./templates-db");
        await updateTemplate(id, ctx.user.id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteTemplate } = await import("./templates-db");
        await deleteTemplate(input.id, ctx.user.id);
        return { success: true };
      }),
    createDefaults: protectedProcedure.mutation(async ({ ctx }) => {
      const { createDefaultTemplates } = await import("./templates-db");
      await createDefaultTemplates(ctx.user.id);
      return { success: true };
    }),
    togglePublic: protectedProcedure
      .input(z.object({ id: z.number(), isPublic: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const { toggleTemplatePublic } = await import("./templates-db");
        await toggleTemplatePublic(input.id, ctx.user.id, input.isPublic);
        return { success: true };
      }),
    listPublic: protectedProcedure.query(async () => {
      const { getPublicTemplates } = await import("./templates-db");
      return getPublicTemplates();
    }),
    import: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { importTemplate } = await import("./templates-db");
        return importTemplate(input.templateId, ctx.user.id, ctx.user.name || "Anonymous");
      }),
  }),

  // Voice transcription
  voice: router({    transcribe: protectedProcedure
      .input(
        z.object({
          audio: z.string(), // base64 encoded audio
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { transcribeAudio } = await import("./_core/voiceTranscription");
        
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(input.audio, "base64");
        
        // Upload to storage and get URL
        const { storagePut } = await import("./storage");
        const { url } = await storagePut(
          `voice-recordings/${Date.now()}.webm`,
          audioBuffer,
          input.mimeType
        );
        
        // Transcribe using the uploaded URL
        const result = await transcribeAudio({
          audioUrl: url,
        });
        
        // Check if transcription was successful
        if ('error' in result) {
          throw new Error(result.error);
        }
        
        return { text: result.text };
      }),
  }),

  // Available models based on configured API keys
  models: router({
    available: publicProcedure.query(async () => {
      const { getAPIKey } = await import("./llm-router");
      
      const providers = {
        openai: !!getAPIKey("openai"),
        anthropic: !!getAPIKey("anthropic"),
        google: !!getAPIKey("google"),
        xai: !!getAPIKey("xai"),
        manus: true, // Always available
      };
      
      // Map providers to available models
      const availableModels = [];
      
      if (providers.openai) {
        availableModels.push(
          { value: "gpt-4", label: "GPT-4", provider: "openai" },
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "openai" }
        );
      }
      
      if (providers.anthropic) {
        availableModels.push(
          { value: "claude-3-opus", label: "Claude 3 Opus", provider: "anthropic" },
          { value: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "anthropic" }
        );
      }
      
      if (providers.google) {
        availableModels.push(
          { value: "gemini-pro", label: "Gemini Pro", provider: "google" }
        );
      }
      
      if (providers.xai) {
        availableModels.push(
          { value: "grok-1", label: "Grok-1", provider: "xai" }
        );
      }
      
      return {
        providers,
        models: availableModels,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
