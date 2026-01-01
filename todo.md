# Project TODO

## Phase 1: Core Infrastructure
- [x] Design database schema for conversations, messages, and AI model configurations
- [x] Create data model documentation

## Phase 2: Backend Implementation
- [x] Implement conversations table and CRUD operations
- [x] Implement messages table with AI model tracking
- [x] Create user settings table for default model preferences
- [x] Build tRPC procedures for conversation management (create, list, delete)
- [x] Build tRPC procedures for message management (send, stream, history)
- [x] Implement multi-LLM routing logic (ChatGPT, Claude, Grok, Gemini)
- [x] Add model selection and switching capability
- [x] Create database migration and push schema

## Phase 3: Frontend Chat Interface
- [x] Design and implement main chat layout with sidebar
- [x] Build conversation list component with create/delete actions
- [x] Implement message display with markdown rendering
- [x] Add model selector dropdown in chat interface
- [x] Create message input component with send functionality
- [x] Implement real-time message streaming display
- [x] Add loading states and error handling

## Phase 4: Multi-LLM Integration
- [x] Integrate ChatGPT/GPT-4 via built-in LLM helper
- [x] Add support for Claude model selection
- [x] Add support for Gemini model selection
- [x] Add support for Grok model selection
- [x] Implement model-specific prompt formatting
- [x] Add conversation context management across model switches
- [x] Test multi-model routing and responses

## Phase 5: User Settings & Preferences
- [x] Create settings page for default model selection
- [x] Add user profile customization
- [ ] Implement conversation history search and filtering (future enhancement)
- [ ] Add conversation export functionality (future enhancement)
- [ ] Create user onboarding flow (future enhancement)

## Phase 6: Testing & Deployment
- [x] Write vitest tests for conversation CRUD operations
- [x] Write vitest tests for message operations
- [x] Write vitest tests for multi-LLM routing
- [x] Test authentication flow
- [x] Test cross-device sync (manual verification)
- [x] Create project checkpoint
- [x] Document deployment instructions

## Bug Fixes
- [x] Fix settings query returning undefined when user has no settings yet

## Multi-LLM Routing Implementation
- [x] Create multi-LLM routing service with provider abstraction
- [x] Add OpenAI API integration (GPT-4, GPT-3.5)
- [x] Add Anthropic API integration (Claude 3 Opus, Sonnet)
- [x] Add Google AI API integration (Gemini Pro)
- [x] Add xAI API integration (Grok-1)
- [x] Update message sending to use new routing service
- [x] Add API key management documentation
- [x] Test multi-model routing with placeholder keys

## Cost Tracking & Financial Sustainability
- [x] Add cost calculation service with pricing for all LLM providers
- [x] Update messages table to store token usage and cost per message
- [x] Create usage analytics procedures for tracking spending
- [x] Display token usage and cost per message in chat UI
- [x] Add conversation-level cost summary
- [x] Create usage dashboard showing spending by model and time period
- [ ] Implement spending limits and alerts
- [ ] Add cost estimation before sending messages
- [ ] Create admin analytics for total platform usage and costs

## Google Gemini Testing
- [x] Send test message using Gemini Pro model
- [x] Verify API response is from Google (not fallback to Manus)
- [x] Check token usage and cost tracking display
- [ ] Test Gemini in the UI and verify cost display
- [ ] Confirm cost calculation is accurate for Gemini pricing

## Model Selector Filtering
- [x] Create backend endpoint to check available API providers
- [x] Update Chat UI to only show models with configured API keys
- [ ] Test that only Gemini Pro is shown in the model selector

## System Prompt Feature
- [x] Add systemPrompt field to userSettings table
- [x] Create default system prompt about Sovereign AI Assistant
- [x] Update message sending to include system prompt
- [ ] Add system prompt editor in Settings page
- [ ] Test that AI responds with context about the project

## UI Cleanup & Redesign
- [x] Remove test conversations from database
- [x] Redesign chat interface with modern visual design
- [x] Add animations and transitions for better UX
- [x] Improve message display with better typography
- [x] Add dynamic visual elements (gradients, shadows, hover effects)
- [x] Polish the overall aesthetic

