import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, ArrowUpDown } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function GMPTracker() {
  const [ipos, setIpos] = useState([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('gmp');
  const [sortDir, setSortDir] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ipos').then(res => setIpos(res.data)).catch(console.error);
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = ipos
    .filter(i => i.gmp)
    .filter(i => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (i.company_name || '').toLowerCase().includes(q) || (i.symbol || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      return ((a[sortField] || 0) - (b[sortField] || 0)) * dir;
    });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-white">GMP Tracker</h1>
        </div>
        <p className="text-sm text-gray-400">Grey Market Premium tracking for active IPOs</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by company or symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-dark-card border border-dark-border text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left p-4 text-gray-500 font-medium">Company</th>
                <th className="text-right p-4 text-gray-500 font-medium cursor-pointer" onClick={() => toggleSort('current_price')}>
                  <span className="flex items-center justify-end gap-1">Issue Price <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-right p-4 text-gray-500 font-medium cursor-pointer" onClick={() => toggleSort('gmp')}>
                  <span className="flex items-center justify-end gap-1">GMP <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-right p-4 text-gray-500 font-medium">Est. Listing Gain</th>
                <th className="text-right p-4 text-gray-500 font-medium">AI Signal</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ipo, i) => {
                const gain = ipo.gmp && ipo.current_price ? ((ipo.gmp / ipo.current_price) * 100).toFixed(1) : null;
                return (
                  <motion.tr
                    key={ipo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => navigate(`/ipos/${ipo.id}`)}
                    className="border-b border-dark-border/50 hover:bg-dark-bg/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <p className="text-white font-medium">{ipo.company_name || ipo.symbol}</p>
                      <p className="text-xs text-gray-600">{ipo.symbol}</p>
                    </td>
                    <td className="p-4 text-right text-gray-300">₹{ipo.current_price || '--'}</td>
                    <td className="p-4 text-right">
                      <span className="text-accent font-semibold">{ipo.gmp ? `₹${ipo.gmp}` : '--'}</span>
                    </td>
                    <td className="p-4 text-right">
                      {gain ? (
                        <span className={Number(gain) > 0 ? 'text-accent font-semibold' : 'text-danger font-semibold'}>
                          {Number(gain) > 0 ? '+' : ''}{gain}%
                        </span>
                      ) : '--'}
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant={ipo.decision === 'ACCEPTED' ? 'success' : ipo.decision === 'REJECTED' ? 'destructive' : 'warning'}>
                        {ipo.decision === 'ACCEPTED' ? 'Apply' : ipo.decision === 'REJECTED' ? 'Avoid' : 'Watch'}
                      </Badge>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="text-center py-12 text-gray-500">No GMP data available</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
