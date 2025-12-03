# Step 1: Move Category Procedures - BEFORE and AFTER Code

## 📁 File: `/home/ubuntu/sovereign_ai_assistant/server/routers.ts`

---

## 🔴 BEFORE (Current - Broken State)

### **Lines 654-814: Templates Router (Current)**

```typescript
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
  }),  // ← END OF TEMPLATES ROUTER
```

### **Lines 816-887: Categories Router (Current - WRONG LOCATION)**

```typescript
  // Category management
  categories: router({
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
  }),  // ← END OF CATEGORIES ROUTER (SEPARATE - WRONG!)
```

---

## 🟢 AFTER (Fixed - Working State)

### **Lines 654-887: Templates Router (Fixed - All-in-One)**

```typescript
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
    
    // ✅ ADDED: Category management procedures (moved from separate router)
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
  }),  // ← END OF TEMPLATES ROUTER (NOW INCLUDES CATEGORIES)
  
  // ✅ DELETED: The standalone categories router is completely removed
```

---

## 📝 Summary of Changes

### **What to DELETE:**
1. **Lines 816-887**: The entire standalone `categories: router({ ... })` block

### **What to ADD:**
1. **After line 813** (after `getFeatured` procedure): Add all 8 category procedures directly into the `templates` router
2. The procedures to add are:
   - `listCategories`
   - `createCategory`
   - `updateCategory`
   - `deleteCategory`
   - `createDefaultCategories`
   - `toggleCategoryPublic`
   - `listPublicCategories`
   - `importCategory`

### **Result:**
- Frontend calls `trpc.templates.listCategories` → ✅ Now exists
- Frontend calls `trpc.templates.listPublicCategories` → ✅ Now exists
- Frontend calls `trpc.templates.importCategory` → ✅ Now exists
- TypeScript errors reduced from 56 to ~42

---

## 🔧 How to Apply This Change

### **Option 1: Manual Edit**
1. Open `/home/ubuntu/sovereign_ai_assistant/server/routers.ts`
2. Find line 813 (end of `getFeatured` procedure)
3. Before the closing `}),` of the templates router, add all 8 category procedures
4. Delete lines 816-887 (the standalone categories router)
5. Save the file

### **Option 2: Use File Tool**
Use the `file` tool with `edit` action to:
1. Find the closing of `getFeatured` procedure
2. Replace the closing `}),` with the new code that includes category procedures
3. Find and delete the standalone `categories: router({` section

---

## ✅ Verification

After making this change, verify with:

```bash
# Check TypeScript errors
pnpm tsc --noEmit 2>&1 | grep "listCategories\|listPublicCategories\|importCategory"

# Should return 0 errors
```

**Expected result:** No TS2339 errors for these procedures

---

**Ready to apply this change?**
