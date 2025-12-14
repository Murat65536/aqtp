'use client';

import { useState } from 'react';

interface Question {
  question: string;
  answer: string;
  context: string;
}

interface Topic {
  title: string;
  content: string;
}

interface QuizInterfaceProps {
  topic: Topic;
  onBack: () => void;
  baseURL: string;
  apiKey: string;
}

export default function QuizInterface({ topic, onBack, baseURL, apiKey }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);

  const generateNextQuestion = async () => {
    setLoading(true);
    try {
      // Import the generateSingleQuestion function directly
      // Note: This will expose your API calls to the client
      const { generateSingleQuestion } = await import('@/lib/llm');
      
      const question = await generateSingleQuestion(
        topic.content,
        topic.title,
        apiKey,
        baseURL
      );
      
      setQuestions(prev => [...prev, question]);
  
      if (!quizStarted) {
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error('Error generating question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setShowAnswer(false);
    setUserAnswer('');

    // If we're at the last question, generate a new one
    if (currentQuestionIndex === questions.length - 1) {
      setCurrentQuestionIndex(questions.length);
      generateNextQuestion();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswer(false);
      setUserAnswer('');
    }
  };

  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Topics
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">{topic.title}</h2>

          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-64 overflow-y-auto">
            <p className="text-gray-200 whitespace-pre-wrap">
              {topic.content}
            </p>
          </div>

          <button
            onClick={generateNextQuestion}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Question with AI...
              </span>
            ) : (
              'Start Quiz'
            )}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Show loading state if we're waiting for a question
  if (!currentQuestion && loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Topics
        </button>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Generating question with AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Back to Topics
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-100">{topic.title}</h2>
          <span className="text-gray-300">
            Question {currentQuestionIndex + 1}
          </span>
        </div>

        <div className="mb-8">
          <div className="bg-blue-50 dark:bg-gray-800 p-6 rounded-lg mb-4">
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Question:</h3>
            <p className="text-gray-200 text-lg">{currentQuestion.question}</p>
          </div>

          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none min-h-32"
          />
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>

          {showAnswer && (
            <>
              <div className="mt-4 p-6 bg-green-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-100 mb-2">Answer:</h3>
                <p className="text-gray-100">{currentQuestion.answer}</p>
              </div>
              <div className="mt-4 p-6 bg-blue-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-100 mb-2">Context:</h3>
                <p className="text-gray-100">{currentQuestion.context}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex-1 bg-gray-700 text-gray-100 py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNextQuestion}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
