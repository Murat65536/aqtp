'use client';

import { useState } from 'react';
import TopicSelector from '@/components/TopicSelector';
import QuizInterface from '@/components/QuizInterface';

interface Topic {
  title: string;
  url: string;
  content: string;
}

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('https://models.inference.ai.azure.com');



  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col items-center">
 
          <label htmlFor="api-key" className="mb-2 font-semibold text-gray-100">Enter your OpenAI API Key:</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full max-w-md p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-4"
            autoComplete="off"
          />

          <label htmlFor="base-url" className="mb-2 font-semibold text-gray-100 mt-4">Enter your OpenAI Base URL:</label>
          <input
            id="base-url"
            type="text"
            value={baseURL}
            onChange={e => {
              setBaseURL(e.target.value);
            }}
            className="w-full max-w-md p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder="https://api.openai.com"
            autoComplete="off"
          />
        </div>
        {selectedTopic ? (
          <QuizInterface 
            topic={selectedTopic} 
            onBack={() => setSelectedTopic(null)} 
            baseURL={baseURL}
            apiKey={apiKey}
          />
        ) : (
          <TopicSelector onTopicSelect={setSelectedTopic} />
        )}
      </div>
    </div>
  );
}
