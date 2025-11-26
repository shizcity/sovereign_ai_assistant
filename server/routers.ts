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
        const { invokeLLM } = await import("./_core/llm");
        
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
        
        // Call LLM
        const response = await invokeLLM({
          messages: llmMessages,
        });
        
        const rawContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof rawContent === "string" ? rawContent : "No response";
        
        // Save assistant message
        const messageId = await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantMessage,
          model: input.model,
        });
        
        // Update conversation timestamp
        await updateConversation(input.conversationId, ctx.user.id, {});
        
        return {
          id: messageId,
          content: assistantMessage,
          model: input.model,
        };
      }),
  }),
  
  // User settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getUserSettings } = await import("./db");
      return getUserSettings(ctx.user.id);
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
});

export type AppRouter = typeof appRouter;
