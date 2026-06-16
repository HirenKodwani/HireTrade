import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, ChevronRight, Shield, Activity, BarChart3 } from 'lucide-react';

function getDecisionColor(decision) {
  switch (decision?.toUpperCase()) {
    case 'ACCEPTED': return { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', label: 'Apply' };
    case 'REJECTED': return { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', label: 'Avoid' };
    case 'NEEDS_REVIEW': return { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', label: 'Watch' };
    default: return { text: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30', label: 'Pending' };
  }
}

export default function TopAIPicks({ ipos = [] }) {
  const navigate = useNavigate();
  const topPicks = ipos
    .filter(ipo => ipo.decision === 'ACCEPTED' || ipo.decision === 'REJECTED')
    .sort((a, b) => (b.decision_score || 0) - (a.decision_score || 0))
    .slice(0, 5);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Top AI Picks</h3>
            <p className="text-xs text-gray-500">Ranked by AI Score & Confidence</p>
          </div>
        </div>
        <button onClick={() => navigate('/ai-hub')} className="text-sm text-primary hover:text-primary-light flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {topPicks.map((ipo, i) => {
          const dc = getDecisionColor(ipo.decision);
          const expectedGain = ipo.gmp && ipo.current_price ? ((ipo.gmp / ipo.current_price) * 100).toFixed(1) : null;
          return (
            <motion.div
              key={ipo.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/ipos/${ipo.id}`)}
              className="flex items-center gap-4 p-3 rounded-lg bg-dark-bg/50 border border-dark-border hover:border-primary/30 cursor-pointer transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{ipo.company_name || ipo.symbol}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">AI Score: <span className="text-primary font-medium">{ipo.decision_score?.toFixed(0) || '--'}%</span></span>
                  <span className="text-xs text-gray-500">Confidence: <span className="text-accent font-medium">{ipo.confidence?.toFixed(0) || '--'}%</span></span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {expectedGain && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Est. Gain</p>
                    <p className={`text-sm font-semibold ${Number(expectedGain) > 0 ? 'text-accent' : 'text-danger'}`}>
                      {Number(expectedGain) > 0 ? '+' : ''}{expectedGain}%
                    </p>
                  </div>
                )}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dc.bg} ${dc.text} ${dc.border} border`}>
                  {dc.label}
                </span>
              </div>
            </motion.div>
          );
        })}
        {topPicks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No IPOs analyzed yet. Run discovery first.
          </div>
        )}
      </div>
    </div>
  );
}
