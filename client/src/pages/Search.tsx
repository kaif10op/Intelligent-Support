import { useState } from 'react';
import { Search as SearchIcon, MessageSquare, Database, Ticket, File, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Button, Input, Card } from '../components/ui';

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
      const res = await axios.get(API_ENDPOINTS.SEARCH, {
        params: { q: query, type, limit: 50 },
        ...axiosConfig
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur">
        <div className="px-6 py-6">
          <h1 className="heading-1">Search Everything</h1>
          <p className="text-surface-600 mt-1">Find chats, knowledge bases, tickets, and documents</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-3xl space-y-8">
          {/* Search Container */}
          <div className="space-y-4">
            {/* Search Input */}
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for chats, documents, tickets..."
              icon={<SearchIcon className="w-5 h-5" />}
              autoFocus
            />

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              {(['all', 'chat', 'kb', 'ticket'] as const).map((t) => (
                <Button
                  key={t}
                  variant={type === t ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => {
                    setType(t);
                    setResults(null);
                  }}
                >
                  {t === 'kb' ? 'Knowledge Base' : t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              <p className="text-surface-600">Searching...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {results && totalResults === 0 && query && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <SearchIcon className="w-12 h-12 text-surface-300" />
              <h2 className="heading-3">No results found</h2>
              <p className="text-surface-600">Try different keywords or adjust your filters</p>
            </div>
          )}

          {/* Results */}
          {results && totalResults > 0 && (
            <div className="space-y-8">
              <p className="text-xs font-semibold text-surface-600 uppercase tracking-widest">{totalResults} results found</p>

              {/* Chats Section */}
              {results.chats.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2 py-1 border-b border-surface-200">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-surface-900">Chats ({results.chats.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {results.chats.map((chat) => (
                      <a
                        key={chat.id}
                        href={`/chat/${chat.id}`}
                      >
                        <Card interactive className="p-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-surface-900 font-medium truncate text-sm">{chat.title || 'Untitled Chat'}</h4>
                            <p className="text-xs text-surface-600 truncate mt-0.5">
                              {chat.kb?.title} • {chat.messages?.length || 0} messages
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-surface-600 flex-shrink-0" />
                        </Card>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Bases Section */}
              {results.kbs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2 py-1 border-b border-surface-200">
                    <Database className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-surface-900">Knowledge Bases ({results.kbs.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {results.kbs.map((kb) => (
                      <a
                        key={kb.id}
                        href={`/kb/${kb.id}`}
                      >
                        <Card interactive className="p-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-surface-900 font-medium truncate text-sm">{kb.title}</h4>
                            <p className="text-xs text-surface-600 truncate mt-0.5">{kb._count?.documents || 0} documents</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-surface-600 flex-shrink-0" />
                        </Card>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tickets Section */}
              {results.tickets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2 py-1 border-b border-surface-200">
                    <Ticket className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-semibold text-surface-900">Tickets ({results.tickets.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {results.tickets.map((ticket) => (
                      <a
                        key={ticket.id}
                        href={`/tickets?id=${ticket.id}`}
                      >
                        <Card interactive className="p-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Ticket className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-surface-900 font-medium truncate text-sm">{ticket.title}</h4>
                            <p className="text-xs text-surface-600 truncate mt-0.5">
                              {ticket.status} • {ticket.priority} priority
                              {ticket.assignedTo && ` • Assigned to ${ticket.assignedTo.name}`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-surface-600 flex-shrink-0" />
                        </Card>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {results.documents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2 py-1 border-b border-surface-200">
                    <File className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-surface-900">Documents ({results.documents.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {results.documents.map((doc) => (
                      <Card interactive key={doc.id} className="p-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <File className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-surface-900 font-medium truncate text-sm">{doc.filename}</h4>
                          <p className="text-xs text-surface-600 truncate mt-0.5">
                            {doc.kb?.title} • {doc.chunks?.length || 0} chunks matched
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-surface-600 flex-shrink-0" />
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
