import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Calendar, Database, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentChats = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/chat');
      setChats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="recent-chats-page fade-in">
      <header className="page-header">
        <h1>Recent Conversations</h1>
        <p>Return to your previous chats and AI assistance sessions.</p>
      </header>

      {loading ? (
        <div className="loading">Loading your history...</div>
      ) : chats.length === 0 ? (
        <div className="empty-state glass">
          <MessageSquare size={48} />
          <h2>No chats yet</h2>
          <p>Start a new conversation from your Knowledge Base dashboard.</p>
          <Link to="/" className="btn-glow">Go to Dashboard</Link>
        </div>
      ) : (
        <div className="chats-list">
          {chats.map(chat => (
            <Link key={chat.id} to={`/chat/${chat.id}?kbId=${chat.kbId}`} className="chat-card glass">
              <div className="chat-info">
                <div className="chat-icon">
                  <MessageSquare size={24} color="#8a2be2" />
                </div>
                <div className="chat-meta">
                  <h3>{chat.title || 'Untitled Conversation'}</h3>
                  <div className="chat-tags">
                    <span><Database size={14} /> {chat.kb?.title}</span>
                    <span><Calendar size={14} /> {new Date(chat.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={20} className="arrow" />
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .recent-chats-page { display: flex; flex-direction: column; gap: 32px; }
        .chats-list { display: flex; flex-direction: column; gap: 16px; }
        .chat-card { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; text-decoration: none; transition: 0.3s; }
        .chat-card:hover { transform: translateX(8px); }
        .chat-info { display: flex; align-items: center; gap: 16px; }
        .chat-icon { width: 48px; height: 48px; background: rgba(138, 43, 226, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .chat-meta h3 { font-size: 1.1rem; color: #fff; margin-bottom: 4px; }
        .chat-tags { display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-muted); }
        .chat-tags span { display: flex; align-items: center; gap: 4px; }
        .arrow { color: var(--text-muted); opacity: 0.5; }
        .chat-card:hover .arrow { opacity: 1; color: var(--accent-primary); }
        .empty-state { padding: 64px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
      `}</style>
    </div>
  );
};

export default RecentChats;
