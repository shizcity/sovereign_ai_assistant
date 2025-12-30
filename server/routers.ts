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
    
    cleanupEmpty: protectedProcedure.mutation(async ({ ctx }) => {
      const { deleteEmptyConversations } = await import("./db");
      const deletedCount = await deleteEmptyConversations(ctx.user.id);
      return { deletedCount };
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
    
    exportJSON: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { exportConversationAsJSON } = await import("./conversation-export-db");
        return exportConversationAsJSON(input.conversationId, ctx.user.id);
      }),

    exportMarkdown: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { exportConversationAsMarkdown } = await import("./conversation-export-db");
        return exportConversationAsMarkdown(input.conversationId, ctx.user.id);
      }),

    exportPDF: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getConversationById, getConversationMessages } = await import("./db");
        const { getConversationSentinels, getSentinelById } = await import("./sentinels-db");
        const { generateConversationPDF } = await import("./pdf-export");
        
        // Fetch conversation data
        const conversation = await getConversationById(input.conversationId, ctx.user.id);
        if (!conversation) throw new Error("Conversation not found");
        
        // Fetch messages
        const messages = await getConversationMessages(input.conversationId, ctx.user.id);
        
        // Fetch primary sentinel name if assigned
        let sentinelName: string | undefined;
        const sentinels = await getConversationSentinels(input.conversationId);
        const primarySentinel = sentinels.find(s => s.role === "primary");
        if (primarySentinel) {
          const sentinel = await getSentinelById(primarySentinel.sentinelId);
          sentinelName = sentinel?.name;
        }
        
        // Calculate total tokens and cost from messages
        const totalTokens = messages.reduce((sum, m) => sum + (m.totalTokens || 0), 0);
        const totalCost = messages.reduce((sum, m) => {
          const cost = m.costUsd ? parseFloat(m.costUsd) : 0;
          return sum + cost;
        }, 0);
        
        // Generate PDF
        const pdfBuffer = await generateConversationPDF({
          title: conversation.title,
          createdAt: conversation.createdAt,
          sentinelName,
          modelName: conversation.defaultModel,
          totalTokens,
          totalCost,
          messages,
        });
        
        // Return PDF as base64 string
        return {
          filename: `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`,
          data: pdfBuffer.toString('base64'),
        };
      }),

    exportAll: protectedProcedure.query(async ({ ctx }) => {
      const { exportAllConversations } = await import("./conversation-export-db");
      return exportAllConversations(ctx.user.id);
    }),

    import: protectedProcedure
      .input(z.object({ data: z.any() }))
      .mutation(async ({ ctx, input }) => {
        const { importConversation } = await import("./conversation-export-db");
        const conversationId = await importConversation(input.data, ctx.user.id);
        return { id: conversationId };
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
        
        // Get Sentinel system prompt if one is selected for this conversation
        const { getConversationSentinels, updateSentinelMessageCount } = await import("./sentinels-db");
        const conversationSentinels = await getConversationSentinels(input.conversationId);
        
        // Multi-Sentinel rotation: select Sentinel with lowest message count
        let activeSentinel;
        if (conversationSentinels.length > 1) {
          // Sort by message count (ascending) to get the Sentinel who has responded least
          const sortedSentinels = [...conversationSentinels].sort((a: any, b: any) => 
            (a.messageCount || 0) - (b.messageCount || 0)
          );
          activeSentinel = sortedSentinels[0];
        } else {
          // Single Sentinel or no Sentinels - use primary or first available
          activeSentinel = conversationSentinels.find((cs: any) => cs.role === 'primary') || conversationSentinels[0];
        }
        
        const primarySentinel = activeSentinel;
        
        let systemPrompt;
        if (primarySentinel && primarySentinel.systemPrompt) {
          // Use Sentinel's system prompt if one is selected
          systemPrompt = primarySentinel.systemPrompt;
          
          // Inject relevant memories into system prompt
          const { getTopMemories } = await import("./memory-db");
          const memories = await getTopMemories(ctx.user.id, primarySentinel.sentinelId, 5);
          
          if (memories.length > 0) {
            const memoryContext = `\n\n## Your Memories of This User\n\nYou have worked with this user before. Here are key things you remember:\n\n${memories.map((m, i) => `${i + 1}. **${m.category.toUpperCase()}**: ${m.content}${m.context ? ` (${m.context})` : ""}`).join("\n")}

Reference these memories naturally when relevant. For example: "Remember when we worked on [topic]?" or "Building on what we discussed about [topic]..."`;
            
            systemPrompt = systemPrompt + memoryContext;
          }
        } else {
          // Fall back to user's custom system prompt or default
          const userSettings = await getUserSettings(ctx.user.id);
          systemPrompt = userSettings?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        }
        
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
        
        // Update message count for the active Sentinel (for rotation tracking)
        if (activeSentinel && activeSentinel.sentinelId) {
          await updateSentinelMessageCount(input.conversationId, activeSentinel.sentinelId);
        }
        
        // Extract and save memories (async, don't block response)
        if (primarySentinel) {
          (async () => {
            try {
              const { extractMemoriesFromConversation, deduplicateMemories } = await import("./memory-extraction");
              const { createMemory, getUserSentinelMemories } = await import("./memory-db");
              
              // Extract memories from conversation
              const extracted = await extractMemoriesFromConversation(
                messages.map((m: any) => ({ role: m.role, content: m.content })),
                primarySentinel.sentinelName || "Sentinel"
              );
              
              if (extracted.length > 0) {
                // Get existing memories to deduplicate
                const existing = await getUserSentinelMemories(ctx.user.id, primarySentinel.sentinelId);
                const uniqueMemories = deduplicateMemories(extracted, existing);
                
                // Save unique memories
                for (const memory of uniqueMemories) {
                  await createMemory({
                    userId: ctx.user.id,
                    sentinelId: primarySentinel.sentinelId,
                    conversationId: input.conversationId,
                    category: memory.category,
                    content: memory.content,
                    context: memory.context,
                    importance: memory.importance,
                    tags: memory.tags,
                  });
                }
              }
            } catch (error) {
              console.error("Error extracting memories:", error);
            }
          })();

          // Generate memory suggestions (async, don't block response)
          (async () => {
            try {
              const { detectMemorySuggestions } = await import("./memory-suggestions");
              const { createMemorySuggestion } = await import("./suggestions-db");

              // Get user message and AI response
              const userMessage = messages[messages.length - 2]?.content || "";
              const aiResponse = response.content;

              // Detect suggestions
              const suggestions = await detectMemorySuggestions(
                userMessage,
                aiResponse,
                messages.slice(0, -2).map((m: any) => ({ role: m.role, content: m.content })),
                primarySentinel.sentinelName || "Sentinel"
              );

              // Save suggestions
              for (const suggestion of suggestions) {
                await createMemorySuggestion({
                  userId: ctx.user.id,
                  conversationId: input.conversationId,
                  messageId: messageId,
                  sentinelId: primarySentinel.sentinelId,
                  content: suggestion.content,
                  category: suggestion.category,
                  importance: suggestion.importance,
                  tags: suggestion.tags,
                  reasoning: suggestion.reasoning,
                });
              }
            } catch (error) {
              console.error("Error generating suggestions:", error);
            }
          })();
        }
        
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

    edit: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateMessage, getMessageById } = await import("./db");
        
        // Verify message exists
        const message = await getMessageById(input.messageId);
        if (!message) {
          throw new Error("Message not found");
        }
        
        // Update the message content
        await updateMessage(input.messageId, input.content);
        
        return { success: true };
      }),

    editAndRegenerate: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        content: z.string().min(1),
        model: z.string().default("gpt-4"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateMessage, getMessageById, deleteMessagesAfter, getConversationMessages, createMessage, getUserSettings } = await import("./db");
        const { routeLLMRequest } = await import("./llm-router");
        const { calculateCost, formatCost } = await import("./cost-calculator");
        const { DEFAULT_SYSTEM_PROMPT } = await import("./default-system-prompt");
        
        // Get the message to edit
        const message = await getMessageById(input.messageId);
        if (!message) {
          throw new Error("Message not found");
        }
        
        // Update the user message
        await updateMessage(input.messageId, input.content);
        
        // Delete all messages after this one (including the old AI response)
        await deleteMessagesAfter(input.messageId);
        
        // Get Sentinel system prompt if one is selected for this conversation
        const { getConversationSentinels } = await import("./sentinels-db");
        const conversationSentinels = await getConversationSentinels(message.conversationId);
        const primarySentinel = conversationSentinels.find((cs: any) => cs.role === 'primary');
        
        let systemPrompt;
        if (primarySentinel && primarySentinel.systemPrompt) {
          // Use Sentinel's system prompt if one is selected
          systemPrompt = primarySentinel.systemPrompt;
          
          // Inject relevant memories into system prompt
          const { getTopMemories } = await import("./memory-db");
          const memories = await getTopMemories(ctx.user.id, primarySentinel.sentinelId, 5);
          
          if (memories.length > 0) {
            const memoryContext = `\n\n## Your Memories of This User\n\nYou have worked with this user before. Here are key things you remember:\n\n${memories.map((m, i) => `${i + 1}. **${m.category.toUpperCase()}**: ${m.content}${m.context ? ` (${m.context})` : ""}`).join("\n")}

Reference these memories naturally when relevant. For example: "Remember when we worked on [topic]?" or "Building on what we discussed about [topic]..."`;
            
            systemPrompt = systemPrompt + memoryContext;
          }
        } else {
          // Fall back to user's custom system prompt or default
          const userSettings = await getUserSettings(ctx.user.id);
          systemPrompt = userSettings?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        }
        
        // Get updated conversation history
        const messages = await getConversationMessages(message.conversationId, ctx.user.id);
        
        // Format messages for LLM
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
        
        // Generate new response
        const response = await routeLLMRequest(llmMessages, input.model);
        
        // Calculate cost
        const costBreakdown = calculateCost(input.model, response.usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        });
        
        // Save new assistant message
        const messageId = await createMessage({
          conversationId: message.conversationId,
          role: "assistant",
          content: response.content,
          model: response.model,
          provider: response.provider,
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
          costUsd: costBreakdown.totalCost.toString(),
        });
        
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
          categoryId: z.number().nullable().optional(),
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
          categoryId: z.number().nullable().optional(),
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
    seedConversationTemplates: protectedProcedure.mutation(async ({ ctx }) => {
      const { seedConversationTemplates } = await import("./seed-templates");
      const count = await seedConversationTemplates(ctx.user.id);
      return { success: true, count };
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
    
    // Review operations
    submitReview: protectedProcedure
      .input(
        z.object({
          templateId: z.number(),
          rating: z.number().min(1).max(5),
          reviewText: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { upsertReview } = await import("./template-reviews-db");
        return upsertReview({
          templateId: input.templateId,
          userId: ctx.user.id,
          userName: ctx.user.name || "Anonymous",
          rating: input.rating,
          reviewText: input.reviewText,
        });
      }),
    
    getReviews: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        const { getReviewsByTemplate } = await import("./template-reviews-db");
        return getReviewsByTemplate(input.templateId);
      }),
    
    getUserReview: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getUserReview } = await import("./template-reviews-db");
        return getUserReview(input.templateId, ctx.user.id);
      }),
    
    deleteReview: protectedProcedure
      .input(z.object({ reviewId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteReview } = await import("./template-reviews-db");
        return deleteReview(input.reviewId, ctx.user.id);
      }),
    
    getRating: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        const { getTemplateRating } = await import("./template-reviews-db");
        return getTemplateRating(input.templateId);
      }),
    
    getRatings: protectedProcedure
      .input(z.object({ templateIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        const { getTemplateRatings } = await import("./template-reviews-db");
        return getTemplateRatings(input.templateIds);
      }),
    
    getFeatured: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { getFeaturedTemplates } = await import("./template-reviews-db");
        const { getPublicTemplates } = await import("./templates-db");
        
        // Get featured template IDs with ratings
        const featured = await getFeaturedTemplates(input?.limit);
        
        // Fetch full template data for featured templates
        const allPublicTemplates = await getPublicTemplates();
        const featuredTemplates = allPublicTemplates.filter(t => 
          featured.some(f => f.templateId === t.id)
        );
        
        // Return templates with their rating data
        return featuredTemplates.map(template => {
          const rating = featured.find(f => f.templateId === template.id);
          return {
            ...template,
            averageRating: rating?.averageRating || 0,
            reviewCount: rating?.reviewCount || 0,
          };
        });
      }),
    
    // Category management procedures
    listCategories: protectedProcedure.query(async ({ ctx }) => {
      const { listCategories } = await import("./template-categories-db");
      return listCategories(ctx.user.id);
    }),
    
    createCategory: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createCategory } = await import("./template-categories-db");
        return createCategory({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
        });
      }),
    
    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateCategory } = await import("./template-categories-db");
        const { id, ...data } = input;
        await updateCategory(id, ctx.user.id, data);
        return { success: true };
      }),
    
    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteCategory } = await import("./template-categories-db");
        await deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
    
    createDefaultCategories: protectedProcedure.mutation(async ({ ctx }) => {
      const { createDefaultCategories } = await import("./template-categories-db");
      return createDefaultCategories(ctx.user.id);
    }),
    
    toggleCategoryPublic: protectedProcedure
      .input(z.object({ id: z.number(), isPublic: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const { toggleCategoryPublic } = await import("./template-categories-db");
        await toggleCategoryPublic(input.id, ctx.user.id, input.isPublic);
        return { success: true };
      }),
    
    listPublicCategories: protectedProcedure.query(async () => {
      const { listPublicCategories } = await import("./template-categories-db");
      return listPublicCategories();
    }),
    
    importCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { importCategory } = await import("./template-categories-db");
        const newCategoryId = await importCategory(
          input.categoryId,
          ctx.user.id,
          ctx.user.name || "Anonymous"
        );
        return { categoryId: newCategoryId };
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

  // Sentinel management
  sentinels: router({
    list: publicProcedure.query(async () => {
      const { getAllSentinels } = await import("./sentinels-db");
      return getAllSentinels();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getSentinelById } = await import("./sentinels-db");
        return getSentinelById(input.id);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { getSentinelBySlug } = await import("./sentinels-db");
        return getSentinelBySlug(input.slug);
      }),

    getMemory: protectedProcedure
      .input(z.object({ sentinelId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getSentinelMemory } = await import("./sentinels-db");
        return getSentinelMemory(ctx.user.id, input.sentinelId);
      }),

    getAllMemories: protectedProcedure.query(async ({ ctx }) => {
      const { getAllSentinelMemories } = await import("./sentinels-db");
      return getAllSentinelMemories(ctx.user.id);
    }),

    updateMemory: protectedProcedure
      .input(z.object({
        sentinelId: z.number(),
        interactionCount: z.number().optional(),
        lastInteraction: z.date().optional(),
        collaborationAreas: z.array(z.string()).optional(),
        keyInsights: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateSentinelMemory } = await import("./sentinels-db");
        return updateSentinelMemory(ctx.user.id, input.sentinelId, input);
      }),

    addToConversation: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        sentinelId: z.number(),
        role: z.enum(["primary", "collaborator"]),
      }))
      .mutation(async ({ input }) => {
        const { addSentinelToConversation } = await import("./sentinels-db");
        return addSentinelToConversation(input.conversationId, input.sentinelId, input.role);
      }),

    getConversationSentinels: publicProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const { getConversationSentinels } = await import("./sentinels-db");
        return getConversationSentinels(input.conversationId);
      }),

    removeFromConversation: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        sentinelId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { removeSentinelFromConversation } = await import("./sentinels-db");
        return removeSentinelFromConversation(input.conversationId, input.sentinelId);
      }),

    // Memory management
    memories: router({
      // Analytics procedures
      timeline: protectedProcedure
        .input(
          z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            granularity: z.enum(["day", "week", "month"]).default("day"),
          })
        )
        .query(async ({ ctx, input }) => {
          const { getMemoryTimeline } = await import("./memory-analytics");
          return getMemoryTimeline(
            ctx.user.id,
            input.startDate ? new Date(input.startDate) : undefined,
            input.endDate ? new Date(input.endDate) : undefined,
            input.granularity
          );
        }),

      categoryStats: protectedProcedure
        .input(z.object({ sentinelId: z.number().optional() }))
        .query(async ({ ctx, input }) => {
          const { getCategoryStats } = await import("./memory-analytics");
          return getCategoryStats(ctx.user.id, input.sentinelId);
        }),

      sentinelStats: protectedProcedure
        .query(async ({ ctx }) => {
          const { getSentinelCollaborationStats } = await import("./memory-analytics");
          return getSentinelCollaborationStats(ctx.user.id);
        }),

      evolutionPaths: protectedProcedure
        .input(z.object({ minMemories: z.number().default(2) }))
        .query(async ({ ctx, input }) => {
          const { getEvolutionPaths } = await import("./memory-analytics");
          return getEvolutionPaths(ctx.user.id, input.minMemories);
        }),

      insights: protectedProcedure
        .query(async ({ ctx }) => {
          const { generateTrendInsights } = await import("./memory-analytics");
          return generateTrendInsights(ctx.user.id);
        }),

      // Existing memory CRUD procedures
      list: protectedProcedure
        .input(z.object({ sentinelId: z.number() }))
        .query(async ({ ctx, input }) => {
          const { getUserSentinelMemories } = await import("./memory-db");
          return getUserSentinelMemories(ctx.user.id, input.sentinelId);
        }),

      listAll: protectedProcedure.query(async ({ ctx }) => {
        const { getAllUserMemories } = await import("./memory-db");
        return getAllUserMemories(ctx.user.id);
      }),

      create: protectedProcedure
        .input(z.object({
          sentinelId: z.number(),
          conversationId: z.number().optional(),
          category: z.enum(["insight", "decision", "milestone", "preference", "goal", "achievement", "challenge", "pattern"]),
          content: z.string(),
          context: z.string().optional(),
          importance: z.number().min(0).max(100).optional(),
          tags: z.array(z.string()).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { createMemory } = await import("./memory-db");
          return createMemory({
            userId: ctx.user.id,
            sentinelId: input.sentinelId,
            conversationId: input.conversationId,
            category: input.category,
            content: input.content,
            context: input.context,
            importance: input.importance,
            tags: input.tags,
          });
        }),

      update: protectedProcedure
        .input(z.object({
          memoryId: z.number(),
          content: z.string().optional(),
          context: z.string().optional(),
          importance: z.number().min(0).max(100).optional(),
          tags: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input }) => {
          const { updateMemory } = await import("./memory-db");
          return updateMemory(input.memoryId, {
            content: input.content,
            context: input.context,
            importance: input.importance,
            tags: input.tags,
          });
        }),

      delete: protectedProcedure
        .input(z.object({ memoryId: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteMemory } = await import("./memory-db");
          return deleteMemory(input.memoryId);
        }),

      search: protectedProcedure
        .input(z.object({
          sentinelId: z.number(),
          searchTerm: z.string(),
        }))
        .query(async ({ ctx, input }) => {
          const { searchMemories } = await import("./memory-db");
          return searchMemories(ctx.user.id, input.sentinelId, input.searchTerm);
        }),

      stats: protectedProcedure
        .input(z.object({ sentinelId: z.number() }))
        .query(async ({ ctx, input }) => {
          const { getMemoryStats } = await import("./memory-db");
          return getMemoryStats(ctx.user.id, input.sentinelId);
        }),

      // Memory suggestions
      suggestions: router({
      // Get pending suggestions for a conversation
      pending: protectedProcedure
        .input(z.object({ conversationId: z.number().optional() }))
        .query(async ({ ctx, input }) => {
          const { getPendingSuggestions } = await import("./suggestions-db");
          return getPendingSuggestions(ctx.user.id, input.conversationId);
        }),

      // Get suggestions for a specific message
      byMessage: protectedProcedure
        .input(z.object({ messageId: z.number() }))
        .query(async ({ input }) => {
          const { getSuggestionsByMessage } = await import("./suggestions-db");
          return getSuggestionsByMessage(input.messageId);
        }),

      // Accept a suggestion and save as memory
      accept: protectedProcedure
        .input(z.object({
          suggestionId: z.number(),
          saveAsMemory: z.boolean().default(true),
        }))
        .mutation(async ({ ctx, input }) => {
          const { acceptSuggestion, getPendingSuggestions } = await import("./suggestions-db");
          const { createMemory } = await import("./memory-db");

          // Get the suggestion
          const suggestions = await getPendingSuggestions(ctx.user.id);
          const suggestion = suggestions.find((s: any) => s.id === input.suggestionId);
          if (!suggestion) throw new Error("Suggestion not found");

          let savedMemoryId: boolean | null | undefined;

          // Save as memory if requested
          if (input.saveAsMemory) {
            savedMemoryId = await createMemory({
              userId: ctx.user.id,
              sentinelId: suggestion.sentinelId || 0,
              conversationId: suggestion.conversationId,
              content: suggestion.content,
              category: suggestion.category as any,
              importance: suggestion.importance,
              tags: suggestion.tags,
              context: suggestion.reasoning || "",
            });
          }

          // Mark suggestion as accepted
          await acceptSuggestion(input.suggestionId, ctx.user.id, savedMemoryId ? 1 : undefined);

          return { success: true, memoryId: savedMemoryId ? 1 : undefined };
        }),

      // Dismiss a suggestion
      dismiss: protectedProcedure
        .input(z.object({
          suggestionId: z.number(),
          feedback: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { dismissSuggestion } = await import("./suggestions-db");
          return dismissSuggestion(input.suggestionId, ctx.user.id, input.feedback);
        }),

      // Edit and accept a suggestion
      editAndAccept: protectedProcedure
        .input(z.object({
          suggestionId: z.number(),
          content: z.string(),
          category: z.string().optional(),
          tags: z.array(z.string()).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { editAndAcceptSuggestion, getPendingSuggestions } = await import("./suggestions-db");
          const { createMemory } = await import("./memory-db");

          // Get the suggestion
          const suggestions = await getPendingSuggestions(ctx.user.id);
          const suggestion = suggestions.find((s: any) => s.id === input.suggestionId);
          if (!suggestion) throw new Error("Suggestion not found");

          // Create memory with edited content
          const savedMemoryId: boolean | null = await createMemory({
            userId: ctx.user.id,
            sentinelId: suggestion.sentinelId || 0,
            conversationId: suggestion.conversationId,
            content: input.content,
            category: (input.category || suggestion.category) as any,
            importance: suggestion.importance,
            tags: input.tags || suggestion.tags,
            context: suggestion.reasoning || "",
          });

          // Mark suggestion as edited and accepted
          await editAndAcceptSuggestion(
            input.suggestionId,
            ctx.user.id,
            input.content,
            input.category,
            input.tags,
            savedMemoryId ? 1 : undefined
          );

          return { success: true, memoryId: savedMemoryId ? 1 : undefined };
        }),

        // Get suggestion statistics
        stats: protectedProcedure
          .query(async ({ ctx }) => {
            const { getSuggestionStats } = await import("./suggestions-db");
            return getSuggestionStats(ctx.user.id);
          }),
      }),
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
