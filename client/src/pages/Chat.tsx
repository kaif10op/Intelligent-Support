import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Bot, ChevronLeft, Loader2, Info, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, AlertTriangle, Paperclip, File, X, Copy, Trash2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';

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
  const [kbName, setKbName] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch chat history and KB info
  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || id === 'new') return;
      try {
        const res = await axios.get(API_ENDPOINTS.CHAT_DETAIL(id), axiosConfig);
        const data = res.data;

        // Set KB name
        if (data.kb?.title) setKbName(data.kb.title);

        // Load messages
        if (data.messages && Array.isArray(data.messages)) {
          const formatted = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content,
            sources: m.sources,
            createdAt: m.createdAt
          }));
          setMessages(formatted);

          // Load feedback
          const fb: Record<string, number> = {};
          data.messages.forEach((m: any) => {
            if (m.rating) fb[m.id] = m.rating;
          });
          setFeedbackGiven(fb);
        }

        subscribeTo('chat', id);
        onChatMessage(id, (data: any) => {
          if (data.message) {
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

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  }, [messages, streaming]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !kbId) {
      addToast('Please select a file and KB', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kbId', kbId);

    try {
      const res = await axios.post(API_ENDPOINTS.KB_UPLOAD, formData, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachedFile({ name: file.name, id: res.data.document?.id });
      addToast('File uploaded successfully', 'success');
    } catch (err: any) {
      console.error('File upload failed:', err);
      addToast(err.response?.data?.error || 'Failed to upload file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || streaming) return;

    let userMessage = input.trim();
    if (attachedFile && !userMessage) {
      userMessage = `I've uploaded a file: ${attachedFile.name}. Can you analyze it?`;
    } else if (attachedFile) {
      userMessage = `(Attached: ${attachedFile.name}) ${userMessage}`;
    }

    setInput('');
    setAttachedFile(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setStreaming(true);
    setError(null);

    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CREATE, {
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
                  const last = { ...prev[prev.length - 1] };
                  last.content = last.content + data.token;
                  return [...prev.slice(0, -1), last];
                });
              } else if (data.event === 'done') {
                if (data.chatId && id === 'new') {
                  navigate(`/chat/${data.chatId}?kbId=${kbId}`, { replace: true });
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
      addToast('Failed to send message', 'error');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    if (!messageId) return;
    try {
      await axios.post(
        apiUrl(`/api/chat/message/${messageId}/feedback`),
        { rating },
        axiosConfig
      );
      setFeedbackGiven(prev => ({ ...prev, [messageId]: rating }));
      addToast('Feedback recorded', 'success');
    } catch (err) {
      console.error('Feedback error:', err);
      addToast('Failed to submit feedback', 'error');
    }
  };

  const copyMessage = async (content: string, messageId?: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId || 'temp');
      addToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      addToast('Failed to copy', 'error');
    }
  };

  const clearChat = async () => {
    if (!id || id === 'new') return;
    try {
      await axios.delete(apiUrl(`/api/chat/${id}/clear`), axiosConfig);
      setMessages([]);
      setShowConfirmClear(false);
      addToast('Chat cleared successfully', 'success');
    } catch (err: any) {
      addToast('Failed to clear chat', 'error');
    }
  };

  const getSuggestions = async (messageIndex: number) => {
    if (!id || id === 'new') return;
    try {
      const res = await axios.get(apiUrl(`/api/chat/${id}/suggestions`), axiosConfig);
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        setShowSuggestionsFor(messageIndex);
      }
    } catch (err) {
      console.error('Suggestions error:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header - Fixed */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-card/50 text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          <span>Exit</span>
        </button>

        {kbName && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Bot size={18} className="text-primary" />
            <span className="text-sm font-medium text-foreground truncate">
              {kbName}
            </span>
          </div>
        )}

        <button
          onClick={() => setShowConfirmClear(true)}
          disabled={messages.length === 0}
          className="p-2 rounded-lg hover:bg-card/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear chat"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-6 py-3 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm animate-fadeIn">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages Container - Scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot size={32} className="text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">How can I help?</h2>
              <p className="text-muted-foreground">Ask anything about your documents</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`max-w-lg space-y-2`}>
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-6 py-4 ${
                    m.role === 'user'
                      ? 'bg-primary/20 border border-primary/30 text-foreground'
                      : 'glass-elevated border border-border/50'
                  }`}
                >
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Message Actions */}
                {m.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-2 px-4">
                    {/* Copy Button */}
                    <button
                      onClick={() => copyMessage(m.content, m.id)}
                      className={`p-2 rounded-lg transition-colors text-sm ${
                        copiedMessageId === m.id
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
                      }`}
                      title="Copy"
                    >
                      {copiedMessageId === m.id ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>

                    {/* Feedback Buttons */}
                    <button
                      onClick={() => handleFeedback(m.id!, 1)}
                      className={`p-2 rounded-lg transition-colors ${
                        feedbackGiven[m.id!] === 1
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp size={16} />
                    </button>

                    <button
                      onClick={() => handleFeedback(m.id!, -1)}
                      className={`p-2 rounded-lg transition-colors ${
                        feedbackGiven[m.id!] === -1
                          ? 'bg-destructive/20 text-destructive'
                          : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
                      }`}
                      title="Not helpful"
                    >
                      <ThumbsDown size={16} />
                    </button>

                    {/* Suggestions Button */}
                    {i === messages.length - 1 && !streaming && (
                      <button
                        onClick={() => getSuggestions(i)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-secondary hover:bg-card/50 transition-colors"
                      >
                        {showSuggestionsFor === i ? (
                          <>
                            <ChevronUp size={14} /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> Suggest
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Follow-Up Suggestions */}
                {showSuggestionsFor === i && suggestions.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {suggestions.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => {
                          setInput(s);
                          setShowSuggestionsFor(null);
                        }}
                        className="block w-full text-left px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-xs hover:bg-secondary/20 transition-colors"
                      >
                        → {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowSources(showSources === i ? null : i)}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Info size={14} />
                      {m.sources.length} Sources
                      {showSources === i ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>

                    {showSources === i && (
                      <div className="space-y-2 mt-2">
                        {m.sources.map((s: any, si: number) => (
                          <div
                            key={si}
                            className="p-3 rounded-lg bg-card/50 border border-border/30 text-xs text-muted-foreground"
                          >
                            <strong>Source {si + 1}:</strong>
                            <p className="mt-1 line-clamp-2">
                              "{s.content?.slice(0, 100) || 'No preview'}..."
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {streaming && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-6 py-4 rounded-2xl glass-elevated border border-border/50">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Fixed */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 space-y-3">
        {/* File Preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/20 w-fit">
            <File size={16} className="text-secondary flex-shrink-0" />
            <span className="text-sm text-secondary truncate">{attachedFile.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="ml-2 p-1 hover:bg-black/20 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex gap-3 items-end">
          {/* File Upload */}
          <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={handleFileUpload}
            accept=".pdf,.txt,.docx,.md,.png,.jpg,.jpeg,.gif"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || streaming}
            className="p-3 rounded-full bg-card/50 hover:bg-card border border-border/50 hover:border-secondary transition-colors disabled:opacity-50 flex-shrink-0"
            title="Attach file"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-secondary" />
            ) : (
              <Paperclip size={20} className="text-muted-foreground" />
            )}
          </button>

          {/* Message Input */}
          <div className="flex-1 flex gap-2 items-center px-4 py-3 rounded-full bg-card/50 border border-border/50 focus-within:border-primary focus-within:bg-card/80 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              disabled={streaming}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={streaming || uploading || (!input.trim() && !attachedFile)}
            className="p-3 rounded-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground transition-colors disabled:cursor-not-allowed flex-shrink-0"
            title="Send message"
          >
            {streaming ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center">
          Powered by RAG AI system
        </p>
      </div>

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-elevated border border-border/50 rounded-lg p-8 max-w-sm w-full animate-fadeIn">
            <h3 className="text-xl font-bold text-foreground mb-2">Clear Chat?</h3>
            <p className="text-muted-foreground mb-6">
              This will delete all messages. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border/50 text-foreground font-medium hover:bg-card/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearChat}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
