import { useState, useRef, useCallback, useEffect } from 'react';
import { TimerColor, TimingThresholds } from '../types';
import { getTimerColor } from '../utils/getTimerColor';
import { playGreenChime, playYellowChime, playRedChime } from '../utils/audioChime';

interface UseTimerOptions {
  thresholds: TimingThresholds;
  singleThreshold?: boolean;
  audioEnabled?: boolean;
  /** Start the timer with an existing elapsed time (in seconds) — e.g. a previously recorded time */
  initialElapsed?: number;
}

interface UseTimerReturn {
  elapsed: number;
  isRunning: boolean;
  color: TimerColor;
  start: () => void;
  pause: () => void;
  stop: () => number;
  reset: () => void;
}

export function useTimer({ thresholds, singleThreshold, audioEnabled = true, initialElapsed = 0 }: UseTimerOptions): UseTimerReturn {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(initialElapsed * 1000);
  const lastColorRef = useRef<TimerColor>(getTimerColor(initialElapsed, thresholds, singleThreshold));

  const color = getTimerColor(elapsed, thresholds, singleThreshold);

  // Play audio cues on color transitions
  useEffect(() => {
    if (!audioEnabled || !isRunning) return;
    if (color !== lastColorRef.current) {
      const prevColor = lastColorRef.current;
      lastColorRef.current = color;

      if (prevColor === 'neutral' && color === 'green') {
        playGreenChime();
      } else if (color === 'yellow') {
        playYellowChime();
      } else if (color === 'red') {
        playRedChime();
      }
    }
  }, [color, audioEnabled, isRunning]);

  const tick = useCallback(() => {
    const now = performance.now();
    const totalMs = accumulatedRef.current + (now - startTimeRef.current);
    setElapsed(Math.floor(totalMs / 1000));
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    startTimeRef.current = performance.now();
    setIsRunning(true);
    intervalRef.current = window.setInterval(tick, 100);
  }, [isRunning, tick]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    accumulatedRef.current += performance.now() - startTimeRef.current;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, [isRunning]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isRunning) {
      accumulatedRef.current += performance.now() - startTimeRef.current;
    }
    const finalElapsed = Math.floor(accumulatedRef.current / 1000);
    setElapsed(finalElapsed);
    setIsRunning(false);
    return finalElapsed;
  }, [isRunning]);

  const reset = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setElapsed(0);
    accumulatedRef.current = 0;
    startTimeRef.current = 0;
    lastColorRef.current = 'neutral';
  }, []);  // Note: reset always goes to 0, not initialElapsed, so the user explicitly clears the recorded time

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { elapsed, isRunning, color, start, pause, stop, reset };
}
