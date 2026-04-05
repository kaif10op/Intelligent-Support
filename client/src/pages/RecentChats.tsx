import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Calendar, Database, ArrowRight, Search, SlidersHorizontal, Trash2, CheckSquare, Square, AlertCircle, X } from 'lucide-react';
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

  const fetchChats = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.CHAT_LIST, axiosConfig);
      const data = res.data?.data || res.data?.chats || (Array.isArray(res.data) ? res.data : []);
      setChats(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load chats';
      addToast(errorMsg, 'error');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      setDeletingChat(chatId);
      await axios.delete(`${API_ENDPOINTS.CHAT_LIST}/${chatId}`, axiosConfig);
      setChats(chats.filter(c => c.id !== chatId));
      addToast('Chat deleted successfully', 'success');
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
      addToast(`Successfully deleted ${selectedChats.size} chat(s)`, 'success');
    } catch (err: any) {
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

  // Filter and sort chats
  const filteredChats = chats
    .filter(chat => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (chat.title || '').toLowerCase().includes(query);
        const matchesKB = (chat.kb?.title || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesKB) return false;
      }

      // Status filter
      if (filterBy === 'open' && chat.isClosed) return false;
      if (filterBy === 'closed' && !chat.isClosed) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sortBy === 'alphabetical') {
        return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
      }
      return 0;
    });

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="heading-1">Recent Conversations</h1>
              <p className="text-surface-600 mt-1">Return to your previous chats and AI assistance sessions</p>
            </div>
            <Button
              variant={bulkMode ? 'primary' : 'outline'}
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedChats(new Set());
              }}
            >
              {bulkMode ? 'Cancel' : 'Manage'}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search chats by title or knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                icon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Filters {showFilters && '▴'}
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="alphabetical">Alphabetical</option>
                    </select>
                  </div>

                  {/* Filter By Status */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">Status</label>
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Chats</option>
                      <option value="open">Open Only</option>
                      <option value="closed">Closed Only</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Bulk Actions Bar */}
            {bulkMode && (
              <Card className="p-4 bg-primary-50 border-primary-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
                    >
                      {selectedChats.size === filteredChats.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {selectedChats.size === filteredChats.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedChats.size > 0 && (
                      <span className="text-sm text-surface-600">
                        {selectedChats.size} selected
                      </span>
                    )}
                  </div>
                  {selectedChats.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete Selected
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Results Count */}
            {(searchQuery || filterBy !== 'all') && (
              <div className="text-sm text-surface-600">
                Showing {filteredChats.length} of {chats.length} conversation(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-surface-200 rounded w-1/3"></div>
                    <div className="flex gap-4">
                      <div className="h-3 bg-surface-200 rounded w-24"></div>
                      <div className="h-3 bg-surface-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-5 w-5 bg-surface-200 rounded flex-shrink-0"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <Card elevated className="p-12 text-center space-y-4 flex flex-col items-center max-w-md mx-auto">
            <MessageSquare className="w-12 h-12 text-surface-300" />
            <h2 className="heading-3">
              {chats.length === 0 ? 'No conversations yet' : 'No matches found'}
            </h2>
            <p className="text-surface-600">
              {chats.length === 0 
                ? 'Start a new conversation from your Knowledge Base dashboard'
                : 'Try adjusting your search or filters'}
            </p>
            {chats.length === 0 ? (
              <Button variant="primary" className="mt-4">
                <Link to="/" className="inline-flex items-center gap-2">
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                  setShowFilters(false);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {filteredChats.map(chat => (
              <Card
                key={chat.id}
                interactive={!bulkMode}
                className={`p-6 flex items-center justify-between ${
                  selectedChats.has(chat.id) ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Checkbox in bulk mode */}
                  {bulkMode && (
                    <button
                      onClick={() => toggleSelectChat(chat.id)}
                      className="flex-shrink-0"
                    >
                      {selectedChats.has(chat.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-surface-400" />
                      )}
                    </button>
                  )}

                  <Link
                    to={`/chat/${chat.id}?kbId=${chat.kbId}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                    onClick={(e) => bulkMode && e.preventDefault()}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-surface-900 truncate">
                          {chat.title || 'Untitled Conversation'}
                        </h3>
                        {chat.isClosed && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-surface-200 text-surface-700 rounded">
                            Closed
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-surface-600">
                        <span className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5" />
                          {chat.kb?.title || 'Unknown KB'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </span>
                        {chat._count?.messages && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {chat._count.messages} message{chat._count.messages !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Individual delete button (not in bulk mode) */}
                  {!bulkMode && (
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      {showDeleteConfirm === chat.id ? (
                        <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Delete?</span>
                          <button
                            onClick={() => handleDeleteChat(chat.id)}
                            disabled={deletingChat === chat.id}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingChat === chat.id ? 'Deleting...' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-2 py-1 text-xs font-medium text-surface-700 bg-surface-200 rounded hover:bg-surface-300"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowDeleteConfirm(chat.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-surface-400 hover:text-red-600 transition-colors"
                            title="Delete chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link to={`/chat/${chat.id}?kbId=${chat.kbId}`}>
                            <ArrowRight className="w-5 h-5 text-surface-600" />
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
  );
};

export default RecentChats;
