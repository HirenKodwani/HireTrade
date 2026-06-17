import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, X, Lock } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      video.style.opacity = '0';
      setTimeout(() => {
        video.play();
        video.style.opacity = '1';
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    video.style.transition = 'opacity 0.5s ease-in-out';
    video.style.opacity = '1';

    return () => {
      if (video) video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const marqueeBrands = [
    { name: "Groww", desc: "Brokerage", logo: "/logos/groww.png" },
    { name: "Zerodha", desc: "Kite API", logo: "/logos/zerodha.png" },
    { name: "Upstox", desc: "Trading", logo: "/logos/upstox.png" },
    { name: "AngelOne", desc: "SmartAPI", logo: "/logos/angel.png" },
    { name: "NSE", desc: "Exchange", logo: "/logos/nse.png" },
    { name: "BSE", desc: "Exchange", logo: "/logos/bse.png" }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'hirenkodwani@gmail.com' && password === 'Hiren@1845') {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="flex flex-col bg-dark-bg min-h-screen font-sans text-gray-100 overflow-x-hidden">
      
      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-dark-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 relative">
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center mb-8 mt-2">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="text-sm text-gray-400 mt-1">Sign in to your HireTrade account</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
                >
                  Log In
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Section (Full Screen) */}
      <section className="relative h-screen flex flex-col overflow-hidden">
        
        {/* Background Video */}
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
        />

        {/* Blurred overlay shape */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none z-0"></div>

        {/* Navbar */}
        <nav className="relative z-20 w-full py-5 px-8 flex justify-between items-center liquid-glass">
          <div className="flex items-center gap-2">
            <img src="/Code_Generated_Image.png" alt="HireTrade Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-2xl font-semibold tracking-tight text-white">HireTrade</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-gray-300">
            <button className="flex items-center gap-1 hover:text-white transition-colors">Features <ChevronDown className="w-4 h-4"/></button>
            <button className="hover:text-white transition-colors">Solutions</button>
            <button className="hover:text-white transition-colors">Plans</button>
            <button className="flex items-center gap-1 hover:text-white transition-colors">Learning <ChevronDown className="w-4 h-4"/></button>
          </div>

          <button 
            onClick={() => setShowLogin(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-2 rounded-full font-medium transition-all duration-200"
          >
            Log in
          </button>
        </nav>
        {/* 1px divider */}
        <div className="relative z-20 h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mt-[3px]"></div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-7xl md:text-[140px] font-bold leading-[1.02] tracking-[-0.024em] text-white">
            HireTrade <span className="bg-clip-text text-transparent bg-gradient-to-l from-[#6366f1] via-[#a855f7] to-[#fcd34d]">AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mt-6 opacity-90 leading-relaxed">
            The most powerful AI ever deployed in IPO acquisition and intelligent algorithmic trading.
          </p>
          <button 
            onClick={() => setShowLogin(true)}
            className="mt-10 group inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white text-lg font-medium pl-8 pr-2 py-2 rounded-full transition-all duration-200"
          >
            Start Applying
            <div className="bg-white rounded-full p-2 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </button>
        </div>

        {/* Logo Marquee (Pinned to bottom) */}
        <div className="relative z-10 w-full max-w-5xl mx-auto pb-10 flex items-center gap-12">
          <div className="text-gray-400 text-sm whitespace-nowrap hidden md:block">
            Integrated with top <br/> brokers across India
          </div>
          <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
            <div className="marquee-track flex gap-16">
              {[...marqueeBrands, ...marqueeBrands].map((brand, i) => (
                <div key={i} className="liquid-glass rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
                  <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden p-1">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                    ) : (
                      brand.name[0]
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">{brand.name}</div>
                    <div className="text-xs text-gray-400">{brand.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Info Section ("Meet HireTrade.") */}
      <section className="px-6 py-24 bg-[#0a0c10]">
        <div className="max-w-[88rem] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
            <div>
              <h2 className="text-white text-4xl md:text-5xl font-medium leading-tight mb-8 tracking-tight">
                Meet HireTrade.
              </h2>
              <button 
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white text-base font-medium pl-6 pr-2 py-2 rounded-full transition-all"
              >
                Discover it
                <div className="bg-white rounded-full p-1.5">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
              </button>
            </div>
            <p className="text-gray-400 text-2xl md:text-3xl leading-relaxed">
              HireTrade is a reward-earning, AI-powered algo platform that lets your investments grow while remaining fully automated and tied to real market logic.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl shadow-2xl mt-4 max-w-5xl mx-auto">
            <div className="h-10 bg-black/40 border-b border-white/10 flex items-center px-4 relative">
              <div className="flex gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs text-white/50 font-medium tracking-wide">HireTrade — Dashboard</span>
              </div>
            </div>
            <div className="relative w-full overflow-hidden bg-[#0c0c0c] min-h-[400px]">
              <img src="/image.png" alt="HireTrade Dashboard" className="w-full h-auto object-cover opacity-90" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Use Cases Section */}
      <section className="px-6 py-24 bg-[#0a0c10]">
        <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="md:pr-12 md:pt-2">
            <div className="text-primary text-sm font-semibold tracking-wider uppercase mb-2">HireTrade in Practice</div>
            <h2 className="text-white text-5xl md:text-6xl font-medium leading-none mb-6 tracking-tight">Use modes</h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              HireTrade powers a wide range of modes for individual investors, HNI traders, and treasuries wanting safe and rewarding integrations.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden min-h-[500px] md:min-h-[720px] group">
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-50"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-transparent"></div>
            <div className="relative z-10 p-10 md:p-12 h-full flex flex-col justify-end">
              <h3 className="text-white text-4xl md:text-5xl font-medium leading-tight mb-5 tracking-tight">Commerce</h3>
              <p className="text-gray-300 text-base max-w-md mb-8">
                Lift retention by offering HireTrade, a trusted AI agent with strong yields, letting your portfolio earn with zero effort.
              </p>
              <button 
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-base font-medium pl-6 pr-2 py-2 rounded-full transition-all self-start"
              >
                Know more
                <div className="bg-white rounded-full p-1.5">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="px-6 py-12 bg-dark-bg border-t border-dark-border text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            © {new Date().getFullYear()} HireTrade AI Inc. All rights reserved. Professional Copywriting.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl mx-auto uppercase tracking-wide font-medium">
            Warning / Caution: Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Past performance is not indicative of future returns. The IPO recommendations and decision logic provided by HireTrade AI are strictly for educational and informational purposes and do not constitute certified financial advice.
          </p>
        </div>
      </footer>

    </div>
  );
}
