import { useEffect, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import api from '../api';

const FIELDS = [
  ['min_decision_age_hours', 'Minimum decision age (hours)', '0.1'],
  ['min_gmp_percent', 'Minimum GMP percent', '0.1'],
  ['min_qib_sub', 'Minimum QIB subscription', '0.1'],
  ['min_retail_sub', 'Minimum retail subscription', '0.1'],
  ['max_pe_ratio', 'Maximum P/E ratio', '0.1'],
  ['min_revenue_yoy', 'Minimum revenue growth YoY', '0.1'],
  ['min_profit_yoy', 'Minimum profit growth YoY', '0.1'],
  ['min_sentiment', 'Minimum sentiment score', '1'],
  ['max_fund_allocation_percent', 'Maximum fund allocation percent', '0.1'],
  ['max_lots_per_ipo', 'Maximum lots per IPO', '1'],
];

export default function MetricsEditor() {
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/config')
      .then((response) => setConfig(response.data))
      .catch(() => setError('Unable to load decision metrics.'));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setConfig((current) => ({
      ...current,
      [name]: name === 'max_lots_per_ipo' ? Number.parseInt(value || 0, 10) : Number(value || 0),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    try {
      const response = await api.post('/config', config);
      setConfig(response.data.config);
      setStatus('Decision metrics saved and open IPOs were revalidated.');
    } catch {
      setError('Unable to save decision metrics.');
    }
  };

  if (!config) return <div className="glass-panel">Loading decision metrics...</div>;

  return (
    <div className="glass-panel metrics-editor">
      <h2><Settings size={20} /> Validation Configuration</h2>
      <form onSubmit={handleSave} className="settings-grid">
        {FIELDS.map(([name, label, step]) => (
          <label key={name} className="form-group">
            <span>{label}</span>
            <input
              type="number"
              name={name}
              value={config[name]}
              onChange={handleChange}
              className="form-input"
              step={step}
              min="0"
            />
          </label>
        ))}
        <button type="submit" className="btn settings-save">
          <Save size={16} /> Save metrics
        </button>
      </form>
      {status && <p className="notice success">{status}</p>}
      {error && <p className="notice danger">{error}</p>}
    </div>
  );
}
