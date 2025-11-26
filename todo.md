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
- [ ] Create project checkpoint
- [ ] Document deployment instructions
