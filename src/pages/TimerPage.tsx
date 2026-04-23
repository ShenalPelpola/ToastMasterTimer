import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { getSpeechTypeById } from '../data/speechTypes';
import { useTimer } from '../hooks/useTimer';
import { formatTime, formatTimeVerbose } from '../utils/formatTime';
import { colorToBg } from '../utils/getTimerColor';
import { TimingThresholds } from '../types';

export default function TimerPage() {
  const { speakerId } = useParams<{ speakerId: string }>();
  const navigate = useNavigate();
  const { meeting, recordTime } = useMeeting();

  const [controlsVisible, setControlsVisible] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const hideTimeoutRef = useRef<number | null>(null);

  const speaker = meeting?.speakers.find((s) => s.id === speakerId);
  const speechType = speaker ? getSpeechTypeById(speaker.speechTypeId) : undefined;
  const thresholds: TimingThresholds = speaker?.customThresholds ?? speechType?.thresholds ?? { green: 60, yellow: 90, red: 120 };

  const { elapsed, isRunning, color, start, pause, stop, reset } = useTimer({
    thresholds,
    singleThreshold: speechType?.singleThreshold,
    audioEnabled,
    initialElapsed: speaker?.elapsedTime ?? 0,
  });

  // Auto-hide controls after 3s when timer is running
  const scheduleHide = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setControlsVisible(true);
    hideTimeoutRef.current = window.setTimeout(() => {
      if (isRunning) setControlsVisible(false);
    }, 3000);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      scheduleHide();
    } else {
      setControlsVisible(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    }
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isRunning, scheduleHide]);

  // Show controls on mouse move / touch
  useEffect(() => {
    const handler = () => scheduleHide();
    window.addEventListener('mousemove', handler);
    window.addEventListener('touchstart', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [scheduleHide]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        isRunning ? pause() : start();
      } else if (e.code === 'Escape') {
        handleStop();
      } else if (e.code === 'KeyR' && !isRunning) {
        reset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (!speaker || !speechType || !meeting) {
    navigate('/meeting');
    return null;
  }

  const handleStop = () => {
    const finalElapsed = stop();
    recordTime(speaker.id, finalElapsed, color);
    navigate('/meeting');
  };

  const handleNext = () => {
    const finalElapsed = stop();
    recordTime(speaker.id, finalElapsed, color);

    // Find next incomplete speaker
    const currentIdx = meeting.speakers.findIndex((s) => s.id === speaker.id);
    const next = meeting.speakers.find((s, i) => i > currentIdx && !s.completed);
    if (next) {
      navigate(`/meeting/timer/${next.id}`);
    } else {
      navigate('/meeting');
    }
  };

  // Determine background color
  const bgColor = colorToBg[color] ?? colorToBg.neutral;
  const isOvertime = color === 'red' && elapsed > thresholds.red;

  // Threshold indicators
  const thresholdMarkers = speechType.singleThreshold
    ? [{ label: 'Max', time: thresholds.red, color: '#EF4444' }]
    : [
        { label: 'Green', time: thresholds.green, color: '#10B981' },
        { label: 'Yellow', time: thresholds.yellow, color: '#F59E0B' },
        { label: 'Red', time: thresholds.red, color: '#EF4444' },
      ];

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center timer-bg-transition select-none ${
        isOvertime ? 'animate-overtime-flash' : ''
      }`}
      style={{ backgroundColor: bgColor }}
      onClick={() => scheduleHide()}
    >
      {/* Noise texture overlay for depth */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Top bar — speaker info */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 flex items-start justify-between transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-body drop-shadow-lg">
            {speaker.name}
          </h1>
          <p className="text-white/60 text-sm md:text-base font-body mt-0.5">
            {speechType.name}
          </p>
        </div>
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          title={audioEnabled ? 'Mute audio cues' : 'Enable audio cues'}
        >
          {audioEnabled ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8H4a1 1 0 00-1 1v6a1 1 0 001 1h2.5l4.5 4V4L6.5 8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      </div>

      {/* Central timer display */}
      <div className="flex flex-col items-center z-10">
        {/* Timer digits */}
        <div className={`font-timer text-[12rem] md:text-[16rem] lg:text-[20rem] leading-none text-white drop-shadow-2xl ${
          isRunning ? 'animate-tick' : ''
        }`}>
          {formatTime(elapsed)}
        </div>

        {/* Threshold bar */}
        <div className="flex items-center gap-4 md:gap-6 mt-4">
          {thresholdMarkers.map((m) => (
            <div key={m.label} className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  elapsed >= m.time ? 'scale-125 shadow-lg' : 'opacity-40'
                }`}
                style={{ backgroundColor: m.color, boxShadow: elapsed >= m.time ? `0 0 8px ${m.color}` : 'none' }}
              />
              <span className="text-white/50 text-xs md:text-sm font-body">
                {m.label} {formatTimeVerbose(m.time)}
              </span>
            </div>
          ))}
        </div>

        {/* Overtime indicator */}
        {isOvertime && (
          <div className="mt-6 px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <p className="text-white font-bold font-body text-lg tracking-wider animate-pulse-slow">
              OVER TIME +{formatTimeVerbose(elapsed - thresholds.red)}
            </p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-center justify-center gap-4 transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Reset (only when paused) */}
        {!isRunning && elapsed > 0 && (
          <button
            onClick={() => reset()}
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
            title="Reset (R)"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* Start / Pause */}
        <button
          onClick={isRunning ? pause : start}
          className="p-6 rounded-3xl bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-sm shadow-2xl hover:scale-105 active:scale-95"
          title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
        >
          {isRunning ? (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14.12a1 1 0 001.5.86l11-7.06a1 1 0 000-1.72l-11-7.06A1 1 0 008 5.14z" />
            </svg>
          )}
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          className="p-4 rounded-2xl bg-white/10 hover:bg-red-500/30 text-white transition-all backdrop-blur-sm"
          title="Stop (Esc)"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>

        {/* Next Speaker */}
        <button
          onClick={handleNext}
          className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
          title="Stop & Next Speaker"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5.14v14.12a1 1 0 001.5.86l9-5.78V19a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1h-1a1 1 0 00-1 1v4.66l-9-5.78A1 1 0 005 5.14z" />
          </svg>
        </button>
      </div>

      {/* Keyboard shortcut hints */}
      <div
        className={`absolute bottom-0 left-0 p-4 transition-opacity duration-500 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex gap-3 text-white/20 text-xs font-body">
          <span>Space: Start/Pause</span>
          <span>Esc: Stop</span>
          <span>R: Reset</span>
        </div>
      </div>
    </div>
  );
}
