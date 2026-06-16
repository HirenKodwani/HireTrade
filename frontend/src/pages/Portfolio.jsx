import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import api from '../api';

export default function Portfolio() {
  const [analytics, setAnalytics] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [broker, setBroker] = useState(localStorage.getItem('selectedBroker') || 'Angel One');
  const [brokerKey, setBrokerKey] = useState(localStorage.getItem('brokerKey') || '');

  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    api.get('/analytics')
      .then(res => setAnalytics(res.data))
      .catch(console.error);

    api.get('/portfolio')
      .then(res => setHoldings(res.data))
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.detail || "Failed to fetch portfolio data. Please check your credentials.");
      });
  }, [broker, brokerKey]);

  const closedTrades = analytics?.past_trades || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        </div>
        <p className="text-sm text-gray-400">Track your IPO investments and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-accent" />
            <span className="text-sm text-gray-400">Total Simulation P&L</span>
          </div>
          <p className={`text-2xl font-bold ${(analytics?.total_pnl || 0) >= 0 ? 'text-accent' : 'text-danger'}`}>
            ₹{(analytics?.total_pnl || 0).toFixed(2)}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-400">Simulation Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.win_rate || 0}%</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Live Holdings ({broker})</span>
          </div>
          <p className="text-2xl font-bold text-white">{holdings.length}</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Current Holdings ({broker})</h2>
        {error ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        ) : holdings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left p-3 text-gray-500 font-medium">Company</th>
                  <th className="text-right p-3 text-gray-500 font-medium">Lots</th>
                  <th className="text-right p-3 text-gray-500 font-medium">Invested</th>
                  <th className="text-right p-3 text-gray-500 font-medium">Current Value</th>
                  <th className="text-right p-3 text-gray-500 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((trade, i) => (
                  <tr key={i} className="border-b border-dark-border/50">
                    <td className="p-3 text-white">{trade.company_name || trade.symbol}</td>
                    <td className="p-3 text-right text-gray-300">{trade.lots}</td>
                    <td className="p-3 text-right text-gray-400">₹{trade.invested}</td>
                    <td className="p-3 text-right text-white">₹{trade.current_value}</td>
                    <td className={`p-3 text-right font-semibold ${(trade.pnl || 0) >= 0 ? 'text-accent' : 'text-danger'}`}>
                      ₹{trade.pnl?.toFixed(2) || '0.00'} <span className="text-xs">({trade.pnl_percent}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No holdings found for {broker}
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Closed Trades</h2>
        {closedTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left p-3 text-gray-500 font-medium">Company</th>
                  <th className="text-right p-3 text-gray-500 font-medium">Status</th>
                  <th className="text-right p-3 text-gray-500 font-medium">Lots</th>
                  <th className="text-right p-3 text-gray-500 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((trade, i) => (
                  <tr key={i} className="border-b border-dark-border/50">
                    <td className="p-3 text-white">{trade.company_name || trade.symbol}</td>
                    <td className="p-3 text-right text-gray-400">{trade.status}</td>
                    <td className="p-3 text-right text-gray-300">{trade.lots}</td>
                    <td className={`p-3 text-right font-semibold ${(trade.pnl || 0) >= 0 ? 'text-accent' : 'text-danger'}`}>
                      ₹{trade.pnl?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No closed trades yet
          </div>
        )}
      </div>
    </motion.div>
  );
}
