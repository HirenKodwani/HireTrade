import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MailCheck, Search, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../api';

export default function AllotmentCenter() {
  const [ipos, setIpos] = useState([]);
  const [search, setSearch] = useState('');
  const [checking, setChecking] = useState(null);
  const [results, setResults] = useState({});

  useEffect(() => {
    api.get('/ipos').then(res => setIpos(res.data)).catch(console.error);
  }, []);

  const handleCheckAllotment = async (ipoId) => {
    setChecking(ipoId);
    try {
      const res = await api.post('/allotment/check', { ipo_id: ipoId });
      setResults(prev => ({
        ...prev,
        [ipoId]: res.data
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [ipoId]: { 
          status: 'error', 
          allotment_status: 'ERROR', 
          message: err.response?.data?.detail || "Error checking allotment. Make sure PAN is saved in Settings."
        }
      }));
    } finally {
      setChecking(null);
    }
  };

  const filteredIpos = ipos.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (i.company_name || '').toLowerCase().includes(q) || (i.symbol || '').toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <MailCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Allotment Center</h1>
        </div>
        <p className="text-sm text-gray-400">Automated IPO allotment tracking using your saved PAN</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search applied IPOs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-dark-card border border-dark-border text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-4">
        {filteredIpos.slice(0, 10).map((ipo) => {
          const result = results[ipo.id];
          const isChecking = checking === ipo.id;

          return (
            <div key={ipo.id} className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{ipo.company_name}</h3>
                <p className="text-sm text-gray-400 mt-1">Issue Price: ₹{ipo.current_price || '--'} | Status: {ipo.lifecycle_status || 'UNKNOWN'}</p>
                {result && (
                  <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${
                    result.allotment_status === 'ALLOTTED' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    result.allotment_status === 'NOT_ALLOTTED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    result.allotment_status === 'ERROR' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                    'bg-gray-500/10 border-gray-500/30 text-gray-400'
                  }`}>
                    {result.allotment_status === 'ALLOTTED' && <CheckCircle className="w-5 h-5 shrink-0" />}
                    {result.allotment_status === 'NOT_ALLOTTED' && <XCircle className="w-5 h-5 shrink-0" />}
                    {(result.allotment_status === 'PENDING' || result.allotment_status === 'ERROR') && <Clock className="w-5 h-5 shrink-0" />}
                    
                    <div>
                      <p className="font-medium text-sm">{result.message}</p>
                      {result.pan_checked && <p className="text-xs opacity-70 mt-0.5">Checked with PAN: {result.pan_checked}</p>}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCheckAllotment(ipo.id)}
                disabled={isChecking}
                className="px-6 py-2.5 bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/50 transition-colors font-medium rounded-lg text-sm shrink-0 flex items-center justify-center min-w-[160px]"
              >
                {isChecking ? (
                  <><Activity className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                ) : (
                  'Check Allotment'
                )}
              </button>
            </div>
          );
        })}
        {filteredIpos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No IPOs found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
