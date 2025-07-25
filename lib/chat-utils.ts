import { BotResponse, PillResponse, CardResponse } from './types';

/**
 * Handles pill click interactions by converting them to user messages
 */
export function handlePillClick(pillText: string, response: BotResponse): string {
  // Special handling for Edit/Submit buttons
  if (pillText === 'Edit') {
    return 'Edit';
  }
  
  if (pillText === 'Submit') {
    return 'Submit the requirements';
  }
  
  // For regular pills, use the pill text as the user's response
  return pillText;
}

/**
 * Determines if a response requires special handling
 */
export function requiresSpecialHandling(response: BotResponse): boolean {
  return response.type === 'card' || 
         (response.type === 'pills' && response.pills.includes('Edit'));
}

/**
 * Formats a bot response for display
 */
export function formatResponseForDisplay(response: BotResponse): {
  mainContent: string;
  interactive?: {
    type: 'pills' | 'card';
    data: any;
  };
} {
  const result: any = {
    mainContent: response.content
  };
  
  if (response.type === 'pills') {
    result.interactive = {
      type: 'pills',
      data: response.pills
    };
  } else if (response.type === 'card') {
    result.interactive = {
      type: 'card',
      data: {
        summary: response.card.summary,
        attachments: response.card.attachments,
        actions: response.pills
      }
    };
  }
  
  return result;
}

/**
 * Validates user input before sending to API
 */
export function validateUserInput(input: {
  message: string;
  images?: string[];
  files?: Array<{ name: string; content: string; type: string }>;
}): { valid: boolean; error?: string } {
  // Check message length
  if (!input.message || input.message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (input.message.length > 2000) {
    return { valid: false, error: 'Message is too long (max 2000 characters)' };
  }
  
  // Validate images if present
  if (input.images) {
    for (const image of input.images) {
      // Basic base64 validation
      if (!image.startsWith('data:image/')) {
        return { valid: false, error: 'Invalid image format' };
      }
      
      // Check size (rough estimate - 1MB limit)
      if (image.length > 1.5 * 1024 * 1024) {
        return { valid: false, error: 'Image size too large (max 1MB)' };
      }
    }
  }
  
  // Validate files if present
  if (input.files) {
    for (const file of input.files) {
      if (!['txt', 'csv'].includes(file.type)) {
        return { valid: false, error: 'Unsupported file type (only txt and csv allowed)' };
      }
      
      // Check file content size
      if (file.content.length > 500 * 1024) {
        return { valid: false, error: 'File size too large (max 500KB)' };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Extracts requirement data from a card response
 */
export function extractRequirementsFromCard(response: CardResponse): {
  product?: string;
  quantity?: string;
  customization?: string[];
  leadTime?: string;
  incoterms?: string;
  shipping?: string;
  raw: string[];
} {
  const requirements: any = {
    raw: response.card.summary
  };
  
  // Parse summary bullet points
  response.card.summary.forEach(point => {
    const [key, ...valueParts] = point.split(':');
    const value = valueParts.join(':').trim();
    
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('product')) {
      requirements.product = value;
    } else if (keyLower.includes('quantity')) {
      requirements.quantity = value;
    } else if (keyLower.includes('custom')) {
      requirements.customization = requirements.customization || [];
      requirements.customization.push(value);
    } else if (keyLower.includes('lead time')) {
      requirements.leadTime = value;
    } else if (keyLower.includes('incoterm')) {
      requirements.incoterms = value;
    } else if (keyLower.includes('shipping')) {
      requirements.shipping = value;
    }
  });
  
  return requirements;
}