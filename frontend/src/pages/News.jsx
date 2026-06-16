import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, MessageSquare } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import api from '../api';

export default function IPONews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/news')
      .then(res => setNews(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white">IPO News</h1>
        </div>
        <p className="text-sm text-gray-400">Latest news and updates from the IPO market</p>
      </div>

      <div className="space-y-4">
        {news.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card-hover p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={item.sentiment > 0 ? 'success' : item.sentiment < 0 ? 'destructive' : 'outline'}>
                    {item.sentiment > 0 ? 'Positive' : item.sentiment < 0 ? 'Negative' : 'Neutral'}
                  </Badge>
                  <span className="text-xs text-gray-600">{item.source}</span>
                </div>
                <h3 className="text-white font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{item.snippet}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Read more <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {!loading && news.length === 0 && (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No news articles available</p>
          </div>
        )}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
