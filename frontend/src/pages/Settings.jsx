import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, RefreshCw, User, Key } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import api from '../api';

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [broker, setBroker] = useState(localStorage.getItem('selectedBroker') || 'Angel One');
  const [brokerKey, setBrokerKey] = useState(localStorage.getItem('brokerKey') || '');
  const [brokerId, setBrokerId] = useState(localStorage.getItem('brokerId') || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('geminiKey') || '');
  const [panNumber, setPanNumber] = useState(localStorage.getItem('panNumber') || '');
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const saveBroker = () => {
    localStorage.setItem('selectedBroker', broker);
    localStorage.setItem('brokerKey', brokerKey);
    localStorage.setItem('brokerId', brokerId);
    localStorage.setItem('geminiKey', geminiKey);
    localStorage.setItem('panNumber', panNumber);
    api.post('/broker/login', { broker, client_id: brokerId, api_key: brokerKey, gemini_key: geminiKey, pan_number: panNumber });
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
  };

  useEffect(() => {
    api.get('/config').then(res => setConfig(res.data)).catch(console.error);
  }, []);

  const updateConfig = async (key, value) => {
    setSaving(true);
    try {
      const res = await api.post('/config', { [key]: value });
      setConfig(res.data.config);
    } catch (err) {
      console.error('Failed to update config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-sm text-gray-400">Configure your IPO Decision Engine</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Decision Engine Configuration
        </h2>
        <div className="space-y-4">
          {config && [
            ['Min Decision Age (hours)', 'min_decision_age_hours', config.min_decision_age_hours],
            ['Min GMP %', 'min_gmp_percent', config.min_gmp_percent],
            ['Min QIB Subscription (x)', 'min_qib_sub', config.min_qib_sub],
            ['Min Retail Subscription (x)', 'min_retail_sub', config.min_retail_sub],
            ['Max PE Ratio', 'max_pe_ratio', config.max_pe_ratio],
            ['Min Revenue Growth (YoY %)', 'min_revenue_yoy', config.min_revenue_yoy],
            ['Min Profit Growth (YoY %)', 'min_profit_yoy', config.min_profit_yoy],
            ['Min Sentiment Score (%)', 'min_sentiment', config.min_sentiment],
            ['Max Fund Allocation (%)', 'max_fund_allocation_percent', config.max_fund_allocation_percent],
            ['Max Lots per IPO', 'max_lots_per_ipo', config.max_lots_per_ipo],
          ].map(([label, key, value]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-gray-300">{label}</p>
                <p className="text-xs text-gray-600">Current: {value}</p>
              </div>
              <input
                type="number"
                defaultValue={value}
                onBlur={(e) => {
                  const newVal = parseFloat(e.target.value);
                  if (newVal !== value) updateConfig(key, newVal);
                }}
                className="w-24 h-9 px-3 rounded-lg bg-dark-bg border border-dark-border text-sm text-gray-300 text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" /> Automation
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-300">Enable Auto Discovery</p>
              <p className="text-xs text-gray-600">Automatically run discovery on schedule</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-300">Enable Lifecycle Simulation</p>
              <p className="text-xs text-gray-600">Auto-advance IPOs through lifecycle</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-300">Notifications</p>
              <p className="text-xs text-gray-600">Receive alerts for IPO events</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-yellow-400" /> Broker Integration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Select Broker</label>
            <select
                className="w-full h-10 px-3 rounded-lg bg-dark-bg border border-dark-border text-sm text-gray-300 mt-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
            >
                <option value="Angel One">Angel One</option>
                <option value="Groww">Groww</option>
                <option value="Upstox">Upstox</option>
                <option value="Zerodha Kite">Zerodha Kite</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400">Client ID</label>
            <input type="text" value={brokerId} onChange={e => setBrokerId(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-dark-bg border border-dark-border text-sm text-gray-300 mt-1 focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Enter your client ID" />
          </div>
          <div>
            <label className="text-sm text-gray-400">API Key / JWT Token</label>
            <input type="password" value={brokerKey} onChange={e => setBrokerKey(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-dark-bg border border-dark-border text-sm text-gray-300 mt-1 focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Enter your broker API key" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Google Gemini API Key</label>
            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-dark-bg border border-dark-border text-sm text-gray-300 mt-1 focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="AI.xxxxxx" />
          </div>
          <div>
            <label className="text-sm text-gray-400">PAN Number (For Allotment Checker)</label>
            <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} className="w-full h-10 px-3 rounded-lg bg-dark-bg border border-dark-border text-sm text-gray-300 mt-1 focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="ABCDE1234F" />
          </div>
          <button onClick={saveBroker} className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-semibold flex items-center justify-center gap-2">
            Save Credentials
            {showSavedMsg && <span className="text-sm text-green-500 font-medium">Saved Successfully!</span>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
