# Day 1-2: Critical Bug Fixes - Detailed Task Breakdown

## 🎯 Goal
Fix all 56 TypeScript errors and critical runtime issues to achieve a clean, production-ready build.

---

## 📊 TypeScript Error Analysis

### **Total Errors: 56**

**By Error Type:**
- **TS7006** (21 errors): Parameter implicitly has 'any' type
- **TS2339** (20 errors): Property does not exist on type
- **TS2304** (4 errors): Cannot find name
- **TS18046** (3 errors): Variable is of type 'unknown'
- **TS2367** (3 errors): Comparison appears unintentional
- **TS2552** (2 errors): Cannot find name (typo suggestion)
- **TS2802** (1 error): Type required in this context
- **TS2551** (1 error): Property does not exist (typo suggestion)
- **TS2345** (1 error): Argument type mismatch

**By File:**
- **Templates.tsx**: 14 errors
- **Sentinels.tsx**: 14 errors
- **Chat.tsx**: 10 errors
- **MemorySuggestionCard.tsx**: 6 errors
- **voice.ts**: 5 errors
- **CategoryGallery.tsx**: 5 errors
- **MessageSuggestions.tsx**: 2 errors

---

## 🔧 Task Breakdown

### **Task 1: Fix Missing tRPC Router Endpoints** (1.5 hours)
**Priority: CRITICAL** | **Files: 3** | **Errors: 14**

#### Problem:
Multiple components reference tRPC procedures that don't exist in the router:
- `trpc.sentinels.suggestions.*` (should be `trpc.sentinels.memorySuggestions.*`)
- `trpc.templates.listPublicCategories` (missing)
- `trpc.templates.importCategory` (missing)

#### Affected Files:
1. `client/src/components/MemorySuggestionCard.tsx` (6 errors)
2. `client/src/components/MessageSuggestions.tsx` (2 errors)
3. `client/src/pages/CategoryGallery.tsx` (5 errors)

#### Solution Steps:

**Step 1.1: Fix Memory Suggestions Router Naming** (30 min)
```typescript
// In server/routers.ts - Verify correct procedure names
sentinels: {
  // Should have these procedures:
  getMemorySuggestions: protectedProcedure...
  acceptMemorySuggestion: protectedProcedure...
  dismissMemorySuggestion: protectedProcedure...
}
```

**Action:**
- Check `server/routers.ts` for actual procedure names
- Update all frontend references to match backend naming
- Fix in: `MemorySuggestionCard.tsx`, `MessageSuggestions.tsx`

**Step 1.2: Add Missing Category Procedures** (45 min)
```typescript
// Add to server/routers.ts
templates: {
  listPublicCategories: publicProcedure
    .query(async ({ ctx }) => {
      // Implementation
    }),
  
  importCategory: protectedProcedure
    .input(z.object({ categoryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
}
```

**Action:**
- Add `listPublicCategories` procedure
- Add `importCategory` procedure
- Write vitest tests for new procedures
- Fix references in `CategoryGallery.tsx`

**Step 1.3: Verify Router Type Generation** (15 min)
- Restart dev server to regenerate tRPC types
- Verify autocomplete works in IDE
- Check that all procedure calls resolve correctly

**Expected Outcome:**
✅ 13 TS2339 errors resolved (property does not exist)
✅ All tRPC calls have proper type inference
✅ New procedures tested and working

---

### **Task 2: Add Type Annotations for Implicit 'any'** (1 hour)
**Priority: HIGH** | **Files: 4** | **Errors: 21**

#### Problem:
21 TS7006 errors where parameters implicitly have 'any' type due to missing annotations.

#### Affected Files:
1. `client/src/pages/Templates.tsx` (4 errors)
2. `client/src/pages/Sentinels.tsx` (multiple errors)
3. `client/src/pages/CategoryGallery.tsx` (2 errors)
4. Error handlers across multiple files (3 errors)

#### Solution Steps:

**Step 2.1: Fix Templates.tsx Map Callbacks** (20 min)
```typescript
// Line 154: categories.find((c) => c.id === template.categoryId)
// Fix:
categories.find((c: { id: number; name: string; color: string }) => c.id === template.categoryId)

// OR better - extract type from tRPC
type Category = NonNullable<ReturnType<typeof trpc.templates.listCategories.useQuery>['data']>[number];
categories.find((c: Category) => c.id === template.categoryId)
```

