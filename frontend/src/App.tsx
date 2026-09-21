import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import Signals from './pages/Signals';
import Effects from './pages/Effects';
import Compare from './pages/Compare';
import Theory from './pages/Theory';
import Settings from './pages/Settings';
import OriginalWorkstation from './App.jsx';
import { AudioPlayerProvider } from './hooks/useAudioPlayer';
import { useAudioStore } from './store/useAudioStore';

function Workspace() {
  const initialize = useAudioStore((state) => state.initialize);
  useEffect(() => { void initialize(); }, [initialize]);
  return <AudioPlayerProvider><AppShell><Outlet /></AppShell></AudioPlayerProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Workspace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/effects" element={<Effects />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<div><h1>Page not found</h1><a href="/">Return to Dashboard</a></div>} />
        </Route>
        <Route path="/workstation" element={<><a className="block p-3 text-center text-sm underline" href="/studio">Return to Studio</a><OriginalWorkstation /></>} />
      </Routes>
    </BrowserRouter>
  );
}
