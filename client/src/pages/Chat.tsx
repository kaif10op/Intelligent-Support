import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Bot, ChevronLeft, Loader2, Info, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, AlertTriangle, Paperclip, File, X, Copy, RotateCcw, Trash2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  createdAt?: string;
}

const Chat = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { subscribeTo, unsubscribeFrom, onChatMessage } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showSources, setShowSources] = useState<number | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsFor, setShowSuggestionsFor] = useState<number | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || id === 'new') return;
      try {
        const res = await axios.get(`http://localhost:8000/api/chat/${id}`, {
          withCredentials: true
        });
        const data = res.data;
        if (data.messages) {
          const formatted = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content,
            sources: m.sources
          }));
          setMessages(formatted);

          const fb: Record<string, number> = {};
          data.messages.forEach((m: any) => {
            if (m.rating) fb[m.id] = m.rating;
          });
          setFeedbackGiven(fb);
        }

        // Subscribe to real-time updates for this chat
        subscribeTo('chat', id);
        onChatMessage(id, (data: any) => {
          if (data.type === 'ai-typing') {
            // Show typing indicator
          } else if (data.message) {
            // Add new message
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
          }
        });
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }

    };

    fetchHistory();

    return () => {
      if (id && id !== 'new') {
        unsubscribeFrom('chat', id);
      }
    };
  }, [id, kbId, subscribeTo, unsubscribeFrom, onChatMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !kbId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kbId', kbId);

    try {
      const res = await axios.post('http://localhost:8000/api/kb/upload', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachedFile({ name: file.name, id: res.data.document.id });
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Failed to upload and process file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || streaming) return;

    let userMessage = input.trim();
    if (attachedFile && !userMessage) {
        userMessage = `I've uploaded a file: ${attachedFile.name}. Can you summarize it or answer questions based on it?`;
    } else if (attachedFile) {
        userMessage = `(Attached: ${attachedFile.name}) ${userMessage}`;
    }

    setInput('');
    setAttachedFile(null);
    setMessages((prev: Message[]) => [...prev, { role: 'user', content: userMessage }]);
    setStreaming(true);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages((prev: Message[]) => [...prev, assistantMessage]);


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
                if (data.chatId && id === 'new') {
                   navigate(`/chat/${data.chatId}?kbId=${kbId}`, { replace: true });
                }
                setTimeout(() => fetchHistoryAgain(data.chatId || id), 500);
              }
            } catch (e) { }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setStreaming(false);
    }
  };

  const fetchHistoryAgain = async (chatId: string) => {
    if (!chatId || chatId === 'new') return;
    try {
      const res = await axios.get(`http://localhost:8000/api/chat/${chatId}`, { withCredentials: true });
      const data = res.data;
      if (data.messages) {
        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content,
          sources: m.sources
        })));
      }
    } catch (e) {}
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    if (!messageId) return;
    try {
      await axios.post(`http://localhost:8000/api/chat/message/${messageId}/feedback`, { rating }, { withCredentials: true });
      setFeedbackGiven(prev => ({ ...prev, [messageId]: rating }));
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const copyMessage = async (content: string, messageId?: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId || 'temp');
      addToast('Message copied to clipboard!', 'success');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      addToast('Failed to copy message', 'error');
    }
  };

  const getSuggestions = async (messageIndex: number) => {
    if (!id || id === 'new') return;
    try {
      const res = await axios.get(`http://localhost:8000/api/chat/${id}/suggestions`, { withCredentials: true });
      if (res.data.suggestions) {
        setSuggestions(res.data.suggestions);
        setShowSuggestionsFor(messageIndex);
      }
    } catch (err) {
      console.error('Suggestions error:', err);
    }
  };

  const regenerateResponse = async () => {
    if (!id || id === 'new' || streaming) return;
    setError(null);
    try {
      setStreaming(true);

      // Remove last AI message
      const updatedMessages = messages.filter(m => !(m.role === 'assistant' && m === messages[messages.length - 1]));
      setMessages(updatedMessages);

      // Get last user message and resend it
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (!lastUserMsg) {
        setError('No user message to regenerate');
        setStreaming(false);
        return;
      }

      // Call the regenerate endpoint first
      await axios.post(`http://localhost:8000/api/chat/${id}/regenerate`, {}, { withCredentials: true });

      // Now send the same message as a new chat
      const newAssistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, newAssistantMessage]);

      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: lastUserMsg.content,
          kbId,
          chatId: id
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
                setTimeout(() => fetchHistoryAgain(data.chatId || id), 500);
              }
            } catch (e) { }
          }
        }
      }
    } catch (err) {
      console.error('Regenerate error:', err);
      setError('Failed to regenerate response');
      setStreaming(false);
    } finally {
      setStreaming(false);
    }
  };

  const clearChat = async () => {
    if (!id || id === 'new') return;
    setError(null);
    try {
      await axios.delete(`http://localhost:8000/api/chat/${id}/clear`, { withCredentials: true });
      setMessages([]);
      setSuggestions([]);
      setShowConfirmClear(false);
      addToast('Chat cleared successfully', 'success');
    } catch (err) {
      console.error('Clear chat error:', err);
      addToast('Failed to clear chat', 'error');
      setError('Failed to clear chat');
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isLowConfidence = (content: string) => {
     const lower = content.toLowerCase();
     return lower.includes('support ticket') || lower.includes('not fully confident') || lower.includes('create a ticket');
  };

  return (
    <div className="chat-page fade-in">
      <header className="chat-header glass">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ChevronLeft size={20} />
          <span>Exit Chat</span>
        </button>
        <div className="kb-indicator">
          <Bot size={20} color="var(--accent-primary)" />
          <span>AI Assistant</span>
        </div>
        <button
          onClick={() => setShowConfirmClear(true)}
          className="clear-btn"
          title="Clear chat history"
          disabled={messages.length === 0}
        >
          <Trash2 size={18} />
        </button>
      </header>

      {error && (
        <div className="error-banner fade-in">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-error">
            <X size={14} />
          </button>
        </div>
      )}

      {showConfirmClear && (
        <div className="modal-overlay" onClick={() => setShowConfirmClear(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <h3>Clear Chat History?</h3>
            <p>This will delete all messages in this chat. This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmClear(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={clearChat} className="btn-danger">
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="messages-container" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="welcome-state">
            <div className="bot-icon-large glass">
              <Bot size={48} color="var(--accent-primary)" />
            </div>
            <h2>How can I help you today?</h2>
            <p>I can answer questions based on the documents you've uploaded to this knowledge base.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`message-wrap ${m.role} fade-in`}>
            <div className={`message glass ${m.role === 'assistant' ? 'assistant-msg' : 'user-msg'}`}>
              <div className="msg-content">
                 <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>

              <div className="msg-footer">
                <span className="msg-time">{formatTime(m.createdAt)}</span>
                <button
                  className={`copy-btn ${copiedMessageId === m.id ? 'copied' : ''}`}
                  onClick={() => copyMessage(m.content, m.id)}
                  title="Copy message"
                >
                  {copiedMessageId === m.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {m.role === 'assistant' && (
                <div className="msg-actions fade-in">
                   <div className="feedback-btns">
                      <button
                        className={`fb-btn ${feedbackGiven[m.id!] === 1 ? 'active' : ''}`}
                        onClick={() => handleFeedback(m.id!, 1)}
                        disabled={!m.id}
                        title="Helpful"
                      >
                         <ThumbsUp size={14} />
                      </button>
                      <button
                        className={`fb-btn ${feedbackGiven[m.id!] === -1 ? 'active' : ''}`}
                        onClick={() => handleFeedback(m.id!, -1)}
                        disabled={!m.id}
                        title="Not Helpful"
                      >
                         <ThumbsDown size={14} />
                      </button>
                      {i === messages.length - 1 && (
                        <button
                          className="fb-btn"
                          onClick={regenerateResponse}
                          disabled={streaming}
                          title="Regenerate response"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                   </div>
                   {isLowConfidence(m.content) && (
                     <button className="escalate-btn" onClick={() => navigate('/tickets')}>
                        <AlertTriangle size={14} />
                        <span>Create Support Ticket</span>
                     </button>
                   )}
                </div>
              )}

              {showSuggestionsFor === i && suggestions.length > 0 && (
                <div className="suggestions-wrap fade-in">
                  <div className="suggestions-label">Suggested follow-ups:</div>
                  <div className="suggestions-list">
                    {suggestions.map((suggestion, si) => (
                      <button
                        key={si}
                        className="suggestion-btn"
                        onClick={() => {
                          setInput(suggestion);
                          setShowSuggestionsFor(null);
                        }}
                        title="Click to ask this question"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {m.role === 'assistant' && i === messages.length - 1 && !streaming && m.content && (
                <button
                  className="show-suggestions-btn"
                  onClick={() => {
                    if (showSuggestionsFor === i && suggestions.length > 0) {
                      setShowSuggestionsFor(null);
                    } else {
                      getSuggestions(i);
                    }
                  }}
                  title="Show suggested follow-up questions"
                >
                  {showSuggestionsFor === i ? '▲' : '▼'} Suggestions
                </button>
              )}

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
                <span>AI is thinking...</span>
             </div>
          </div>
        )}
      </div>

      <div className="input-area-wrapper">
        {attachedFile && (
           <div className="attachment-preview glass fade-in">
              <File size={16} color="var(--accent-secondary)" />
              <span>{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="remove-attach">
                 <X size={14} />
              </button>
           </div>
        )}
        <div className="input-container">
          <div className="input-wrap glass focus-within">
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              onChange={handleFileUpload} 
              accept=".pdf,.txt,.docx,.md"
            />
            <button 
              className={`attach-btn ${uploading ? 'loading' : ''}`} 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || streaming}
              title="Attach File (PDF, DOCX, TXT)"
            >
              {uploading ? <Loader2 size={20} className="spinner" /> : <Paperclip size={20} />}
            </button>
            <textarea 
              placeholder="Ask anything about your documents..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              rows={1}
            />
            <button onClick={handleSend} disabled={streaming || uploading || (!input.trim() && !attachedFile)} className="send-btn">
              {streaming ? <Loader2 className="spinner" size={20} /> : <Send size={20} />}
            </button>
          </div>
          <p className="chat-footer">Powered by RAG Agentic Pipeline • v2.0</p>
        </div>
      </div>

      <style>{`
        .chat-page { display: flex; flex-direction: column; height: 100%; max-height: calc(100vh - 100px); }
        .chat-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-radius: 16px 16px 0 0; margin-bottom: 8px; }
        .back-btn { display: flex; align-items: center; gap: 6px; color: var(--text-muted); background: none; border: none; cursor: pointer; transition: 0.2s; font-weight: 500; }
        .back-btn:hover { color: #fff; transform: translateX(-4px); }
        .kb-indicator { display: flex; align-items: center; gap: 8px; font-weight: 700; padding: 8px 16px; background: rgba(236, 72, 153, 0.1); border-radius: 12px; }
        .clear-btn { background: rgba(255, 127, 0, 0.05); border: 1px solid rgba(255, 127, 0, 0.2); color: rgba(255, 127, 0, 0.6); padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
        .clear-btn:hover:not(:disabled) { background: rgba(255, 127, 0, 0.1); color: #ff7f00; border-color: rgba(255, 127, 0, 0.4); }
        .clear-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .error-banner { display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: rgba(255, 100, 100, 0.1); border: 1px solid rgba(255, 100, 100, 0.3); border-radius: 12px; margin: 8px 24px 0 24px; color: #ff6464; font-size: 0.9rem; animation: slideIn 0.3s ease-out; }
        .close-error { background: none; border: none; color: rgba(255, 100, 100, 0.6); cursor: pointer; display: flex; align-items: center; margin-left: auto; }
        .close-error:hover { color: #ff6464; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; animation: slideIn 0.3s ease-out; }
        .modal-content h3 { margin: 0 0 12px 0; color: #fff; font-size: 1.2rem; }
        .modal-content p { margin: 0 0 20px 0; color: var(--text-muted); font-size: 0.95rem; }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .btn-secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); color: #fff; padding: 10px 20px; border-radius: 10px; cursor: pointer; transition: 0.2s; }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }
        .btn-danger { background: rgba(255, 100, 100, 0.2); border: 1px solid rgba(255, 100, 100, 0.4); color: #ff6464; padding: 10px 20px; border-radius: 10px; cursor: pointer; transition: 0.2s; font-weight: 600; }
        .btn-danger:hover { background: rgba(255, 100, 100, 0.3); }

        .messages-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; padding: 24px 0;scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        .welcome-state { margin: auto; text-align: center; max-width: 500px; display: flex; flex-direction: column; align-items: center; gap: 20px; opacity: 0.7; }
        .bot-icon-large { width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; border-radius: 36px; background: rgba(236, 72, 153, 0.05); }
        .message-wrap { display: flex; width: 100%; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message-wrap.user { justify-content: flex-end; }
        .message-wrap.assistant { justify-content: flex-start; }
        .message { max-width: 75%; padding: 16px 24px; border-radius: 24px; font-size: 1rem; line-height: 1.6; position: relative; }
        .user-msg { background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1)); border: 1px solid rgba(236, 72, 153, 0.3); border-bottom-right-radius: 4px; }
        .assistant-msg { background: var(--bg-card); border-bottom-left-radius: 4px; border: 1px solid var(--glass-border); }
        .loading-msg { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 0.95rem; }
        .msg-content { color: #f0f0f0; }
        .msg-content p { margin-bottom: 12px; }
        .msg-content p:last-child { margin-bottom: 0; }

        .msg-footer { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
        .msg-time { font-size: 0.75rem; color: var(--text-muted); opacity: 0.7; }
        .copy-btn { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); color: var(--text-muted); padding: 4px 8px; border-radius: 6px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; }
        .copy-btn:hover { border-color: var(--accent-secondary); color: var(--accent-secondary); background: rgba(0, 210, 255, 0.05); }
        .copy-btn.copied { color: var(--accent-secondary); background: rgba(0, 210, 255, 0.1); }

        .msg-actions { margin-top: 16px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .feedback-btns { display: flex; gap: 10px; }
        .fb-btn { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); color: var(--text-muted); padding: 6px 10px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
        .fb-btn:hover:not(:disabled) { border-color: var(--accent-primary); color: #fff; background: rgba(236, 72, 153, 0.1); }
        .fb-btn.active { background: rgba(236, 72, 153, 0.2); color: var(--accent-primary); border-color: var(--accent-primary); box-shadow: 0 0 10px rgba(236, 72, 153, 0.2); }
        .escalate-btn { display: flex; align-items: center; gap: 8px; background: rgba(255, 127, 0, 0.1); border: 1px solid rgba(255, 127, 0, 0.3); color: #ff7f00; padding: 6px 14px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: 0.3s; }
        .escalate-btn:hover { background: rgba(255, 127, 0, 0.2); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 127, 0, 0.2); }

        .suggestions-wrap { margin-top: 16px; padding: 12px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; }
        .suggestions-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .suggestions-list { display: flex; flex-direction: column; gap: 8px; }
        .suggestion-btn { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: var(--accent-secondary); padding: 8px 12px; border-radius: 8px; cursor: pointer; text-align: left; transition: 0.2s; font-size: 0.9rem; }
        .suggestion-btn:hover { background: rgba(59, 130, 246, 0.2); border-color: var(--accent-secondary); }
        .show-suggestions-btn { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); color: var(--accent-secondary); padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; font-size: 0.8rem; font-weight: 600; margin-top: 12px; }
        .show-suggestions-btn:hover { background: rgba(59, 130, 246, 0.15); }

        .sources-wrap { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
        .sources-toggle { background: none; border: none; color: var(--accent-secondary); display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700; padding: 6px 10px; border-radius: 6px; transition: 0.2s; }
        .sources-toggle:hover { background: rgba(59, 130, 246, 0.1); }
        .sources-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
        .source-item { font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.02); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); line-height: 1.4; }

        .input-area-wrapper { padding-top: 24px; display: flex; flex-direction: column; gap: 12px; }
        .attachment-preview { align-self: flex-start; display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); font-size: 0.85rem; }
        .remove-attach { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 2px; border-radius: 50%; }
        .remove-attach:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .input-container { position: relative; }
        .input-wrap { display: flex; align-items: center; gap: 16px; padding: 12px 20px; border-radius: 28px; border: 1px solid var(--glass-border); background: rgba(10, 10, 10, 0.8); transition: 0.3s; }
        .input-wrap.focus-within:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 15px rgba(236, 72, 153, 0.1); }
        .attach-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-muted); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .attach-btn:hover:not(:disabled) { border-color: var(--accent-secondary); color: var(--accent-secondary); background: rgba(59, 130, 246, 0.05); }
        .attach-btn.loading { opacity: 0.7; }
        .input-wrap textarea { flex: 1; min-height: 24px; max-height: 200px; background: none; border: none; padding: 10px 0; resize: none; font-size: 1.05rem; color: #fff; }
        .input-wrap textarea:focus { outline: none; }
        .send-btn { background: var(--accent-primary); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; flex-shrink: 0; }
        .send-btn:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 0 15px rgba(236, 72, 153, 0.4); }
        .send-btn:disabled { opacity: 0.4; filter: grayscale(1); }
        .chat-footer { text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 12px; font-weight: 500; letter-spacing: 0.5px; opacity: 0.5; }
        .spinner { animation: rotate 2s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>


    </div>
  );
};

export default Chat;