**Locations to fix:**
- Line 154: `(c) =>` → `(c: Category) =>`
- Line 294: `(cat) =>` → `(cat: Category) =>`
- Line 357: `(c) =>` → `(c: Category) =>`
- Line 484: `(cat) =>` → `(cat: Category) =>`

**Step 2.2: Fix Error Handler Types** (15 min)
```typescript
// Current: onError: (error) => { toast.error(...) }
// Fix: onError: (error: Error) => { toast.error(...) }

// OR use tRPC's TRPCClientError:
import { TRPCClientError } from '@trpc/client';
onError: (error: TRPCClientError<any>) => { 
  toast.error(error.message) 
}
```

**Locations to fix:**
- `MemorySuggestionCard.tsx` lines 37, 51, 66
- `CategoryGallery.tsx` line 19

**Step 2.3: Fix Sentinels.tsx Type Issues** (25 min)
- Add proper types for Sentinel objects
- Extract type from tRPC query result
- Apply to all map/filter callbacks

**Expected Outcome:**
✅ 21 TS7006 errors resolved
✅ Full type safety in callbacks
✅ Better IDE autocomplete

---

### **Task 3: Fix Voice.ts Web Speech API Types** (45 min)
**Priority: HIGH** | **Files: 1** | **Errors: 5**

#### Problem:
Web Speech API types not recognized (SpeechRecognition, SpeechRecognitionEvent).

#### Affected File:
`client/src/lib/voice.ts` (5 errors)

#### Solution Steps:

**Step 3.1: Add Web Speech API Type Declarations** (20 min)
```typescript
// Add to client/src/types/speech.d.ts (new file)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};
```

**Step 3.2: Update voice.ts to Use Types** (15 min)
```typescript
// In voice.ts, add type guard
const SpeechRecognitionAPI = 
  (window as any).SpeechRecognition || 
  (window as any).webkitSpeechRecognition;

if (!SpeechRecognitionAPI) {
  throw new Error('Speech recognition not supported');
}

const recognition: SpeechRecognition = new SpeechRecognitionAPI();
```

**Step 3.3: Fix Event Handler Types** (10 min)
```typescript
recognition.onresult = (event: SpeechRecognitionEvent) => {
  const latestResult = event.results[event.results.length - 1];
  if (latestResult.isFinal) {
    const transcript = latestResult[0].transcript;
    // ...
  }
};
```

**Expected Outcome:**
✅ 5 errors in voice.ts resolved
✅ Full type safety for Web Speech API
✅ Better error messages for unsupported browsers

---

### **Task 4: Fix Chat.tsx Undefined Variables** (30 min)
**Priority: CRITICAL** | **Files: 1** | **Errors: 10**

#### Problem:
References to undefined variables like `activeSentinel`.

#### Affected File:
`client/src/pages/Chat.tsx` (10 errors)

#### Solution Steps:

**Step 4.1: Identify Missing Variable Declarations** (10 min)
```bash
# Check for undefined variables
grep -n "activeSentinel\|selectedSentinel" client/src/pages/Chat.tsx
```

**Step 4.2: Add Missing State Variables** (15 min)
```typescript
// Add to Chat.tsx component state
const [selectedSentinel, setSelectedSentinel] = useState<number | null>(null);

// OR if it should come from conversation
const { data: conversationSentinels } = trpc.sentinels.getConversationSentinels.useQuery(
  { conversationId: activeConversation?.id ?? 0 },
  { enabled: !!activeConversation }
);

const activeSentinel = conversationSentinels?.[0];
```

**Step 4.3: Fix All References** (5 min)
- Replace `activeSentinel` with correct variable name
- Ensure proper null checks
- Update dependent logic

**Expected Outcome:**
✅ 10 errors in Chat.tsx resolved
✅ Sentinel selection working correctly
✅ No undefined variable references

---

### **Task 5: Fix Remaining Type Issues** (45 min)
**Priority: MEDIUM** | **Files: 2** | **Errors: 6**