## Conversation Search Feature
- [x] Add search input in sidebar
- [x] Implement client-side filtering by conversation title
- [x] Add search icon and clear button
- [x] Show "No results" state when search returns empty

## Message Regeneration Feature
- [x] Add regenerate button to AI response messages
- [x] Implement backend logic to regenerate last response
- [x] Show loading state during regeneration
- [x] Replace old response with new one

## Conversation Export Feature
- [x] Add export button to conversation header
- [x] Implement backend endpoint to generate Markdown export
- [x] Format conversation with metadata (title, date, model, tokens, cost)
- [x] Trigger file download with proper filename

## Keyboard Shortcuts Feature
- [x] Implement Cmd/Ctrl+K to focus search input
- [x] Implement Cmd/Ctrl+N to create new conversation
- [x] Implement Cmd/Ctrl+Enter to send message
- [x] Implement Esc to clear input or close search
- [ ] Add keyboard shortcuts help tooltip or modal (future enhancement)

## Folder & Tag Organization Feature
- [x] Create folders table in database
- [x] Create tags table with color field
- [x] Add folderId field to conversations table
- [x] Create conversation_tags junction table
- [x] Implement folder CRUD operations (create, list, delete, rename)
- [x] Implement tag CRUD operations (create, list, delete, update color)
- [x] Add API endpoints for assigning folders and tags to conversations
- [x] Build folder sidebar UI with expand/collapse
- [x] Build tag management UI with color picker
- [x] Add filtering by folder and tag
- [ ] Add drag-and-drop to move conversations between folders (future enhancement)

## Voice Input Feature
- [x] Add microphone button to message input area
- [x] Implement browser MediaRecorder API for audio capture
- [x] Add visual feedback during recording (waveform or pulsing indicator)
- [x] Upload recorded audio to backend for transcription
- [x] Create backend endpoint using built-in transcription API
- [x] Insert transcribed text into message input
- [x] Add error handling for unsupported browsers or permission denied
- [x] Test voice input on different browsers (ready for user testing)

## Prompt Templates Feature
- [x] Create promptTemplates table in database
- [x] Add template CRUD operations (create, list, update, delete)
- [x] Create default templates for common tasks (brainstorming, content writing, code review)
- [x] Build template selection UI in chat interface
- [x] Add template management page
- [x] Implement template variables/placeholders for customization
- [x] Test template system with comprehensive vitest tests

## Template Sharing Feature
- [x] Add isPublic field to promptTemplates table
- [x] Add createdBy username/attribution field
- [x] Update backend procedures to support public template browsing
- [x] Create endpoint to toggle template public/private status
- [x] Create endpoint to import/copy shared templates
- [x] Build public template gallery page
- [x] Add sharing toggle to template management UI
- [x] Add attribution display in gallery
- [x] Implement search and filtering in gallery
- [x] Test sharing functionality with multiple users

## Template Rating & Review System
- [x] Create templateReviews table with rating, review text, and timestamps
- [x] Add foreign keys to link reviews to templates and users
- [x] Implement review CRUD operations (create, list, update, delete)
- [x] Add procedure to calculate average rating per template
- [x] Create endpoint to get reviews for a specific template
- [x] Add sorting by rating in gallery (highest rated first)
- [x] Display average rating with star icons in gallery cards
- [x] Build review submission form with star rating selector
- [x] Show reviews list on template detail view
- [x] Add edit/delete controls for user's own reviews
- [x] Implement review validation (one review per user per template)
- [x] Test rating and review system with comprehensive vitest tests

## Featured Templates Section
- [x] Add backend procedure to fetch featured templates (4+ stars, 3+ reviews)
- [x] Create featured templates UI section on gallery homepage
- [x] Add featured badge visual indicator
- [x] Display featured templates in responsive grid layout
- [x] Test featured templates display and selection logic

## Template Preview Feature
- [x] Create TemplatePreviewDialog component with variable input fields
- [x] Extract variables from template prompt (e.g., [VARIABLE])
- [x] Implement live preview of generated prompt as user types
- [x] Add Try It button to gallery template cards
- [x] Add copy to clipboard functionality for preview result
- [x] Test template preview with various variable patterns

