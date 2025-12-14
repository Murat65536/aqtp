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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading NAQT topics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-400">
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
          className="w-full max-w-md p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="max-h-[58vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white/5 p-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => onTopicSelect(topic)}
              className="p-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
            >
              <h3 className="font-semibold text-gray-100 line-clamp-2">
                {topic.title}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
