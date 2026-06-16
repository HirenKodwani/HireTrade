import { useEffect, useState } from 'react';
import { CheckCircle2, CircleDollarSign, Layers3, TrendingUp } from 'lucide-react';
import api from '../api';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics')
      .then((response) => setAnalytics(response.data))
      .catch(() => setError('Unable to load workflow reports.'));
  }, []);

  if (error) return <div className="notice danger">{error}</div>;
  if (!analytics) return <div className="glass-panel">Loading reports...</div>;

  return (
    <div className="analytics-container">
      <div className="stats-grid reports-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon accent"><CircleDollarSign size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Closed simulated PnL</span>
            <span className="stat-value">INR {analytics.total_pnl.toLocaleString()}</span>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon success"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Closed trade win rate</span>
            <span className="stat-value">{analytics.win_rate}%</span>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon warn"><Layers3 size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Accepted decisions</span>
            <span className="stat-value">{analytics.decision_counts.ACCEPTED || 0}</span>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon success"><CheckCircle2 size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Closed demo trades</span>
            <span className="stat-value">{analytics.closed_trades}</span>
          </div>
        </div>
      </div>

      <div className="detail-split report-split">
        <section className="glass-panel">
          <h2>Decision Counts</h2>
          <div className="count-grid">
            {Object.entries(analytics.decision_counts).map(([status, count]) => (
              <div key={status}>
                <span>{status.replace('_', ' ')}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="glass-panel">
          <h2>Lifecycle Counts</h2>
          <div className="count-grid">
            {Object.entries(analytics.lifecycle_counts).map(([status, count]) => (
              <div key={status}>
                <span>{status.replaceAll('_', ' ')}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-panel mt-4">
        <h2>Closed Simulated Trades</h2>
        <div className="table-scroll">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>IPO</th>
                <th>Status</th>
                <th>Lots</th>
                <th>Simulated PnL</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {analytics.past_trades.length === 0 && (
                <tr><td colSpan="5">Advance an accepted IPO through the demo lifecycle to populate reports.</td></tr>
              )}
              {analytics.past_trades.map((trade) => (
                <tr key={`${trade.symbol}-${trade.date}`}>
                  <td>{trade.company_name}</td>
                  <td>{trade.status.replaceAll('_', ' ')}</td>
                  <td>{trade.lots}</td>
                  <td>INR {trade.pnl.toLocaleString()}</td>
                  <td>{formatDate(trade.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
