# Task 1: Fix Missing tRPC Endpoints - Step-by-Step Instructions

**Estimated Time:** 1.5 hours  
**Priority:** CRITICAL  
**Errors Fixed:** 14 TypeScript errors

---

## 🎯 Overview

The frontend code references tRPC procedures that either:
1. Don't exist in the router
2. Have incorrect naming/paths
3. Are in the wrong nested router

**Files Affected:**
- `client/src/components/MemorySuggestionCard.tsx` (6 errors)
- `client/src/components/MessageSuggestions.tsx` (2 errors)
- `client/src/pages/CategoryGallery.tsx` (5 errors)
- `client/src/pages/Templates.tsx` (1 error)

---

## 🔍 Problem Analysis

### **Issue 1: Templates Router Mismatch**

**Frontend calls:**
```typescript
// In Templates.tsx line 37
trpc.templates.listCategories.useQuery()

// In CategoryGallery.tsx line 13
trpc.templates.listPublicCategories.useQuery()

// In CategoryGallery.tsx line 15
trpc.templates.importCategory.useMutation()
```

**Backend reality:**
```typescript
// In server/routers.ts
templates: router({ ... }),
categories: router({
  listCategories: ...,      // ✅ EXISTS
  listPublicCategories: ..., // ✅ EXISTS
  importCategory: ...,       // ✅ EXISTS
})
```

**Problem:** Frontend expects `templates.listCategories` but backend has `categories.listCategories`

---

## ✅ Solution: Step-by-Step Instructions

### **Step 1: Move Category Procedures into Templates Router** (30 minutes)

The cleanest solution is to nest the `categories` router inside `templates` router, since categories are template-related.

#### **1.1: Open server/routers.ts**

```bash
# File location
/home/ubuntu/sovereign_ai_assistant/server/routers.ts
```

#### **1.2: Locate the templates router (around line 654)**

Find this section:
```typescript
templates: router({
  list: protectedProcedure.query(async ({ ctx }) => { ... }),
  // ... other procedures
}),
```

#### **1.3: Locate the categories router (around line 817)**

Find this section:
```typescript
categories: router({
  listCategories: protectedProcedure.query(async ({ ctx }) => { ... }),
  // ... other procedures
}),
```

#### **1.4: Move categories router INSIDE templates router**

**BEFORE:**
```typescript
templates: router({
  list: protectedProcedure.query(async ({ ctx }) => { ... }),
  // ... other template procedures
  getFeatured: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => { ... }),
}),  // ← End of templates router

// Category management (SEPARATE ROUTER - WRONG!)
categories: router({
  listCategories: protectedProcedure.query(async ({ ctx }) => { ... }),
  // ... category procedures
}),
```

**AFTER:**
```typescript
templates: router({
  list: protectedProcedure.query(async ({ ctx }) => { ... }),
  // ... other template procedures
  getFeatured: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => { ... }),
  
  // ✅ NESTED: Category management procedures
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
}),  // ← End of templates router (now includes categories)
```

#### **1.5: Delete the standalone categories router**

Remove this entire section (around line 817-887):
```typescript
// DELETE THIS ENTIRE BLOCK:
categories: router({
  listCategories: protectedProcedure.query(async ({ ctx }) => { ... }),
  // ... all category procedures
}),
```

#### **1.6: Save the file**

```bash
# Save server/routers.ts
```

---

### **Step 2: Verify Router Structure** (10 minutes)

#### **2.1: Restart the dev server**

```bash
cd /home/ubuntu/sovereign_ai_assistant
pnpm run dev
```

#### **2.2: Check for TypeScript errors**

```bash
pnpm tsc --noEmit 2>&1 | grep "listCategories\|listPublicCategories\|importCategory"
```

**Expected output:** No errors related to these procedures

#### **2.3: Test in browser**

1. Open the app in browser
2. Navigate to Templates page (`/templates`)
3. Check browser console for errors
4. Verify categories load correctly

---

### **Step 3: Fix Memory Suggestions Router Path** (20 minutes)

#### **Problem:**
Frontend calls `trpc.sentinels.suggestions.*` but the router has `sentinels.suggestions.*` correctly nested. The issue is likely import path or naming.

#### **3.1: Check MemorySuggestionCard.tsx**

Open `/home/ubuntu/sovereign_ai_assistant/client/src/components/MemorySuggestionCard.tsx`

Look for these lines (around line 30):
```typescript
const acceptMutation = trpc.sentinels.suggestions.accept.useMutation({ ... });
const dismissMutation = trpc.sentinels.suggestions.dismiss.useMutation({ ... });
const editMutation = trpc.sentinels.suggestions.editAndAccept.useMutation({ ... });
```

#### **3.2: Verify the backend procedures exist**

Check `server/routers.ts` around line 1127:
```typescript
sentinels: router({
  // ... other procedures
  
  suggestions: router({
    pending: protectedProcedure
      .input(z.object({ conversationId: z.number().optional() }))
      .query(async ({ ctx, input }) => { ... }),
    
    byMessage: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .query(async ({ input }) => { ... }),
    
    accept: protectedProcedure
      .input(z.object({
        suggestionId: z.number(),
        saveAsMemory: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => { ... }),
    
    dismiss: protectedProcedure
      .input(z.object({
        suggestionId: z.number(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => { ... }),
    
    editAndAccept: protectedProcedure
      .input(z.object({
        suggestionId: z.number(),
        content: z.string(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => { ... }),
  }),
}),
```

#### **3.3: Check if procedures are complete**

