import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip';
import Sidebar, { Header } from './components/layout/Sidebar';
import Home from './pages/Home';
import LiveIPOs from './pages/LiveIPOs';
import UpcomingIPOs from './pages/UpcomingIPOs';
import ListedIPOs from './pages/ListedIPOs';
import IPODetails from './pages/IPODetails';
import AIRecommendations from './pages/IPORecommendations';
import GMPTracker from './pages/GMPTracker';
import SubscriptionTracker from './pages/SubscriptionTracker';
import AllotmentCenter from './pages/AllotmentCenter';
import IPONews from './pages/News';
import Portfolio from './pages/Portfolio';
import SettingsPage from './pages/Settings';
import AIPerformance from './pages/AIPerformance';
import IPOCopilot from './pages/IPOCopilot';
import PlaceholderPage from './pages/PlaceholderPage';
import MarketTrackers from './pages/MarketTrackers';
import AIHub from './pages/AIHub';
import LiveData from './pages/LiveData';

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Router>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-dark-bg">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          <div className="flex-1 flex flex-col min-w-0">
            <Header setMobileOpen={setMobileOpen} />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/live-ipos" element={<LiveIPOs />} />
                <Route path="/upcoming-ipos" element={<UpcomingIPOs />} />
                <Route path="/listed-ipos" element={<ListedIPOs />} />
                <Route path="/ipos/:id" element={<IPODetails />} />
                <Route path="/ai-recommendations" element={<AIRecommendations />} />
                <Route path="/gmp-tracker" element={<GMPTracker />} />
                <Route path="/subscription-tracker" element={<SubscriptionTracker />} />
                <Route path="/allotment-center" element={<AllotmentCenter />} />
                <Route path="/ipo-news" element={<IPONews />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/ai-performance" element={<AIPerformance />} />
                <Route path="/ipo-copilot" element={<IPOCopilot />} />
                
                <Route path="/orders" element={<PlaceholderPage title="Orders" />} />
                <Route path="/live-data" element={<LiveData />} />
                <Route path="/market-trackers" element={<MarketTrackers />} />
                <Route path="/ai-hub" element={<AIHub />} />
              </Routes>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </Router>
  );
}

export default App;
