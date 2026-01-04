'use client';

import { useState, useEffect } from 'react';

interface Topic {
  title: string;
  url: string;
  content: string;
}

interface TopicSelectorProps {
  onTopicSelect: (topic: Topic) => void;
}

export default function TopicSelector({ onTopicSelect }: TopicSelectorProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchTopics() {
      try {
        const response = await fetch('/aqtp/naqt_topics_cache.json');
        if (!response.ok) throw new Error('Failed to fetch topics');
        const data = await response.json();
        setTopics(data);
      } catch (err) {
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
      <div className="text-center p-8">
        <div className="spinner"></div>
        <p className="mt-4 text-muted">Loading NAQT topics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search topics..."
          className="search-input"
        />
      </div>
      <div className="topics-scroll-container">
        <div className="topics-grid">
          {filteredTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => onTopicSelect(topic)}
              className="card-small"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                {topic.title}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}