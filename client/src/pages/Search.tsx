import { useState } from 'react';
import { Search as SearchIcon, MessageSquare, Database, Ticket, File, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Search Everything</h1>
        <p className="text-muted-foreground text-lg">Find chats, knowledge bases, tickets, and documents</p>
      </div>

      {/* Search Container */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative flex items-center gap-3 px-4 py-3 bg-card/50 border-2 border-primary/30 rounded-lg hover:border-primary/50 focus-within:border-primary transition-all">
          <SearchIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for chats, documents, tickets..."
            className="flex-1 bg-transparent text-foreground outline-none placeholder-muted-foreground text-base"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-lg font-light"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {(['all', 'chat', 'kb', 'ticket'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setResults(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50'
              }`}
            >
              {t === 'kb' ? 'Knowledge Base' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {results && totalResults === 0 && query && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <SearchIcon className="w-12 h-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold text-foreground">No results found</h2>
          <p className="text-muted-foreground">Try different keywords or adjust your filters</p>
        </div>
      )}

      {/* Results */}
      {results && totalResults > 0 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{totalResults} results found</p>

          {/* Chats Section */}
          {results.chats.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2 py-1 border-b border-border/30">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="text-fn font-semibold text-foreground">Chats ({results.chats.length})</h3>
              </div>
              <div className="space-y-2">
                {results.chats.map((chat) => (
                  <a
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    className="flex items-center gap-4 p-3 bg-card/30 border border-border/20 rounded-lg hover:bg-primary/10 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-medium truncate text-sm">{chat.title || 'Untitled Chat'}</h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {chat.kb?.title} • {chat.messages?.length || 0} messages
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Bases Section */}
          {results.kbs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2 py-1 border-b border-border/30">
                <Database className="w-5 h-5 text-secondary" />
                <h3 className="text-base font-semibold text-foreground">Knowledge Bases ({results.kbs.length})</h3>
              </div>
              <div className="space-y-2">
                {results.kbs.map((kb) => (
                  <a
                    key={kb.id}
                    href={`/kb/${kb.id}`}
                    className="flex items-center gap-4 p-3 bg-card/30 border border-border/20 rounded-lg hover:bg-secondary/10 hover:border-secondary/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/25 transition-colors">
                      <Database className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-medium truncate text-sm">{kb.title}</h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{kb._count?.documents || 0} documents</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tickets Section */}
          {results.tickets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2 py-1 border-b border-border/30">
                <Ticket className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-semibold text-foreground">Tickets ({results.tickets.length})</h3>
              </div>
              <div className="space-y-2">
                {results.tickets.map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/tickets?id=${ticket.id}`}
                    className="flex items-center gap-4 p-3 bg-card/30 border border-border/20 rounded-lg hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/25 transition-colors">
                      <Ticket className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-medium truncate text-sm">{ticket.title}</h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {ticket.status} • {ticket.priority} priority
                        {ticket.assignedTo && ` • Assigned to ${ticket.assignedTo.name}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {results.documents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2 py-1 border-b border-border/30">
                <File className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-semibold text-foreground">Documents ({results.documents.length})</h3>
              </div>
              <div className="space-y-2">
                {results.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 bg-card/30 border border-border/20 rounded-lg hover:bg-emerald-500/10 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                      <File className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-medium truncate text-sm">{doc.filename}</h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {doc.kb?.title} • {doc.chunks?.length || 0} chunks matched
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
