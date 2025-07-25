# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## Plan & Review

### Before starting work
- Always in plan mode to make a plan
- After get the plan, make sure you Write the plan to .claude/tasks/<TASK_NAME>.md
- The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
- If the task require external knowledge or certain package, also research to get latest knowledge (Use Task tool for research)
- Don't over plan it, always think simple and sharp.
- Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing
- You should update the plan as you work.
- After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.

## Project Overview

**autoquote** is a B2B sourcing chatbot application built with Next.js that helps sourcing buyers communicate their requirements. The application uses a multimodal chat interface to collect sourcing information through structured conversations.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.4.3 with App Router
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: React 19.1.0 built-in features

### Key Directories
- `/app` - Next.js App Router pages and layouts
- `/app/api` - API routes for chatbot backend
- `/components` - React components (shadcn/ui based)
- `/lib` - Utilities and shared logic

### Path Aliases
- `@/*` maps to root directory (configured in tsconfig.json)

## Core Features to Implement

### 1. Chatbot API Architecture
- OpenAI Structured Output integration for consistent message formatting
- Conversation state management with memory persistence
- Multimodal message handling (text, images, files)

### 2. Message Type System
**User Input Types:**
- Pure text
- Text with embedded images
- File uploads (TXT, CSV)

**Bot Response Types:**
- Pure text
- Text with clickable text-pills
- Text with structured cards (markdown + attachments)

### 3. Conversation Flow Logic
1. Assess if requirements are broad (need refinement) or precise
2. Progressively collect: product specs, quantities, customization, lead times, Incoterms, shipping
3. Generate requirement summary cards with Edit/Submit actions
4. Handle edit flows when users click "Edit" pill

### 4. Implementation Priorities
1. Set up OpenAI API integration with Structured Output
2. Create chat UI components supporting all message types
3. Implement conversation state management
4. Build file upload and image handling
5. Create requirement summary card generation
6. Add edit flow functionality

## Key Technical Considerations

- Use OpenAI Structured Output for all bot responses to ensure consistent formatting
- Design prompts that implement adaptive questioning based on requirement precision
- Implement proper error handling for file uploads and API calls
- Ensure conversation state persists across page refreshes
- Follow Next.js App Router patterns for API routes and server components

## Implementation Status

### Completed Features
1. ✅ Dependencies installed (openai, ai, zod)
2. ✅ Message type schemas with Zod
3. ✅ Adaptive system prompt for conversation flow
4. ✅ API route at `/api/chat` with structured responses
5. ✅ In-memory conversation management
6. ✅ Pill click handling utilities
7. ✅ File/image processing capabilities
8. ✅ Test UI component at root path

### API Endpoint
- **POST /api/chat**: Handles chat messages with multimodal support
- **GET /api/chat**: Retrieves conversation history

### Key Files Created
- `/lib/types.ts` - TypeScript types and Zod schemas
- `/lib/openai-schemas.ts` - OpenAI Structured Output schemas
- `/lib/system-prompt.ts` - Adaptive conversation prompts
- `/lib/chat-utils.ts` - Interaction handling utilities
- `/lib/file-utils.ts` - File/image processing
- `/app/api/chat/route.ts` - Main API endpoint
- `/components/ChatTest.tsx` - Test UI component