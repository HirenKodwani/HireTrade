import { useNavigate } from 'react-router-dom';
import { Rocket, TrendingUp, ShieldCheck, BarChart3, Zap, Brain, ArrowRight } from 'lucide-react';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: 'Real-Time Evaluation',
      desc: 'Scan live GMP and Subscription data automatically with instant updates.'
    },
    {
      icon: ShieldCheck,
      title: 'Rule-Based Decisions',
      desc: 'Set hard thresholds for QIB, Retail, and P/E ratios to secure your capital.'
    },
    {
      icon: Zap,
      title: 'Automated Analysis',
      desc: 'Process multiple IPOs simultaneously with AI-powered insights and recommendations.'
    },
    {
      icon: Brain,
      title: 'Bias Elimination',
      desc: 'Remove emotional decision-making with objective, data-driven metrics.'
    }
  ];

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Logo and Badge */}
        <div className="logo-wrapper">
          <img src="/Code_Generated_Image (1).png" alt="HireTrade Logo" className="logo-img" />
        </div>
        <span className="badge">✨ Intelligent IPO Trading Platform</span>

        {/* Hero Section */}
        <h1 className="hero-title">
          Make Smarter IPO Investments with Data-Driven Intelligence
        </h1>
        <p className="hero-subtitle">
          Eliminate emotional bias and make confident investment decisions. Track upcoming IPOs in real-time with automated analysis and rule-based evaluation metrics that protect your capital.
        </p>
        
        {/* CTA Buttons */}
        <div className="cta-buttons-wrapper">
          <button className="btn hero-btn" onClick={() => navigate('/dashboard')}>
            <Rocket size={18} /> Launch Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => {
            document.querySelector('.features-grid')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Learn More <ArrowRight size={18} />
          </button>
        </div>

        {/* Hero Visualization */}
        <div className="hero-visualization">
          {/* Animated Chart Visualization */}
          <svg width="100%" height="100%" viewBox="0 0 600 300" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ff5722', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#ff5722', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[...Array(4)].map((_, i) => (
              <line key={`h-${i}`} x1="50" y1={50 + i * 60} x2="550" y2={50 + i * 60} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            {/* Chart bars */}
            <g>
              {[70, 45, 85, 60, 95, 75].map((height, i) => (
                <rect
                  key={i}
                  x={80 + i * 75}
                  y={200 - height}
                  width="50"
                  height={height}
                  fill={`rgba(255, 87, 34, ${0.3 + i * 0.1})`}
                  rx="6"
                  style={{ animation: `slideUp 0.8s ease-out forwards ${0.2 + i * 0.1}s` }}
                />
              ))}
            </g>
            {/* Trend line */}
            <polyline
              points="105,130 180,85 255,110 330,60 405,95 480,50"
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth="2"
              style={{ animation: 'slideUp 0.8s ease forwards 0.4s', opacity: 0 }}
            />
          </svg>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <BarChart3 size={48} style={{ color: 'var(--accent-color)', opacity: 0.3 }} />
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="feature-card">
                <Icon size={32} className="feature-icon" />
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-value">78%</div>
            <div className="stat-label">Average Win Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">₹142.5K+</div>
            <div className="stat-label">Total P&L Generated</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">500+</div>
            <div className="stat-label">IPOs Analyzed</div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="final-cta">
          <h2>Ready to Transform Your IPO Strategy?</h2>
          <p>Start using data-driven insights to make confident investment decisions today.</p>
          <button className="btn hero-btn" onClick={() => navigate('/dashboard')}>
            <Rocket size={18} /> Enter Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
