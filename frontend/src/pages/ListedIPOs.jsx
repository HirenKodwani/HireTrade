import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, LineChart, RefreshCw } from 'lucide-react';
import api from '../api';
import IPOCard from '../components/ipo/IPOCard';

const filters = ['All', 'Accepted', 'Needs Review', 'Rejected'];

export default function ListedIPOs() {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchIPOs = async () => {
    try {
      const res = await api.get('/ipos');
      // Only show closed or listed
      setIpos(res.data.filter(i => ['CLOSED', 'LISTED'].includes(i.lifecycle_status)));
    } catch (err) {
      console.error('Failed to fetch IPOs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIPOs(); }, []);

  const filtered = ipos.filter(ipo => {
    if (activeFilter === 'Accepted') return ipo.decision === 'ACCEPTED';
    if (activeFilter === 'Rejected') return ipo.decision === 'REJECTED';
    if (activeFilter === 'Needs Review') return ipo.decision === 'NEEDS_REVIEW';
    return true;
  }).filter(ipo => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (ipo.company_name || '').toLowerCase().includes(q) ||
           (ipo.symbol || '').toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Listed IPOs</h1>
          <p className="text-sm text-gray-400 mt-1">Historical IPO database with listing performance</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by company or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-dark-card border border-dark-border text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeFilter === f
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-dark-card text-gray-400 border border-dark-border hover:border-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ipo, i) => (
          <IPOCard key={ipo.id} ipo={ipo} index={i} />
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 glass-card">
          <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No listed IPOs available in database.</p>
        </div>
      )}
    </motion.div>
  );
}
