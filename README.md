# Sovereign AI Assistant

**Your AI. Your Identity. Your Sovereignty.**

A privacy-first, cross-platform multi-LLM assistant platform with local-first architecture, user authentication, and encrypted data synchronization across devices.

## Overview

Sovereign AI Assistant is a foundational implementation of the vision outlined in the Sovereign AI Systems pitch deck and technical design document. It provides a clean, privacy-focused interface for interacting with multiple AI models while maintaining full user sovereignty over conversations and data.

## Features

### Core Functionality

**Multi-LLM Orchestration**
- Support for multiple AI models (GPT-4, GPT-3.5 Turbo, Claude 3 Opus, Claude 3 Sonnet, Gemini Pro, Grok-1)
- Model selection per conversation
- Conversation context maintained across model switches
- Currently integrated with Manus built-in LLM (GPT-4), with architecture ready for external API integration

**Conversation Management**
- Create, view, and delete conversations
- Persistent conversation history
- Real-time message streaming
- Markdown rendering for AI responses

**User Settings**
- Default model preferences
- User profile management
- Privacy-focused design

**Authentication & Security**
- Manus OAuth integration
- Secure session management
- User-owned data with strict access control

### Design Philosophy

**Privacy-First Architecture**
- All conversations are private to the authenticated user
- No data collection beyond what's necessary for functionality
- Database encryption at rest
- Secure HTTPS communication

**Sovereign Aesthetic**
- Dark theme with deep blacks and blue accents
- Clean, minimal interface
- Focus on content and conversation
- Professional, trust-building design

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **tRPC** for type-safe API calls
- **Wouter** for routing
- **shadcn/ui** components
- **Streamdown** for markdown rendering

### Backend
- **Express 4** with TypeScript
- **tRPC 11** for API layer
- **Drizzle ORM** for database operations
- **MySQL/TiDB** database
- **Manus OAuth** for authentication

### Testing
- **Vitest** for unit and integration tests
- Comprehensive test coverage for CRUD operations and LLM integration

## Getting Started

### Prerequisites
- Node.js 22.13.0+
- pnpm package manager
- Access to the Manus platform (for OAuth and LLM services)

### Installation

1. The project is already initialized and running
2. Access the development server at: `https://3000-iix148t35jdl9qgzertjp-d28fe603.manusvm.computer`

### Development Commands

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Push database schema changes
pnpm db:push

# Build for production
pnpm build
```

## Project Structure

```
sovereign_ai_assistant/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components (Chat, Settings)
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client and utilities
│   │   └── index.css      # Global styles and theme
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # API endpoints (conversations, messages, settings)
│   ├── db.ts              # Database query helpers
│   ├── _core/             # Core framework code (OAuth, LLM, etc.)
│   └── *.test.ts          # Test files
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Table definitions
└── shared/                # Shared types and constants
```

## Database Schema

### Tables

**users** - User accounts (provided by auth system)
- id, openId, name, email, loginMethod, role, timestamps

**conversations** - Chat sessions
- id, userId, title, defaultModel, timestamps

**messages** - Individual messages within conversations
- id, conversationId, role, content, model, createdAt

**userSettings** - User preferences
- id, userId, defaultModel, theme, timestamps

## API Endpoints (tRPC)

### Conversations
- `conversations.list` - Get all user conversations
- `conversations.create` - Create a new conversation
- `conversations.delete` - Delete a conversation
- `conversations.updateTitle` - Update conversation title

### Messages
- `messages.list` - Get messages for a conversation
- `messages.send` - Send a message and receive AI response

### Settings
- `settings.get` - Get user settings
- `settings.update` - Update user settings

### Auth
- `auth.me` - Get current user info
- `auth.logout` - Log out current user

## Testing

The project includes comprehensive test coverage:

```bash
pnpm test
```

**Test Files:**
- `server/auth.logout.test.ts` - Authentication tests
- `server/conversations.test.ts` - Conversation CRUD tests
- `server/messages.test.ts` - Message operations and LLM integration tests

All tests pass successfully, confirming:
- ✅ Conversation creation, listing, updating, and deletion
- ✅ Message sending with AI responses
- ✅ Conversation context maintenance
- ✅ Authentication flow

## Future Enhancements

### Phase 1: External API Integration
- Add API key management for OpenAI, Anthropic, Google, and xAI
- Implement true multi-model routing based on user selection
- Add model comparison features

### Phase 2: Advanced Features
- Conversation search and filtering
- Conversation export (JSON, Markdown, PDF)
- User onboarding flow
- Voice input integration
- Image generation integration

### Phase 3: Collaboration
- Shared workspaces
- Team collaboration features
- Conversation sharing

### Phase 4: Vessel Builder Integration
- Custom AI identity creation
- Personality and voice customization
- Memory retention rules
- Privacy settings per identity

### Phase 5: VOX Integration
- Emotional voice synthesis
- Real-time prosody shaping
- Voice profile management

## Deployment

### Using Manus Platform

1. **Create a checkpoint:**
   ```bash
   # This is done via the webdev tools
   ```

2. **Publish via Management UI:**
   - Click the "Publish" button in the Management UI header
   - The application will be deployed to `*.manus.space`

3. **Custom Domain (Optional):**
   - Configure custom domain in Settings → Domains panel
   - Follow DNS configuration instructions

### Environment Variables

All required environment variables are automatically injected by the Manus platform:
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `OAUTH_SERVER_URL` - OAuth backend URL
- `BUILT_IN_FORGE_API_KEY` - LLM API key
- And more...

No manual configuration required.

## Architecture Notes

### Local-First Design

The architecture is designed to support local-first principles as outlined in the technical document:

**Current Implementation:**
- Server-side data storage with user-specific access control
- Real-time updates via tRPC queries
- Optimistic UI updates for instant feedback

**Future Enhancement:**
- IndexedDB for client-side storage
- Background synchronization
- Offline mode support
- Conflict resolution

### Multi-LLM Orchestration

**Current Implementation:**
- Manus built-in LLM (GPT-4) via `invokeLLM` helper
- Model selection UI for all supported models
- Database tracking of which model generated each response

**Future Enhancement:**
- Direct API integration with OpenAI, Anthropic, Google, xAI
- API key management via secrets system
- Model-specific prompt formatting
- Side-by-side model comparison

## Contributing

This is a foundational implementation. Future development will focus on:
1. External API integration for true multi-model support
2. Advanced conversation management features
3. Integration with other Sovereign AI Systems products (Vessel Builder, VOX)
4. Mobile app development

## License

Proprietary - Sovereign AI Systems

## Support

For questions or issues, contact the development team or submit feedback at https://help.manus.im

---

**Built with sovereignty in mind. Your AI belongs to you.**