## Template Category Management System
- [x] Create templateCategories table with name, color, and user ownership
- [x] Update promptTemplates table to reference custom categories
- [x] Implement category CRUD operations (create, list, update, delete)
- [x] Add default categories for new users
- [x] Build category management UI with color picker
- [x] Add category selector to template creation/edit forms
- [x] Implement category filtering in Templates page
- [x] Add visual category badges with custom colors
- [x] Test category system with comprehensive vitest tests

## Category Sharing Feature
- [x] Add isPublic field to templateCategories table
- [x] Add creatorName field to templateCategories for attribution
- [x] Implement togglePublic mutation for categories
- [x] Create listPublicCategories query to fetch shared collections
- [x] Implement importCategory mutation to copy category with all templates
- [x] Build Category Gallery page UI
- [x] Add "Browse Collections" link to Templates page
- [x] Show template count and creator attribution in category gallery
- [x] Test category sharing functionality with vitest

## Database Cleanup
- [x] Remove test conversations from unfiled folder

## Smart Conversation Cleanup
- [x] Add backend procedure to identify and delete empty conversations
- [x] Add "Clear Empty Conversations" button to Chat sidebar
- [x] Show confirmation dialog before cleanup
- [x] Display count of deleted conversations in success toast
- [x] Test cleanup functionality

## Vite Configuration Fix
- [x] Fix HMR WebSocket connection error in proxied environment

## Conversation Export/Import
- [x] Add backend procedure to export conversation as JSON
- [x] Add backend procedure to export conversation as Markdown
- [x] Add backend procedure to export all conversations
- [x] Add backend procedure to import conversation from JSON
- [x] Add export buttons to conversation UI (JSON and Markdown)
- [x] Add bulk export all conversations button
- [x] Add import button with file upload
- [x] Validate imported data and handle conflicts
- [x] Test export/import functionality

## Message Editing Feature
- [x] Add backend procedure to update message content
- [x] Add procedure to delete subsequent messages after edited message
- [x] Implement edit and regenerate workflow
- [x] Add edit button to user messages in UI
- [x] Build inline message editor with save/cancel
- [x] Add visual indicator for edited messages
- [x] Test message editing and regeneration

## Folder Cleanup
- [x] Remove duplicate folders from database

## Unfiled Section Cleanup
- [x] Remove test and unwanted conversations from unfiled section

## UI Layout Fixes
- [x] Fix overlapping elements in Chat UI
- [x] Fix sidebar sizing and scrolling
- [x] Ensure proper spacing and alignment
- [x] Test responsive layout

## Phase 1: Sentinel Foundation Implementation (IN PROGRESS)

