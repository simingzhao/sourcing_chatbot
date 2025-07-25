/**
 * File processing utilities for the chatbot
 */

/**
 * Converts a File object to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Converts an image file to base64 with optional resizing
 */
export async function imageToBase64(
  file: File, 
  maxWidth: number = 1024, 
  maxHeight: number = 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            } else {
              reject(new Error('Failed to convert to base64'));
            }
          };
          reader.onerror = error => reject(error);
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = error => reject(error);
  });
}

/**
 * Reads text content from a file
 */
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Processes uploaded files for the chatbot
 */
export async function processUploadedFiles(files: FileList | File[]): Promise<{
  images: string[];
  textFiles: Array<{ name: string; content: string; type: 'txt' | 'csv' }>;
  errors: string[];
}> {
  const result = {
    images: [] as string[],
    textFiles: [] as Array<{ name: string; content: string; type: 'txt' | 'csv' }>,
    errors: [] as string[]
  };
  
  const fileArray = Array.from(files);
  
  for (const file of fileArray) {
    try {
      // Handle images
      if (file.type.startsWith('image/')) {
        const base64 = await imageToBase64(file);
        result.images.push(base64);
      }
      // Handle text files
      else if (file.name.endsWith('.txt')) {
        const content = await readTextFile(file);
        result.textFiles.push({
          name: file.name,
          content,
          type: 'txt'
        });
      }
      // Handle CSV files
      else if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const content = await readTextFile(file);
        result.textFiles.push({
          name: file.name,
          content,
          type: 'csv'
        });
      }
      else {
        result.errors.push(`Unsupported file type: ${file.name}`);
      }
    } catch (error) {
      result.errors.push(`Error processing ${file.name}: ${error}`);
    }
  }
  
  return result;
}

/**
 * Validates file size and type before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_TEXT_SIZE = 1 * 1024 * 1024; // 1MB
  
  // Check file type
  const supportedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/csv'
  ];
  
  const isSupported = supportedTypes.includes(file.type) || 
                     file.name.endsWith('.txt') || 
                     file.name.endsWith('.csv');
  
  if (!isSupported) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  // Check file size
  if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image file too large (max 5MB)' };
  }
  
  if ((file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) 
      && file.size > MAX_TEXT_SIZE) {
    return { valid: false, error: 'Text file too large (max 1MB)' };
  }
  
  return { valid: true };
}