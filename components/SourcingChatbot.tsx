'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { BotResponse } from '@/lib/types';
import { handlePillClick, validateUserInput } from '@/lib/chat-utils';
import { processUploadedFiles } from '@/lib/file-utils';

interface UploadedFile {
  name: string;
  content: string;
  type: "txt" | "csv";
}

export default function SourcingChatbot() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string | BotResponse }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState('chat-' + Date.now());
  const [uploadedFiles, setUploadedFiles] = useState<{ images: string[]; files: UploadedFile[] }>({ images: [], files: [] });
  const [hasInitialized, setHasInitialized] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    // Prevent duplicate sends
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    // Validate input
    const validation = validateUserInput({ 
      message, 
      images: uploadedFiles.images.length > 0 ? uploadedFiles.images : undefined,
      files: uploadedFiles.files.length > 0 ? uploadedFiles.files : undefined
    });
    
    if (!validation.valid) {
      alert(validation.error);
      isSendingRef.current = false;
      return;
    }

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          images: uploadedFiles.images.length > 0 ? uploadedFiles.images : null,
          files: uploadedFiles.files.length > 0 ? uploadedFiles.files : null
        })
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response as BotResponse 
        }]);
      }
      
      // Clear uploaded files after sending
      setUploadedFiles({ images: [], files: [] });
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: { type: 'text', content: 'Error: Failed to get response' } 
      }]);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [conversationId, uploadedFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const processedFiles = await processUploadedFiles(e.target.files);
    
    if (processedFiles.errors.length > 0) {
      alert('File errors: ' + processedFiles.errors.join(', '));
    }
    
    setUploadedFiles({
      images: processedFiles.images,
      files: processedFiles.textFiles
    });
  };

  const handlePillClickEvent = (pillText: string, response: BotResponse) => {
    // Immediately deactivate pills in UI for instant feedback
    setMessages(prev => prev.map(msg => {
      if (msg.role === 'assistant' && msg.content === response) {
        return {
          ...msg,
          content: {
            ...msg.content as BotResponse,
            pillsActive: false
          }
        };
      }
      return msg;
    }));

    const message = handlePillClick(pillText);
    sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Handle query parameter on component mount
  useEffect(() => {
    const query = searchParams.get('query');
    if (query && !hasInitialized && !isSendingRef.current) {
      setHasInitialized(true);
      sendMessage(query);
    }
  }, [searchParams, hasInitialized, sendMessage]);

  return (
    <div className="w-[500px] h-[1000px] bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Specify your sourcing needs</h2>
        <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
          Close
        </button>
      </div>

      {/* Chat Body */}
      <div 
        ref={chatBodyRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.role === 'assistant' ? (
              <div className="flex items-start gap-3">
                {/* Bot Avatar */}
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-orange-300 flex items-center justify-center">
                    <span className="text-orange-700 text-xs font-bold">🤖</span>
                  </div>
                </div>
                
                {/* Bot Message */}
                <div className="flex-1">
                  <div className="text-gray-800 text-sm mb-2">
                    {typeof msg.content === 'object' && 'type' in msg.content && msg.content.type === 'text' && msg.content.content}
                    {typeof msg.content === 'object' && 'type' in msg.content && msg.content.type === 'pills' && msg.content.content}
                    {typeof msg.content === 'object' && 'type' in msg.content && msg.content.type === 'card' && msg.content.content}
                  </div>
                  
                  {/* Render card summary if present */}
                  {typeof msg.content === 'object' && 'type' in msg.content && msg.content.type === 'card' && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-sm">
                      <ul className="space-y-1">
                        {msg.content.card.summary.map((point: string, i: number) => (
                          <li key={i} className="text-gray-700">• {point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* User Message - appears as pills on the right */
              <div className="flex justify-end">
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium max-w-xs">
                  {msg.content}
                </div>
              </div>
            )}
            
            {/* Pills for bot responses */}
            {msg.role === 'assistant' && typeof msg.content === 'object' && 'type' in msg.content && (msg.content.type === 'pills' || msg.content.type === 'card') && msg.content.pillsActive !== false && (
              <div className="flex flex-wrap gap-2 mt-3 ml-11">
                {msg.content.pills.map((pill: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handlePillClickEvent(pill, msg.content as BotResponse)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      pill === 'Submit' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-orange-300 flex items-center justify-center">
                <span className="text-orange-700 text-xs font-bold">🤖</span>
              </div>
            </div>
            <div className="flex space-x-1 items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your sourcing requirements..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          {/* File upload button */}
          <input
            type="file"
            onChange={handleFileUpload}
            multiple
            accept="image/*,.txt,.csv"
            className="hidden"
            id="file-upload-input"
          />
          <label 
            htmlFor="file-upload-input" 
            className="p-3 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </label>
          
          {/* Attachment button */}
          <button className="p-3 text-gray-500 hover:text-gray-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          </button>
          
          {/* Send button */}
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9 22,2"/>
            </svg>
          </button>
        </div>
        
        {/* File attachment indicator */}
        {(uploadedFiles.images.length > 0 || uploadedFiles.files.length > 0) && (
          <div className="mt-2 text-xs text-gray-500">
            Attached: {uploadedFiles.images.length} image(s), {uploadedFiles.files.length} file(s)
          </div>
        )}
      </div>
    </div>
  );
}