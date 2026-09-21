import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import Compare from './pages/Compare';
import Effects from './pages/Effects';
import Signals from './pages/Signals';
import Settings from './pages/Settings';
import Theory from './pages/Theory';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/effects" element={<Effects />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
