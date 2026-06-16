import React, { useState } from 'react';
import { Search, Activity, TrendingUp, AlertCircle, TrendingDown, RefreshCw, Layers } from 'lucide-react';

export default function LiveData() {
  const [symbol, setSymbol] = useState('NIFTY'); 
  const [exchange, setExchange] = useState('NSE');
  const [segment, setSegment] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchQuote = async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
        // Use relative path or standard api instance
        // Assuming we are proxying or fetching localhost:8000
        const response = await fetch(`http://localhost:8000/api/live/quote?exchange=${exchange}&segment=${segment}&trading_symbol=${symbol}`);
        
        if (!response.ok) {
            const errBody = await response.json();
            throw new Error(errBody.detail || "Failed to fetch live data from Groww");
        }
        
        const json = await response.json();
        setData(json);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Market Data</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time quotes powered by Groww API</p>
        </div>
      </div>

      <div className="glass-panel p-6 flex flex-col md:flex-row gap-4 items-end border border-slate-700/50 rounded-xl bg-slate-800/30">
        <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-slate-400 mb-1">Exchange</label>
            <select 
              value={exchange} 
              onChange={(e) => setExchange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-500"
            >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
            </select>
        </div>
        <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-slate-400 mb-1">Segment</label>
            <select 
              value={segment} 
              onChange={(e) => setSegment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-500"
            >
                <option value="CASH">CASH (Stocks/Index)</option>
                <option value="FNO">FNO (Derivatives)</option>
            </select>
        </div>
        <div className="w-full md:w-2/4 relative">
            <label className="block text-sm font-medium text-slate-400 mb-1">Trading Symbol</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. NIFTY or RELIANCE"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-500"
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuote()}
                />
            </div>
        </div>
        <button 
            onClick={fetchQuote}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-900 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Activity size={18} />}
            Fetch Quote
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-red-400 font-medium">Data Fetch Error</h3>
            <p className="text-red-300/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 border border-slate-700/50 rounded-xl bg-slate-800/30">
            <p className="text-sm font-medium text-slate-400">Last Traded Price</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">₹{data.last_price || data.average_price || '--'}</span>
            </div>
            {data.day_change !== undefined && (
                <div className={`mt-2 flex items-center gap-1 text-sm ${data.day_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.day_change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{Math.abs(data.day_change).toFixed(2)} ({data.day_change_perc}%)</span>
                </div>
            )}
          </div>

          <div className="glass-panel p-6 border border-slate-700/50 rounded-xl bg-slate-800/30">
            <p className="text-sm font-medium text-slate-400">Volume & Trades</p>
            <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                    <span className="text-slate-500">Volume</span>
                    <span className="text-white font-medium">{data.volume || '--'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Last Trade Qty</span>
                    <span className="text-white font-medium">{data.last_trade_quantity || '--'}</span>
                </div>
            </div>
          </div>

          <div className="glass-panel p-6 border border-slate-700/50 rounded-xl bg-slate-800/30">
            <p className="text-sm font-medium text-slate-400">OHLC</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="text-slate-500 block text-xs">Open</span>
                    <span className="text-white font-medium">₹{data.ohlc?.open || '--'}</span>
                </div>
                <div>
                    <span className="text-slate-500 block text-xs">High</span>
                    <span className="text-white font-medium">₹{data.ohlc?.high || '--'}</span>
                </div>
                <div>
                    <span className="text-slate-500 block text-xs">Low</span>
                    <span className="text-white font-medium">₹{data.ohlc?.low || '--'}</span>
                </div>
                <div>
                    <span className="text-slate-500 block text-xs">Close</span>
                    <span className="text-white font-medium">₹{data.ohlc?.close || '--'}</span>
                </div>
            </div>
          </div>

          <div className="glass-panel p-6 border border-slate-700/50 rounded-xl bg-slate-800/30">
            <p className="text-sm font-medium text-slate-400">Market Depth</p>
            <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Buy</span>
                    <span className="text-green-400 font-medium">{data.total_buy_quantity || '--'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Sell</span>
                    <span className="text-red-400 font-medium">{data.total_sell_quantity || '--'}</span>
                </div>
                 <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div 
                        className="bg-brand-500 h-1.5 rounded-full" 
                        style={{ width: `${(data.total_buy_quantity / (data.total_buy_quantity + data.total_sell_quantity)) * 100}%` }}
                    ></div>
                </div>
            </div>
          </div>
        </div>
      )}
      
      {!data && !loading && !error && (
          <div className="py-20 text-center flex flex-col items-center">
            <Layers className="text-slate-700 mb-4" size={48} />
            <h3 className="text-xl font-medium text-slate-400">Enter a symbol to view live data</h3>
            <p className="text-slate-500 mt-2">Try 'NIFTY', 'RELIANCE', or any other valid NSE/BSE symbol.</p>
          </div>
      )}
    </div>
  );
}
