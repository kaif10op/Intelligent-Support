import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Send, Bot, ChevronLeft, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

const Chat = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showSources, setShowSources] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || id === 'new') return;
      try {
        const res = await fetch(`http://localhost:8000/api/chat/${id}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.messages) {
          const formatted = data.messages.map((m: any) => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content,
            sources: m.sources
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchHistory();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setStreaming(true);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          message: userMessage, 
          kbId, 
          chatId: id !== 'new' ? id : undefined 
        })
      });


      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        const chunk = decoder.decode(value, { stream: true });
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.token) {
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  return [...prev.slice(0, -1), { ...last, content: last.content + data.token }];
                });
              } else if (data.event === 'done') {
                if (data.sources) {
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev.slice(0, -1), { ...last, sources: data.sources }];
                  });
                }
                if (data.chatId && id === 'new') {
                   navigate(`/chat/${data.chatId}?kbId=${kbId}`, { replace: true });
                }
              }
            } catch (e) {
                // Fragmented JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setStreaming(false);
    }
  };


  return (
    <div className="chat-page fade-in">
      <header className="chat-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ChevronLeft size={20} />
          <span>Exit Chat</span>
        </button>
        <div className="kb-indicator">
          <Bot size={20} color="#8a2be2" />
          <span>AI Assistant</span>
        </div>
      </header>

      <div className="messages-container" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="welcome-state">
            <div className="bot-icon-large glass">
              <Bot size={48} color="#8a2be2" />
            </div>
            <h2>How can I help you today?</h2>
            <p>I can answer questions based on the documents you've uploaded to this knowledge base.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`message-wrap ${m.role}`}>
            <div className={`message glass ${m.role === 'assistant' ? 'assistant-msg' : 'user-msg'}`}>
              <div className="msg-content">
                 <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              
              {m.sources && m.sources.length > 0 && (
                <div className="sources-wrap">
                  <button onClick={() => setShowSources(showSources === i ? null : i)} className="sources-toggle">
                    <Info size={14} />
                    <span>{m.sources.length} Sources</span>
                    {showSources === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showSources === i && (
                    <div className="sources-list fade-in">
                      {m.sources.map((s: any, si: number) => (
                        <div key={si} className="source-item">
                           <strong>Source {si + 1}:</strong> "{s.content?.slice(0, 100) || 'No preview available'}..."
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {streaming && messages[messages.length - 1].content === '' && (
          <div className="message-wrap assistant">
             <div className="message glass assistant-msg loading-msg">
                <Loader2 className="spinner" size={18} />
                <span>Thinking...</span>
             </div>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrap glass">
          <textarea 
            placeholder="Type your question..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            rows={1}
          />
          <button onClick={handleSend} disabled={streaming || !input.trim()} className="send-btn">
            {streaming ? <Loader2 className="spinner" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <p className="chat-footer">AI will answer ONLY based on your documents. If unsure, it will say so.</p>
      </div>

      <style>{`
        .chat-page { display: flex; flex-direction: column; height: 100%; max-height: calc(100vh - 100px); }
        .chat-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border); margin-bottom: 16px; }
        .back-btn { display: flex; align-items: center; gap: 4px; color: var(--text-muted); background: none; border: none; cursor: pointer; transition: 0.2s; }
        .back-btn:hover { color: #fff; transform: translateX(-4px); }
        .kb-indicator { display: flex; align-items: center; gap: 8px; font-weight: 600; padding: 6px 12px; background: rgba(138, 43, 226, 0.1); border-radius: 20px; border: 1px solid rgba(138, 43, 226, 0.2); }
        .messages-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; padding: 16px 0; }
        .welcome-state { margin: auto; text-align: center; max-width: 500px; display: flex; flex-direction: column; align-items: center; gap: 16px; opacity: 0.6; }
        .bot-icon-large { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; border-radius: 28px; background: rgba(138, 43, 226, 0.05); }
        .message-wrap { display: flex; width: 100%; }
        .message-wrap.user { justify-content: flex-end; }
        .message-wrap.assistant { justify-content: flex-start; }
        .message { max-width: 80%; padding: 16px 20px; border-radius: 20px; font-size: 1rem; line-height: 1.5; position: relative; }
        .user-msg { background: rgba(138, 43, 226, 0.15); border-color: rgba(138, 43, 226, 0.3); border-bottom-right-radius: 4px; }
        .assistant-msg { background: var(--bg-card); border-bottom-left-radius: 4px; }
        .loading-msg { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 0.9rem; }
        .msg-content { color: #f0f0f0; }
        .msg-content p { color: #f0f0f0; margin-bottom: 12px; }
        .msg-content p:last-child { margin-bottom: 0; }
        .sources-wrap { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--glass-border); }
        .sources-toggle { background: none; border: none; color: var(--accent-secondary); display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
        .sources-toggle:hover { background: rgba(0, 210, 255, 0.1); }
        .sources-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .source-item { font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }
        .input-container { padding-top: 24px; position: relative; }
        .input-wrap { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 24px; border: 1px solid var(--glass-border); background: rgba(15, 15, 15, 0.8); }
        .input-wrap textarea { flex: 1; min-height: 24px; max-height: 150px; background: none; border: none; padding: 0; resize: none; font-size: 1rem; color: #fff; }
        .input-wrap textarea:focus { box-shadow: none; }
        .send-btn { background: var(--accent-primary); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .send-btn:hover:not(:disabled) { background: #9b4dff; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .chat-footer { text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 12px; }
        .spinner { animation: rotate 2s linear infinite; }
      `}</style>
    </div>
  );
};

export default Chat;
