# Category Sharing Test Fix

## Problem

The `category-sharing.test.ts` test was failing with:
```
AssertionError: expected 42 to be 2
```

When importing a category with 2 templates, the test was finding 42 templates instead of 2.

---

## Root Cause

**File:** `server/template-categories-db.ts`  
**Functions:** `createCategory()` and `importCategory()`

Both functions had the same bug:

```typescript
// ❌ WRONG: Orders by oldest first (ascending)
.orderBy(templateCategories.createdAt)
.limit(1);
```

**Why this caused the bug:**

1. Tests run multiple times without cleanup
2. Each run creates a new category with the same name
3. The query returns the **oldest** category (from a previous test run)
4. That old category has accumulated templates from multiple test runs (42 templates)
5. The test expects only the 2 templates from the current run

---

## Solution

Changed the `orderBy` to **descending** to get the **newest** category:

```typescript
// ✅ CORRECT: Orders by newest first (descending)
.orderBy(desc(templateCategories.createdAt))
.limit(1);
```

---

## Code Changes

### 1. Add `desc` import

```diff
- import { eq, and } from "drizzle-orm";
+ import { eq, and, desc } from "drizzle-orm";
```

### 2. Fix `createCategory()` function (lines 14-24)

```diff
  // Fetch the created category
  const [category] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.userId, data.userId),
        eq(templateCategories.name, data.name)
      )
    )
-   .orderBy(templateCategories.createdAt)
+   .orderBy(desc(templateCategories.createdAt))
    .limit(1);
```

### 3. Fix `importCategory()` function (lines 199-209)

```diff
  // Fetch the newly created category
  const [newCategory] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.userId, targetUserId),
        eq(templateCategories.name, sourceCategory.name)
      )
    )
-   .orderBy(templateCategories.createdAt)
+   .orderBy(desc(templateCategories.createdAt))
    .limit(1);
```

---

## Test Results

### Before Fix
- ❌ 2 failing tests
- ✅ 152 passing tests
- Pass rate: 98.1%

### After Fix
- ❌ 1 failing test (unrelated: suggestions deduplication)
- ✅ 153 passing tests
- Pass rate: **99.4%**

### Specific Test Results

```bash
✓ server/category-sharing.test.ts (9 tests) 383ms
  ✓ Category Creation with Attribution
    ✓ should create a category with creator name
  ✓ Category Visibility Toggle
    ✓ should toggle category to public
    ✓ should toggle category back to private
    ✓ should make category public for import tests
  ✓ Public Category Browsing
    ✓ should list all public categories
    ✓ should not include private categories in public list
  ✓ Category Import
    ✓ should import a public category with all templates ✅ FIXED!
    ✓ should not allow importing private categories
    ✓ should prevent duplicate imports
```

---

## Impact

✅ **Fixed:** Category import now correctly returns only the newly imported templates  
✅ **No breaking changes:** Existing functionality unaffected  
✅ **Better reliability:** Handles multiple test runs without cleanup  
✅ **Improved test coverage:** 99.4% pass rate

---

## Files Modified

- `/home/ubuntu/sovereign_ai_assistant/server/template-categories-db.ts`
  - Added `desc` import from drizzle-orm
  - Fixed `createCategory()` orderBy
  - Fixed `importCategory()` orderBy

---

## Recommendation

This fix should be included in the next checkpoint as it:
1. Fixes a real bug (not just a test issue)
2. Improves data integrity
3. Makes the system more robust for production use
