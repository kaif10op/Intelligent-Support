import { useState } from 'react';
import { Search as SearchIcon, MessageSquare, Book, Ticket, File, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface SearchResults {
  chats: any[];
  kbs: any[];
  tickets: any[];
  documents: any[];
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'chat' | 'kb' | 'ticket'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const performSearch = async () => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get('http://localhost:8000/api/search', {
        params: { q: query, type, limit: 50 },
        withCredentials: true
      });

      setResults(res.data.results);
      setTotalResults(res.data.totalResults);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return (
    <div className="search-page fade-in">
      <div className="search-header">
        <h1>Search Everything</h1>
        <p>Find chats, knowledge bases, tickets, and documents</p>
      </div>

      {/* Search Box */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <SearchIcon size={20} className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for chats, documents, tickets..."
            className="search-input"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="clear-btn"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div className="search-filters">
          {(['all', 'chat', 'kb', 'ticket'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setResults(null);
              }}
              className={`filter-btn ${type === t ? 'active' : ''}`}
            >
              {t === 'kb' ? 'Knowledge Base' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="search-loading">
          <Loader2 size={32} className="spinning" />
          <p>Searching...</p>
        </div>
      )}

      {error && (
        <div className="search-error">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {results && totalResults === 0 && query && (
        <div className="search-empty">
          <SearchIcon size={48} />
          <h2>No results found</h2>
          <p>Try different keywords or adjust your filters</p>
        </div>
      )}

      {results && totalResults > 0 && (
        <div className="search-results">
          <h2 className="results-title">{totalResults} results found</h2>

          {/* Chats */}
          {results.chats.length > 0 && (
            <div className="result-section">
              <div className="section-header">
                <MessageSquare size={18} />
                <h3>Chats ({results.chats.length})</h3>
              </div>
              <div className="result-items">
                {results.chats.map((chat) => (
                  <a key={chat.id} href={`/chat/${chat.id}`} className="result-item">
                    <div className="result-icon">
                      <MessageSquare size={16} />
                    </div>
                    <div className="result-content">
                      <h4>{chat.title || 'Untitled Chat'}</h4>
                      <p className="result-meta">
                        {chat.kb?.title} • {chat.messages?.length || 0} messages
                      </p>
                    </div>
                    <ChevronRight size={16} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Bases */}
          {results.kbs.length > 0 && (
            <div className="result-section">
              <div className="section-header">
                <Book size={18} />
                <h3>Knowledge Bases ({results.kbs.length})</h3>
              </div>
              <div className="result-items">
                {results.kbs.map((kb) => (
                  <a key={kb.id} href={`/kb/${kb.id}`} className="result-item">
                    <div className="result-icon">
                      <Book size={16} />
                    </div>
                    <div className="result-content">
                      <h4>{kb.title}</h4>
                      <p className="result-meta">{kb._count?.documents || 0} documents</p>
                    </div>
                    <ChevronRight size={16} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {results.tickets.length > 0 && (
            <div className="result-section">
              <div className="section-header">
                <Ticket size={18} />
                <h3>Tickets ({results.tickets.length})</h3>
              </div>
              <div className="result-items">
                {results.tickets.map((ticket) => (
                  <a key={ticket.id} href={`/tickets?id=${ticket.id}`} className="result-item">
                    <div className="result-icon">
                      <Ticket size={16} />
                    </div>
                    <div className="result-content">
                      <h4>{ticket.title}</h4>
                      <p className="result-meta">
                        {ticket.status} • {ticket.priority} priority
                        {ticket.assignedTo && ` • Assigned to ${ticket.assignedTo.name}`}
                      </p>
                    </div>
                    <ChevronRight size={16} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {results.documents.length > 0 && (
            <div className="result-section">
              <div className="section-header">
                <File size={18} />
                <h3>Documents ({results.documents.length})</h3>
              </div>
              <div className="result-items">
                {results.documents.map((doc) => (
                  <div key={doc.id} className="result-item">
                    <div className="result-icon">
                      <File size={16} />
                    </div>
                    <div className="result-content">
                      <h4>{doc.filename}</h4>
                      <p className="result-meta">
                        {doc.kb?.title} • {doc.chunks?.length || 0} chunks matched
                      </p>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .search-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .search-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .search-header h1 {
          font-size: 2rem;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .search-header p {
          color: var(--text-muted);
          font-size: 1rem;
          margin: 0;
        }

        .search-container {
          margin-bottom: 40px;
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(138, 43, 226, 0.3);
          border-radius: 16px;
          padding: 12px 16px;
          transition: 0.2s;
        }

        .search-input-wrapper:focus-within {
          border-color: var(--accent-primary);
          background: rgba(138, 43, 226, 0.1);
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 12px;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          color: #fff;
          font-size: 1rem;
          outline: none;
          padding: 0;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .clear-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 8px;
          font-size: 1.2rem;
          transition: 0.2s;
        }

        .clear-btn:hover {
          color: #fff;
        }

        .search-filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          font-weight: 500;
          transition: 0.2s;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .filter-btn.active {
          background: var(--accent-primary);
          color: #fff;
          border-color: var(--accent-primary);
        }

        .search-loading,
        .search-error,
        .search-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 24px;
          text-align: center;
        }

        .search-loading > .spinning {
          animation: spin 1s linear infinite;
          color: var(--accent-primary);
        }

        .search-error {
          color: #ff6464;
        }

        .search-empty {
          color: var(--text-muted);
        }

        .search-results {
          animation: fadeIn 0.3s ease-out;
        }

        .results-title {
          font-size: 0.9rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 24px 0;
        }

        .result-section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-header h3 {
          color: #fff;
          font-size: 1.1rem;
          margin: 0;
        }

        .section-header svg {
          color: var(--accent-primary);
        }

        .result-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .result-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          text-decoration: none;
          transition: 0.2s;
          cursor: pointer;
        }

        .result-item:hover {
          background: rgba(138, 43, 226, 0.1);
          border-color: rgba(138, 43, 226, 0.3);
          transform: translateX(4px);
        }

        .result-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(138, 43, 226, 0.2);
          border-radius: 8px;
          color: var(--accent-primary);
          margin-right: 12px;
        }

        .result-content {
          flex: 1;
          min-width: 0;
        }

        .result-content h4 {
          color: #fff;
          font-size: 0.95rem;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-meta {
          color: var(--text-muted);
          font-size: 0.8rem;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-item svg:last-child {
          color: var(--text-muted);
          margin-left: 12px;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .search-page {
            padding: 24px 12px;
          }

          .search-header h1 {
            font-size: 1.5rem;
          }

          .search-input-wrapper {
            font-size: 0.9rem;
          }

          .filter-btn {
            padding: 6px 12px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Search;
