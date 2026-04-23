import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { speechTypes } from '../data/speechTypes';
import { formatTimeVerbose } from '../utils/formatTime';

export default function SetupPage() {
  const navigate = useNavigate();
  const { meeting, createMeeting, addSpeaker, removeSpeaker, moveSpeaker, reorderSpeakers } = useMeeting();

  const [meetingTitle, setMeetingTitle] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speechTypeId, setSpeechTypeId] = useState(speechTypes[0].id);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const handleCreateMeeting = () => {
    if (!meetingTitle.trim()) return;
    createMeeting(meetingTitle.trim());
    setMeetingTitle('');
  };

  const handleAddSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!speakerName.trim()) return;
    addSpeaker({ name: speakerName.trim(), speechTypeId });
    setSpeakerName('');
    // keep speechTypeId so the user can quickly add more to the same category
  };

  // Unique names already in the list for autocomplete
  const existingNames = useMemo(() => {
    if (!meeting) return [];
    return [...new Set(meeting.speakers.map((s) => s.name))];
  }, [meeting?.speakers]);

  // Group speakers by speech type for the list view
  const groupedSpeakers = useMemo(() => {
    if (!meeting) return [];
    const groups: { speechTypeId: string; label: string; indices: number[] }[] = [];
    const seen = new Map<string, number>();
    meeting.speakers.forEach((speaker, idx) => {
      if (!seen.has(speaker.speechTypeId)) {
        const st = speechTypes.find((t) => t.id === speaker.speechTypeId);
        seen.set(speaker.speechTypeId, groups.length);
        groups.push({ speechTypeId: speaker.speechTypeId, label: st?.name ?? speaker.speechTypeId, indices: [] });
      }
      groups[seen.get(speaker.speechTypeId)!].indices.push(idx);
    });
    return groups;
  }, [meeting?.speakers]);

  const handleStartMeeting = () => {
    if (meeting && meeting.speakers.length > 0) {
      navigate('/meeting');
    }
  };

  // If no meeting exists, show the create meeting form
  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-fade-in w-full max-w-md">
          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <h1 className="font-timer text-6xl text-timer-green tracking-wider">TM</h1>
            <p className="text-sm text-gray-400 mt-1 font-body tracking-widest uppercase">
              Toastmaster Timer
            </p>
          </div>

          {/* Create Meeting Card */}
          <div className="bg-surface-800 rounded-2xl p-8 border border-surface-600/50 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-6 font-body">
              New Meeting
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-body">Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateMeeting()}
                  placeholder="e.g. Weekly Toastmasters Meeting"
                  className="w-full bg-surface-700 border border-surface-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-timer-green focus:ring-1 focus:ring-timer-green/30 transition-all font-body"
                  autoFocus
                />
              </div>
              <button
                onClick={handleCreateMeeting}
                disabled={!meetingTitle.trim()}
                className="w-full bg-timer-green hover:bg-emerald-600 disabled:bg-surface-600 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 font-body tracking-wide"
              >
                Create Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Meeting exists — show speaker management
  const selectedType = speechTypes.find((st) => st.id === speechTypeId);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-timer-green animate-pulse-slow" />
          <p className="text-sm text-gray-400 font-body tracking-widest uppercase">Meeting Setup</p>
        </div>
        <h1 className="text-3xl font-bold text-white font-body">{meeting.title}</h1>
        <p className="text-sm text-gray-500 mt-1 font-body">{meeting.date}</p>
      </div>

      {/* Add Speaker Form */}
      <form onSubmit={handleAddSpeaker} className="animate-slide-up bg-surface-800 rounded-2xl p-6 border border-surface-600/50 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 font-body">Add Speaker</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5 font-body">Speaker Name</label>
            <input
              type="text"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Speaker name"
              list="existing-names"
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-timer-green focus:ring-1 focus:ring-timer-green/30 transition-all font-body"
            />
            <datalist id="existing-names">
              {existingNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5 font-body">Speech Type</label>
            <select
              value={speechTypeId}
              onChange={(e) => setSpeechTypeId(e.target.value)}
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-timer-green focus:ring-1 focus:ring-timer-green/30 transition-all font-body appearance-none cursor-pointer"
            >
              {speechTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Show thresholds for selected type */}
        {selectedType && (
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-body">
            <span className="text-gray-500">Timing:</span>
            {selectedType.singleThreshold ? (
              <span className="px-3 py-1 rounded-full bg-surface-600 text-gray-300 border border-surface-600/80">
                Up to {formatTimeVerbose(selectedType.thresholds.red)}
              </span>
            ) : (
              <>
                <span className="px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/30">
                  Green {formatTimeVerbose(selectedType.thresholds.green)}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800/30">
                  Yellow {formatTimeVerbose(selectedType.thresholds.yellow)}
                </span>
                <span className="px-3 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-800/30">
                  Red {formatTimeVerbose(selectedType.thresholds.red)}
                </span>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!speakerName.trim()}
          className="w-full sm:w-auto bg-surface-600 hover:bg-surface-700 disabled:opacity-40 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200 font-body border border-surface-600/80"
        >
          + Add Speaker
        </button>
      </form>

      {/* Speaker List — grouped by speech type */}
      {meeting.speakers.length > 0 && (
        <div className="animate-slide-up space-y-5 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-400 font-body tracking-widest uppercase">
              Speakers ({meeting.speakers.length})
            </h3>
            <span className="text-xs text-gray-600 font-body">Same person can appear in multiple sections</span>
          </div>
          {groupedSpeakers.map((group) => (
            <div key={group.speechTypeId}>
              {/* Category label */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <h4 className="text-xs font-semibold text-gray-400 font-body tracking-widest uppercase">{group.label}</h4>
                <span className="text-[10px] text-gray-600 font-body">{group.indices.length} speaker{group.indices.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-1.5">
                {group.indices.map((idx) => {
                  const speaker = meeting.speakers[idx];
                  const sessionsCount = meeting.speakers.filter((s) => s.name === speaker.name).length;
                  return (
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
                      className={`bg-surface-800 rounded-xl border transition-all flex items-center gap-1 group ${
                        dragOverId === speaker.id
                          ? 'border-timer-green/50 ring-2 ring-timer-green/30'
                          : 'border-surface-600/30 hover:border-surface-600'
                      }`}
                    >
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing px-2 py-4 text-gray-600 hover:text-gray-400 transition-colors shrink-0 touch-none">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="7" r="1.5" /><circle cx="15" cy="7" r="1.5" />
                          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                          <circle cx="9" cy="17" r="1.5" /><circle cx="15" cy="17" r="1.5" />
                        </svg>
                      </div>
                      <div className="flex-1 flex items-center justify-between py-3 pr-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-white font-medium font-body text-sm truncate">{speaker.name}</p>
                          {sessionsCount > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 font-body shrink-0">
                              {sessionsCount} sessions
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                          <button
                            onClick={() => moveSpeaker(speaker.id, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg hover:bg-surface-600 disabled:opacity-20 text-gray-400 transition-all"
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveSpeaker(speaker.id, 'down')}
                            disabled={idx === meeting.speakers.length - 1}
                            className="p-1.5 rounded-lg hover:bg-surface-600 disabled:opacity-20 text-gray-400 transition-all"
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeSpeaker(speaker.id)}
                            className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-all"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Meeting Button */}
      <button
        onClick={handleStartMeeting}
        disabled={meeting.speakers.length === 0}
        className="w-full bg-timer-green hover:bg-emerald-600 disabled:bg-surface-600 disabled:text-gray-500 text-white text-lg font-bold py-4 rounded-2xl transition-all duration-200 font-body tracking-wide shadow-lg shadow-emerald-900/20"
      >
        Start Meeting →
      </button>
    </div>
  );
}
