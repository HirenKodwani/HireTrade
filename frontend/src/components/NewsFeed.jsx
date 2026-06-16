import { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';
import api from '../api';

function formatDate(value) {
  if (!value || value === 'Unknown') return 'Unknown time';
  return new Date(value).toLocaleString();
}

export default function NewsFeed() {
  const [news, setNews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/news')
      .then((response) => setNews(response.data))
      .catch(() => setError('The public IPO news adapter is unavailable.'));
  }, []);

  return (
    <div className="glass-panel">
      <h2><Newspaper size={20} /> Public IPO News Adapter</h2>
      {error && <p className="notice danger">{error}</p>}
      <div className="news-grid">
        {!error && news.length === 0 && (
          <p className="empty-state">No live public IPO news items were parsed.</p>
        )}
        {news.map((item) => (
          <article key={`${item.title}-${item.date}`} className="news-card">
            <div className="news-header">
              <span className={`sentiment-badge ${item.sentiment >= 0 ? 'bg-success' : 'bg-danger'}`}>
                Signal {item.sentiment}
              </span>
              <span className="news-date">{formatDate(item.date)}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.snippet}</p>
            <strong className="news-source">{item.source}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}
