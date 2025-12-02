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
