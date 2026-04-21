import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { awardXp } from "./gamification";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, TRPCError } from "./_core/trpc";
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
    completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.update(users)
        .set({ onboardingCompleted: true, onboardingStep: 6 })
        .where(eq(users.id, ctx.user.id));
      
      return { success: true };
    }),
    updateOnboardingStep: protectedProcedure
      .input(z.object({ step: z.number().min(0).max(6) }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await db.update(users)
          .set({ onboardingStep: input.step })
          .where(eq(users.id, ctx.user.id));
        
        return { success: true };
      }),
    resetOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.update(users)
        .set({ onboardingCompleted: false, onboardingStep: 0 })
        .where(eq(users.id, ctx.user.id));
      
      return { success: true };
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
      .input(z.object({
        data: z.object({
          title: z.string().min(1).max(255),
          defaultModel: z.string().max(100).optional(),
          messages: z.array(z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string().min(1).max(20000),
            sentinelId: z.number().optional(),
            model: z.string().max(100).optional(),
          })).max(1000),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const { importConversation } = await import("./conversation-export-db");
        const conversationId = await importConversation(input.data, ctx.user.id);
        return { id: conversationId };
      }),

    // Multi-Sentinel management (Pro feature)
    listSentinels: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getConversationSentinels } = await import("./sentinels-db");
        return getConversationSentinels(input.conversationId);
      }),

    addSentinel: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        sentinelId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Pro-tier gating: Free users can only have 1 Sentinel per conversation
        const { isProOrAbove: isProOrAbove_addSentinel } = await import("./products");
        if (!isProOrAbove_addSentinel(ctx.user.subscriptionTier ?? "free")) {
          const { getConversationSentinels } = await import("./sentinels-db");
          const existingSentinels = await getConversationSentinels(input.conversationId);
          
          if (existingSentinels.length >= 1) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Multi-Sentinel conversations are a Pro feature. Upgrade to add multiple Sentinels to your conversations.",
            });
          }
        }

        const { addSentinelToConversation } = await import("./sentinels-db");
        // Add as collaborator (primary is set during conversation creation)
        await addSentinelToConversation(input.conversationId, input.sentinelId, "collaborator");
        return { success: true };
      }),

    removeSentinel: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        sentinelId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { removeSentinelFromConversation } = await import("./sentinels-db");
        await removeSentinelFromConversation(input.conversationId, input.sentinelId);
        return { success: true };
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
        content: z.string().min(1).max(20000),
        model: z.string().max(100).default("gpt-4"),
        targetSentinelId: z.number().optional(), // Optional: manually select which Sentinel responds
      }))
      .mutation(async ({ ctx, input }) => {
        const { createMessage, getConversationById, updateConversation, getUserSettings, getConversationMessages } = await import("./db");
        const { routeLLMRequest } = await import("./llm-router");
        const { calculateCost, formatCost } = await import("./cost-calculator");
        const { DEFAULT_SYSTEM_PROMPT } = await import("./default-system-prompt");
        
        // Check usage limits for free tier users
        const { checkMessageLimit } = await import("./usage-tracking");
        const usageCheck = await checkMessageLimit(ctx.user.id);
        
        if (!usageCheck.allowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've reached your monthly limit of ${usageCheck.limit} messages. Upgrade to Pro for unlimited messages at $19/month.`,
          });
        }
        
        // Verify conversation ownership
        const conversation = await getConversationById(input.conversationId, ctx.user.id);
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get Sentinel system prompt if one is selected for this conversation
        const { getConversationSentinels, updateSentinelMessageCount } = await import("./sentinels-db");
        const conversationSentinels = await getConversationSentinels(input.conversationId);
        
        // Sentinel selection: manual override or automatic rotation
        let activeSentinel;
        if (input.targetSentinelId) {
          // Manual selection: use the specified Sentinel
          activeSentinel = conversationSentinels.find((cs: any) => cs.sentinelId === input.targetSentinelId);
          if (!activeSentinel) {
            throw new Error("Selected Sentinel is not assigned to this conversation");
          }
        } else if (conversationSentinels.length > 1) {
          // Automatic rotation: select Sentinel with lowest message count
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
        
        // Save assistant message with cost tracking and Sentinel attribution
        const messageId = await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: response.content,
          model: response.model,
          provider: response.provider,
          sentinelId: activeSentinel?.sentinelId || null, // Track which Sentinel responded
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
        
        // Award XP for sending a message — await so we can surface new achievements
        const xpResult = await awardXp(ctx.user.id, "message_sent").catch(() => ({ xpAwarded: 0, newAchievements: [] }));

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
          newAchievements: xpResult.newAchievements.map((a) => ({ id: a.id, title: a.title, emoji: a.emoji, tier: a.tier })),
        };
      }),

    edit: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        content: z.string().min(1).max(20000),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateMessage, getMessageById, getConversationById } = await import("./db");
        
        // Verify message exists and belongs to the calling user's conversation
        const message = await getMessageById(input.messageId);
        if (!message) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
        }
        const conversation = await getConversationById(message.conversationId, ctx.user.id);
        if (!conversation) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        // Update the message content
        await updateMessage(input.messageId, input.content);
        
        return { success: true };
      }),

    editAndRegenerate: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        content: z.string().min(1).max(20000),
        model: z.string().max(100).default("gpt-4"),
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
        
        // Award XP for sending a message — await so we can surface new achievements
        const xpResult2 = await awardXp(ctx.user.id, "message_sent").catch(() => ({ xpAwarded: 0, newAchievements: [] }));

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
          newAchievements: xpResult2.newAchievements.map((a) => ({ id: a.id, title: a.title, emoji: a.emoji, tier: a.tier })),
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
          emailDigestFrequency: "weekly" as const,
          lastDigestSent: null,
          ttsEnabled: false,
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
        systemPrompt: z.string().max(10000).optional(),
        emailDigestFrequency: z.enum(["weekly", "monthly", "both", "off"]).optional(),
        ttsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { upsertUserSettings } = await import("./db");
        await upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
    
    sendTestDigest: protectedProcedure
      .input(z.object({ type: z.enum(["weekly", "monthly"]) }))
      .mutation(async ({ ctx, input }) => {
        const { sendDigestEmail } = await import("./email-digest");
        const success = await sendDigestEmail(ctx.user.id, input.type);
        return { success };
      }),
  }),
  
  // Usage analytics and cost tracking
  costs: router({
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
        const templateResult = await createTemplate({
          ...input,
          userId: ctx.user.id,
          isDefault: 0,
          isPublic: 0,
        }, ctx.user.name || "Anonymous");
        // Award XP for creating a template — await to surface new achievements
        const tmplXp = await awardXp(ctx.user.id, "template_created").catch(() => ({ xpAwarded: 0, newAchievements: [] }));
        return { ...templateResult, newAchievements: tmplXp.newAchievements.map((a) => ({ id: a.id, title: a.title, emoji: a.emoji, tier: a.tier })) };
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
    
    // Template activation - apply variables and prepare for use
    activate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        variables: z.record(z.string(), z.string()).optional(), // Key-value pairs for variable substitution
      }))
      .mutation(async ({ input, ctx }) => {
        const { getTemplateById, getTemplateByIdAny } = await import("./templates-db");
        let template = await getTemplateById(input.templateId, ctx.user.id);
        
        // If not found in user's templates, try to get it as a public template
        if (!template) {
          template = await getTemplateByIdAny(input.templateId);
          // Verify it's actually public
          if (template && template.isPublic !== 1) {
            throw new Error("Template not found");
          }
        }
        
        if (!template) {
          throw new Error("Template not found");
        }
        
        // Apply variable substitution
        let processedPrompt = template.prompt;
        if (input.variables) {
          Object.entries(input.variables).forEach(([key, value]) => {
            const placeholder = `[${key.toUpperCase()}]`;
            processedPrompt = processedPrompt.replaceAll(placeholder, String(value));
          });
        }
        
        // Parse follow-up prompts if they exist
        let followUpPrompts: string[] = [];
        if (template.followUpPrompts) {
          try {
            followUpPrompts = JSON.parse(template.followUpPrompts);
          } catch (e) {
            // If parsing fails, treat as empty array
          }
        }
        
        // Parse memory tags if they exist
        let memoryTags: string[] = [];
        if (template.memoryTags) {
          try {
            memoryTags = JSON.parse(template.memoryTags);
          } catch (e) {
            // If parsing fails, treat as empty array
          }
        }
        
        return {
          prompt: processedPrompt,
          recommendedSentinelId: template.recommendedSentinelId,
          followUpPrompts,
          memoryTags,
        };
      }),
    
    // Search templates by name, description, or category
    search: protectedProcedure
      .input(z.object({
        query: z.string(),
        categoryId: z.number().optional(),
        includePublic: z.boolean().default(false),
      }))
      .query(async ({ input, ctx }) => {
        const { getTemplatesByUser, getPublicTemplates } = await import("./templates-db");
        
        // Get user's templates
        let templates = await getTemplatesByUser(ctx.user.id);
        
        // Optionally include public templates
        if (input.includePublic) {
          const publicTemplates = await getPublicTemplates();
          templates = [...templates, ...publicTemplates];
        }
        
        // Filter by search query
        const query = input.query.toLowerCase();
        let filtered = templates.filter(t => 
          t.name.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
        );
        
        // Filter by category if specified
        if (input.categoryId !== undefined) {
          filtered = filtered.filter(t => t.categoryId === input.categoryId);
        }
        
        return filtered;
      }),
    
    // Track template usage
    trackUsage: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // This is a simple implementation - you could extend this to track
        // usage in a separate table with timestamps, user info, etc.
        // For now, we'll just return success
        return { success: true, templateId: input.templateId };
      }),
  }),



  // Sentinel management
  sentinels: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const { getAllSentinels } = await import("./sentinels-db");
      const { FREE_TIER_SENTINEL_SLUGS } = await import("./products");
      const allSentinels = await getAllSentinels();

      const tier = (ctx.user?.subscriptionTier ?? "free").toLowerCase();

      // Creator tier: include custom Sentinels owned by this user
      if (tier === "creator" && ctx.user) {
        const { getDb } = await import("./db");
        const { customSentinels } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        const custom = db
          ? await db.select().from(customSentinels).where(eq(customSentinels.userId, ctx.user.id))
          : [];
        // Map custom Sentinels to the same shape as built-in ones
        const customMapped = custom.map((c) => ({
          specialties: [] as string[],
          id: c.id + 100000, // offset to avoid ID collision with built-in Sentinels
          slug: c.slug,
          name: c.name,
          archetype: c.archetype,
          primaryFunction: c.primaryFunction,
          energySignature: null,
          personalityTraits: c.personalityTraits,
          communicationStyle: c.communicationStyle,
          specializationDomains: c.specializationDomains,
          idealUseCases: null,
          primaryColor: c.primaryColor,
          secondaryColor: c.primaryColor,
          accentColor: c.primaryColor,
          symbolEmoji: c.symbolEmoji,
          systemPrompt: c.systemPrompt,
          displayOrder: 999,
          isActive: c.isActive,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          isCustom: true,
          customId: c.id,
        }));
        return [...allSentinels, ...customMapped];
      }

      // Free-tier users only see the 3 included Sentinels
      const { isProOrAbove: isProOrAbove_list } = await import("./products");
      if (!isProOrAbove_list(tier)) {
        return allSentinels.filter((s) =>
          (FREE_TIER_SENTINEL_SLUGS as readonly string[]).includes(s.slug)
        );
      }

      return allSentinels;
    }),

    // Custom Sentinel CRUD (Creator tier only)
    custom: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const tier = (ctx.user.subscriptionTier ?? "free").toLowerCase();
        if (tier !== "creator") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Custom Sentinels require the Creator tier." });
        }
        const { getDb } = await import("./db");
        const { customSentinels } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        return db.select().from(customSentinels).where(eq(customSentinels.userId, ctx.user.id));
      }),

      create: protectedProcedure
        .input(z.object({
          name: z.string().min(2).max(100),
          archetype: z.string().min(2).max(255),
          primaryFunction: z.string().min(10),
          personalityTraits: z.array(z.string()).min(1).max(10),
          communicationStyle: z.string().min(5),
          specializationDomains: z.array(z.string()).min(1).max(10),
          primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#8b5cf6"),
          symbolEmoji: z.string().max(10).default("✨"),
          systemPrompt: z.string().min(20),
        }))
        .mutation(async ({ ctx, input }) => {
          const tier = (ctx.user.subscriptionTier ?? "free").toLowerCase();
          if (tier !== "creator") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Custom Sentinel creation requires the Creator tier." });
          }
          const { getDb } = await import("./db");
          const { customSentinels } = await import("../drizzle/schema");
          const { eq, count } = await import("drizzle-orm");
          const { getMaxCustomSentinels } = await import("./products");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

          // Enforce max custom Sentinels limit
          const [countResult] = await db.select({ count: count() }).from(customSentinels).where(eq(customSentinels.userId, ctx.user.id));
          const maxAllowed = getMaxCustomSentinels(tier);
          if ((countResult?.count ?? 0) >= maxAllowed) {
            throw new TRPCError({ code: "FORBIDDEN", message: `You have reached the maximum of ${maxAllowed} custom Sentinels.` });
          }

          // Generate a unique slug from the name
          const baseSlug = `custom-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${ctx.user.id}`;

          const [result] = await db.insert(customSentinels).values({
            userId: ctx.user.id,
            name: input.name,
            slug: baseSlug,
            archetype: input.archetype,
            primaryFunction: input.primaryFunction,
            personalityTraits: JSON.stringify(input.personalityTraits),
            communicationStyle: input.communicationStyle,
            specializationDomains: JSON.stringify(input.specializationDomains),
            primaryColor: input.primaryColor,
            symbolEmoji: input.symbolEmoji,
            systemPrompt: input.systemPrompt,
          }).$returningId();

          // Award XP for creating a custom Sentinel — await to surface new achievements
          const sentXp = await awardXp(ctx.user.id, "custom_sentinel_created").catch(() => ({ xpAwarded: 0, newAchievements: [] }));
          return { id: result.id, slug: baseSlug, newAchievements: sentXp.newAchievements.map((a) => ({ id: a.id, title: a.title, emoji: a.emoji, tier: a.tier })) };
        }),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().min(2).max(100).optional(),
          archetype: z.string().min(2).max(255).optional(),
          primaryFunction: z.string().min(10).optional(),
          personalityTraits: z.array(z.string()).min(1).max(10).optional(),
          communicationStyle: z.string().min(5).optional(),
          specializationDomains: z.array(z.string()).min(1).max(10).optional(),
          primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          symbolEmoji: z.string().max(10).optional(),
          systemPrompt: z.string().min(20).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const tier = (ctx.user.subscriptionTier ?? "free").toLowerCase();
          if (tier !== "creator") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Custom Sentinel editing requires the Creator tier." });
          }
          const { getDb } = await import("./db");
          const { customSentinels } = await import("../drizzle/schema");
          const { eq, and } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

          const updateData: Record<string, unknown> = {};
          if (input.name !== undefined) updateData.name = input.name;
          if (input.archetype !== undefined) updateData.archetype = input.archetype;
          if (input.primaryFunction !== undefined) updateData.primaryFunction = input.primaryFunction;
          if (input.personalityTraits !== undefined) updateData.personalityTraits = JSON.stringify(input.personalityTraits);
          if (input.communicationStyle !== undefined) updateData.communicationStyle = input.communicationStyle;
          if (input.specializationDomains !== undefined) updateData.specializationDomains = JSON.stringify(input.specializationDomains);
          if (input.primaryColor !== undefined) updateData.primaryColor = input.primaryColor;
          if (input.symbolEmoji !== undefined) updateData.symbolEmoji = input.symbolEmoji;
          if (input.systemPrompt !== undefined) updateData.systemPrompt = input.systemPrompt;

          await db.update(customSentinels)
            .set(updateData)
            .where(and(eq(customSentinels.id, input.id), eq(customSentinels.userId, ctx.user.id)));

          return { success: true };
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const tier = (ctx.user.subscriptionTier ?? "free").toLowerCase();
          if (tier !== "creator") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Custom Sentinel deletion requires the Creator tier." });
          }
          const { getDb } = await import("./db");
          const { customSentinels } = await import("../drizzle/schema");
          const { eq, and } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

          await db.delete(customSentinels)
            .where(and(eq(customSentinels.id, input.id), eq(customSentinels.userId, ctx.user.id)));

          return { success: true };
        }),

      generatePrompt: protectedProcedure
        .input(
          z.object({
            name: z.string().min(1),
            archetype: z.string().min(1),
            primaryFunction: z.string().min(5),
            personalityTraits: z.array(z.string()),
            communicationStyle: z.string(),
            specializationDomains: z.array(z.string()),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const tier = (ctx.user.subscriptionTier ?? "free").toLowerCase();
          if (tier !== "creator") {
            throw new TRPCError({ code: "FORBIDDEN", message: "AI prompt generation requires the Creator tier." });
          }
          const { invokeLLM } = await import("./_core/llm");
          const traitsStr = input.personalityTraits.join(", ") || "thoughtful, precise";
          const domainsStr = input.specializationDomains.join(", ") || "general knowledge";
          const result = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are an expert AI persona designer. Write a concise, powerful system prompt for a custom AI assistant. " +
                  "The prompt should be 3-5 sentences, written in second person (\"You are...\"), and capture the essence of the persona. " +
                  "Make it specific, vivid, and immediately actionable. Do not add any preamble or explanation — output only the system prompt text.",
              },
              {
                role: "user",
                content:
                  `Create a system prompt for an AI named "${input.name}" with the following profile:\n` +
                  `- Archetype: ${input.archetype}\n` +
                  `- Primary Function: ${input.primaryFunction}\n` +
                  `- Personality Traits: ${traitsStr}\n` +
                  `- Communication Style: ${input.communicationStyle || "clear and direct"}\n` +
                  `- Specialization Domains: ${domainsStr}`,
              },
            ],
          });
          const prompt = result?.choices?.[0]?.message?.content ?? "";
          if (!prompt) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate prompt." });
          return { prompt };
        }),
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
      .mutation(async ({ ctx, input }) => {
        // Pro-tier gating: free users can only have 1 Sentinel per conversation
        const tier = (ctx.user.subscriptionTier ?? "free").toLowerCase();
        const { isProOrAbove: isProOrAbove_collab } = await import("./products");
        if (!isProOrAbove_collab(tier) && input.role === "collaborator") {
          const { getConversationSentinels } = await import("./sentinels-db");
          const existing = await getConversationSentinels(input.conversationId);
          if (existing.length >= 1) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Multi-Sentinel conversations are a Pro feature. Upgrade to add multiple Sentinels to your conversations.",
            });
          }
        }
        const { addSentinelToConversation } = await import("./sentinels-db");
        return addSentinelToConversation(input.conversationId, input.sentinelId, input.role);
      }),

    getConversationSentinels: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify the conversation belongs to the calling user
        const { getConversationById } = await import("./db");
        const conversation = await getConversationById(input.conversationId, ctx.user.id);
        if (!conversation) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
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
          content: z.string().min(1).max(5000),
          context: z.string().max(2000).optional(),
          importance: z.number().min(0).max(100).optional(),
          tags: z.array(z.string().max(50)).max(20).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { createMemory } = await import("./memory-db");
          const memoryResult = await createMemory({
            userId: ctx.user.id,
            sentinelId: input.sentinelId,
            conversationId: input.conversationId,
            category: input.category,
            content: input.content,
            context: input.context,
            importance: input.importance,
            tags: input.tags,
          });
          // Award XP for saving a memory — await to surface new achievements
          const memXp = await awardXp(ctx.user.id, "memory_saved").catch(() => ({ xpAwarded: 0, newAchievements: [] }));
          return { success: memoryResult, newAchievements: memXp.newAchievements.map((a) => ({ id: a.id, title: a.title, emoji: a.emoji, tier: a.tier })) };
        }),

      update: protectedProcedure
        .input(z.object({
          memoryId: z.number(),
          content: z.string().min(1).max(5000).optional(),
          context: z.string().max(2000).optional(),
          importance: z.number().min(0).max(100).optional(),
          tags: z.array(z.string().max(50)).max(20).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          // Verify memory belongs to the calling user
          const { updateMemory, getMemoryById } = await import("./memory-db");
          const memory = await getMemoryById(input.memoryId);
          if (!memory || memory.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
          return updateMemory(input.memoryId, {
            content: input.content,
            context: input.context,
            importance: input.importance,
            tags: input.tags,
          });
        }),

      delete: protectedProcedure
        .input(z.object({ memoryId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          // Verify memory belongs to the calling user
          const { deleteMemory, getMemoryById } = await import("./memory-db");
          const memory = await getMemoryById(input.memoryId);
          if (!memory || memory.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
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

  // Voice features (Pro tier)
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audio: z.string(), // base64 encoded audio
        mimeType: z.string(),
        language: z.string().optional(),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check Pro tier requirement
        const { isProOrAbove: isProOrAbove_transcribe } = await import("./products");
        if (!isProOrAbove_transcribe(ctx.user.subscriptionTier ?? "free")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Voice features are only available for Pro and Creator users. Upgrade to unlock voice mode.",
          });
        }

        const { transcribeAudio } = await import("./_core/voiceTranscription");
        const { storagePut } = await import("./storage");
        
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(input.audio, "base64");
        
        // Upload to storage and get URL
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const { url } = await storagePut(
          `voice-recordings/${timestamp}-${randomSuffix}.webm`,
          audioBuffer,
          input.mimeType
        );
        
        // Transcribe using the uploaded URL
        const result = await transcribeAudio({
          audioUrl: url,
          language: input.language,
          prompt: input.prompt,
        });
        
        // Check if it's an error
        if ('error' in result) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
            cause: result,
          });
        }
        
        return result;
      }),

    synthesize: protectedProcedure
      .input(z.object({
        text: z.string(),
        voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
        speed: z.number().min(0.25).max(4.0).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check Pro tier requirement
        const { isProOrAbove: isProOrAbove_synthesize } = await import("./products");
        if (!isProOrAbove_synthesize(ctx.user.subscriptionTier ?? "free")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Voice features are only available for Pro and Creator users. Upgrade to unlock voice mode.",
          });
        }

        const { synthesizeSpeech } = await import("./_core/textToSpeech");
        const result = await synthesizeSpeech(input);
        
        // Check if it's an error
        if ('error' in result) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
            cause: result,
          });
        }
        
        return result;
      }),
  }),

  // Subscription management
  subscription: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      return {
        tier: ctx.user.subscriptionTier || "free",
        status: ctx.user.subscriptionStatus || "active",
        currentPeriodEnd: ctx.user.subscriptionCurrentPeriodEnd,
        stripeCustomerId: ctx.user.stripeCustomerId,
        stripeSubscriptionId: ctx.user.stripeSubscriptionId,
      };
    }),

    createCheckoutSession: protectedProcedure
      .input(z.object({ tier: z.enum(["pro", "creator"]).optional().default("pro") }))
      .mutation(async ({ ctx, input }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-01-28.clover",
      });
      const { SUBSCRIPTION_TIERS } = await import("./products");

      const origin = ctx.req.headers.origin || "http://localhost:3000";
      const targetTier = input.tier ?? "pro";

      // Determine price based on tier
      const tierKey = targetTier.toUpperCase() as "PRO" | "CREATOR";
      let priceId = SUBSCRIPTION_TIERS[tierKey]?.stripePriceId;
      
      if (!priceId) {
        // Create product and price dynamically for test mode
        const isCreator = targetTier === "creator";
        const product = await stripe.products.create({
          name: isCreator ? "Sovereign AI Creator" : "Sovereign AI Pro",
          description: isCreator
            ? "Build custom AI Sentinels + all Pro features"
            : "Unlimited messages and all premium features",
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: isCreator ? 2900 : 1900, // $29 or $19
          currency: "usd",
          recurring: {
            interval: "month",
          },
        });
        
        priceId = price.id;
        console.log(`[Stripe] Created test price for ${targetTier}: ${priceId}`);
      }

      // Determine success redirect based on tier
      const successPath = targetTier === "creator" ? "/my-sentinels?upgraded=creator" : "/sentinels?upgraded=pro";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}${successPath}`,
        cancel_url: `${origin}/chat?upgrade=canceled`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        allow_promotion_codes: true,
      });

      return {
        url: session.url,
      };
    }),

    getUsage: protectedProcedure.query(async ({ ctx }) => {
      const { getUsageStats } = await import("./usage-tracking");
      return await getUsageStats(ctx.user.id);
    }),

    getWarningState: protectedProcedure.query(async ({ ctx }) => {
      const { getWarningState } = await import("./usage-tracking");
      return await getWarningState(ctx.user.id);
    }),

    createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-01-28.clover",
      });

      // Check if user has a Stripe customer ID
      if (!ctx.user.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription found. Please subscribe first.",
        });
      }

      const origin = ctx.req.headers.origin || "http://localhost:3000";

      // Create Customer Portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: ctx.user.stripeCustomerId,
        return_url: `${origin}/settings`,
      });

      return {
        url: session.url,
      };
    }),
  }),

  // Analytics
  analytics: router({
    getOverview: protectedProcedure.query(async ({ ctx }) => {
      const db = await import("./db");
      const { getUsageStats } = await import("./usage-tracking");
      
      // Get usage stats
      const usageStats = await getUsageStats(ctx.user.id);
      
      // Get total conversations
      const conversations = await db.getUserConversations(ctx.user.id);
      const totalConversations = conversations.length;
      
      // Get total messages
      const { getDb } = await import("./db");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const { messages, conversationSentinels } = await import("../drizzle/schema");
      const { sql, count } = await import("drizzle-orm");
      
      const [totalMessagesResult] = await database
        .select({ count: count() })
        .from(messages)
        .innerJoin(conversationSentinels, sql`${messages.conversationId} = ${conversationSentinels.conversationId}`)
        .where(sql`${conversationSentinels.conversationId} IN (SELECT id FROM conversations WHERE userId = ${ctx.user.id})`);
      
      const totalMessages = totalMessagesResult?.count || 0;
      
      // Get active days this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const activeDaysResult = await database
        .select({ day: sql`DATE(${messages.createdAt})` })
        .from(messages)
        .innerJoin(conversationSentinels, sql`${messages.conversationId} = ${conversationSentinels.conversationId}`)
        .where(sql`${conversationSentinels.conversationId} IN (SELECT id FROM conversations WHERE userId = ${ctx.user.id}) AND ${messages.createdAt} >= ${startOfMonth}`)
        .groupBy(sql`DATE(${messages.createdAt})`);
      
      const activeDays = activeDaysResult.length;
      
      // Get total Sentinels used
      const sentinelsResult = await database
        .select({ sentinelId: conversationSentinels.sentinelId })
        .from(conversationSentinels)
        .where(sql`${conversationSentinels.conversationId} IN (SELECT id FROM conversations WHERE userId = ${ctx.user.id})`)
        .groupBy(conversationSentinels.sentinelId);
      
      const totalSentinels = sentinelsResult.length;
      
      return {
        totalMessages,
        monthlyMessages: usageStats.used,
        monthlyLimit: usageStats.limit,
        activeDays,
        totalConversations,
        totalSentinels,
        subscriptionTier: ctx.user.subscriptionTier,
      };
    }),

    getMessageTimeSeries: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { messages, conversationSentinels } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");
        
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - input.days);
        
        const result = await database
          .select({
            date: sql`DATE(${messages.createdAt})`,
            count: sql`COUNT(*)`,
          })
          .from(messages)
          .innerJoin(conversationSentinels, sql`${messages.conversationId} = ${conversationSentinels.conversationId}`)
          .where(sql`${conversationSentinels.conversationId} IN (SELECT id FROM conversations WHERE userId = ${ctx.user.id}) AND ${messages.createdAt} >= ${daysAgo}`)
          .groupBy(sql`DATE(${messages.createdAt})`)
          .orderBy(sql`DATE(${messages.createdAt})`);
        
        return result.map((r: any) => ({
          date: r.date as string,
          count: Number(r.count),
        }));
      }),

    getSentinelStats: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const { messages, conversationSentinels, sentinels } = await import("../drizzle/schema");
      const { sql, eq } = await import("drizzle-orm");
      
      const result = await database
        .select({
          sentinelId: messages.sentinelId,
          sentinelName: sentinels.name,
          count: sql`COUNT(*)`,
        })
        .from(messages)
        .innerJoin(conversationSentinels, sql`${messages.conversationId} = ${conversationSentinels.conversationId}`)
        .leftJoin(sentinels, eq(messages.sentinelId, sentinels.id))
        .where(sql`${conversationSentinels.conversationId} IN (SELECT id FROM conversations WHERE userId = ${ctx.user.id}) AND ${messages.sentinelId} IS NOT NULL`)
        .groupBy(messages.sentinelId, sentinels.name)
        .orderBy(sql`COUNT(*) DESC`);
      
      const total = result.reduce((sum: number, r: any) => sum + Number(r.count), 0);
      
      return result.map((r: any) => ({
        sentinelId: r.sentinelId,
        sentinelName: r.sentinelName || 'Unknown',
        messageCount: Number(r.count),
        percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
      }));
    }),

    getConversationInsights: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const { messages, conversations } = await import("../drizzle/schema");
      const { sql, eq, desc } = await import("drizzle-orm");
      
      // Average messages per conversation
      const [avgResult] = await database
        .select({
          avg: sql`AVG(message_count)`,
        })
        .from(
          database
            .select({
              conversationId: messages.conversationId,
              message_count: sql`COUNT(*)`,
            })
            .from(messages)
            .where(sql`${messages.conversationId} IN (SELECT id FROM conversations WHERE userId = ${ctx.user.id})`)
            .groupBy(messages.conversationId)
            .as('conv_counts')
        );
      
      const avgMessagesPerConversation = Math.round(Number(avgResult?.avg || 0));
      
      // Longest conversation
      const [longestResult] = await database
        .select({
          conversationId: messages.conversationId,
          title: conversations.title,
          count: sql`COUNT(*)`,
        })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(eq(conversations.userId, ctx.user.id))
        .groupBy(messages.conversationId, conversations.title)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(1);
      
      const longestConversation = longestResult ? {
        title: longestResult.title,
        messageCount: Number(longestResult.count),
      } : null;
      
      // Total tokens (sum from messages)
      const [tokensResult] = await database
        .select({
          total: sql`SUM(${messages.totalTokens})`,
        })
        .from(messages)
        .where(sql`${messages.conversationId} IN (SELECT id FROM conversations WHERE userId = ${ctx.user.id})`);
      
      const totalTokens = Number(tokensResult?.total || 0);
      
      // Estimated cost (assuming $0.03 per 1K tokens for GPT-4)
      const estimatedCost = (totalTokens / 1000) * 0.03;
      
      // Memory count - placeholder for future implementation
      const memoryCount = 0;
      
      return {
        avgMessagesPerConversation,
        longestConversation,
        totalTokens,
        estimatedCost: estimatedCost.toFixed(2),
        memoryCount,
      };
    }),
  }),

  roundTable: router({
    start: protectedProcedure
      .input(
        z.object({
          question: z.string().min(10).max(2000),
          sentinelIds: z.array(z.number()).min(2).max(6),
          maxRounds: z.number().min(1).max(3).default(2),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { runRoundTable } = await import("./roundtable");
        const { isProOrAbove } = await import("./products");
        if (!isProOrAbove(ctx.user.subscriptionTier ?? "free")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Round Table is available for Pro and Creator subscribers.",
          });
        }
        const roundTableResult = await runRoundTable(ctx.user.id, input.question, input.sentinelIds, input.maxRounds);
        // Award XP for completing a Round Table — await to surface new achievements
        const rtXp = await awardXp(ctx.user.id, "round_table_completed").catch(() => ({ xpAwarded: 0, newAchievements: [] }));
        return { ...roundTableResult, newAchievements: rtXp.newAchievements.map((a: { id: string; title: string; emoji: string; tier: string }) => ({ id: a.id, title: a.title, emoji: a.emoji, tier: a.tier })) };
      }),

    history: protectedProcedure.query(async ({ ctx }) => {
      const { getRoundTableHistory } = await import("./roundtable");
      return getRoundTableHistory(ctx.user.id);
    }),

    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getRoundTableSession } = await import("./roundtable");
        const result = await getRoundTableSession(input.sessionId, ctx.user.id);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        return result;
      }),
  }),

  // ─── Gamification ─────────────────────────────────────────────────────────
  gamification: router({
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const { getGamificationProfile } = await import("./gamification");
      const profile = await getGamificationProfile(ctx.user.id);
      const { stats, level } = profile;
      return {
        level: level.level,
        levelTitle: level.title,
        xp: stats.totalXp,
        nextLevelXp: level.nextLevel?.minXp ?? stats.totalXp,
        currentLevelXp: level.minXp,
        progressPct: level.progressPct,
        streak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        stats,
      };
    }),

    getAchievements: protectedProcedure.query(async ({ ctx }) => {
      const { getGamificationProfile } = await import("./gamification");
      const profile = await getGamificationProfile(ctx.user.id);
      return profile.achievements;
    }),
  }),
});

export type AppRouter = typeof appRouter;

