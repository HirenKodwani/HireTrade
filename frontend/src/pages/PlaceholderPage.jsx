import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

export default function PlaceholderPage({ title }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-gray-400 mt-1">This module is under development</p>
      </div>
      <div className="glass-card p-12 text-center">
        <Settings className="w-12 h-12 mx-auto mb-4 text-gray-600 animate-spin-slow" />
        <p className="text-gray-400">The {title} module will be available in the next release.</p>
        <p className="text-sm text-gray-600 mt-2">Integrating with advanced SmartAPI features.</p>
      </div>
    </motion.div>
  );
}
