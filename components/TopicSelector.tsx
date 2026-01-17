'use client';

import { useState, useEffect } from 'react';

interface Topic {
  title: string;
  url: string;
  content: string;
}

interface TopicSelectorProps {
  onTopicSelect: (topic: Topic) => void;
  onShowOptions: () => void;
}

export default function TopicSelector({ onTopicSelect, onShowOptions }: TopicSelectorProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchTopics() {
      try {
        // Try with basePath first
        let response = await fetch('/aqtp/naqt_topics_cache.json');
        
        // Fallback to root if basePath fails (e.g. in some local dev setups)
        if (!response.ok) {
           console.warn('Failed to fetch from /aqtp/, trying root...');
           response = await fetch('/naqt_topics_cache.json');
        }

        if (!response.ok) throw new Error(`Failed to fetch topics: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        setTopics(data);
      } catch (err) {
        console.error('Topic fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner mb-4 border-blue-500 border-t-transparent"></div>
        <p className="text-muted text-foreground">Loading NAQT topics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="error-box inline-block">
          <p className="font-bold">Error loading topics</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2">Please check if 'naqt_topics_cache.json' exists in public folder.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search topics..."
          className="search-input bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 flex-1 min-w-0"
        />
        <button
          onClick={onShowOptions}
          className="btn-primary py-2 px-4 whitespace-nowrap"
        >
          Options
        </button>
      </div>
      <div className="topics-scroll-container bg-white/5 dark:bg-black/20">
        {filteredTopics.length === 0 ? (
           <div className="text-center p-4 text-muted">No topics found matching "{search}"</div>
        ) : (
          <div className="topics-grid">
            {filteredTopics.map((topic, index) => (
              <button
                key={index}
                onClick={() => onTopicSelect(topic)}
                className="card-small hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-left">
                  {topic.title}
                </h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}