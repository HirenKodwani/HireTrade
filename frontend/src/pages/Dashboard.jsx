import { useState } from 'react';
import IPODecisionFeed from '../components/IPODecisionFeed';
import Analytics from '../components/Analytics';
import NewsFeed from '../components/NewsFeed';
import { LayoutDashboard, Settings, PieChart, Newspaper, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('feed');
  const navigate = useNavigate();

  const tabs = [
    { id: 'feed', label: 'IPO Workflow', icon: LayoutDashboard },
    { id: 'analytics', label: 'Reports', icon: PieChart },
    { id: 'news', label: 'Source News', icon: Newspaper },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <img src="/Code_Generated_Image (1).png" alt="Logo" style={{height: '32px'}} />
          <h2>HireTrade</h2>
        </div>
        <nav className="sidebar-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
          <div className="sidebar-divider" style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }}></div>
          <button
            className="nav-item"
            onClick={() => navigate('/trader-mode')}
          >
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
            <p className="eyebrow">Architecture-driven local demo</p>
            <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          </div>
        </header>
        
        <div className="tab-content animate-in">
          {activeTab === 'feed' && <IPODecisionFeed />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'news' && <NewsFeed />}
        </div>
      </main>
    </div>
  );
}
