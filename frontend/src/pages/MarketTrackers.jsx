import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3 } from 'lucide-react';
import GMPTracker from './GMPTracker';
import SubscriptionTracker from './SubscriptionTracker';

export default function MarketTrackers() {
  const [activeTab, setActiveTab] = useState('gmp');

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('gmp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'gmp' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-dark-bg/50 hover:text-white'}`}
          >
            <BarChart3 className="w-4 h-4" />
            GMP Tracker
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subscriptions' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-dark-bg/50 hover:text-white'}`}
          >
            <Activity className="w-4 h-4" />
            Subscription Tracker
          </button>
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'gmp' ? <GMPTracker /> : <SubscriptionTracker />}
      </motion.div>
    </div>
  );
}
