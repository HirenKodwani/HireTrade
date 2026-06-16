import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, BarChart3, ChevronRight, Building2 } from 'lucide-react';

function getDecisionInfo(decision) {
  switch (decision?.toUpperCase()) {
    case 'ACCEPTED': return { label: 'Apply', color: 'text-accent', bg: 'bg-accent/15', border: 'border-accent/30', dot: 'bg-accent' };
    case 'REJECTED': return { label: 'Avoid', color: 'text-danger', bg: 'bg-danger/15', border: 'border-danger/30', dot: 'bg-danger' };
    case 'NEEDS_REVIEW': return { label: 'Watch', color: 'text-yellow-400', bg: 'bg-yellow-400/15', border: 'border-yellow-400/30', dot: 'bg-yellow-400' };
    default: return { label: 'Pending', color: 'text-gray-400', bg: 'bg-gray-400/15', border: 'border-gray-400/30', dot: 'bg-gray-400' };
  }
}

export default function IPOCard({ ipo, index = 0 }) {
  const navigate = useNavigate();
  const dc = getDecisionInfo(ipo.decision);
  const expectedGain = ipo.gmp && ipo.current_price 
    ? ((ipo.gmp / ipo.current_price) * 100).toFixed(1) 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/ipos/${ipo.id}`)}
      className="glass-card-hover p-5 cursor-pointer group relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${dc.dot === 'bg-accent' ? 'from-accent' : dc.dot === 'bg-danger' ? 'from-danger' : 'from-yellow-400'} opacity-[0.03] rounded-full -translate-y-16 translate-x-16`} />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{ipo.company_name || ipo.symbol}</h3>
            <p className="text-xs text-gray-500">{ipo.symbol}{ipo.is_sme ? ' (SME)' : ''}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${dc.bg} ${dc.color} ${dc.border} border flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dc.dot}`} />
          {dc.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase">GMP</p>
            <p className="text-sm font-semibold text-white">{ipo.gmp || '--'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase">QIB</p>
            <p className="text-sm font-semibold text-white">{ipo.qib_subscription?.toFixed(1) || '--'}x</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Score</p>
            <p className="text-sm font-semibold text-primary">{ipo.decision_score?.toFixed(0) || '--'}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Est. Gain</p>
            <p className={`text-sm font-semibold ${expectedGain && Number(expectedGain) > 0 ? 'text-accent' : 'text-gray-400'}`}>
              {expectedGain ? `${Number(expectedGain) > 0 ? '+' : ''}${expectedGain}%` : '--'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-dark-border">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {ipo.open_date && <span>{new Date(ipo.open_date).toLocaleDateString()}</span>}
          {ipo.close_date && <><span>→</span><span>{new Date(ipo.close_date).toLocaleDateString()}</span></>}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors" />
      </div>
    </motion.div>
  );
}
