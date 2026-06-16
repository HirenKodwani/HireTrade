import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import api from '../api';

export default function AIPerformance() {
  const [analytics, setAnalytics] = useState(null);
  const [ipos, setIpos] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/analytics'),
      api.get('/ipos'),
    ]).then(([a, i]) => {
      setAnalytics(a.data);
      setIpos(i.data);
    }).catch(console.error);
  }, []);

  const acceptedIpos = ipos.filter(i => i.decision === 'ACCEPTED');
  const rejectedIpos = ipos.filter(i => i.decision === 'REJECTED');
  const totalDecided = acceptedIpos.length + rejectedIpos.length;
  const accuracy = totalDecided > 0 ? ((acceptedIpos.length / totalDecided) * 100) : 0;
  const avgError = 0; // Would need actual vs predicted data

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">AI Performance</h1>
        </div>
        <p className="text-sm text-gray-400">Track the accuracy and performance of AI predictions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-gray-500 uppercase mb-1">Accuracy</p>
          <p className="text-3xl font-bold text-accent">{accuracy.toFixed(0)}%</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-500 uppercase mb-1">Avg Error</p>
          <p className="text-3xl font-bold text-white">{avgError.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-500 uppercase mb-1">Accepted Success</p>
          <p className="text-3xl font-bold text-primary">{acceptedIpos.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-500 uppercase mb-1">Rejected Avoided</p>
          <p className="text-3xl font-bold text-yellow-400">{rejectedIpos.length}</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> AI Credibility Score
        </h2>
        <div className="text-center py-8">
          <p className="text-6xl font-bold text-primary mb-2">{accuracy.toFixed(0)}%</p>
          <p className="text-gray-400">Overall Prediction Accuracy</p>
          <Progress value={accuracy} className="h-3 mt-4 max-w-md mx-auto" indicatorClass="bg-gradient-to-r from-primary to-accent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Decision Distribution</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <span className="text-sm text-gray-300">Accepted</span>
              <span className="text-accent font-semibold">{acceptedIpos.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <span className="text-sm text-gray-300">Rejected</span>
              <span className="text-danger font-semibold">{rejectedIpos.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <span className="text-sm text-gray-300">Needs Review</span>
              <span className="text-yellow-400 font-semibold">{ipos.filter(i => i.decision === 'NEEDS_REVIEW').length}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Historical Results</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm text-gray-300">Total P&L</span>
              </div>
              <span className="text-accent font-semibold">₹{(analytics?.total_pnl || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-300">Win Rate</span>
              </div>
              <span className="text-accent font-semibold">{analytics?.win_rate || 0}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">Closed Trades</span>
              </div>
              <span className="text-white font-semibold">{analytics?.closed_trades || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