#### Remaining Issues:
- **TS18046** (3 errors): Unknown type issues
- **TS2367** (3 errors): Comparison issues

#### Solution Steps:

**Step 5.1: Fix Unknown Type Assertions** (20 min)
```typescript
// Current: latestResult is of type 'unknown'
// Fix with type assertion:
const latestResult = event.results[event.results.length - 1] as SpeechRecognitionResult;
```

**Step 5.2: Fix Comparison Issues** (15 min)
- Review comparison logic
- Add proper type guards
- Fix any loose equality comparisons

**Step 5.3: Final Type Check** (10 min)
```bash
pnpm tsc --noEmit
# Should show 0 errors
```

**Expected Outcome:**
✅ All 56 TypeScript errors resolved
✅ Clean build with zero errors
✅ Full type safety across codebase

---

## 🧪 Task 6: Test Memory Suggestions System (1.5 hours)
**Priority: HIGH** | **Blocking: NO**

### Steps:

**Step 6.1: Create Test Conversation** (20 min)
1. Open chat interface
2. Select Vixen's Den Sentinel
3. Send message: "I want to learn TypeScript and build a web app"
4. Wait for AI response
5. Check if memory suggestion appears

**Step 6.2: Test Suggestion Actions** (30 min)
1. **Accept Suggestion**
   - Click "Save Memory" button
   - Verify toast notification
   - Check Memories page for new entry
   - Verify importance score displayed

2. **Edit Suggestion**
   - Click "Edit" button
   - Modify content and category
   - Save changes
   - Verify updated memory in database

3. **Dismiss Suggestion**
   - Click "Dismiss" button
   - Verify suggestion disappears
   - Confirm it doesn't reappear on refresh

**Step 6.3: Test Edge Cases** (20 min)
1. Multiple suggestions in one response
2. Suggestions with different importance scores
3. Suggestions for different Sentinels
4. No suggestions (boring conversation)

**Step 6.4: Fix Any Issues Found** (20 min)
- UI/UX improvements
- Error handling
- Loading states
- Toast messages

**Expected Outcome:**
✅ Memory suggestions appear after AI responses
✅ Accept/Edit/Dismiss actions work correctly
✅ Suggestions saved to database
✅ UI provides clear feedback

---

## 🎤 Task 7: Test Voice System Browser Compatibility (1 hour)
**Priority: MEDIUM** | **Blocking: NO**

### Steps:

**Step 7.1: Chrome Testing** (15 min)
1. Test wake-word detection ("Hey Vixen")
2. Test continuous speech recognition
3. Test voice synthesis with different Sentinels
4. Verify waveform animations
5. Check microphone permissions

**Step 7.2: Firefox Testing** (15 min)
1. Check Web Speech API support
2. Test wake-word (may not work)
3. Test basic speech recognition
4. Test voice synthesis
5. Add fallback messaging if needed

**Step 7.3: Safari Testing** (15 min)
1. Check Web Speech API support
2. Test available features
3. Document limitations
4. Add browser-specific warnings

**Step 7.4: Add Browser Detection & Fallbacks** (15 min)
```typescript
// Add to voice.ts
export function checkVoiceSupport() {
  const hasSpeechRecognition = 
    'SpeechRecognition' in window || 
    'webkitSpeechRecognition' in window;
  
  const hasSpeechSynthesis = 'speechSynthesis' in window;
  
  return {
    recognition: hasSpeechRecognition,
    synthesis: hasSpeechSynthesis,
    fullSupport: hasSpeechRecognition && hasSpeechSynthesis,
  };
}

// In Chat.tsx, show warning if not supported
const voiceSupport = checkVoiceSupport();
if (!voiceSupport.fullSupport) {
  toast.warning("Voice features limited in this browser");
}
```

**Expected Outcome:**
✅ Voice working in Chrome
✅ Graceful degradation in Firefox/Safari
✅ Clear messaging about browser support
✅ No crashes on unsupported browsers

---

## 🗄️ Task 8: Database Integrity Check (30 min)
**Priority: MEDIUM** | **Blocking: NO**

### Steps:

**Step 8.1: Verify Schema Migrations** (10 min)
```bash
cd /home/ubuntu/sovereign_ai_assistant
pnpm db:push
# Should show "No schema changes detected"
```

