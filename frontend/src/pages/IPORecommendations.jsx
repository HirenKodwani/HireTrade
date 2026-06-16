import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Target, BarChart3, Users } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function AIRecommendations() {
  const [ipos, setIpos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ipos').then(res => setIpos(res.data)).catch(console.error);
  }, []);

  const scored = ipos
    .filter(i => i.decision_score > 0)
    .sort((a, b) => (b.decision_score || 0) - (a.decision_score || 0));

  const accepted = scored.filter(i => i.decision === 'ACCEPTED');
  const rejected = scored.filter(i => i.decision === 'REJECTED');
  const reviewed = scored.filter(i => i.decision === 'NEEDS_REVIEW');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">AI Recommendations</h1>
        </div>
        <p className="text-sm text-gray-400">Smart IPO recommendations ranked by AI analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-l-4 border-l-accent">
          <p className="text-2xl font-bold text-accent">{accepted.length}</p>
          <p className="text-sm text-gray-400">Apply</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-yellow-400">
          <p className="text-2xl font-bold text-yellow-400">{reviewed.length}</p>
          <p className="text-sm text-gray-400">Watch</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-danger">
          <p className="text-2xl font-bold text-danger">{rejected.length}</p>
          <p className="text-sm text-gray-400">Avoid</p>
        </div>
      </div>

      <div className="space-y-3">
        {scored.map((ipo, i) => (
          <motion.div
            key={ipo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/ipos/${ipo.id}`)}
            className="glass-card-hover p-5 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{ipo.company_name || ipo.symbol}</h3>
                  <Badge variant={ipo.decision === 'ACCEPTED' ? 'success' : ipo.decision === 'REJECTED' ? 'destructive' : 'warning'}>
                    {ipo.decision === 'ACCEPTED' ? 'Apply' : ipo.decision === 'REJECTED' ? 'Avoid' : 'Watch'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Score: {ipo.decision_score?.toFixed(0)}%</span>
                  <span>Confidence: {ipo.confidence?.toFixed(0)}%</span>
                  {ipo.gmp && <span>GMP: ₹{ipo.gmp}</span>}
                  {ipo.qib_subscription && <span>QIB: {ipo.qib_subscription.toFixed(1)}x</span>}
                </div>
                <Progress value={ipo.decision_score || 0} className="h-1.5 mt-2" indicatorClass="bg-gradient-to-r from-primary to-accent" />
              </div>
              <div className="text-right">
                {ipo.gmp && ipo.current_price && (
                  <p className={`text-sm font-semibold ${(ipo.gmp / ipo.current_price) > 0.05 ? 'text-accent' : 'text-danger'}`}>
                    {((ipo.gmp / ipo.current_price) * 100).toFixed(1)}%
                  </p>
                )}
                <p className="text-[10px] text-gray-600">Est. Gain</p>
              </div>
            </div>
          </motion.div>
        ))}
        {scored.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No AI recommendations yet. Run discovery first.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
