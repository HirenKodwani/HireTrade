import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Users, BarChart3, Shield, Activity, Newspaper, AlertTriangle, Building2, Target, ChevronDown, ChevronUp, Send, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import api from '../api';

function DecisionBadge({ decision }) {
  const map = {
    'ACCEPTED': { label: 'Apply', variant: 'success' },
    'REJECTED': { label: 'Avoid', variant: 'destructive' },
    'NEEDS_REVIEW': { label: 'Watch', variant: 'warning' },
  };
  const d = map[decision] || { label: decision || 'Pending', variant: 'outline' };

  const handleApply = () => {
    const broker = localStorage.getItem('selectedBroker') || 'Groww';
    let url = 'https://groww.in/ipo';
    if (broker.toLowerCase().includes('zerodha')) url = 'https://kite.zerodha.com/ipo';
    if (broker.toLowerCase().includes('angel')) url = 'https://trade.angelone.in/';
    if (broker.toLowerCase().includes('upstox')) url = 'https://upstox.com/ipo/';
    window.open(url, '_blank');
  };

  if (decision === 'ACCEPTED') {
    return (
      <button 
        onClick={handleApply}
        title="Apply via configured broker"
        className="px-4 py-1.5 rounded-full text-sm font-semibold transition-transform hover:scale-105 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer"
      >
        {d.label} <ExternalLink className="w-3.5 h-3.5" />
      </button>
    );
  }

  return <Badge variant={d.variant} className="text-sm px-4 py-1.5">{d.label}</Badge>;
}

