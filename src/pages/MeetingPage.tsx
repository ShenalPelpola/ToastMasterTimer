import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { speechTypes, getSpeechTypeById } from '../data/speechTypes';
import { formatTime, formatTimeVerbose } from '../utils/formatTime';
import { Speaker } from '../types';

export default function MeetingPage() {
  const navigate = useNavigate();
  const { meeting, addSpeaker, reorderSpeakers } = useMeeting();
  const [showAddForm, setShowAddForm] = useState(false);
  const [speakerName, setSpeakerName] = useState('');
  const [speechTypeId, setSpeechTypeId] = useState(speechTypes[0].id);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  if (!meeting) {
    navigate('/setup');
    return null;
  }

  const completedCount = meeting.speakers.filter((s) => s.completed).length;
  const totalElapsed = meeting.speakers.reduce((sum, s) => sum + (s.elapsedTime ?? 0), 0);

  // Group speakers by speech type, preserving insertion order within each group
  const groupedSpeakers = useMemo(() => {
    const groups: { speechTypeId: string; name: string; speakers: Speaker[] }[] = [];
    const groupMap = new Map<string, Speaker[]>();

    for (const speaker of meeting.speakers) {
      if (!groupMap.has(speaker.speechTypeId)) {
        const arr: Speaker[] = [];
        groupMap.set(speaker.speechTypeId, arr);
        const st = getSpeechTypeById(speaker.speechTypeId);
        groups.push({ speechTypeId: speaker.speechTypeId, name: st?.name ?? speaker.speechTypeId, speakers: arr });
      }
      groupMap.get(speaker.speechTypeId)!.push(speaker);
    }
    return groups;
  }, [meeting.speakers]);

  const handleAddSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!speakerName.trim()) return;
    addSpeaker({ name: speakerName.trim(), speechTypeId });
    setSpeakerName('');
    setShowAddForm(false);
  };

  const handleTimerClick = (speakerId: string) => {
    navigate(`/meeting/timer/${speakerId}`);
  };

  const statusDot = (speaker: typeof meeting.speakers[0]) => {
    if (!speaker.completed) {
      return <div className="w-2.5 h-2.5 rounded-full bg-gray-600 border border-gray-500" />;
    }
    const colors: Record<string, string> = {
      green: 'bg-timer-green',
      yellow: 'bg-timer-yellow',
      red: 'bg-timer-red',
      neutral: 'bg-gray-400',
    };
    return (
      <div className={`w-2.5 h-2.5 rounded-full ${colors[speaker.statusAtStop ?? 'neutral'] ?? 'bg-gray-400'}`} />
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar / Speaker Queue */}
      <div className="lg:w-96 bg-surface-800 border-r border-surface-600/30 p-6 lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/setup')}
              className="text-gray-500 hover:text-gray-300 text-sm font-body mb-3 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Setup
            </button>
            <h1 className="text-xl font-bold text-white font-body">{meeting.title}</h1>
            <p className="text-sm text-gray-500 font-body mt-0.5">{meeting.date}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-surface-700 rounded-xl p-3 text-center">
              <p className="font-timer text-2xl text-white">{completedCount}/{meeting.speakers.length}</p>
              <p className="text-xs text-gray-500 font-body">Completed</p>
            </div>
            <div className="bg-surface-700 rounded-xl p-3 text-center">
              <p className="font-timer text-2xl text-white">{formatTime(totalElapsed)}</p>
              <p className="text-xs text-gray-500 font-body">Total Time</p>
            </div>
          </div>

          {/* Speaker List — Grouped by Speech Type */}
          <div className="space-y-5 mb-6">
            {groupedSpeakers.map((group) => {
              const st = getSpeechTypeById(group.speechTypeId);
              const groupCompleted = group.speakers.filter((s) => s.completed).length;
              const groupTotalElapsed = group.speakers.reduce((sum, s) => sum + (s.elapsedTime ?? 0), 0);
              return (
                <div key={group.speechTypeId}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-gray-400 font-body tracking-widest uppercase">
                        {group.name}
                      </h3>
                      <span className="text-[10px] text-gray-600 font-body">
                        {st && !st.singleThreshold
                          ? `${formatTimeVerbose(st.thresholds.green)} / ${formatTimeVerbose(st.thresholds.yellow)} / ${formatTimeVerbose(st.thresholds.red)}`
                          : st ? `Max: ${formatTimeVerbose(st.thresholds.red)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {groupTotalElapsed > 0 && (
                        <span className="font-timer text-sm text-gray-400">{formatTime(groupTotalElapsed)}</span>
                      )}
                      <span className="text-[10px] text-gray-600 font-body">
                        {groupCompleted}/{group.speakers.length}
                      </span>
                    </div>
                  </div>
                  {/* Speakers in this category */}
                  <div className="space-y-1">
                    {group.speakers.map((speaker) => (
                      <div
                        key={speaker.id}
                        draggable
                        onDragStart={(e) => {
                          dragIdRef.current = speaker.id;
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragIdRef.current !== speaker.id) setDragOverId(speaker.id);
                        }}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragIdRef.current && dragIdRef.current !== speaker.id) {
                            reorderSpeakers(dragIdRef.current, speaker.id);
                          }
                          dragIdRef.current = null;
                          setDragOverId(null);
                        }}
                        onDragEnd={() => {
                          dragIdRef.current = null;
                          setDragOverId(null);
                        }}
                        className={`group flex items-center gap-2 rounded-xl transition-all duration-150 ${
                          dragOverId === speaker.id
                            ? 'ring-2 ring-timer-green/50 ring-offset-1 ring-offset-surface-800'
                            : ''
                        }`}
                      >
                        {/* Drag handle */}
                        <div className="cursor-grab active:cursor-grabbing pl-1 py-3 text-gray-600 hover:text-gray-400 transition-colors shrink-0 touch-none">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="9" cy="7" r="1.5" /><circle cx="15" cy="7" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                            <circle cx="9" cy="17" r="1.5" /><circle cx="15" cy="17" r="1.5" />
                          </svg>
                        </div>
                        <button
                          onClick={() => handleTimerClick(speaker.id)}
                          className={`flex-1 text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                            speaker.completed
                              ? 'bg-surface-900/50 hover:bg-surface-700/50'
                              : 'bg-surface-700/50 hover:bg-surface-600/70'
                          }`}
                        >
                          {statusDot(speaker)}
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium font-body truncate text-sm ${speaker.completed ? 'text-gray-400' : 'text-white'}`}>
                              {speaker.name}
                            </p>
                          </div>
                          {speaker.completed && speaker.elapsedTime != null ? (
                            <span className="font-timer text-lg text-gray-400">{formatTime(speaker.elapsedTime)}</span>
                          ) : (
                            <svg className="w-4 h-4 text-gray-600 group-hover:text-timer-green transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Speaker On-the-fly */}
          {showAddForm ? (
            <form onSubmit={handleAddSpeaker} className="animate-slide-up bg-surface-700 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="Speaker name"
                className="w-full bg-surface-900 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-timer-green transition-all font-body"
                autoFocus
              />
              <select
                value={speechTypeId}
                onChange={(e) => setSpeechTypeId(e.target.value)}
                className="w-full bg-surface-900 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-timer-green transition-all font-body appearance-none"
              >
                {speechTypes.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!speakerName.trim()}
                  className="flex-1 bg-timer-green hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-all font-body"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setSpeakerName(''); }}
                  className="px-4 bg-surface-600 hover:bg-surface-700 text-gray-300 text-sm font-medium py-2 rounded-lg transition-all font-body"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full border border-dashed border-surface-600 hover:border-timer-green/50 text-gray-500 hover:text-timer-green rounded-xl py-3 text-sm font-body transition-all duration-200"
            >
              + Add Speaker
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="animate-fade-in text-center max-w-lg">
          <div className="w-20 h-20 rounded-full bg-surface-800 border border-surface-600/50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-timer-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white font-body mb-2">Ready to Time</h2>
          <p className="text-gray-500 font-body mb-8">
            Select a speaker from the list to start their timer.
            {meeting.speakers.filter((s) => !s.completed).length === 0 && meeting.speakers.length > 0 && (
              <span className="block mt-2 text-timer-green">All speakers completed!</span>
            )}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {meeting.speakers.some((s) => s.completed) && (
              <button
                onClick={() => navigate('/results')}
                className="bg-surface-700 hover:bg-surface-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 font-body border border-surface-600/50"
              >
                View Results
              </button>
            )}
          </div>

          {/* Timing Reference */}
          <div className="mt-12">
            <h3 className="text-sm text-gray-500 font-body tracking-widest uppercase mb-4">Timing Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {speechTypes.map((st) => (
                <div key={st.id} className="bg-surface-800 rounded-lg p-3 border border-surface-600/20">
                  <p className="text-white text-sm font-medium font-body">{st.name}</p>
                  <p className="text-gray-500 text-xs font-body mt-0.5">
                    {st.singleThreshold
                      ? `Max: ${formatTimeVerbose(st.thresholds.red)}`
                      : `${formatTimeVerbose(st.thresholds.green)} / ${formatTimeVerbose(st.thresholds.yellow)} / ${formatTimeVerbose(st.thresholds.red)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
