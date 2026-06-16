import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../api';

const suggestions = [
  'Should I apply for this IPO?',
  'Explain what GMP means',
  'How does AI decide to accept or reject?',
  'What metrics are most important?',
];

export default function IPOCopilot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your AI Market Analyst. I can help you analyze IPOs, understand GMP trends, and make informed investment decisions using Gemini. What would you like to know?' }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [ipos, setIpos] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/ipos').then(res => setIpos(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    const userQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setLoading(true);

    try {
      const res = await api.post('/copilot', { message: userQuery });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to my AI core at the moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-white">AI Market Analyst</h1>
        </div>
        <p className="text-sm text-gray-400">Your Gemini-powered assistant for IPO investment decisions</p>
      </div>

      <div className="glass-card flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
              )}
              <div className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/20 text-white border border-primary/30'
                  : 'bg-dark-bg/50 text-gray-300 border border-dark-border'
              }`}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={line.startsWith('•') || line.startsWith('**') ? '' : 'mb-1'}>{line}</p>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="bg-dark-bg/50 border border-dark-border p-4 rounded-xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-dark-border">
          {messages.length === 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s); }}
                  className="px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-gray-400 hover:text-white hover:border-primary/30 whitespace-nowrap transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about IPOs..."
              className="flex-1 h-12 px-4 rounded-xl bg-dark-bg border border-dark-border text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 h-12 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
