import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Newspaper, BarChart3, Activity } from 'lucide-react';

function SentimentGauge({ value, label }) {
  const val = value || 50;
  const color = val >= 60 ? 'text-accent' : val >= 40 ? 'text-yellow-400' : 'text-danger';
  return (
    <div className="glass-card-hover p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-300">{label}</span>
        <Activity className={`w-4 h-4 ${color}`} />
      </div>
      <div className="relative h-2 bg-dark-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${val}%` }}
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            val >= 60 ? 'bg-accent' : val >= 40 ? 'bg-yellow-400' : 'bg-danger'
          }`}
        />
      </div>
      <p className={`text-right text-sm font-medium mt-1 ${color}`}>{val}%</p>
    </div>
  );
}

export default function MarketWidgets({ ipos = [], news = [] }) {
  const avgSentiment = ipos.length
    ? (ipos.reduce((a, i) => a + (i.sentiment_score || 50), 0) / ipos.length).toFixed(0)
    : 50;

  const avgGmp = ipos.filter(i => i.gmp).length
    ? (ipos.reduce((a, i) => a + (i.gmp || 0), 0) / ipos.filter(i => i.gmp).length).toFixed(1)
    : '--';

  const activeSubscribed = ipos.filter(i => i.qib_subscription > 0 || i.retail_subscription > 0).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SentimentGauge value={Number(avgSentiment)} label="Market Sentiment" />
      <div className="glass-card-hover p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">Average GMP</span>
          <TrendingUp className="w-4 h-4 text-accent" />
        </div>
        <p className="text-2xl font-bold text-white">{avgGmp}</p>
        <p className="text-xs text-gray-500 mt-1">Across active IPOs</p>
      </div>
      <div className="glass-card-hover p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">Active IPOs</span>
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <p className="text-2xl font-bold text-white">{ipos.length}</p>
        <p className="text-xs text-gray-500 mt-1">Total tracked IPOs</p>
      </div>
      <div className="glass-card-hover p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">IPO News</span>
          <Newspaper className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-white">{news.length || '--'}</p>
        <p className="text-xs text-gray-500 mt-1">Latest updates</p>
      </div>
    </div>
  );
}
