import MetricsEditor from '../components/MetricsEditor';
import { LayoutDashboard, Settings, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TraderMode() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <img src="/Code_Generated_Image (1).png" alt="Logo" style={{height: '32px'}} />
          <h2>HireTrade</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard size={18} /> Back to Dashboard
          </button>
          
          <div className="sidebar-divider" style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }}></div>
          <button className="nav-item active">
            <Settings size={18} /> Trader Mode
          </button>
        </nav>
        <div className="sidebar-footer">
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 8px', lineHeight: '1.4' }}>
            Data sources: Chittorgarh, InvestorGain, IPOWatch & Google News
          </p>
          <button className="nav-item" onClick={() => navigate('/intro')}>
            <Info size={18} /> Project Intro
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="content-header">
          <div>
            <p className="eyebrow">Advanced Control</p>
            <h1>Trader Only Mode</h1>
          </div>
        </header>
        
        <div className="tab-content animate-in">
          <div style={{ maxWidth: '600px' }}>
            <MetricsEditor />
          </div>
        </div>
      </main>
    </div>
  );
}
