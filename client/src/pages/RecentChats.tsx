import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Calendar, Database, ArrowRight, Search, SlidersHorizontal, Trash2, CheckSquare, Square, X, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Card, Button } from '../components/ui';

type SortOption = 'recent' | 'oldest' | 'alphabetical';
type FilterOption = 'all' | 'open' | 'closed';

const RecentChats = () => {
  const { addToast } = useToast();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [deletingChat, setDeletingChat] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.CHAT_LIST, axiosConfig);
      const data = res.data?.data || res.data?.chats || (Array.isArray(res.data) ? res.data : []);
      setChats(Array.isArray(data) ? data : []);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to load chats', 'error');
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const handleDeleteChat = async (chatId: string) => {
    try {
      setDeletingChat(chatId);
      await axios.delete(`${API_ENDPOINTS.CHAT_LIST}/${chatId}`, axiosConfig);
      setChats(chats.filter(c => c.id !== chatId));
      addToast('Chat deleted', 'success');
      setShowDeleteConfirm(null);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to delete chat', 'error');
    } finally {
      setDeletingChat(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChats.size === 0) return;
    
    const confirmed = window.confirm(`Delete ${selectedChats.size} chat(s)? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedChats).map(chatId =>
          axios.delete(`${API_ENDPOINTS.CHAT_LIST}/${chatId}`, axiosConfig)
        )
      );
      setChats(chats.filter(c => !selectedChats.has(c.id)));
      setSelectedChats(new Set());
      setBulkMode(false);
      addToast(`Deleted ${selectedChats.size} chat(s)`, 'success');
    } catch (_err: any) {
      addToast('Failed to delete some chats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectChat = (chatId: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedChats.size === filteredChats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(filteredChats.map(c => c.id)));
    }
  };

  const filteredChats = chats
    .filter(chat => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (chat.title || '').toLowerCase().includes(query);
        const matchesKB = (chat.kb?.title || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesKB) return false;
      }
      if (filterBy === 'open' && chat.isClosed) return false;
      if (filterBy === 'closed' && !chat.isClosed) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === 'alphabetical') return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
      return 0;
    });

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Sticky Header */}
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="px-6 py-8 md:py-10">
           <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between max-w-[1200px] mx-auto">
             <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  <History className="w-3.5 h-3.5" />
                  Chat History
                </div>
                <h1 className="heading-1">Conversations</h1>
                <p className="text-surface-500 max-w-2xl text-[15px] leading-relaxed">
                  Resume past AI sessions or view history of your support interactions.
                </p>
             </div>
             
             <div className="flex gap-3 shrink-0">
               <Button
                 variant={bulkMode ? 'primary' : 'outline'}
                 onClick={() => {
                   setBulkMode(!bulkMode);
                   setSelectedChats(new Set());
                 }}
               >
                 {bulkMode ? 'Done Managing' : 'Manage History'}
               </Button>
             </div>
           </div>

           {/* Filters Bar */}
           <div className="max-w-[1200px] mx-auto mt-8 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search chats by title or KB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-surface-50/50 border border-surface-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 rounded-md hover:bg-surface-200/50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                variant={showFilters ? "primary" : "glass"}
                onClick={() => setShowFilters(!showFilters)}
                icon={<SlidersHorizontal className="w-4 h-4" />}
                className="shrink-0"
              >
                Filters
              </Button>
           </div>
           
           {/* Expanded Filters Drawer */}
           <div className={`max-w-[1200px] mx-auto overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <div className="glass-lg p-5 rounded-2xl flex gap-6">
                 <div className="flex-1">
                    <label className="block text-[11px] font-bold text-surface-500 uppercase tracking-widest mb-2">Sorting</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full bg-transparent border-none p-0 text-sm font-semibold text-foreground focus:ring-0 cursor-pointer"
                    >
                      <option value="recent">Most Recent First</option>
                      <option value="oldest">Oldest Priority</option>
                      <option value="alphabetical">A-Z Name Listing</option>
                    </select>
                 </div>
                 <div className="w-px bg-surface-200/50"></div>
                 <div className="flex-1">
                    <label className="block text-[11px] font-bold text-surface-500 uppercase tracking-widest mb-2">Completion Status</label>
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                      className="w-full bg-transparent border-none p-0 text-sm font-semibold text-foreground focus:ring-0 cursor-pointer"
                    >
                      <option value="all">All Conversations</option>
                      <option value="open">Active / Open</option>
                      <option value="closed">Closed / Resolved</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-8 overflow-y-auto w-full">
         <div className="max-w-[1200px] mx-auto pb-12 w-full space-y-6 animate-fade-in-up delay-100">
           
           {/* Bulk Action Strip */}
           <div className={`overflow-hidden transition-all duration-300 ${bulkMode ? 'max-h-[100px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
             <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-400 hover:opacity-80 transition-opacity">
                    {selectedChats.size === filteredChats.length && filteredChats.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    {selectedChats.size === filteredChats.length && filteredChats.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedChats.size > 0 && <span className="text-sm font-medium text-sky-600/80">({selectedChats.size} selected)</span>}
                </div>
                {selectedChats.size > 0 && (
                   <Button variant="outline" size="sm" onClick={handleBulkDelete} className="border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 shadow-none">
                     Delete {selectedChats.size} Selection{selectedChats.size !== 1 ? 's' : ''}
                   </Button>
                )}
             </div>
           </div>

           {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 rounded-2xl border border-surface-200/50 bg-card shimmer h-24"></div>
                ))}
              </div>
           ) : filteredChats.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-16 glass-elevated border border-dashed border-surface-300 rounded-3xl text-center mt-12">
                <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <MessageSquare className="w-10 h-10 text-surface-400" />
                </div>
                <h3 className="heading-3 mb-2 text-foreground">
                  {chats.length === 0 ? 'No conversations yet' : 'No matches found'}
                </h3>
                <p className="text-surface-500 mb-8 max-w-md text-sm">
                  {chats.length === 0 
                    ? 'Use an AI support agent from a knowledge base to start logging chat history.'
                    : 'Try removing some filters to see more results.'}
                </p>
                {chats.length > 0 && (
                  <Button variant="ghost" onClick={() => { setSearchQuery(''); setFilterBy('all'); }}>
                    Reset Filters
                  </Button>
                )}
             </div>
           ) : (
             <div className="space-y-3">
                {filteredChats.map(chat => (
                  <Card
                    key={chat.id}
                    className={`p-0 overflow-hidden transition-all duration-300 group border-[1.5px] ${
                      selectedChats.has(chat.id) ? 'border-sky-500 bg-sky-50/30' : 'border-surface-200/60 hover:border-sky-300/50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-stretch min-h-[5rem]">
                       {bulkMode && (
                         <div className="flex items-center justify-center pl-6 pr-2" onClick={() => toggleSelectChat(chat.id)}>
                            {selectedChats.has(chat.id) ? (
                              <CheckSquare className="w-6 h-6 text-sky-500 cursor-pointer" />
                            ) : (
                              <Square className="w-6 h-6 text-surface-300 hover:text-surface-400 cursor-pointer" />
                            )}
                         </div>
                       )}

                       <Link
                          to={`/chat/${chat.id}?kbId=${chat.kbId}`}
                          className={`flex-1 flex items-center gap-5 p-5 min-w-0 ${bulkMode ? 'cursor-default pointer-events-none' : 'cursor-pointer'}`}
                       >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              chat.isClosed ? 'bg-surface-100 text-surface-400' : 'bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20'
                          }`}>
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-[15px] font-bold font-heading text-foreground truncate group-hover:text-primary-500 transition-colors">
                                  {chat.title || 'Untitled Session'}
                                </h3>
                                {chat.isClosed && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-200 text-surface-600 rounded-md">
                                    Resolved
                                  </span>
                                )}
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 bg-surface-100 px-2.5 py-1 rounded-md">
                                  <Database className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[150px]">{chat.kb?.title || 'Unknown Source'}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
                                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                                  {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                                </span>
                                {chat._count?.messages !== undefined && (
                                  <span className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
                                    <MessageSquare className="w-3.5 h-3.5 opacity-70" />
                                    {chat._count.messages} msg{chat._count.messages !== 1 ? 's' : ''}
                                  </span>
                                )}
                             </div>
                          </div>
                       </Link>
                       
                       {!bulkMode && (
                          <div className="flex items-center gap-2 pr-6 pl-2 border-l border-surface-100/50 bg-gradient-to-r from-transparent to-surface-50/50">
                            {showDeleteConfirm === chat.id ? (
                              <div className="flex flex-col items-center gap-2 shrink-0 animate-fade-in">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Are you sure?</span>
                                <div className="flex gap-2">
                                   <button onClick={() => handleDeleteChat(chat.id)} disabled={deletingChat === chat.id} className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 disabled:opacity-50 transition-colors">
                                     <CheckSquare className="w-4 h-4" />
                                   </button>
                                   <button onClick={() => setShowDeleteConfirm(null)} className="w-8 h-8 rounded-full bg-surface-200 text-surface-600 flex items-center justify-center hover:bg-surface-300 transition-colors">
                                     <X className="w-4 h-4" />
                                   </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => setShowDeleteConfirm(chat.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0" title="Delete conversation">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <Link to={`/chat/${chat.id}?kbId=${chat.kbId}`} className="w-10 h-10 rounded-full flex items-center justify-center text-surface-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors shrink-0" title="Open chat">
                                  <ArrowRight className="w-5 h-5" />
                                </Link>
                              </>
                            )}
                          </div>
                       )}
                    </div>
                  </Card>
                ))}
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default RecentChats;
