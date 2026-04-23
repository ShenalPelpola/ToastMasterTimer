import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { getSpeechTypeById } from '../data/speechTypes';
import { formatTime } from '../utils/formatTime';
import { exportToExcel } from '../utils/exportToExcel';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { meeting, clearMeeting, resetSpeaker } = useMeeting();

  if (!meeting) {
    navigate('/setup');
    return null;
  }

  const completedSpeakers = meeting.speakers.filter((s) => s.completed);

  const statusBadge = (status: string | undefined) => {
    const styles: Record<string, string> = {
      green: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30',
      yellow: 'bg-amber-900/30 text-amber-400 border-amber-800/30',
      red: 'bg-red-900/30 text-red-400 border-red-800/30',
    };
    const style = styles[status ?? ''] ?? 'bg-gray-800 text-gray-400 border-gray-700';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} capitalize font-body`}>
        {status ?? '—'}
      </span>
    );
  };

  const handleNewMeeting = () => {
    clearMeeting();
    navigate('/setup');
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-8">
        <button
          onClick={() => navigate('/meeting')}
          className="text-gray-500 hover:text-gray-300 text-sm font-body mb-3 flex items-center gap-1 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Meeting
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-body">Results</h1>
            <p className="text-gray-500 text-sm font-body mt-1">
              {meeting.title} — {meeting.date}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportToExcel(meeting)}
              className="bg-timer-green hover:bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-200 font-body flex items-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
            <button
              onClick={handleNewMeeting}
              className="bg-surface-700 hover:bg-surface-600 text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-200 font-body border border-surface-600/50"
            >
              New Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="animate-slide-up grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-surface-800 rounded-xl p-4 border border-surface-600/30 text-center">
          <p className="font-timer text-3xl text-white">{meeting.speakers.length}</p>
          <p className="text-xs text-gray-500 font-body mt-1">Total Speakers</p>
        </div>
        <div className="bg-surface-800 rounded-xl p-4 border border-surface-600/30 text-center">
          <p className="font-timer text-3xl text-timer-green">{completedSpeakers.length}</p>
          <p className="text-xs text-gray-500 font-body mt-1">Completed</p>
        </div>
        <div className="bg-surface-800 rounded-xl p-4 border border-surface-600/30 text-center">
          <p className="font-timer text-3xl text-white">
            {formatTime(completedSpeakers.reduce((sum, s) => sum + (s.elapsedTime ?? 0), 0))}
          </p>
          <p className="text-xs text-gray-500 font-body mt-1">Total Time</p>
        </div>
        <div className="bg-surface-800 rounded-xl p-4 border border-surface-600/30 text-center">
          <p className="font-timer text-3xl text-white">
            {completedSpeakers.length > 0
              ? formatTime(Math.round(completedSpeakers.reduce((sum, s) => sum + (s.elapsedTime ?? 0), 0) / completedSpeakers.length))
              : '—'}
          </p>
          <p className="text-xs text-gray-500 font-body mt-1">Avg Time</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="animate-slide-up bg-surface-800 rounded-2xl border border-surface-600/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-600/30">
                <th className="text-left py-3.5 px-5 text-xs text-gray-500 font-medium font-body tracking-widest uppercase">#</th>
                <th className="text-left py-3.5 px-5 text-xs text-gray-500 font-medium font-body tracking-widest uppercase">Speaker</th>
                <th className="text-left py-3.5 px-5 text-xs text-gray-500 font-medium font-body tracking-widest uppercase">Speech Type</th>
                <th className="text-left py-3.5 px-5 text-xs text-gray-500 font-medium font-body tracking-widest uppercase">Time</th>
                <th className="text-left py-3.5 px-5 text-xs text-gray-500 font-medium font-body tracking-widest uppercase">Status</th>
                <th className="text-right py-3.5 px-5 text-xs text-gray-500 font-medium font-body tracking-widest uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {meeting.speakers.map((speaker, idx) => {
                const st = getSpeechTypeById(speaker.speechTypeId);
                return (
                  <tr key={speaker.id} className="border-b border-surface-600/10 hover:bg-surface-700/30 transition-colors">
                    <td className="py-3.5 px-5 text-sm text-gray-500 font-body">{idx + 1}</td>
                    <td className="py-3.5 px-5">
                      <p className="text-white font-medium font-body">{speaker.name}</p>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-gray-400 font-body">{st?.name}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-timer text-xl text-white">
                        {speaker.elapsedTime != null ? formatTime(speaker.elapsedTime) : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">{speaker.completed ? statusBadge(speaker.statusAtStop) : statusBadge(undefined)}</td>
                    <td className="py-3.5 px-5 text-right">
                      {speaker.completed && (
                        <button
                          onClick={() => resetSpeaker(speaker.id)}
                          className="text-gray-500 hover:text-gray-300 text-xs font-body transition-colors"
                        >
                          Re-time
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
