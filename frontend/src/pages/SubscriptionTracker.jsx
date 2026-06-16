import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Building2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SubscriptionTracker() {
  const [ipos, setIpos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ipos').then(res => setIpos(res.data)).catch(console.error);
  }, []);

  const subbed = ipos.filter(i => i.qib_subscription > 0 || i.retail_subscription > 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Subscription Tracker</h1>
        </div>
        <p className="text-sm text-gray-400">Live subscription data for active IPOs</p>
      </div>

      {subbed.map((ipo, i) => (
        <motion.div
          key={ipo.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => navigate(`/ipos/${ipo.id}`)}
          className="glass-card-hover p-5 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-white font-semibold">{ipo.company_name || ipo.symbol}</h3>
            <Badge variant={ipo.decision === 'ACCEPTED' ? 'success' : 'warning'}>
              {ipo.decision === 'ACCEPTED' ? 'Apply' : 'Watch'}
            </Badge>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">QIB</span>
                <span className="text-accent font-semibold">{ipo.qib_subscription?.toFixed(2) || '0.00'}x</span>
              </div>
              <Progress value={Math.min((ipo.qib_subscription || 0) * 20, 100)} className="h-2" indicatorClass="bg-accent" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Retail</span>
                <span className="text-primary font-semibold">{ipo.retail_subscription?.toFixed(2) || '0.00'}x</span>
              </div>
              <Progress value={Math.min((ipo.retail_subscription || 0) * 20, 100)} className="h-2" indicatorClass="bg-primary" />
            </div>
          </div>
        </motion.div>
      ))}
      {subbed.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No subscription data available yet</p>
        </div>
      )}
    </motion.div>
  );
}
