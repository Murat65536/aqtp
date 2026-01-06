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

          <div className="info-box mb-6 max-h-64 overflow-y-auto">
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
        <div className="card text-center">
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

        <div className="mb-8">
          <div className="question-box">
            <h3 className="heading-section">Question:</h3>
            <p className="text-body text-lg">{currentQuestion.question}</p>
          </div>

          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="textarea"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Check Answer and Skip Buttons */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={handleCheckAnswer}
            disabled={checking || !userAnswer.trim() || checkResult?.correct || skipped}
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
            disabled={checkResult?.correct || skipped}
            className="btn-skip flex-1 py-3"
          >
            Skip
          </button>
        </div>

        {/* Check Result */}
        {checkResult && (
          <div className={checkResult.correct ? 'result-correct' : 'result-incorrect'}>
            <h3 className={checkResult.correct ? 'result-title-correct' : 'result-title-incorrect'}>
              {checkResult.correct ? 'Correct' : 'Incorrect'}
            </h3>
            <p className={checkResult.correct ? 'result-text-correct' : 'result-text-incorrect'}>
              Correct Answer: {currentQuestion.answer}
              <br />
              Your Answer: {userAnswer}
            </p>
          </div>
        )}

        {/* Show Answer only when skipped, Context after checking or skipping */}
        {(checkResult || skipped) && (
          <div className="mb-6">
            {skipped && (
              <div className="context-box mt-4">
                <h3 className="heading-section">Answer:</h3>
                <p className="text-body">{currentQuestion.answer}</p>
              </div>
            )}
            <div className="context-box mt-4">
              <h3 className="heading-section">Context:</h3>
              <p className="text-body">{currentQuestion.context}</p>
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