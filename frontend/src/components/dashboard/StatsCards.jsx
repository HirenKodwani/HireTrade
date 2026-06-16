import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, LineChart, Activity } from 'lucide-react';

const defaultStats = [
  { label: 'Total Active IPOs', value: '--', icon: Activity, color: 'from-blue-500 to-blue-600' },
  { label: 'Average GMP', value: '--', icon: TrendingUp, color: 'from-green-500 to-green-600' },
  { label: 'Accepted IPOs', value: '--', icon: Target, color: 'from-primary to-purple-600' },
  { label: 'Avg Listing Gain', value: '--', icon: LineChart, color: 'from-accent to-emerald-600' },
];

export default function StatsCards({ stats = defaultStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card-hover p-5 relative overflow-hidden group"
        >
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-8 translate-x-8 group-hover:opacity-10 transition-opacity`} />
          <div className="flex items-center justify-between mb-3">
            <stat.icon className={`w-5 h-5 text-${stat.color.includes('primary') ? 'primary' : stat.color.includes('accent') ? 'accent' : stat.color.includes('green') ? 'green-400' : 'blue-400'}`} />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
