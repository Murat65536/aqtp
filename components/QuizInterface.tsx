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
  apiKey: string;
  model: string;
}

export default function QuizInterface({ topic, onBack, apiKey, model }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const [questionError, setQuestionError] = useState<string | null>(null);

  const generateNextQuestion = async () => {
    setLoading(true);
    setQuestionError(null);
    try {
      const { generateSingleQuestion } = await import('@/lib/llm');

      const question = await generateSingleQuestion(
        topic.content,
        apiKey,
        model
      );

      setQuestions(prev => [...prev, question]);

      if (!quizStarted) {
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
      }
    } catch (error: any) {
      setQuestionError(error.message || 'Failed to generate question');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim()) {
      return;
    }

    setChecking(true);
    setCheckResult(null);

    try {
      const { checkAnswer } = await import('@/lib/llm');

      const result = await checkAnswer(
        currentQuestion.question,
        currentQuestion.answer,
        userAnswer,
        apiKey,
        model
      );

      setCheckResult(result);
    } catch (error: any) {
      setQuestionError('Failed to check answer: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  const handleNextQuestion = () => {
    setShowAnswer(false);
    setUserAnswer('');
    setCheckResult(null);

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
      setCheckResult(null);
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

          {questionError && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
              {questionError}
            </div>
          )}

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

        {questionError && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
            {questionError}
          </div>
        )}

        <div className="mb-8">
          <div className="bg-blue-50 dark:bg-gray-800 p-6 rounded-lg mb-4">
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Question:</h3>
            <p className="text-gray-200 text-lg">{currentQuestion.question}</p>
          </div>

          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none min-h-32 text-gray-900 dark:text-gray-100 dark:bg-gray-800"
          />
        </div>

        {/* Check Answer Button */}
        {userAnswer.trim() && !checkResult && (
          <div className="mb-4">
            <button
              onClick={handleCheckAnswer}
              disabled={checking}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Checking Answer...
                </span>
              ) : (
                'Check My Answer'
              )}
            </button>
          </div>
        )}

        {/* Check Result */}
        {checkResult && (
          <div className={`mb-4 p-4 rounded-lg ${checkResult
            ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500'
            : 'bg-orange-100 dark:bg-orange-900 border-2 border-orange-500'
            }`}>
            <h3 className={`text-xl font-semibold mb-2 ${checkResult ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'
              }`}>
              {checkResult ? '✓ Correct!' : '✗ Not Quite'}
            </h3>
            <p className={checkResult ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}>
              Correct Answer: {currentQuestion.answer}
              <br />
              Your Answer: {userAnswer}
            </p>
          </div>
        )}

        {/* Show Answer Button */}
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

        {/* Navigation Buttons */}
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