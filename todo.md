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
