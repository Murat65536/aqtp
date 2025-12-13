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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            NAQT Quiz Practice
          </h1>
          <p className="text-xl text-gray-700">
            Practice with AI-generated questions from NAQT &quot;You Gotta Know&quot; topics
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Powered by locally-hosted AI
          </p>
        </header>

        {selectedTopic ? (
          <QuizInterface 
            topic={selectedTopic} 
            onBack={() => setSelectedTopic(null)} 
          />
        ) : (
          <TopicSelector onTopicSelect={setSelectedTopic} />
        )}
      </div>
    </div>
  );
}
