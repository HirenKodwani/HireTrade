import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import HeroSection from '../components/dashboard/HeroSection';
import StatsCards from '../components/dashboard/StatsCards';
import TopAIPicks from '../components/dashboard/TopAIPicks';
import MarketWidgets from '../components/dashboard/MarketWidgets';

export default function Home() {
  const [ipos, setIpos] = useState([]);
  const [news, setNews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [iposRes, newsRes, analyticsRes] = await Promise.all([
          api.get('/ipos'),
          api.get('/news'),
          api.get('/analytics'),
        ]);
        setIpos(iposRes.data);
        setNews(newsRes.data || []);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const acceptedIpos = ipos.filter(i => i.decision === 'ACCEPTED');
  const rejectedIpos = ipos.filter(i => i.decision === 'REJECTED');

  const avgGmp = ipos.filter(i => i.gmp).length
    ? (ipos.reduce((a, i) => a + (i.gmp || 0), 0) / ipos.filter(i => i.gmp).length).toFixed(1)
    : '--';

  const avgListingGain = analytics?.closed_trades
    ? analytics?.win_rate || '--'
    : '--';

  const stats = [
    { label: 'Active IPOs', value: ipos.length.toString(), icon: 'Activity', color: 'from-primary/80 to-primary' },
    { label: 'Avg GMP', value: avgGmp === '--' ? '--' : `₹${avgGmp}`, icon: 'TrendingUp', color: 'from-accent/80 to-accent' },
    { label: 'Accepted IPOs', value: acceptedIpos.length.toString(), icon: 'Target', color: 'from-primary to-orange-600' },
    { label: 'Avg Listing Gain', value: `${avgListingGain}%`, icon: 'LineChart', color: 'from-accent to-yellow-600' },
  ];

  return (
    <div className="space-y-8">
      <HeroSection stats={{ activeIpos: ipos.length }} />
      
      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopAIPicks ipos={ipos} />
        </div>
        <div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-dark-border">
                <span className="text-sm text-gray-400">Total IPOs</span>
                <span className="text-white font-semibold">{ipos.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-border">
                <span className="text-sm text-gray-400">Accepted</span>
                <span className="text-accent font-semibold">{acceptedIpos.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-border">
                <span className="text-sm text-gray-400">Rejected</span>
                <span className="text-danger font-semibold">{rejectedIpos.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-border">
                <span className="text-sm text-gray-400">Needs Review</span>
                <span className="text-yellow-400 font-semibold">{ipos.filter(i => i.decision === 'NEEDS_REVIEW').length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Sim. P&L</span>
                <span className="text-accent font-semibold">₹{analytics?.total_pnl?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarketWidgets ipos={ipos} news={news} />
    </div>
  );
}
