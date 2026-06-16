import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield } from 'lucide-react';

export default function HeroSection({ stats }) {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-2xl glass-card p-8 lg:p-12 mb-8">
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI-Powered Decision Engine v2.0
          </span>
          <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium">
            {stats?.activeIpos || 0} Active IPOs
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight"
        >
          Should You Apply<br />
          <span className="gradient-text">For This IPO?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-lg max-w-2xl mb-8 leading-relaxed"
        >
          AI-powered IPO Intelligence Engine combining GMP, Subscription Trends, Financial Analysis, 
          News Sentiment, and Smart Validation for data-driven investment decisions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4"
        >
          <button
            onClick={() => navigate('/live-ipos')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all"
          >
            View Live IPOs <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/ai-hub')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-dark-border bg-dark-card/50 text-gray-300 font-medium hover:border-primary/30 hover:text-white transition-all"
          >
            <Sparkles className="w-4 h-4" /> View AI Picks
          </button>
        </motion.div>
      </div>
    </div>
  );
}