Read the rest of `editAndAccept` procedure (around line 1200-1220):
```typescript
editAndAccept: protectedProcedure
  .input(z.object({
    suggestionId: z.number(),
    content: z.string(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { getPendingSuggestions, acceptSuggestion } = await import("./suggestions-db");
    const { createMemory } = await import("./memory-db");

    // Get the suggestion
    const suggestions = await getPendingSuggestions(ctx.user.id);
    const suggestion = suggestions.find((s: any) => s.id === input.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");

    // Create memory with edited content
    const memoryId = await createMemory({
      userId: ctx.user.id,
      sentinelId: suggestion.sentinelId || 0,
      conversationId: suggestion.conversationId,
      content: input.content,
      category: (input.category || suggestion.category) as any,
      importance: suggestion.importance,
      tags: input.tags || suggestion.tags,
      context: suggestion.reasoning || "",
    });

    // Mark suggestion as accepted
    await acceptSuggestion(input.suggestionId, ctx.user.id, memoryId);

    return { success: true, memoryId };
  }),
```

**If the procedure is incomplete or missing the closing brackets, complete it.**

---

### **Step 4: Fix Missing use-toast Hook** (15 minutes)

#### **Problem:**
Error message shows:
```
Failed to resolve import "@/hooks/use-toast" from "client/src/components/MemorySuggestionCard.tsx"
```

#### **4.1: Check if use-toast exists**

```bash
ls -la /home/ubuntu/sovereign_ai_assistant/client/src/hooks/use-toast.ts
```

**If file doesn't exist:**

#### **4.2: Check where toast is actually imported from**

```bash
grep -r "import.*toast" /home/ubuntu/sovereign_ai_assistant/client/src/pages/*.tsx | head -5
```

**Expected output:**
```typescript
import { toast } from "sonner";
```

#### **4.3: Fix MemorySuggestionCard.tsx imports**

Open `/home/ubuntu/sovereign_ai_assistant/client/src/components/MemorySuggestionCard.tsx`

**BEFORE:**
```typescript
import { useToast } from "@/hooks/use-toast";
```

**AFTER:**
```typescript
import { toast } from "sonner";
```

**And update usage:**

**BEFORE:**
```typescript
const { toast } = useToast();
toast({ title: "Success", description: "Memory saved" });
```

**AFTER:**
```typescript
toast.success("Memory saved");
toast.error("Failed to save memory");
```

---

### **Step 5: Run TypeScript Check** (5 minutes)

#### **5.1: Run full type check**

```bash
cd /home/ubuntu/sovereign_ai_assistant
pnpm tsc --noEmit
```

#### **5.2: Count remaining errors**

```bash
pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

**Expected:** Should be reduced from 56 to ~42 errors (14 errors fixed)

#### **5.3: Verify specific files are fixed**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "(CategoryGallery|MemorySuggestionCard|MessageSuggestions)" | grep "TS2339"
```

**Expected:** No TS2339 errors (property does not exist) for these files

---

### **Step 6: Test in Browser** (10 minutes)

#### **6.1: Open the application**

Navigate to: `https://3000-iix148t35jdl9qgzertjp-d28fe603.manusvm.computer`

#### **6.2: Test Templates Page**

1. Go to `/templates`
2. Check if categories load
3. Try creating a new category
4. Verify no console errors

#### **6.3: Test Category Gallery**

1. Go to `/category-gallery`
2. Check if public categories load
3. Try importing a category
4. Verify no console errors

#### **6.4: Test Memory Suggestions (if visible)**

1. Go to `/chat`
2. Send a message
3. Check if suggestions appear (may need to wait for AI response)
4. Verify no console errors

---

## 📝 Complete Code Changes Summary

### **File 1: server/routers.ts**

**Change 1: Move category procedures into templates router**

Location: Around line 654-887

Action: Move all procedures from standalone `categories` router into `templates` router as direct children (not nested in another router).

**Change 2: Delete standalone categories router**

Location: Around line 817-887

Action: Delete the entire `categories: router({ ... })` block.

### **File 2: client/src/components/MemorySuggestionCard.tsx**

**Change: Fix toast import**

Location: Top of file

**BEFORE:**
```typescript
import { useToast } from "@/hooks/use-toast";
```

**AFTER:**
```typescript
import { toast } from "sonner";
```

**And remove:**
```typescript
const { toast } = useToast();
```

**Update all toast calls:**
```typescript
// BEFORE
toast({ title: "Success", description: "Memory saved" });

// AFTER
toast.success("Memory saved");
```

---

## ✅ Success Criteria

After completing this task, you should have:

1. ✅ **Zero TS2339 errors** for `listCategories`, `listPublicCategories`, `importCategory`
2. ✅ **Templates page loads** without console errors
3. ✅ **Category Gallery page loads** without console errors
4. ✅ **Categories can be created and imported** successfully
5. ✅ **Memory suggestions components** don't have import errors
6. ✅ **TypeScript errors reduced** from 56 to ~42

---

## 🐛 Troubleshooting

### **Issue: "Cannot find module './template-categories-db'"**

**Solution:** Verify the file exists:
```bash
ls -la /home/ubuntu/sovereign_ai_assistant/server/template-categories-db.ts
```

If missing, you need to create it or check the correct import path.

### **Issue: "Property 'listCategories' does not exist on type..."**

**Solution:** 
1. Restart dev server: `pnpm run dev`
2. Wait for tRPC types to regenerate
3. Restart TypeScript server in your IDE

### **Issue: Categories still don't load in UI**

**Solution:**
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify database has categories:
   ```sql
   SELECT * FROM template_categories LIMIT 5;
   ```

---

## ⏭️ Next Steps

Once Task 1 is complete:
- Proceed to **Task 2: Add Type Annotations** (1 hour)
- This will fix the remaining 21 TS7006 errors (implicit 'any' types)

---

**Ready to start? Begin with Step 1! 🚀**
