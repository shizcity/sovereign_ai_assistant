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
        const { createMessage, getConversationById, updateConversation } = await import("./db");
        const { routeLLMRequest } = await import("./llm-router");
        const { calculateCost, formatCost } = await import("./cost-calculator");
        
        // Verify conversation ownership
        const conversation = await getConversationById(input.conversationId, ctx.user.id);
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Save user message
        await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
          model: null,
        });
        
        // Get conversation history for context
        const { getConversationMessages } = await import("./db");
        const history = await getConversationMessages(input.conversationId, ctx.user.id);
        
        // Build messages array for LLM
        const llmMessages = history.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        }));
        
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
      const settings = await getUserSettings(ctx.user.id);
      
      // Return default settings if none exist
      if (!settings) {
        return {
          id: 0,
          userId: ctx.user.id,
          defaultModel: "gpt-4",
          theme: "dark",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      return settings;
    }),
    
    update: protectedProcedure
      .input(z.object({
        defaultModel: z.string().optional(),
        theme: z.string().optional(),
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
});

export type AppRouter = typeof appRouter;
