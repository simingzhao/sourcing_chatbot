import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  SYSTEM_PROMPT, 
  EDIT_MODE_PROMPT,
  buildContextPrompt 
} from '@/lib/system-prompt';
import { chatResponseFormat } from '@/lib/openai-schemas';
import { 
  BotResponse,
  ConversationMessage 
} from '@/lib/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory conversation storage (replace with Redis/DB in production)
const conversations = new Map<string, ConversationMessage[]>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      conversationId = 'default',
      images = null,
      files = null
    } = body;

    // Get or create conversation history
    let conversationHistory = conversations.get(conversationId) || [];

    // Deactivate pills from the most recent bot message with pills before adding user response
    if (conversationHistory.length > 0) {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        if (msg.role === 'assistant' && 'type' in msg && (msg.type === 'pills' || msg.type === 'card')) {
          if ('pillsActive' in msg && msg.pillsActive !== false) {
            (msg as BotResponse & { pillsActive?: boolean }).pillsActive = false;
            break; // Only deactivate the most recent message with pills
          }
        }
      }
    }

    // Add user message to history
    const userMessage: ConversationMessage = {
      role: 'user',
      type: 'user',
      content: message,
      images: images,
      files: files
    };
    conversationHistory.push(userMessage);

    // Build messages for OpenAI
    const contextPrompt = buildContextPrompt(conversationHistory, files || []);
    const systemPromptWithContext = SYSTEM_PROMPT + contextPrompt;

    // Handle Edit mode
    const isEditMode = message.toLowerCase() === 'edit';
    const finalSystemPrompt = isEditMode ? 
      systemPromptWithContext + '\n\n' + EDIT_MODE_PROMPT : 
      systemPromptWithContext;

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: finalSystemPrompt }
    ];

    // Add conversation history (last 10 messages for context window)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        const content: OpenAI.Chat.ChatCompletionContentPart[] = [
          { type: 'text', text: msg.content }
        ];
        
        // Add images if present
        if (msg.images && msg.images.length > 0) {
          for (const image of msg.images) {
            content.push({
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}` }
            });
          }
        }
        
        messages.push({ 
          role: 'user', 
          content: content
        });
      } else if (msg.role === 'assistant' && 'type' in msg) {
        // Reconstruct assistant message
        let assistantContent = msg.content;
        if (msg.type === 'pills') {
          assistantContent += ` [Pills: ${msg.pills.join(', ')}]`;
        } else if (msg.type === 'card') {
          assistantContent += ` [Summary Card Shown]`;
        }
        messages.push({ 
          role: 'assistant', 
          content: assistantContent 
        });
      }
    }

    // Call OpenAI with Structured Output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: messages,
      response_format: chatResponseFormat,
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const wrappedResponse = JSON.parse(responseContent) as { response: BotResponse };
    const parsedResponse = wrappedResponse.response;
    
    // Add assistant response to history
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      ...parsedResponse
    };
    conversationHistory.push(assistantMessage);

    // Store updated conversation (keep last 50 messages)
    if (conversationHistory.length > 50) {
      conversationHistory = conversationHistory.slice(-50);
    }
    conversations.set(conversationId, conversationHistory);

    // Return the structured response
    return NextResponse.json({
      response: parsedResponse,
      conversationId
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Return a fallback text response on error
    const fallbackResponse: BotResponse = {
      type: 'text',
      content: 'I apologize, but I encountered an error processing your request. Please try again.'
    };
    
    return NextResponse.json({
      response: fallbackResponse,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Add GET endpoint to retrieve conversation history
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const conversationId = searchParams.get('conversationId') || 'default';
  
  const history = conversations.get(conversationId) || [];
  
  return NextResponse.json({
    conversationId,
    messages: history
  });
}