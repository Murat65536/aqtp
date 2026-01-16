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

interface Validation {
  correct: boolean;
}

interface QuizInterfaceProps {
  topic: Topic;
  onBack: () => void;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export default function QuizInterface({ topic, onBack, apiKey, model, baseUrl }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [userAnswer, setUserAnswer] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [checkResult, setCheckResult] = useState<Validation | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [showContextPopup, setShowContextPopup] = useState(false);

  const [questionError, setQuestionError] = useState<string | null>(null);

  const generateNextQuestion = async () => {
    setLoading(true);
    setQuestionError(null);
    try {
      const { generateSingleQuestion } = await import('@/lib/llm');

      const question = await generateSingleQuestion(
        topic.content,
        apiKey,
        model,
        baseUrl
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
        model,
        baseUrl
      );

      setCheckResult(result);
      setAnsweredCount((prev) => prev + 1);
      if (result.correct) setCorrectCount((prev) => prev + 1);
    } catch (error: any) {
      setQuestionError('Failed to check answer: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setCheckResult(null);
    setSkipped(false);

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
      setUserAnswer('');
      setCheckResult(null);
    }
  };

  if (!quizStarted) {
    return (
      <div className="quiz-wrapper">
        <button
          onClick={onBack}
          className="btn-link mb-6"
        >
          ← Back to Topics
        </button>

        <div className="card">
          <h2 className="heading-large">{topic.title}</h2>

          <div className="info-box mb-6 flex-1 overflow-y-auto">
            <p className="text-body whitespace-pre-wrap">
              {topic.content}
            </p>
          </div>

          {questionError && (
            <div className="error-box">
              {questionError}
            </div>
          )}

          <button
            onClick={generateNextQuestion}
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <span className="loading-container">
                <div className="spinner-small"></div>
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
      <div className="quiz-wrapper">
        <button
          onClick={onBack}
          className="btn-link mb-6"
        >
          ← Back to Topics
        </button>
        <div className="card text-center items-center justify-center">
          <div className="spinner mb-4"></div>
          <p className="text-muted">Generating question with AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-wrapper">
      <button
        onClick={onBack}
        className="btn-link mb-6"
      >
        ← Back to Topics
      </button>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="heading-medium">{topic.title}</h2>
          <div className="flex flex-col items-end">
            <span className="text-muted">
              Question {currentQuestionIndex + 1}
            </span>
            <span className="accuracy-badge">
              Accuracy: {answeredCount > 0 ? ((correctCount / answeredCount) * 100).toFixed(2) : 100}%
            </span>
          </div>
        </div>

        {questionError && (
          <div className="error-box">
            {questionError}
          </div>
        )}

        <div className="flex-1 flex flex-col min-height-0 mb-8">
          <div className="question-box flex-1 overflow-y-auto mb-4">
            <h3 className="heading-section">Question:</h3>
            <p className="text-body text-lg">{currentQuestion.question}</p>
          </div>

          {!checkResult && !skipped && (
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
              placeholder="Type your answer here..."
              className="input py-3 text-lg"
              autoComplete="off"
              spellCheck="false"
              autoFocus
            />
          )}
        </div>

        {/* Check Answer and Skip Buttons OR Result Box */}
        <div className="mb-4">
          {(!checkResult && !skipped) ? (
            <div className="flex gap-4">
              <button
                onClick={handleCheckAnswer}
                disabled={checking || !userAnswer.trim()}
                className="btn-check flex-1 py-3"
              >
                {checking ? (
                  <span className="loading-container">
                    <div className="spinner-small"></div>
                    Checking Answer...
                  </span>
                ) : (
                  'Check Answer'
                )}
              </button>
              <button
                onClick={() => { setSkipped(true); setCheckResult(null); setAnsweredCount((prev) => prev + 1); }}
                className="btn-skip flex-1 py-3"
              >
                Skip
              </button>
            </div>
          ) : (
            <div className={skipped ? 'result-incorrect' : (checkResult?.correct ? 'result-correct' : 'result-incorrect')}>
              <h3 className={skipped ? 'result-title-incorrect' : (checkResult?.correct ? 'result-title-correct' : 'result-title-incorrect')}>
                {skipped ? 'Skipped' : (checkResult?.correct ? 'Correct' : 'Incorrect')}
              </h3>
              <p className={skipped ? 'result-text-incorrect' : (checkResult?.correct ? 'result-text-correct' : 'result-text-incorrect')}>
                Correct Answer: {currentQuestion.answer}
                {!skipped && (
                  <>
                    <br />
                    Your Answer: {userAnswer}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Context Button after checking or skipping */}
        {(checkResult || skipped) && (
          <div className="mb-6">
            <button
              onClick={() => setShowContextPopup(true)}
              className="btn-secondary w-full py-3"
            >
              Show Context
            </button>
          </div>
        )}

        {/* Context Popup */}
        {showContextPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowContextPopup(false)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close context"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              <h2 className="heading-medium mb-6 pr-8">Context & Explanation</h2>
              
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="context-box">
                  <h3 className="heading-section">Context:</h3>
                  <p className="text-body whitespace-pre-wrap">{currentQuestion.context}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowContextPopup(false)}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn-secondary flex-1 py-3"
          >
            Previous
          </button>
          <button
            onClick={handleNextQuestion}
            disabled={loading || (!skipped && checkResult === null)}
            className="btn-primary flex-1 py-3"
          >
            {loading ? 'Generating...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}