import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Calendar, Database, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Card, Button } from '../components/ui';

const RecentChats = () => {
  const { addToast } = useToast();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.CHAT_LIST, axiosConfig);
      const data = Array.isArray(res.data) ? res.data : res.data.chats || res.data.data || [];
      setChats(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load chats';
      addToast(errorMsg, 'error');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6">
          <h1 className="heading-1">Recent Conversations</h1>
          <p className="text-surface-600 mt-1">Return to your previous chats and AI assistance sessions</p>
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
        ) : chats.length === 0 ? (
          <Card elevated className="p-12 text-center space-y-4 flex flex-col items-center max-w-md mx-auto">
            <MessageSquare className="w-12 h-12 text-surface-300" />
            <h2 className="heading-3">No conversations yet</h2>
            <p className="text-surface-600">Start a new conversation from your Knowledge Base dashboard</p>
            <Button variant="primary" className="mt-4">
              <Link to="/" className="inline-flex items-center gap-2">
                Go to Dashboard
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {chats.map(chat => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}?kbId=${chat.kbId}`}
              >
                <Card interactive className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-surface-900 truncate">{chat.title || 'Untitled Conversation'}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-surface-600">
                        <span className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5" />
                          {chat.kb?.title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-surface-600 ml-4 flex-shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentChats;
