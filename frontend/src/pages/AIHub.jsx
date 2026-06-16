import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BarChart3 } from 'lucide-react';
import IPORecommendations from './IPORecommendations';
import AIPerformance from './AIPerformance';

export default function AIHub() {
  const [activeTab, setActiveTab] = useState('recommendations');

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'recommendations' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-dark-bg/50 hover:text-white'}`}
          >
            <Sparkles className="w-4 h-4" />
            AI Recommendations
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'performance' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-dark-bg/50 hover:text-white'}`}
          >
            <BarChart3 className="w-4 h-4" />
            AI Performance
          </button>
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'recommendations' ? <IPORecommendations /> : <AIPerformance />}
      </motion.div>
    </div>
  );
}
