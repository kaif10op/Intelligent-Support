import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Calendar, Database, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentChats = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/chat', { withCredentials: true });
      // Handle different response structures
      const data = Array.isArray(res.data) ? res.data : res.data.chats || res.data.data || [];
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Recent Conversations</h1>
        <p className="text-muted-foreground">Return to your previous chats and AI assistance sessions.</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="glass-elevated border border-border/50 rounded-lg p-12 text-center space-y-4 flex flex-col items-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/50" />
          <h2 className="text-2xl font-semibold text-foreground">No chats yet</h2>
          <p className="text-muted-foreground">Start a new conversation from your Knowledge Base dashboard.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors mt-4">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map(chat => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}?kbId=${chat.kbId}`}
              className="glass-elevated border border-border/50 rounded-lg p-6 flex items-center justify-between hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-foreground truncate">{chat.title || 'Untitled Conversation'}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
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
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentChats;
