
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Player from '@/pages/Player';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/player" element={<Player />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
