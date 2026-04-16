import { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, MessageSquare, Database, Ticket, File, Loader2, AlertCircle, ChevronRight, Hash, Command } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Button, Card, Badge } from '../components/ui';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      setError(err.response?.data?.error || 'Search index disconnected');
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
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      
      {/* Decorative Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[40%] h-[500px] bg-gradient-to-b from-primary-500/5 to-transparent blur-[100px] rounded-bl-full"></div>
         <div className="absolute bottom-0 left-0 w-[50%] h-[300px] bg-gradient-to-t from-blue-500/5 to-transparent blur-[100px] rounded-tr-full"></div>
      </div>

      <div className="flex-1 px-6 py-12 md:py-20 overflow-y-auto w-full relative z-10 flex flex-col items-center">
        <div className="w-full max-w-3xl mx-auto space-y-12 animate-fade-in-up">
          
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500/10 to-indigo-500/10 border border-primary-500/20 flex items-center justify-center shadow-lg mx-auto mb-6 relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary-500/10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <SearchIcon className="w-8 h-8 text-primary-500 relative z-10 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
             </div>
             <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground bg-clip-text">Network Global Scope</h1>
             <p className="text-surface-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">Cross-index search for chats, memory vectors, support tickets, and raw documentation.</p>
          </div>

          {/* Search Box Engine */}
          <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
             <Card elevated className="p-2 relative bg-background/80 backdrop-blur-xl border border-surface-200/50 flex flex-col md:flex-row shadow-xl">
               <div className="flex-1 flex items-center bg-transparent px-2">
                 <SearchIcon className="w-6 h-6 text-primary-500 shrink-0 ml-2" />
                 <input
                   ref={inputRef}
                   type="text"
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder="Enter syntax or natural language query..."
                   className="w-full bg-transparent border-none focus:ring-0 text-lg md:text-xl text-foreground placeholder-surface-400 py-4 px-4 pr-12 focus:outline-none"
                   autoFocus
                 />
                 <div className="absolute right-4 md:right-36 hidden sm:flex items-center gap-1 text-[11px] font-bold tracking-widest text-surface-400 bg-surface-100 px-2 py-1 rounded-md opacity-0 transition-opacity group-focus-within:opacity-100">
                    <Command size={12}/> K
                 </div>
               </div>
               <div className="hidden md:block w-px bg-surface-200/50 my-2"></div>
               <Button variant="primary" onClick={performSearch} loading={loading} className="py-4 md:py-0 md:px-8 m-2 shadow-lg shadow-primary-500/20 md:w-32 justify-center text-[15px]">
                  Execute
               </Button>
             </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
             <span className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mr-2">Target Filter:</span>
             {(['all', 'chat', 'kb', 'ticket'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); setResults(null); }}
                  className={`px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    type === t
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105'
                      : 'bg-white dark:bg-card text-surface-500 border border-surface-200/50 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {t === 'kb' ? 'Memory Sphere' : t === 'all' ? 'Global Space' : t}
                </button>
             ))}
          </div>

          {/* Loading Engine */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
               <div className="relative">
                 <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
                 <div className="relative bg-card p-4 rounded-full shadow-lg border border-primary-500/20">
                    <Loader2 size={32} className="animate-spin text-primary-500" />
                 </div>
               </div>
               <p className="text-[12px] text-surface-500 font-bold uppercase tracking-widest animate-pulse mt-2">Querying Database Indices</p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col items-center justify-center gap-3 animate-fade-in text-center max-w-lg mx-auto">
               <AlertCircle size={32} className="text-rose-500" />
               <h3 className="heading-4 text-rose-700">Execution Blocked</h3>
               <p className="text-[13px] font-medium text-rose-600/80">{error}</p>
            </div>
          )}

          {results && totalResults === 0 && query && (
             <div className="flex flex-col items-center justify-center py-24 gap-4 text-center animate-fade-in border-2 border-dashed border-surface-200/50 rounded-3xl bg-surface-50/30">
               <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mb-2">
                 <SearchIcon className="w-8 h-8 text-surface-400" />
               </div>
               <h3 className="heading-3 text-foreground">Zero Matches Found</h3>
               <p className="text-sm text-surface-500 font-medium max-w-sm">No internal vectors, support threads, or configurations matched the query parameters.</p>
             </div>
          )}

          {results && totalResults > 0 && (
             <div className="space-y-12 animate-fade-in pt-8">
                <div className="flex items-center gap-4 before:h-px before:flex-1 before:bg-surface-200 after:h-px after:flex-1 after:bg-surface-200">
                   <Badge variant="info" className="px-4 py-1.5 shadow-sm border-primary-200/50">
                      Found {totalResults} Indexed Elements
                   </Badge>
                </div>

                {/* Chats */}
                {results.chats.length > 0 && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-3 pl-2 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600"><MessageSquare size={20}/></div>
                        <h3 className="heading-4 text-foreground">Chat Sessions <span className="text-sm font-medium text-surface-400 ml-2">({results.chats.length})</span></h3>
                     </div>
                     <div className="grid gap-3">
                       {results.chats.map(chat => (
                         <a key={chat.id} href={`/chat/${chat.id}`} className="block group">
                            <Card className="p-0 overflow-hidden flex items-stretch border-surface-200/60 hover:border-indigo-400/50 hover:shadow-lg transition-all duration-300">
                               <div className="w-2 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors"></div>
                               <div className="p-5 flex flex-1 items-center gap-5">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                   <MessageSquare className="w-5 h-5 text-indigo-500" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <h4 className="text-[15px] font-bold text-surface-900 group-hover:text-indigo-600 transition-colors truncate">{chat.title || 'Untitled Session'}</h4>
                                   <p className="text-[12px] font-medium text-surface-500 mt-1 flex items-center gap-2">
                                     <Hash size={12}/> {chat.kb?.title} <span className="opacity-40">•</span> {chat.messages?.length || 0} transmission(s)
                                   </p>
                                 </div>
                                 <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1 shrink-0" />
                               </div>
                            </Card>
                         </a>
                       ))}
                     </div>
                   </div>
                )}

                {/* Tickets */}
                {results.tickets.length > 0 && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-3 pl-2 mb-6">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600"><Ticket size={20}/></div>
                        <h3 className="heading-4 text-foreground">Support Threads <span className="text-sm font-medium text-surface-400 ml-2">({results.tickets.length})</span></h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {results.tickets.map(ticket => (
                         <a key={ticket.id} href={`/tickets?id=${ticket.id}`} className="block group">
                            <Card className="p-5 h-full flex flex-col border-[1.5px] border-surface-200/60 hover:border-amber-400/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-[100px] -z-10 group-hover:scale-150 transition-transform"></div>
                               <div className="flex items-start justify-between mb-4">
                                 <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                   <Ticket className="w-5 h-5 text-amber-500" />
                                 </div>
                                 <Badge variant={ticket.priority === 'URGENT' ? 'error' : ticket.priority === 'HIGH' ? 'warning' : 'info'} size="sm" className="shadow-sm">
                                   {ticket.priority} Prio
                                 </Badge>
                               </div>
                               <h4 className="text-[15px] font-bold text-surface-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug mb-3 flex-1">{ticket.title}</h4>
                               <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-surface-500 border-t border-surface-100 pt-3">
                                  <span>{ticket.status}</span>
                                  <span className="text-surface-400">{ticket.assignedTo ? 'Claimed' : 'Unassigned'} <ChevronRight size={14} className="inline group-hover:text-amber-500 transition-transform group-hover:translate-x-1" /></span>
                               </div>
                            </Card>
                         </a>
                       ))}
                     </div>
                   </div>
                )}

                {/* KBs */}
                {results.kbs.length > 0 && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-3 pl-2 mb-6">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600"><Database size={20}/></div>
                        <h3 className="heading-4 text-foreground">Memory Spheres <span className="text-sm font-medium text-surface-400 ml-2">({results.kbs.length})</span></h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {results.kbs.map(kb => (
                         <a key={kb.id} href={`/kb/${kb.id}`} className="block group">
                            <Card className="p-5 border-surface-200/60 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300">
                               <div className="flex flex-col items-center text-center">
                                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                   <Database className="w-6 h-6" />
                                 </div>
                                 <h4 className="text-[14px] font-bold text-surface-900 group-hover:text-emerald-700 transition-colors mb-2 line-clamp-1 w-full">{kb.title}</h4>
                                 <p className="text-[12px] font-medium text-surface-500 bg-surface-100 px-3 py-1 rounded-full">{kb._count?.documents || 0} Vector Documents</p>
                               </div>
                            </Card>
                         </a>
                       ))}
                     </div>
                   </div>
                )}

                {/* Documents */}
                {results.documents.length > 0 && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-3 pl-2 mb-6">
                        <div className="p-2 bg-sky-500/10 rounded-lg text-sky-600"><File size={20}/></div>
                        <h3 className="heading-4 text-foreground">Attached Files <span className="text-sm font-medium text-surface-400 ml-2">({results.documents.length})</span></h3>
                     </div>
                     <div className="grid gap-3">
                       {results.documents.map(doc => (
                         <a key={doc.id} href={`/kb/${doc.kbId}`} className="block group">
                            <Card className="p-4 flex items-center gap-4 border-surface-200/60 hover:border-sky-400/50 hover:shadow-md transition-all">
                               <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                 <File className="w-5 h-5 text-sky-500" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <h4 className="text-[14px] font-bold text-surface-900 truncate group-hover:text-sky-600 transition-colors">{doc.filename}</h4>
                                 <p className="text-[11px] font-medium text-surface-500 mt-1 flex items-center gap-1.5">
                                   From Sphere: <span className="text-surface-700">{doc.kb?.title}</span> <span className="opacity-40">•</span> {doc.chunks?.length || 0} Data Chunks
                                 </p>
                               </div>
                               <Button variant="ghost" size="sm" className="hidden sm:flex text-[12px] group-hover:bg-sky-50 group-hover:text-sky-700">
                                  View Context <ChevronRight size={14} className="ml-1" />
                               </Button>
                            </Card>
                         </a>
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
