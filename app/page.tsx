'use client';

import { useState, useEffect } from 'react';
import TopicSelector from '@/components/TopicSelector';
import QuizInterface from '@/components/QuizInterface';
import { fetchAvailableModels, DEFAULT_OPENAI_MODEL } from '@/lib/llm';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Topic {
  title: string;
  url: string;
  content: string;
}

// Storage keys
const STORAGE_KEYS = {
  API_KEY: 'quiz_app_api_key',
  BASE_URL: 'quiz_app_base_url',
  PROVIDER: 'quiz_app_base_url_provider',
  MODEL: 'quiz_app_model',
};

const BASE_URL_PROVIDERS = [
  { name: 'GitHub', url: 'https://models.inference.ai.azure.com' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1' },
  { name: 'Custom', url: '' },
];

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrlProvider, setBaseUrlProvider] = useState(BASE_URL_PROVIDERS[0].name);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState(DEFAULT_OPENAI_MODEL);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      const savedProvider = localStorage.getItem(STORAGE_KEYS.PROVIDER);
      const savedBaseUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const savedModel = localStorage.getItem(STORAGE_KEYS.MODEL);

      if (savedApiKey) setApiKey(savedApiKey);
      if (savedProvider) setBaseUrlProvider(savedProvider);
      if (savedBaseUrl) setCustomBaseUrl(savedBaseUrl);
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PROVIDER, baseUrlProvider);
      if (customBaseUrl) {
        localStorage.setItem(STORAGE_KEYS.BASE_URL, customBaseUrl);
      }
    }
  }, [baseUrlProvider, customBaseUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined' && model) {
      localStorage.setItem(STORAGE_KEYS.MODEL, model);
    }
  }, [model]);

  useEffect(() => {
    async function fetchModels() {
      if (!apiKey) return;
      
      const baseUrl = baseUrlProvider === 'Custom' 
        ? customBaseUrl 
        : BASE_URL_PROVIDERS.find(p => p.name === baseUrlProvider)?.url;

      setModelLoading(true);
      setModelError(null);
      try {
        const result = await fetchAvailableModels(apiKey, baseUrl);
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
  }, [apiKey, baseUrlProvider, customBaseUrl]);

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
      setBaseUrlProvider(BASE_URL_PROVIDERS[0].name);
      setCustomBaseUrl('');
      setModel(DEFAULT_OPENAI_MODEL);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
        localStorage.removeItem(STORAGE_KEYS.PROVIDER);
        localStorage.removeItem(STORAGE_KEYS.BASE_URL);
        localStorage.removeItem(STORAGE_KEYS.MODEL);
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header with global controls */}
      <header className="flex justify-between items-center mb-4 px-2">
        <ThemeToggle />
        <button
          className="btn-primary py-2 px-4 text-sm"
          onClick={() => setShowOptions((v) => !v)}
        >
          Options
        </button>
      </header>

      {/* Sidebar */}
      {showOptions && (
        <div className="sidebar">
          <button
            className="sidebar-close-btn"
            onClick={() => setShowOptions(false)}
            aria-label="Close options sidebar"
          >
            ×
          </button>
          
          {/* API Key Section */}
          <div className="mb-6">
            <label htmlFor="api-key" className="label">
              API Key:
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="input mb-2"
              autoComplete="off"
              placeholder="Enter your API key"
            />
            {apiKey && (
              <div className="saved-indicator">
                ✓ API key saved in browser
              </div>
            )}
            {apiKey && (
              <button
                onClick={handleClearApiKey}
                className="clear-link"
              >
                Clear saved API key
              </button>
            )}
          </div>

          {/* Base URL Provider Section */}
          <div className="mb-6">
            <label htmlFor="base-url-provider" className="label">
              Base URL Provider:
            </label>
            <select
              id="base-url-provider"
              value={baseUrlProvider}
              onChange={e => setBaseUrlProvider(e.target.value)}
              className="select mb-2"
            >
              {BASE_URL_PROVIDERS.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            
            {baseUrlProvider === 'Custom' && (
              <div className="mt-2">
                <label htmlFor="custom-base-url" className="label">
                  Custom Base URL:
                </label>
                <input
                  id="custom-base-url"
                  type="text"
                  value={customBaseUrl}
                  onChange={e => setCustomBaseUrl(e.target.value)}
                  className="input"
                  placeholder="https://api.example.com/v1"
                />
              </div>
            )}
          </div>

          {/* Model Selection */}
          {models.length > 0 && (
            <div className="mb-4">
              <label htmlFor="model" className="label">
                Select Model:
              </label>
              <select
                id="model"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="select"
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
          
          {modelLoading && <div className="text-muted mb-2 text-sm">Loading models...</div>}
          {modelError && <div className="text-error mb-2 text-sm">{modelError}</div>}

          {/* Clear All Settings */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={handleClearAllSettings}
              className="btn-danger w-full text-sm"
            >
              Clear All Saved Settings
            </button>
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            Settings are stored locally in your browser. Only save API keys on trusted devices.
          </div>
        </div>
      )}

      <div className="content-wrapper">
        {selectedTopic ? (
          <QuizInterface
            topic={selectedTopic}
            onBack={() => setSelectedTopic(null)}
            apiKey={apiKey}
            model={model}
            baseUrl={baseUrlProvider === 'Custom' ? customBaseUrl : BASE_URL_PROVIDERS.find(p => p.name === baseUrlProvider)?.url}
          />
        ) : (
          <TopicSelector onTopicSelect={setSelectedTopic} />
        )}
      </div>
    </div>
  );
}