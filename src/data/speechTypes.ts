import { SpeechType } from '../types';

export const speechTypes: SpeechType[] = [
  {
    id: 'round-robin',
    name: 'Round Robin',
    thresholds: { green: 0, yellow: 0, red: 20 },
    singleThreshold: true,
  },
  {
    id: 'table-topics',
    name: 'Table Topics',
    thresholds: { green: 60, yellow: 90, red: 120 },
  },
  {
    id: 'ice-breakers',
    name: 'Ice Breakers',
    thresholds: { green: 120, yellow: 150, red: 180 },
  },
  {
    id: '2nd-speech',
    name: '2nd Speech',
    thresholds: { green: 180, yellow: 240, red: 300 },
  },
  {
    id: 'prepared-speech-evaluators',
    name: 'Prepared Speech Evaluators',
    thresholds: { green: 120, yellow: 150, red: 180 },
  },
  {
    id: 'table-topics-evaluators',
    name: 'Table Topics Evaluators',
    thresholds: { green: 30, yellow: 45, red: 60 },
  },
  {
    id: 'keynote',
    name: 'Keynote',
    thresholds: { green: 1200, yellow: 1500, red: 1680 },
  },
];

export function getSpeechTypeById(id: string): SpeechType | undefined {
  return speechTypes.find((st) => st.id === id);
}