export default function IPODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ipo, setIpo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotMessages, setCopilotMessages] = useState([]);

  useEffect(() => {
    const fetchIPO = async () => {
      try {
        const res = await api.get(`/ipos/${id}`);
        setIpo(res.data);
      } catch (err) {
        console.error('Failed to fetch IPO:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIPO();
  }, [id]);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'financials', label: 'Financials' },
    { id: 'ai-analysis', label: 'AI Analysis' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'gmp', label: 'GMP' },
    { id: 'sentiment', label: 'Sentiment' },
    { id: 'risks', label: 'Risk Factors' },
    { id: 'verdict', label: 'Final Verdict' },
  ];

  const handleCopilotSend = (e) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    const query = copilotQuery;
    setCopilotMessages(prev => [...prev, { role: 'user', content: query }]);
    setCopilotQuery('');

    let response = '';
    const q = query.toLowerCase();
    if (q.includes('should i apply') || q.includes('apply')) {
      if (ipo?.decision === 'ACCEPTED') {
        response = `Based on our AI analysis, **YES**, you should apply for ${ipo.company_name || ipo.symbol}. The AI Score is ${ipo.decision_score?.toFixed(0)}% with ${ipo.confidence?.toFixed(0)}% confidence. Strong GMP of ${ipo.gmp || 'N/A'} and solid QIB subscription of ${ipo.qib_subscription?.toFixed(1)}x support this decision.`;
      } else if (ipo?.decision === 'REJECTED') {
        response = `Our AI recommends **AVOIDING** ${ipo.company_name || ipo.symbol}. The AI Score is ${ipo.decision_score?.toFixed(0)}% with key concerns in the evaluation metrics.`;
      } else {
        response = `${ipo?.company_name || ipo?.symbol || 'This IPO'} is currently under review. We need more data before making a recommendation.`;
      }
    } else if (q.includes('gmp')) {
      response = `The current GMP for ${ipo?.company_name || ipo?.symbol} is **₹${ipo?.gmp || 'N/A'}**. The current price is ₹${ipo?.current_price || 'N/A'}, implying an expected listing gain of approximately **${ipo?.gmp && ipo?.current_price ? (((ipo.gmp / ipo.current_price) * 100).toFixed(1)) : 'N/A'}%**.`;
    } else if (q.includes('compare') || q.includes('versus') || q.includes('vs')) {
      response = `I can compare ${ipo?.company_name || ipo?.symbol} with other IPOs in our database. Based on the AI scoring, this IPO ranks with a score of ${ipo?.decision_score?.toFixed(0) || 'N/A'}%. Would you like me to compare specific metrics like GMP, subscription, or financial growth?`;
    } else if (q.includes('reject') || q.includes('why')) {
      const reasons = ipo?.decision_reasons || [];
      if (reasons.length > 0) {
        response = `The AI rejected ${ipo?.company_name || ipo?.symbol} for the following reasons:\n${reasons.map(r => `• ${r}`).join('\n')}`;
      } else {
        response = `The AI decision was "${ipo?.decision}". The score was ${ipo?.decision_score?.toFixed(0) || 'N/A'}% with ${ipo?.confidence?.toFixed(0) || 'N/A'}% confidence.`;
      }
    } else {
      response = `I can help you analyze ${ipo?.company_name || ipo?.symbol || 'this IPO'}. Ask me about:\n• Should I apply?\n• GMP analysis\n• Compare with other IPOs\n• Why was it rejected?\n• Financial metrics`;
    }
    setTimeout(() => {
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ipo) {
    return (
      <div className="glass-card p-12 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger" />
        <h2 className="text-xl font-semibold text-white mb-2">IPO Not Found</h2>
        <p className="text-gray-400">The requested IPO could not be found.</p>
        <button onClick={() => navigate('/live-ipos')} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm">Back to Live IPOs</button>
      </div>
    );
  }

  const expectedGain = ipo.gmp && ipo.current_price ? ((ipo.gmp / ipo.current_price) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/live-ipos')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Live IPOs
      </button>

      <div className="glass-card p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{ipo.company_name || ipo.symbol}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400">{ipo.symbol}</span>
                {ipo.is_sme && <Badge variant="warning">SME</Badge>}
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-gray-400">Rank #{ipo.comparative_rank || '--'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DecisionBadge decision={ipo.decision} />
            <Badge variant={ipo.lifecycle_status === 'CLOSED' ? 'outline' : 'default'}>{ipo.lifecycle_status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-lg bg-dark-bg/50 border border-dark-border">
            <p className="text-xs text-gray-500 uppercase mb-1">Price Band</p>
            <p className="text-white font-semibold">₹{ipo.current_price || '--'}</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-bg/50 border border-dark-border">
            <p className="text-xs text-gray-500 uppercase mb-1">GMP</p>
            <p className="text-accent font-semibold">{ipo.gmp ? `₹${ipo.gmp}` : '--'}</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-bg/50 border border-dark-border">
            <p className="text-xs text-gray-500 uppercase mb-1">Expected Gain</p>
            <p className={`font-semibold ${expectedGain && Number(expectedGain) > 0 ? 'text-accent' : 'text-gray-400'}`}>{expectedGain ? `${expectedGain}%` : '--'}</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-bg/50 border border-dark-border">
            <p className="text-xs text-gray-500 uppercase mb-1">AI Score</p>
            <p className="text-primary font-semibold">{ipo.decision_score?.toFixed(0) || '--'}%</p>
          </div>
        </div>

        {ipo.open_date && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <span>{new Date(ipo.open_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>→</span>
            <span>{new Date(ipo.close_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-dark-card text-gray-400 border border-dark-border hover:border-gray-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeSection === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['PE Ratio', ipo.pe_ratio?.toFixed(2) || '--'],
                  ['QIB Subscription', ipo.qib_subscription ? `${ipo.qib_subscription.toFixed(2)}x` : '--'],
                  ['Retail Subscription', ipo.retail_subscription ? `${ipo.retail_subscription.toFixed(2)}x` : '--'],
                  ['Revenue Growth (YoY)', ipo.revenue_growth_yoy ? `${ipo.revenue_growth_yoy.toFixed(1)}%` : '--'],
                  ['Profit Growth (YoY)', ipo.profit_growth_yoy ? `${ipo.profit_growth_yoy.toFixed(1)}%` : '--'],
                  ['Sentiment Score', ipo.sentiment_score ? `${ipo.sentiment_score.toFixed(0)}%` : '--'],
                  ['Confidence', `${ipo.confidence?.toFixed(0) || '--'}%`],
                  ['Recommended Lots', ipo.recommended_lots || '--'],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 rounded-lg bg-dark-bg/30 border border-dark-border">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-white mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'ai-analysis' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="text-lg font-semibold text-white">AI Analysis</h2>
                </div>
                <DecisionBadge decision={ipo.decision} />
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">AI Score</p>
                  <p className="text-4xl font-bold text-primary">{ipo.decision_score?.toFixed(0) || '--'}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Confidence</p>
                  <p className="text-4xl font-bold text-accent">{ipo.confidence?.toFixed(0) || '--'}%</p>
                </div>
              </div>
              <Progress value={ipo.decision_score || 0} className="h-2 mb-6" indicatorClass="bg-gradient-to-r from-primary to-accent" />
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">Decision Reasoning</p>
                {(ipo.decision_reasons || []).length > 0 ? (
                  <ul className="space-y-2">
                    {ipo.decision_reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${r.includes('Strong') || r.includes('High') ? 'bg-accent' : 'bg-yellow-400'}`} />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No detailed reasoning available.</p>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'financials' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Financial Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['PE Ratio', ipo.pe_ratio?.toFixed(2), 'Valuation metric'],
                  ['Revenue Growth', ipo.revenue_growth_yoy ? `${ipo.revenue_growth_yoy.toFixed(1)}%` : '--', 'Year-over-Year'],
                  ['Profit Growth', ipo.profit_growth_yoy ? `${ipo.profit_growth_yoy.toFixed(1)}%` : '--', 'Year-over-Year'],
                  ['Current Price', ipo.current_price ? `₹${ipo.current_price}` : '--', 'Price Band'],
                ].map(([label, value, desc]) => (
                  <div key={label} className="p-4 rounded-lg bg-dark-bg/30 border border-dark-border">
                    <p className="text-xs text-gray-500">{desc}</p>
                    <p className="text-lg font-bold text-white mt-1">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'subscription' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Subscription Analysis</h2>
              <div className="space-y-4">
                {[
                  ['QIB', ipo.qib_subscription || 0, 'accent'],
                  ['Retail', ipo.retail_subscription || 0, 'primary'],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className={`font-semibold text-${color === 'accent' ? 'accent' : 'primary'}`}>{typeof value === 'number' ? `${value.toFixed(2)}x` : value}</span>
                    </div>
                    <Progress value={Math.min((value || 0) * 50, 100)} className="h-2" indicatorClass={color === 'accent' ? 'bg-accent' : 'bg-primary'} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'gmp' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">GMP Analysis</h2>
              <div className="p-6 rounded-lg bg-dark-bg/50 border border-dark-border text-center">
                <p className="text-5xl font-bold text-accent mb-2">{ipo.gmp ? `₹${ipo.gmp}` : '--'}</p>
                <p className="text-gray-400">Current GMP</p>
                {expectedGain && (
                  <p className="text-lg text-accent font-semibold mt-2">+{expectedGain}% Expected Listing Gain</p>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'sentiment' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Sentiment Analysis</h2>
              <div className="text-center">
                <p className="text-5xl font-bold mb-2" style={{ color: ipo.sentiment_score >= 60 ? '#00E5A8' : ipo.sentiment_score >= 40 ? '#FFD700' : '#FF5C5C' }}>
                  {ipo.sentiment_score?.toFixed(0) || '--'}%
                </p>
                <p className="text-gray-400">News Sentiment Score</p>
              </div>
            </motion.div>
          )}

          {activeSection === 'risks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Risk Factors</h2>
              {(ipo.decision_reasons || []).filter(r => r.toLowerCase().includes('low') || r.toLowerCase().includes('weak') || r.toLowerCase().includes('below')).length > 0 ? (
                <ul className="space-y-3">
                  {ipo.decision_reasons.filter(r => r.toLowerCase().includes('low') || r.toLowerCase().includes('weak') || r.toLowerCase().includes('below')).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No significant risk factors identified by AI analysis.</p>
              )}
            </motion.div>
          )}

          {activeSection === 'verdict' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Final Verdict</h2>
              <div className="p-6 rounded-xl bg-dark-bg/50 border border-dark-border text-center">
                <DecisionBadge decision={ipo.decision} />
                <p className="text-3xl font-bold text-white mt-4">AI Score: {ipo.decision_score?.toFixed(0) || '--'}%</p>
                <p className="text-gray-400 mt-2">Confidence: {ipo.confidence?.toFixed(0) || '--'}%</p>
                <Separator className="my-4" />
                <p className="text-sm text-gray-500">{ipo.decision === 'ACCEPTED' ? 'Based on comprehensive AI analysis of GMP, subscription trends, financial metrics, and market sentiment.' : 'Proceed with caution. Review the detailed analysis above for more context.'}</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`glass-card p-4 transition-all ${copilotOpen ? 'h-[500px]' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-white">IPO Copilot</h3>
              </div>
              <button onClick={() => setCopilotOpen(!copilotOpen)} className="text-gray-500 hover:text-white">
                {copilotOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
            {copilotOpen && (
              <div className="flex flex-col h-[420px]">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {copilotMessages.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-primary/20 text-white ml-8' : 'bg-dark-border/50 text-gray-300 mr-8'}`}>
                      {msg.content.split('\n').map((line, j) => (
                        <p key={j}>{line}</p>
                      ))}
                    </div>
                  ))}
                  {copilotMessages.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Ask me about this IPO
                    </div>
                  )}
                </div>
                <form onSubmit={handleCopilotSend} className="flex gap-2">
                  <input
                    type="text"
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    placeholder="Ask about this IPO..."
                    className="flex-1 h-9 px-3 rounded-lg bg-dark-bg border border-dark-border text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button type="submit" className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-bg/50 transition-colors">Re-run AI Analysis</button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-bg/50 transition-colors">View Similar IPOs</button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-bg/50 transition-colors">Add to Portfolio</button>
            </div>
          </div>

          {ipo.lifecycle_events && ipo.lifecycle_events.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Lifecycle Events</h3>
              <div className="space-y-2">
                {ipo.lifecycle_events.slice(0, 5).map((event, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-gray-400">{event.event_type} → {event.status_after}</p>
                      <p className="text-gray-600">{new Date(event.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageSquare({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
