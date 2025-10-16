import { useState, useEffect, useRef, useCallback } from 'react';

interface QuestionTiming {
  question_index: string;
  time_spent_seconds: number;
}

interface UseQuizTimerReturn {
  totalSeconds: number;
  currentQuestionSeconds: number;
  formattedTotalTime: string;
  formattedQuestionTime: string;
  questionTimings: QuestionTiming[];
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  recordQuestionTime: (questionIndex: string) => void;
  isRunning: boolean;
}

/**
 * Custom hook to manage quiz timing
 * Tracks both total quiz time and per-question time
 */
export const useQuizTimer = (): UseQuizTimerReturn => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentQuestionSeconds, setCurrentQuestionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [questionTimings, setQuestionTimings] = useState<QuestionTiming[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalStartTimeRef = useRef<number | null>(null);
  const questionStartTimeRef = useRef<number | null>(null);

  // Format seconds to MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Start the timer
  const startTimer = useCallback(() => {
    if (!isRunning) {
      const now = Date.now();
      totalStartTimeRef.current = now - (totalSeconds * 1000);
      questionStartTimeRef.current = now - (currentQuestionSeconds * 1000);
      setIsRunning(true);
    }
  }, [isRunning, totalSeconds, currentQuestionSeconds]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  // Reset the timer
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTotalSeconds(0);
    setCurrentQuestionSeconds(0);
    setQuestionTimings([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    totalStartTimeRef.current = null;
    questionStartTimeRef.current = null;
  }, []);

  // Record time spent on current question and reset question timer
  const recordQuestionTime = useCallback((questionIndex: string) => {
    const timing: QuestionTiming = {
      question_index: questionIndex,
      time_spent_seconds: currentQuestionSeconds,
    };

    setQuestionTimings((prev) => [...prev, timing]);

    // Reset question timer for next question
    setCurrentQuestionSeconds(0);
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionSeconds]);

  // Main timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (totalStartTimeRef.current && questionStartTimeRef.current) {
          const now = Date.now();
          const newTotalSeconds = Math.floor((now - totalStartTimeRef.current) / 1000);
          const newQuestionSeconds = Math.floor((now - questionStartTimeRef.current) / 1000);

          setTotalSeconds(newTotalSeconds);
          setCurrentQuestionSeconds(newQuestionSeconds);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    totalSeconds,
    currentQuestionSeconds,
    formattedTotalTime: formatTime(totalSeconds),
    formattedQuestionTime: formatTime(currentQuestionSeconds),
    questionTimings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    recordQuestionTime,
    isRunning,
  };
};