**Step 8.2: Check Foreign Key Constraints** (10 min)
```sql
-- Run in database UI
SELECT * FROM sentinel_memory WHERE sentinel_id NOT IN (SELECT id FROM sentinels);
SELECT * FROM conversation_sentinels WHERE sentinel_id NOT IN (SELECT id FROM sentinels);
SELECT * FROM conversation_sentinels WHERE conversation_id NOT IN (SELECT id FROM conversations);
-- Should return 0 rows (no orphaned records)
```

**Step 8.3: Verify Seed Data** (10 min)
```sql
-- Check Sentinels
SELECT COUNT(*) FROM sentinels; -- Should be 6

-- Check Templates
SELECT COUNT(*) FROM prompt_templates WHERE is_default = true; -- Should be 8

-- Check Categories
SELECT COUNT(*) FROM template_categories; -- Should be > 0
```

**Expected Outcome:**
✅ Schema up to date
✅ No orphaned records
✅ All seed data present
✅ Foreign keys intact

---

## ⏱️ Time Estimates Summary

| Task | Estimated Time | Priority | Blocking |
|------|----------------|----------|----------|
| 1. Fix Missing tRPC Endpoints | 1.5 hours | CRITICAL | YES |
| 2. Add Type Annotations | 1 hour | HIGH | YES |
| 3. Fix Voice.ts Types | 45 min | HIGH | YES |
| 4. Fix Chat.tsx Variables | 30 min | CRITICAL | YES |
| 5. Fix Remaining Type Issues | 45 min | MEDIUM | YES |
| 6. Test Memory Suggestions | 1.5 hours | HIGH | NO |
| 7. Test Voice System | 1 hour | MEDIUM | NO |
| 8. Database Integrity Check | 30 min | MEDIUM | NO |
| **TOTAL** | **7.5 hours** | - | - |

### **Recommended Schedule:**

**Day 1 (4 hours):**
- Morning: Tasks 1-3 (Fix tRPC, types, voice.ts)
- Afternoon: Tasks 4-5 (Fix Chat.tsx, remaining issues)
- **Goal:** Zero TypeScript errors

**Day 2 (3.5 hours):**
- Morning: Tasks 6-7 (Test memory suggestions, voice system)
- Afternoon: Task 8 (Database check)
- **Goal:** All features tested and working

---

## ✅ Success Criteria

### **Technical:**
- ✅ Zero TypeScript errors (`pnpm tsc --noEmit` shows 0 errors)
- ✅ Dev server starts without errors
- ✅ All tRPC procedures properly typed
- ✅ Web Speech API types working
- ✅ No undefined variables

### **Functional:**
- ✅ Memory suggestions appear and work correctly
- ✅ Voice system works in Chrome (primary browser)
- ✅ Graceful degradation in other browsers
- ✅ Database schema clean and consistent

### **Quality:**
- ✅ All existing vitest tests still passing (65+)
- ✅ No console errors in browser
- ✅ No runtime crashes
- ✅ Clean code with full type safety

---

## 🚨 Risk Mitigation

### **Risk 1: Missing tRPC Procedures**
- **Impact:** HIGH (blocks functionality)
- **Mitigation:** Add missing procedures first (Task 1)
- **Fallback:** Temporarily disable features if complex

### **Risk 2: Web Speech API Browser Support**
- **Impact:** MEDIUM (limits voice features)
- **Mitigation:** Add browser detection and fallbacks
- **Fallback:** Make voice features optional/progressive enhancement

### **Risk 3: Type Errors Cascade**
- **Impact:** MEDIUM (one fix may reveal more errors)
- **Mitigation:** Fix in order: router → types → components
- **Fallback:** Use `@ts-ignore` sparingly for non-critical issues

---

## 📝 Next Steps After Day 1-2

Once all bugs are fixed:
1. ✅ Proceed to Day 3: Template Quick-Start Feature
2. ✅ Continue with UI/UX Polish (Day 4-5)
3. ✅ Add documentation (Day 6)
4. ✅ Final testing and launch (Day 7)

---

**Ready to start? Let's fix these bugs! 🔧**