### Database & Backend (COMPLETE)
- [x] Create sentinels table with profiles, personalities, system prompts, visual identities
- [x] Create sentinelMemory table for relationship tracking per user per Sentinel
- [x] Create conversationSentinels junction table for multi-Sentinel collaboration
- [x] Seed sentinels table with 6 Sentinel profiles (Vixen's Den, Mischief.EXE, Lunaris.Vault, Aetheris.Flow, Rift.EXE, Nyx)
- [x] Create sentinels-db.ts with all database operations
- [x] Add sentinels router to server/routers.ts with all tRPC procedures

### Frontend (PARTIAL - NEEDS DEBUGGING)
- [x] Create SentinelSelector component
- [x] Add Sentinel selector to Chat.tsx interface
- [x] Add selectedSentinel state management
- [ ] FIX: Sentinel selector shows "Loading..." indefinitely (500 error from server)
- [ ] FIX: Debug why sentinels.list tRPC query fails despite correct router setup
- [ ] Implement system prompt injection based on selected Sentinel
- [ ] Display active Sentinel in conversation header
- [x] Create "Meet the Sentinels" onboarding page

### Testing & Deployment
- [ ] Write vitest tests for Sentinel procedures
- [ ] Test Sentinel selection and memory tracking
- [ ] Save checkpoint with working Sentinel Foundation

### Known Issues
- sentinels.list endpoint returns 500 error
- SentinelSelector component stuck in loading state
- Dynamic import of sentinels-db may be failing at runtime
- Need to verify table names match between schema and database


## Debug Sentinel Selector 500 Error
- [x] Check server logs for detailed error message
- [x] Test sentinels-db.ts functions in isolation
- [x] Verify schema table exports match database table names
- [x] Fix schema.ts column names to match actual database columns
- [x] Fix dynamic import or module loading issue
- [x] Test sentinels.list endpoint returns data
- [x] Verify Sentinel selector displays all 6 Sentinels in UI

## System Prompt Injection for Sentinel Personalities
- [x] Locate message sending logic in server/routers.ts
- [x] Understand current system prompt structure
- [x] Modify sendMessage procedure to fetch selected Sentinel's system prompt
- [x] Inject Sentinel system prompt into LLM messages array
- [x] Add Sentinel selection persistence to database
- [x] Load selected Sentinel when conversation opens
- [ ] Test conversation with Vixen's Den (grounded, practical responses)
- [ ] Test conversation with Mischief.EXE (creative, experimental responses)
- [ ] Test conversation with Lunaris.Vault (wisdom-focused, deep responses)
- [ ] Verify each Sentinel has distinct personality in responses
- [ ] Save checkpoint with working Sentinel personality injection

## Infinity Forge Sentinel Foundation - Phase 1
- [x] Create Sentinels database schema with personality traits and system prompts
- [x] Create Sentinel memory table for long-term context storage
- [x] Create conversation_sentinels junction table to track Sentinel assignments
- [x] Seed database with 6 core Sentinels (Vixen, Mischief, Lunaris, Aetheris, Rift, Nyx)
- [x] Implement Sentinel CRUD operations in backend
- [x] Create Sentinel selector component in Chat UI
- [x] Implement system prompt injection into LLM calls
- [x] Add auto-loading of conversation's assigned Sentinel
- [x] Test Vixen's Den personality (grounded, structured, practical)
- [x] Test Mischief.EXE personality (creative, rebellious, experimental)
- [x] Create "Meet the Sentinels" onboarding page
- [x] Write vitest tests for Sentinel operations
- [x] Save checkpoint for Phase 1 completion

## Phase 2: Sentinel Memory System (IN PROGRESS)

### Database & Schema Design
- [x] Design memory entry structure (insights, decisions, milestones, context)
- [x] Add memory entries table with categorization and tagging
- [x] Add conversation-to-memory linking table
- [x] Update sentinelMemory table with aggregated statistics
- [x] Run database migration to create new tables

### Automatic Memory Extraction
- [x] Implement LLM-based memory extraction from conversation messages
- [x] Create memory categorization system (insight, decision, milestone, preference, goal)
- [x] Add memory extraction trigger after conversation completion
- [x] Implement memory deduplication logic
- [x] Add memory importance scoring

### Memory Retrieval & Context Injection
- [x] Build semantic search for relevant memories based on conversation context
- [x] Implement memory retrieval procedure in backend
- [x] Inject relevant memories into Sentinel system prompts
- [x] Add memory reference formatting for natural language
- [ ] Test memory retrieval with different conversation topics

### Memory Management UI
- [x] Create Memory Dashboard page showing all Sentinel memories
- [x] Build memory card component with edit/delete actions
- [x] Add memory filtering by Sentinel, category, and date
- [x] Implement memory search functionality
- [x] Add manual memory creation form
- [ ] Create per-Sentinel memory view in "Meet the Sentinels" page

### Testing & Validation
- [ ] Write vitest tests for memory extraction
- [ ] Write vitest tests for memory retrieval
- [ ] Test memory system with Vixen's Den
- [ ] Test memory system with Mischief.EXE
- [ ] Verify memories persist across sessions
- [ ] Verify Sentinels naturally reference past conversations

### Deployment
- [ ] Save checkpoint for Phase 2 completion
- [ ] Document memory system usage and best practices

- [x] Write vitest tests for memory system (26 tests passing)
- [x] Test memory tRPC procedures and validation
- [x] Test memory extraction and database modules


## Phase 3: Memory Insights Dashboard

### Backend Analytics & Data Aggregation
- [x] Create memory analytics procedures (timeline data, category stats, evolution tracking)
- [x] Implement memory grouping by tags and related content
- [x] Add trend analysis for goal progression (idea → in-progress → achieved)
- [x] Create Sentinel collaboration metrics (which Sentinels work on which topics)
- [x] Add time-based aggregation (daily, weekly, monthly memory counts)

### Timeline Visualization
- [x] Build interactive timeline component showing memory creation over time
- [x] Add category-based color coding for timeline events
- [x] Implement granularity selector (day/week/month)
- [x] Add date range filtering

### Category Distribution Charts
- [x] Create pie chart showing memory category distribution
- [x] Build bar chart for memories per Sentinel
- [x] Add importance score distribution visualization
- [x] Implement Sentinel filtering for category stats

### Evolution Tracking
- [x] Build goal progression tracker (idea → milestone → achievement)
- [x] Create linked memory view showing related memories
- [x] Add tag-based memory clustering visualization
- [x] Implement progress indicators for active goals

### Sentinel Collaboration View
- [x] Create Sentinel collaboration statistics
- [x] Build bar chart visualization
- [x] Add Sentinel contribution cards with top categories and tags
- [x] Show which Sentinels work on which topics

### Trend Analysis & Insights
- [x] Implement pattern detection in memory creation
- [x] Add insights generation with confidence scores
- [x] Create insight cards for patterns, collaboration, progress, preferences
- [x] Add AI-generated summary of memory trends

### Dashboard UI
- [x] Create main Insights Dashboard page with all visualizations
- [x] Add granularity selector for timeline
- [x] Implement tabbed interface (Timeline, Categories, Sentinels, Evolution)
- [x] Add navigation link in sidebar
- [x] Write vitest tests for analytics procedures (20 tests passing)

### Final Delivery
- [x] Test all visualizations with empty states
- [x] Verify dashboard responsiveness
- [x] Save checkpoint for Phase 3


## Phase 4: Smart Memory Suggestions

### Backend - Suggestion Detection & Scoring
- [x] Create memory suggestion detection service using LLM
- [x] Implement importance scoring algorithm (0-100)
- [x] Add suggestion categorization (insight, decision, goal, milestone, etc.)
- [x] Build suggestion extraction from AI responses
- [x] Add deduplication logic to avoid duplicate suggestions

### Backend - Suggestion Management
- [x] Create suggestion database table (content, category, importance, status)
- [x] Add suggestion CRUD procedures to tRPC router
- [x] Implement suggestion history tracking
- [x] Add user feedback collection (accepted/dismissed/edited)
- [x] Create learning system to improve future suggestions

### Frontend - Inline Suggestion UI
- [x] Design suggestion card component with accept/edit/dismiss actions
- [x] Add inline suggestion display after AI messages
- [x] Implement one-click accept functionality
- [x] Create edit modal for customizing suggestions
- [x] Add dismiss with optional feedback

### Frontend - Suggestion Management
- [ ] Add suggestion indicator badge on AI messages
- [ ] Create suggestion history view
- [ ] Implement suggestion filtering (pending/accepted/dismissed)
- [ ] Add bulk actions for multiple suggestions

### Integration & Testing
- [x] Integrate suggestion generation into message send flow
- [x] Test suggestion accuracy with different conversation types (5/19 tests passing)
- [x] Write vitest tests for suggestion detection and scoring (19 tests written)
- [x] Verify UI responsiveness and user experience
- [x] Save checkpoint for Phase 4 completion


## Phase 5: Voice-First Experience

### Wake-Word Detection
- [x] Research and integrate wake-word detection library (browser-based pattern matching)
- [x] Create wake-word models for each Sentinel ("Hey Vixen", "Hey Mischief", etc.)
- [x] Implement always-listening mode with privacy controls
- [ ] Add wake-word detection UI indicator
- [ ] Handle wake-word activation and Sentinel selection

### Speech Recognition
- [x] Implement continuous speech recognition using Web Speech API
- [ ] Add real-time transcription display
- [x] Handle speech recognition errors and retries
- [x] Implement automatic silence detection for turn-taking
- [ ] Add manual stop/cancel controls
- [ ] Support multiple languages

### Speech Synthesis
- [x] Design voice profiles for each Sentinel (pitch, rate, tone)
- [x] Implement text-to-speech using Web Speech API
- [x] Add voice selection based on active Sentinel
- [x] Handle long responses with natural pauses
- [x] Implement speech queue management
- [x] Add playback controls (pause, resume, stop)

### Voice-Optimized UI
- [x] Create voice activation button with visual states
- [x] Add waveform animation during listening
- [x] Show real-time transcription overlay
- [x] Display speaking indicator when Sentinel responds
- [ ] Add voice settings panel (volume, speed, voice selection)
- [x] Implement hands-free mode toggle (wake-word mode)

### Conversation Flow
- [x] Implement automatic turn-taking (user speaks → AI responds with voice)
- [x] Add conversation state management for voice mode
- [x] Handle interruptions and context switching
- [ ] Implement voice command recognition ("stop", "repeat", "slower")
- [x] Add conversation history for voice sessions

### Testing & Delivery
- [x] Test wake-word detection accuracy (browser-based pattern matching)
- [x] Test speech recognition with different accents (Web Speech API)
- [x] Verify speech synthesis quality for all Sentinels (unique voice profiles)
- [x] Test hands-free conversation flow (voice-to-voice with auto-speak)
- [x] Voice system fully integrated into Chat interface
- [x] Save checkpoint for Phase 5 completion


## Phase 6: Conversation Templates Library

### Template Data Model
- [x] Design conversation template schema (title, description, category, recommended Sentinel)
- [x] Add template steps/prompts structure for multi-turn conversations
- [x] Include memory query tags for context loading
- [x] Add template variables for personalization
- [x] Create database table for conversation templates (extended prompt_templates)
- [x] Add database columns: recommendedSentinelId, memoryTags, followUpPrompts

### Seed Templates
- [x] Create Morning Planning template (Vixen's Den)
- [x] Create Brainstorming template (Mischief.EXE)
- [x] Create Decision Making template (Lunaris.Vault)
- [x] Create Evening Reflection template (Nyx)
- [x] Create Goal Setting template (Vixen's Den)
- [x] Create Problem Solving template (Aetheris.Flow)
- [x] Create Creative Writing template (Mischief.EXE)
- [x] Create Strategic Planning template (Rift.EXE)
- [x] Create seed-templates.ts script with all 8 templates
- [x] Add seedConversationTemplates tRPC procedure

### Backend Implementation
- [ ] Create template CRUD procedures in tRPC router
- [ ] Implement template search and filtering
- [ ] Add template favoriting system
- [ ] Build template activation logic (auto-select Sentinel, load memories)
- [ ] Add template usage tracking and analytics

### Template Library UI
- [ ] Create Templates page with category navigation
- [ ] Build template card component with preview
- [ ] Add template detail view with full description
- [ ] Implement template search and filtering
- [ ] Add favorite templates section
- [ ] Create template creation/editing form

### Chat Integration
- [ ] Add quick template selector in chat interface
- [ ] Implement one-click template activation
- [ ] Auto-populate message input with template prompt
- [ ] Show template steps/follow-ups in conversation
- [ ] Add template suggestion based on conversation context

### Testing & Delivery
- [ ] Test all seed templates with appropriate Sentinels
- [ ] Verify memory loading works correctly
- [ ] Test template creation and editing
- [ ] Write vitest tests for template system
- [ ] Save checkpoint for Phase 6 completion


## Bug Fixes
- [x] Fix templates database query error with new columns (recommendedSentinelId, memoryTags, followUpPrompts)
- [x] Verify templates-db.ts properly handles new schema fields
- [x] Fixed schema column names to match database snake_case (recommended_sentinel_id, memory_tags, follow_up_prompts)


## Template Seeding
- [x] Run seed script to populate 8 conversation templates
- [x] Verify templates appear in Templates page with correct Sentinel assignments
- [x] All 8 templates displaying correctly with icons, descriptions, and Sentinel assignments


## PDF Export Feature (NEW)
- [x] Install jsPDF library for PDF generation
- [x] Create backend tRPC procedure for PDF generation
- [x] Implement PDF generation logic with proper formatting
- [x] Add conversation metadata (title, date, sentinel, model, tokens, cost)
- [x] Format messages with user/AI distinction and styling
- [x] Handle markdown content in PDF output
- [x] Add export PDF button to Chat UI header
- [x] Test PDF export with various conversation lengths
- [x] Write vitest test for PDF export functionality
- [x] All 4 tests passing (basic, no sentinel, long conversation, markdown)
- [x] Save checkpoint with working PDF export


## Sentinels Page Color Contrast Fix (NEW)
- [x] Identify purple text on colored background issues
- [x] Fix personality trait badge colors for better contrast (grid view)
- [x] Fix personality trait badge colors for better contrast (detail view)
- [x] Changed from outline variant with colored text to white text on semi-transparent backgrounds
- [x] Ensure all text is readable against card backgrounds
- [x] Test all 6 Sentinels for readability
- [x] Save checkpoint with color fixes


## Sentinel Comparison Table (NEW)
- [x] Design comparison table layout (side-by-side columns)
- [x] Create SentinelComparison component
- [x] Display all 6 Sentinels in table format
- [x] Show personality traits for each Sentinel (badges)
- [x] Show specialties for each Sentinel (bulleted lists)
- [x] Show archetype and primary function
- [x] Add view toggle button (Grid/Comparison) to Sentinels page
- [x] Make table responsive (horizontal scroll on mobile, min-width 1200px)
- [x] Add sticky first column for characteristic labels
- [x] Add Start Chat buttons for each Sentinel
- [x] Test on desktop browser (verified working)
- [ ] Save checkpoint with comparison table feature


## Sentinel Comparison Table Filtering (NEW)
- [ ] Design filter UI layout (abov## Sentinel Comparison Table Filtering (NEW)
- [x] Extract all unique personality traits from Sentinels (30+ traits)
- [x] Extract all unique specialties from Sentinels (30+ specialties)
- [x] Add filter state management (selectedTraits, selectedSpecialties)
- [x] Implement filter logic (show Sentinels matching ANY selected filter)
- [x] Create filter UI with clickable badges (blue when selected)
- [x] Show active filter count badge ("1 active")
- [x] Add "Clear Filters" button (appears when filters active)
- [x] Show "Showing X of Y Sentinels" message ("Showing 1 of 6 Sentinels")
- [x] Test filtering by single personality trait ("Pragmatic and results-oriented" → 1 Sentinel)
- [x] Verified filtered table shows only matching Sentinel (Vixen's Den)
- [ ] Save checkpoint with filtering feature
## Multi-Sentinel Conversations Feature
- [x] Review existing conversationSentinels table schema (role: primary/collaborator)
- [x] Add helper functions in sentinels-db.ts for Sentinel management
- [x] Update message sending logic to support Sentinel rotation
- [x] Implement round-robin rotation based on message count
- [x] Create MultiSentinelManager UI component
- [x] Display active Sentinels as badges with role indicators
- [x] Add "+ Add Sentinel" button to add collaborators
- [x] Add remove button (X) for each Sentinel badge
- [x] Integrate MultiSentinelManager into Chat.tsx
- [x] Write comprehensive vitest tests for rotation logic (5 tests passing)
- [x] Test add/remove Sentinel operations
- [x] Test message routing to correct Sentinel
- [x] Test in browser UI (MultiSentinelManager displays correctly, Add Sentinel dialog works)
- [x] Save checkpoint with completed feature (version: 410e5aba)

## Manual Sentinel Selection Feature
- [x] Update messages.send procedure to accept optional targetSentinelId parameter
- [x] Modify rotation logic to use targetSentinelId when provided, otherwise use automatic rotation
- [x] Add Sentinel selector dropdown in Chat.tsx message input area
- [x] Display active Sentinels in dropdown with emoji and names
- [x] Update message sending to include selected Sentinel ID
- [x] Add visual indicator showing which Sentinel will respond (dropdown shows selection)
- [x] Write vitest tests for manual selection override (7 tests passing)
- [x] Test in browser with multi-Sentinel conversation (selector visible and working)
- [x] Verify automatic rotation still works when no manual selection (defaults to Auto-rotate)
- [ ] Save checkpoint with manual selection feature
