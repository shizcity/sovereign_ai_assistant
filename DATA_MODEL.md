# Data Model Design - Sovereign AI Assistant

## Overview

This document outlines the database schema and data architecture for the Sovereign AI Assistant platform, a multi-LLM orchestration system with local-first principles and cross-device synchronization.

## Core Principles

The data model is designed around the following principles derived from the technical requirements:

**Local-First Architecture:** All data is structured to support client-side storage with eventual cloud synchronization. Timestamps are stored as UTC-based Unix timestamps (milliseconds) to ensure consistency across devices and timezones.

**Multi-Model Support:** The schema tracks which AI model (ChatGPT, Claude, Grok, Gemini) generated each response, enabling users to compare outputs and maintain conversation continuity across model switches.

**User Sovereignty:** Each user owns their conversations and messages. The system enforces strict access control at the database and API layers to ensure privacy and data ownership.

**Extensibility:** The schema is designed to accommodate future features such as multi-user collaboration, shared workspaces, and advanced AI orchestration patterns.

## Database Schema

### Users Table (Existing)

The `users` table is provided by the authentication system and tracks user accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incremented user identifier |
| `openId` | varchar(64) | Manus OAuth identifier (unique) |
| `name` | text | User display name |
| `email` | varchar(320) | User email address |
| `loginMethod` | varchar(64) | Authentication method used |
| `role` | enum('user', 'admin') | User role for access control |
| `createdAt` | timestamp | Account creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `lastSignedIn` | timestamp | Last authentication timestamp |

### Conversations Table

The `conversations` table stores chat sessions. Each conversation represents a distinct thread of messages with a specific AI model or across multiple models.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incremented conversation identifier |
| `userId` | int (FK → users.id) | Owner of the conversation |
| `title` | varchar(255) | User-defined or auto-generated title |
| `defaultModel` | varchar(50) | Default AI model for this conversation |
| `createdAt` | timestamp | Conversation creation timestamp |
| `updatedAt` | timestamp | Last message timestamp |

**Indexes:**
- `userId` for efficient user-specific queries
- `updatedAt` for sorting by recent activity

### Messages Table

The `messages` table stores individual messages within conversations, tracking both user prompts and AI responses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incremented message identifier |
| `conversationId` | int (FK → conversations.id) | Parent conversation |
| `role` | enum('user', 'assistant', 'system') | Message sender type |
| `content` | text | Message content (markdown-formatted) |
| `model` | varchar(50) | AI model that generated this response (null for user messages) |
| `createdAt` | timestamp | Message creation timestamp |

**Indexes:**
- `conversationId` for efficient conversation retrieval
- `createdAt` for chronological ordering

### User Settings Table

The `userSettings` table stores user preferences and configuration for the AI assistant.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incremented settings identifier |
| `userId` | int (FK → users.id, unique) | User owning these settings |
| `defaultModel` | varchar(50) | Global default AI model preference |
| `theme` | varchar(20) | UI theme preference (light/dark) |
| `createdAt` | timestamp | Settings creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:**
- `userId` (unique) for one-to-one user-settings relationship

## AI Model Identifiers

The system supports the following AI model identifiers, stored in the `model` column:

| Identifier | Description |
|------------|-------------|
| `gpt-4` | OpenAI GPT-4 (via built-in LLM helper) |
| `gpt-3.5-turbo` | OpenAI GPT-3.5 Turbo |
| `claude-3-opus` | Anthropic Claude 3 Opus |
| `claude-3-sonnet` | Anthropic Claude 3 Sonnet |
| `gemini-pro` | Google Gemini Pro |
| `grok-1` | xAI Grok-1 |

These identifiers are used in both the `conversations.defaultModel` and `messages.model` columns to track model usage and enable multi-model orchestration.

## Data Flow and Synchronization

The local-first architecture follows this data flow pattern:

**Client-Side Operations:** User interactions (creating conversations, sending messages) are first written to the local database (IndexedDB for web, SQLite for mobile/desktop). This ensures instant responsiveness and offline capability.

**Background Synchronization:** When online, the client periodically syncs with the cloud backend via tRPC procedures. New messages and conversations are uploaded, and updates from other devices are downloaded.

**Conflict Resolution:** The system uses a last-write-wins strategy based on `updatedAt` timestamps. In the initial solo-use mode, conflicts are rare since each user operates on their own data.

**Real-Time Updates:** Future enhancements may include WebSocket-based real-time sync for near-instant cross-device updates.

## Access Control and Privacy

All database queries enforce user-level access control:

- **Conversations:** Users can only access conversations where `userId` matches their authenticated user ID.
- **Messages:** Access is granted only if the parent conversation belongs to the user.
- **Settings:** Each user can only read and modify their own settings.

The backend uses tRPC's `protectedProcedure` to enforce authentication, and all queries filter by `ctx.user.id` to prevent unauthorized access.

## Future Extensions

The schema is designed to support future enhancements:

**Shared Workspaces:** Add a `workspaces` table and junction table for multi-user collaboration on conversations.

**Message Attachments:** Add a `messageAttachments` table to link files (stored in S3) to messages.

**Model Comparison:** Add a `modelComparisons` table to store side-by-side outputs from multiple models for the same prompt.

**Conversation Tags:** Add a `tags` table and junction table for organizing conversations by topic or project.

**Usage Analytics:** Add a `usageMetrics` table to track API usage, token consumption, and cost per model.

## Summary

This data model provides a solid foundation for the Sovereign AI Assistant platform, balancing simplicity with extensibility. The schema supports the core requirements of multi-LLM orchestration, local-first architecture, and user sovereignty while remaining flexible enough to accommodate future features as the platform evolves.
