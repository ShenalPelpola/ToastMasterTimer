import { Routes, Route, Navigate } from 'react-router-dom';
import { MeetingProvider } from './context/MeetingContext';
import SetupPage from './pages/SetupPage';
import MeetingPage from './pages/MeetingPage';
import TimerPage from './pages/TimerPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <MeetingProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/meeting" element={<MeetingPage />} />
        <Route path="/meeting/timer/:speakerId" element={<TimerPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </MeetingProvider>
  );
}
