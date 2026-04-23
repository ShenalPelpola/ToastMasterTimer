import { TimerColor, TimingThresholds } from '../types';

/**
 * Determine the timer color based on elapsed seconds and thresholds.
 * - neutral: before green threshold
 * - green: elapsed >= green, < yellow
 * - yellow: elapsed >= yellow, < red
 * - red: elapsed >= red
 * - overtime: elapsed > red (used for pulsing effect — same as red but past threshold)
 *
 * For singleThreshold types (e.g., Round Robin): neutral until red, then red.
 */
export function getTimerColor(
  elapsedSeconds: number,
  thresholds: TimingThresholds,
  singleThreshold?: boolean
): TimerColor {
  if (singleThreshold) {
    if (elapsedSeconds >= thresholds.red) return 'red';
    return 'neutral';
  }

  if (elapsedSeconds >= thresholds.red) return 'red';
  if (elapsedSeconds >= thresholds.yellow) return 'yellow';
  if (elapsedSeconds >= thresholds.green) return 'green';
  return 'neutral';
}

export const colorToBg: Record<TimerColor, string> = {
  neutral: '#0A0A0F',
  green: '#059669',
  yellow: '#D97706',
  red: '#DC2626',
  overtime: '#991B1B',
};

export const colorToLabel: Record<TimerColor, string> = {
  neutral: '',
  green: 'Green',
  yellow: 'Yellow',
  red: 'Red',
  overtime: 'Over Time',
};
