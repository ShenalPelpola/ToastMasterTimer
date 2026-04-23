export type TimerColor = 'neutral' | 'green' | 'yellow' | 'red' | 'overtime';

export interface TimingThresholds {
  green: number;  // seconds
  yellow: number; // seconds
  red: number;    // seconds
}

export interface SpeechType {
  id: string;
  name: string;
  thresholds: TimingThresholds;
  /** If true, there's no green/yellow phase — just a single red-at-end threshold */
  singleThreshold?: boolean;
}

export interface Speaker {
  id: string;
  name: string;
  speechTypeId: string;
  /** Custom overrides for thresholds (optional) */
  customThresholds?: TimingThresholds;
  /** Elapsed time in seconds when stopped */
  elapsedTime?: number;
  /** The color status when the timer was stopped */
  statusAtStop?: TimerColor;
  /** Whether the speaker has been timed */
  completed: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  speakers: Speaker[];
  createdAt: string;
}
