'use client';

import { useState, useEffect } from 'react';
import TopicSelector from '@/components/TopicSelector';
import QuizInterface from '@/components/QuizInterface';

interface Topic {
  title: string;
  url: string;
  content: string;
}

import { fetchAvailableModels, DEFAULT_OPENAI_MODEL } from '@/lib/llm';

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('https://models.inference.ai.azure.com');
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState(DEFAULT_OPENAI_MODEL);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    async function fetchModels() {
      if (!apiKey || !baseURL) return;
      setModelLoading(true);
      setModelError(null);
      try {
        const result = await fetchAvailableModels(apiKey, baseURL);
        setModels(result);
        if (result.length > 0) setModel(result[0]);
      } catch (err: any) {
        setModelError(err.message || 'Failed to fetch models');
        setModels([]);
      } finally {
        setModelLoading(false);
      }
    }
    fetchModels();
  }, [apiKey, baseURL]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 relative">
      {/* Options Button - Top Right */}
      <button
        className="fixed top-6 right-6 z-50 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none shadow-lg"
        onClick={() => setShowOptions((v) => !v)}
      >
        Options
      </button>
      {/* Sidebar */}
      {showOptions && (
        <div className="fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl z-40 flex flex-col p-8 transition-transform duration-300">
          <button
            className="self-end mb-6 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none"
            onClick={() => setShowOptions(false)}
            aria-label="Close options sidebar"
          >
            ×
          </button>
          <label htmlFor="api-key" className="mb-2 font-semibold text-gray-100">Enter your OpenAI API Key:</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-4 bg-gray-800 text-white"
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
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-800 text-white"
            autoComplete="off"
          />
          {models.length > 0 && (
            <div className="mb-4 w-full">
              <label htmlFor="model" className="mb-2 font-semibold text-gray-100">Select Model:</label>
              <select
                id="model"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-800 text-white"
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
          {modelLoading && <div className="text-gray-300 mb-2">Loading models...</div>}
          {modelError && <div className="text-red-400 mb-2">{modelError}</div>}
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col items-center">
      </div>
      {selectedTopic ? (
        <QuizInterface
          topic={selectedTopic}
          onBack={() => setSelectedTopic(null)}
          baseURL={baseURL}
          apiKey={apiKey}
          model={model}
        />
      ) : (
        <TopicSelector onTopicSelect={setSelectedTopic} />
      )}
      </div>
    </div>
  );
}

