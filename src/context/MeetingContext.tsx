import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { Meeting, Speaker, TimerColor } from '../types';

interface MeetingContextValue {
  meeting: Meeting | null;
  createMeeting: (title: string) => void;
  addSpeaker: (speaker: Omit<Speaker, 'id' | 'completed'>) => void;
  removeSpeaker: (speakerId: string) => void;
  moveSpeaker: (speakerId: string, direction: 'up' | 'down') => void;
  reorderSpeakers: (fromId: string, toId: string) => void;
  renameSpeaker: (speakerId: string, newName: string) => void;
  recordTime: (speakerId: string, elapsed: number, status: TimerColor) => void;
  resetSpeaker: (speakerId: string) => void;
  clearMeeting: () => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

const STORAGE_KEY = 'toastmaster-meeting';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function loadMeeting(): Meeting | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return null;
}

function saveMeeting(meeting: Meeting | null) {
  if (meeting) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meeting));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [meeting, setMeeting] = useState<Meeting | null>(() => loadMeeting());

  useEffect(() => {
    saveMeeting(meeting);
  }, [meeting]);

  const createMeeting = useCallback((title: string) => {
    const newMeeting: Meeting = {
      id: generateId(),
      title,
      date: new Date().toLocaleDateString(),
      speakers: [],
      createdAt: new Date().toISOString(),
    };
    setMeeting(newMeeting);
  }, []);

  const addSpeaker = useCallback((speaker: Omit<Speaker, 'id' | 'completed'>) => {
    setMeeting((prev) => {
      if (!prev) return prev;
      const newSpeaker: Speaker = {
        ...speaker,
        id: generateId(),
        completed: false,
      };
      return { ...prev, speakers: [...prev.speakers, newSpeaker] };
    });
  }, []);

  const removeSpeaker = useCallback((speakerId: string) => {
    setMeeting((prev) => {
      if (!prev) return prev;
      return { ...prev, speakers: prev.speakers.filter((s) => s.id !== speakerId) };
    });
  }, []);

  const moveSpeaker = useCallback((speakerId: string, direction: 'up' | 'down') => {
    setMeeting((prev) => {
      if (!prev) return prev;
      const idx = prev.speakers.findIndex((s) => s.id === speakerId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.speakers.length) return prev;
      const speakers = [...prev.speakers];
      [speakers[idx], speakers[newIdx]] = [speakers[newIdx], speakers[idx]];
      return { ...prev, speakers };
    });
  }, []);

  const recordTime = useCallback((speakerId: string, elapsed: number, status: TimerColor) => {
    setMeeting((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        speakers: prev.speakers.map((s) =>
          s.id === speakerId
            ? { ...s, elapsedTime: elapsed, statusAtStop: status, completed: true }
            : s
        ),
      };
    });
  }, []);

  const resetSpeaker = useCallback((speakerId: string) => {
    setMeeting((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        speakers: prev.speakers.map((s) =>
          s.id === speakerId
            ? { ...s, elapsedTime: undefined, statusAtStop: undefined, completed: false }
            : s
        ),
      };
    });
  }, []);

  const clearMeeting = useCallback(() => {
    setMeeting(null);
  }, []);

  const reorderSpeakers = useCallback((fromId: string, toId: string) => {
    setMeeting((prev) => {
      if (!prev) return prev;
      const speakers = [...prev.speakers];
      const fromIdx = speakers.findIndex((s) => s.id === fromId);
      const toIdx = speakers.findIndex((s) => s.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const [moved] = speakers.splice(fromIdx, 1);
      speakers.splice(toIdx, 0, moved);
      return { ...prev, speakers };
    });
  }, []);

  const renameSpeaker = useCallback((speakerId: string, newName: string) => {
    setMeeting((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        speakers: prev.speakers.map((s) =>
          s.id === speakerId ? { ...s, name: newName.trim() } : s
        ),
      };
    });
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        meeting,
        createMeeting,
        addSpeaker,
        removeSpeaker,
        moveSpeaker,
        reorderSpeakers,
        renameSpeaker,
        recordTime,
        resetSpeaker,
        clearMeeting,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeeting must be used within MeetingProvider');
  return ctx;
}
