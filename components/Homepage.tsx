'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Homepage = () => {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();

  const handleQuerySelect = (query: string) => {
    router.push(`/chat?query=${encodeURIComponent(query)}`);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/chat?query=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const recommendedQueries = [
    "I need electronics components",
    "Looking for packaging materials",
    "Need industrial machinery",
    "500 units waterproof IP67 connectors, 12-pin, automotive grade",
    "1000 pcs corrugated boxes 30x20x15cm, double wall, for export shipping"
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-12 h-12 mx-auto bg-orange-400 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-light text-gray-900 mb-8">
          Good evening, Siming
        </h1>

        {/* Search Input */}
        <form onSubmit={handleInputSubmit} className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="How can I help you today?"
              className="w-full px-5 py-3 pr-12 text-base bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>

        {/* Recommended Query Pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
          {recommendedQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleQuerySelect(query)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Homepage;