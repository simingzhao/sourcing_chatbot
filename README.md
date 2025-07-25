# AutoQuote - B2B Sourcing Chatbot

A simple yet powerful B2B sourcing chatbot backend built with Next.js and OpenAI's Structured Output API.

## Features

- **Multimodal Support**: Handle text, images, and file uploads (TXT, CSV)
- **Adaptive Conversation Flow**: LLM intelligently assesses requirements and asks follow-up questions
- **Structured Responses**: Three response types - text, pills (clickable options), and summary cards
- **Conversation Memory**: Maintains context across the conversation
- **Simple Architecture**: Minimal backend logic, letting the LLM handle conversation flow

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to test the chatbot

## Architecture

### Core Components

- **`/app/api/chat/route.ts`**: Main API endpoint handling chat requests
- **`/lib/system-prompt.ts`**: System prompt that guides the LLM's behavior
- **`/lib/openai-schemas.ts`**: Zod schemas for OpenAI Structured Output
- **`/lib/types.ts`**: TypeScript types for messages and responses
- **`/lib/chat-utils.ts`**: Utilities for handling pill clicks and validations
- **`/lib/file-utils.ts`**: File and image processing utilities

### Response Types

1. **Text Response**: Simple text messages
2. **Pill Response**: Text with clickable options
3. **Card Response**: Summary card with bullet points and Edit/Submit actions

## API Usage

### Send Message
```bash
POST /api/chat
{
  "message": "I need to source 5000 USB cables",
  "conversationId": "optional-id",
  "images": ["base64..."],
  "files": [{"name": "specs.txt", "content": "...", "type": "txt"}]
}
```

### Response Format
```json
{
  "response": {
    "type": "pills",
    "content": "What type of USB cables do you need?",
    "pills": ["USB-A to USB-C", "USB-C to USB-C", "USB-A to Lightning"]
  },
  "conversationId": "..."
}
```

## Testing

A test UI is available at the root path. You can:
- Send text messages
- Upload images and files
- Click on pill options
- View summary cards
- Test the Edit/Submit flow

## Production Considerations

- Replace in-memory conversation storage with Redis or a database
- Add rate limiting and authentication
- Implement proper error handling and logging
- Consider using streaming responses for better UX
- Add file size and type validation on the backend