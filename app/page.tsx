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

// Storage keys
const STORAGE_KEYS = {
  API_KEY: 'quiz_app_api_key',
  BASE_URL: 'quiz_app_base_url',
  MODEL: 'quiz_app_model',
};

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [apiKey, setApiKey] = useState('');
  const baseURL = 'https://models.inference.ai.azure.com';
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState(DEFAULT_OPENAI_MODEL);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      const savedBaseURL = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const savedModel = localStorage.getItem(STORAGE_KEYS.MODEL);
      const savedBaseURLMode = localStorage.getItem('quiz_app_base_url_mode');

      if (savedApiKey) setApiKey(savedApiKey);
      
      if (savedModel) setModel(savedModel);
      
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && apiKey) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    }
  }, [apiKey]);

  

  useEffect(() => {
    if (typeof window !== 'undefined' && model) {
      localStorage.setItem(STORAGE_KEYS.MODEL, model);
    }
  }, [model]);

  useEffect(() => {
    async function fetchModels() {
      if (!apiKey) return;
      setModelLoading(true);
      setModelError(null);
      try {
        const result = await fetchAvailableModels(apiKey);
        setModels(result);
        
        // Only change model if current model is not in the new list
        if (result.length > 0) {
          const currentModelExists = result.includes(model);
          if (!currentModelExists) {
            setModel(result[0]);
          }
        }
      } catch (err: any) {
        setModelError(err.message || 'Failed to fetch models');
        setModels([]);
      } finally {
        setModelLoading(false);
      }
    }
    fetchModels();
  }, [apiKey]);

  const handleClearApiKey = () => {
    if (confirm('Are you sure you want to clear your saved API key?')) {
      setApiKey('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
      }
    }
  };

  const handleClearAllSettings = () => {
    if (confirm('Are you sure you want to clear all saved settings?')) {
      setApiKey('');
      setModel(DEFAULT_OPENAI_MODEL);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
        localStorage.removeItem(STORAGE_KEYS.MODEL);
      }
    }
  };

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
        <div className="fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl z-40 flex flex-col p-8 transition-transform duration-300 overflow-y-auto">
          <button
            className="self-end mb-6 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none"
            onClick={() => setShowOptions(false)}
            aria-label="Close options sidebar"
          >
            ×
          </button>
          
          {/* API Key Section */}
          <div className="mb-6">
            <label htmlFor="api-key" className="mb-2 font-semibold text-gray-100 block">
              OpenAI API Key:
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2 bg-gray-800 text-white"
              autoComplete="off"
              placeholder="Enter your API key"
            />
            {apiKey && (
              <div className="text-xs text-green-400 mb-2">
                ✓ API key saved in browser
              </div>
            )}
            {apiKey && (
              <button
                onClick={handleClearApiKey}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Clear saved API key
              </button>
            )}
          </div>

          {/* Model Selection */}
          {models.length > 0 && (
            <div className="mb-4">
              <label htmlFor="model" className="mb-2 font-semibold text-gray-100 block">
                Select Model:
              </label>
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
          
          {modelLoading && <div className="text-gray-300 mb-2 text-sm">Loading models...</div>}
          {modelError && <div className="text-red-400 mb-2 text-sm">{modelError}</div>}

          {/* Clear All Settings */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={handleClearAllSettings}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none text-sm"
            >
              Clear All Saved Settings
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            Settings are stored locally in your browser. Only save API keys on trusted devices.
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col items-center">
      </div>
      {selectedTopic ? (
        <QuizInterface
          topic={selectedTopic}
          onBack={() => setSelectedTopic(null)}
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