import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import Player from './pages/Player';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import { Toaster } from './components/ui/toaster';
import TestXtreamAccount from './pages/TestXtreamAccount';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account" element={<Account />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/player" element={<Player />} />
        <Route path="/test-xtream" element={<TestXtreamAccount />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
