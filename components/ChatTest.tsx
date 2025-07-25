'use client';

import { useState } from 'react';
import { BotResponse } from '@/lib/types';
import { handlePillClick, validateUserInput } from '@/lib/chat-utils';
import { processUploadedFiles } from '@/lib/file-utils';

export default function ChatTest() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string | BotResponse }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState('test-' + Date.now());
  const [uploadedFiles, setUploadedFiles] = useState<{ images: string[]; files: { name: string; content: string; type: string }[] }>({ images: [], files: [] });

  const sendMessage = async (message: string) => {
    // Validate input
    const validation = validateUserInput({ 
      message, 
      images: uploadedFiles.images.length > 0 ? uploadedFiles.images : undefined,
      files: uploadedFiles.files.length > 0 ? uploadedFiles.files : undefined
    });
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);

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
      setLoading(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">B2B Sourcing Chatbot Test</h1>
      
      <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'
            }`}>
              {msg.role === 'user' ? (
                <div>{msg.content}</div>
              ) : (
                <div>
                  {/* Render bot response based on type */}
                  {msg.content.type === 'text' && (
                    <div>{msg.content.content}</div>
                  )}
                  
                  {msg.content.type === 'pills' && (
                    <div>
                      <div className="mb-2">{msg.content.content}</div>
                      {msg.content.pillsActive !== false && (
                        <div className="flex flex-wrap gap-2">
                          {msg.content.pills.map((pill: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => handlePillClickEvent(pill, msg.content)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                            >
                              {pill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {msg.content.type === 'card' && (
                    <div>
                      <div className="mb-2">{msg.content.content}</div>
                      <div className="border rounded p-3 bg-gray-50">
                        <ul className="list-disc list-inside">
                          {msg.content.card.summary.map((point: string, i: number) => (
                            <li key={i} className="text-sm">{point}</li>
                          ))}
                        </ul>
                        {msg.content.card.attachments && msg.content.card.attachments.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            Attachments: {msg.content.card.attachments.length} file(s)
                          </div>
                        )}
                      </div>
                      {msg.content.pillsActive !== false && (
                        <div className="flex gap-2 mt-2">
                          {msg.content.pills.map((pill: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => handlePillClickEvent(pill, msg.content)}
                              className={`px-4 py-2 rounded ${
                                pill === 'Submit' 
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              {pill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg"
          disabled={loading}
        />
        <input
          type="file"
          onChange={handleFileUpload}
          multiple
          accept="image/*,.txt,.csv"
          className="hidden"
          id="file-upload"
        />
        <label 
          htmlFor="file-upload" 
          className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300"
        >
          📎
        </label>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
      
      {(uploadedFiles.images.length > 0 || uploadedFiles.files.length > 0) && (
        <div className="mt-2 text-sm text-gray-600">
          Attached: {uploadedFiles.images.length} image(s), {uploadedFiles.files.length} file(s)
        </div>
      )}
    </div>
  );
}