import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Bot, ChevronLeft, Loader2, Info, ThumbsUp, ThumbsDown, AlertTriangle, Paperclip, File, X, Copy, Trash2, Check, Zap, ArrowRightLeft, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';
import { useAuthStore } from '../store/useAuthStore';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';
import PresenceIndicators from '../components/PresenceIndicators';
import { Button, Card } from '../components/ui';

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'human' | 'system';
  content: string;
  sources?: any[];
  createdAt?: string;
  senderName?: string;
  senderRole?: string;
}

const AI_TOOL_OPTIONS = [
  { value: 'draft_reply', label: 'Draft Reply', category: 'responses' },
  { value: 'summary', label: 'Summary', category: 'analysis' },
  { value: 'sentiment', label: 'Sentiment', category: 'analysis' },
  { value: 'next_steps', label: 'Next Steps', category: 'planning' },
  { value: 'escalation_check', label: 'Escalation Check', category: 'risk' },
  { value: 'root_cause', label: 'Root Cause', category: 'analysis' },
  { value: 'priority_assessment', label: 'Priority', category: 'risk' },
  { value: 'sla_risk', label: 'SLA Risk', category: 'risk' },
  { value: 'response_tone', label: 'Tone Improve', category: 'responses' },
  { value: 'knowledge_gaps', label: 'KB Gaps', category: 'knowledge' },
  { value: 'followup_questions', label: 'Follow-up Qs', category: 'responses' },
  { value: 'resolution_plan', label: 'Resolution Plan', category: 'planning' },
  { value: 'concise_reply', label: 'Concise Reply', category: 'responses' },
  { value: 'empathetic_reply', label: 'Empathetic Reply', category: 'responses' },
  { value: 'deescalation_reply', label: 'De-escalation', category: 'responses' },
  { value: 'executive_summary', label: 'Executive Summary', category: 'analysis' },
  { value: 'intent_detection', label: 'Intent Detection', category: 'analysis' },
  { value: 'blocker_identification', label: 'Blocker Finder', category: 'analysis' },
  { value: 'verification_steps', label: 'Verification Steps', category: 'planning' },
  { value: 'workaround_generation', label: 'Workaround', category: 'planning' },
  { value: 'bug_report_draft', label: 'Bug Report', category: 'documentation' },
  { value: 'incident_update', label: 'Incident Update', category: 'responses' },
  { value: 'action_items', label: 'Action Items', category: 'planning' },
  { value: 'customer_update_short', label: 'Customer Update Short', category: 'responses' },
  { value: 'customer_update_detailed', label: 'Customer Update Detailed', category: 'responses' },
  { value: 'rca_template', label: 'RCA Template', category: 'documentation' },
  { value: 'policy_compliance_check', label: 'Policy Check', category: 'risk' },
  { value: 'refund_eligibility_check', label: 'Refund Check', category: 'risk' },
  { value: 'upsell_opportunity', label: 'Upsell Signal', category: 'analysis' },
  { value: 'churn_risk_assessment', label: 'Churn Risk', category: 'risk' },
  { value: 'language_simplify', label: 'Simplify Language', category: 'responses' },
  { value: 'translation_ready', label: 'Translation Ready', category: 'responses' },
  { value: 'qa_test_scenarios', label: 'QA Scenarios', category: 'planning' },
  { value: 'kb_article_draft', label: 'KB Article', category: 'documentation' },
  { value: 'handoff_note', label: 'Handoff Note', category: 'documentation' },
  { value: 'staffing_recommendation', label: 'Staffing Advice', category: 'risk' },
  { value: 'time_to_resolve_estimate', label: 'TTR Estimate', category: 'planning' },
  { value: 'confidence_score', label: 'Confidence', category: 'analysis' },
  { value: 'risk_matrix', label: 'Risk Matrix', category: 'risk' },
  { value: 'closure_checklist', label: 'Closure Checklist', category: 'planning' }
] as const;



const Chat = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { subscribeTo, unsubscribeFrom, onChatMessage, sendChatMessage } = useSocket();
  const user = useAuthStore((state: any) => state.user);
  const isAgent = ['SUPPORT_AGENT', 'ADMIN', 'SUPPORT', 'AGENT'].includes(user?.role || '');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsFor, setShowSuggestionsFor] = useState<number | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [kbName, setKbName] = useState<string>('');
  const [sendingHuman, setSendingHuman] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAiToolbelt, setShowAiToolbelt] = useState(false);
  const [showSources, setShowSources] = useState<number | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [humanInput, setHumanInput] = useState('');
  const [handoffStatus, setHandoffStatus] = useState<any>(null);
  const [requestingHandoff, setRequestingHandoff] = useState(false);
  
  const [aiToolMode, setAiToolMode] = useState('draft_reply');
  const [aiToolResult, setAiToolResult] = useState('');
  const [aiToolLoading, setAiToolLoading] = useState(false);
  const [aiToolSearch, setAiToolSearch] = useState('');
  const [aiToolCategory, setAiToolCategory] = useState<string>('all');
  const [aiFavoriteTools, setAiFavoriteTools] = useState<string[]>([]);

  
  const [userAiMode, setUserAiMode] = useState('summary');
  const [userAiResult, setUserAiResult] = useState('');
  const [userAiLoading, setUserAiLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const filteredTools = useMemo(() => {
    const q = aiToolSearch.trim().toLowerCase();
    return AI_TOOL_OPTIONS.filter((tool) => {
      const inCategory = aiToolCategory === 'all' || tool.category === aiToolCategory;
      const inSearch = !q || tool.label.toLowerCase().includes(q) || tool.value.includes(q);
      return inCategory && inSearch;
    });
  }, [aiToolSearch, aiToolCategory]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chat.aiToolFavorites');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setAiFavoriteTools(parsed.filter((v) => typeof v === 'string'));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat.aiToolFavorites', JSON.stringify(aiFavoriteTools));
  }, [aiFavoriteTools]);

  useEffect(() => {
    const cleanupChat = onChatMessage(id || 'new', (data: any) => {
      if (data.type === 'ai-token') {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          
          if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: newMessages[lastIndex].content + data.token
            };
            return newMessages;
          } else {
            return [...prev, { role: 'assistant', content: data.token }];
          }
        });
      } else if (data.type === 'ai-complete') {
        setStreaming(false);
        if (data.chatId && id === 'new') {
          navigate(`/chat/${data.chatId}?kbId=${kbId}`, { replace: true });
        }
      } else if (data.type === 'ai-error') {
        setStreaming(false);
        setError(data.message || 'AI generation failed');
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.role === 'assistant' && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else if (data.type === 'ai-paused') {
        setStreaming(false);
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.role === 'assistant' && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        addToast(data.message || 'A support agent is viewing this conversation, so AI is paused.', 'info');
      }
    });

    const fetchHistory = async () => {
      if (!id || id === 'new') return;
      try {
        const res = await axios.get(API_ENDPOINTS.CHAT_DETAIL(id), axiosConfig);
        const data = res.data;
        if (data.kb?.title) setKbName(data.kb.title);
        if (data.messages && Array.isArray(data.messages)) {
          const formatted = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role === 'ai' ? 'assistant' : m.role,
            content: m.content,
            sources: m.sources,
            createdAt: m.createdAt,
            senderName: m.senderName,
            senderRole: m.senderRole
          }));
          setMessages(formatted);
          const fb: Record<string, number> = {};
          data.messages.forEach((m: any) => {
            if (m.rating) fb[m.id] = m.rating;
          });
          setFeedbackGiven(fb);
        }
        subscribeTo('chat', id);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    fetchHistory();

    return () => {
      cleanupChat();
      if (id && id !== 'new') {
        unsubscribeFrom('chat', id);
      }
    };
  }, [id, kbId, subscribeTo, unsubscribeFrom, onChatMessage, navigate, addToast]);

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
      sendChatMessage({
        message: userMessage,
        kbId: kbId || '',
        chatId: id !== 'new' ? id : undefined
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
      addToast('Failed to send message', 'error');
      setMessages(prev => prev.slice(0, -1));
      setStreaming(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    if (!messageId) return;
    try {
      await axios.post(apiUrl(`/api/chat/message/${messageId}/feedback`), { rating }, axiosConfig);
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
      addToast('Copied!', 'success');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (_err) {
      addToast('Copy failed', 'error');
    }
  };

  const clearChat = async () => {
    if (!id || id === 'new') return;
    try {
      await axios.delete(apiUrl(`/api/chat/${id}/clear`), axiosConfig);
      setMessages([]);
      setShowConfirmClear(false);
      addToast('Chat cleared successfully', 'success');
    } catch (_err: any) {
      addToast('Failed to clear chat', 'error');
    }
  };

  const getSuggestions = useCallback(async (messageIndex: number) => {
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
  }, [id]);

  useEffect(() => {
    if (!streaming && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content.length > 0) {
        getSuggestions(messages.length - 1);
      }
    }
  }, [streaming, messages, id, getSuggestions]);

  const loadHandoffStatus = useCallback(async () => {
    if (!id || id === 'new') return;
    try {
      const res = await axios.get(API_ENDPOINTS.CHAT_HUMAN_STATUS(id), axiosConfig);
      setHandoffStatus(res.data);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    loadHandoffStatus();
  }, [loadHandoffStatus]);

  useEffect(() => {
    if (isAgent && showTransfer) {
      const fetchAgents = async () => {
        try {
          const res = await axios.get(API_ENDPOINTS.TICKET_AGENTS, axiosConfig);
          const agentList = res.data?.data || [];
          setAgents(agentList.filter((a: any) => a.id !== user?.id));
        } catch (err) {
          console.error(err);
        }
      };
      fetchAgents();
    }
  }, [showTransfer, isAgent, user?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isAgent || !id || id === 'new') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRequestAIAssistance();
        return;
      }

      if (e.altKey && /^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        if (filteredTools[idx]) {
          e.preventDefault();
          setAiToolMode(filteredTools[idx].value);
          addToast(`Selected: ${filteredTools[idx].label}`, 'info');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAgent, id, filteredTools, addToast]);

  const requestHumanHandoff = async () => {
    if (!id || id === 'new') return;
    setRequestingHandoff(true);
    try {
      await axios.post(API_ENDPOINTS.CHAT_HUMAN_REQUEST(id), { reason: 'Customer requested human support' }, axiosConfig);
      addToast('Human support requested. An agent will join shortly.', 'success');
      await loadHandoffStatus();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to request human handoff', 'error');
    } finally {
      setRequestingHandoff(false);
    }
  };

  const takeOverChat = async () => {
    if (!id || id === 'new') return;
    try {
      await axios.post(API_ENDPOINTS.CHAT_HUMAN_TAKEOVER(id), {}, axiosConfig);
      addToast('You have taken over this chat', 'success');
      await loadHandoffStatus();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to take over chat', 'error');
    }
  };

  const runAiTool = useCallback(async (mode: string, writeResult = true) => {
    if (!id || id === 'new') {
      addToast('Open a specific chat to run AI tools', 'info');
      return '';
    }

    try {
      setAiToolLoading(true);
      const res = await axios.post(
        API_ENDPOINTS.CHAT_HUMAN_ASSIST(id),
        { context: messages[messages.length - 1]?.content || '', mode },
        axiosConfig
      );
      const output = res.data.suggestion || 'No output generated.';
      if (writeResult) setAiToolResult(output);
      return output;
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to get AI assistance', 'error');
      return '';
    } finally {
      setAiToolLoading(false);
    }
  }, [id, messages, addToast]);

  const handleSendHumanMessage = async () => {
    if (!humanInput.trim() || !id || id === 'new') return;

    setSendingHuman(true);
    try {
      await axios.post(
        API_ENDPOINTS.CHAT_HUMAN_MESSAGE(id),
        { message: humanInput },
        axiosConfig
      );

      setMessages(prev => [...prev, {
        role: 'human',
        content: humanInput,
        senderName: user?.name || 'Support Agent',
        senderRole: user?.role
      }]);

      setHumanInput('');
      addToast('Message sent to customer', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to send message', 'error');
    } finally {
      setSendingHuman(false);
    }
  };

  const handleRequestAIAssistance = useCallback(async () => {
    await runAiTool(aiToolMode, true);
  }, [aiToolMode, runAiTool]);

  const handleInsertAiIntoReply = () => {
    if (!aiToolResult) return;
    setHumanInput(prev => (prev ? `${prev}\n\n${aiToolResult}` : aiToolResult));
    addToast('AI output inserted into reply box', 'success');
  };

  const runUserCopilot = async () => {
    if (!id || id === 'new') {
      addToast('Save conversation to use AI copilot', 'info');
      return;
    }
    try {
      setUserAiLoading(true);
      const context = messages[messages.length - 1]?.content || input || '';
      const res = await axios.post(
        API_ENDPOINTS.TICKET_AI_COPILOT,
        { flow: 'problem_solving', mode: userAiMode, context },
        axiosConfig
      );
      setUserAiResult(res.data?.suggestion || 'No output.');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to run AI copilot', 'error');
    } finally {
      setUserAiLoading(false);
    }
  };

  const handleInsertUserAi = () => {
    if (!userAiResult) return;
    setInput((prev) => (prev ? `${prev}\n\n${userAiResult}` : userAiResult));
    addToast('AI output inserted into chat input', 'success');
  };

  const handleTransferChat = async (targetAgentId: string) => {
    if (!id || id === 'new') return;
    try {
      await axios.post(
        API_ENDPOINTS.CHAT_HUMAN_TRANSFER(id, targetAgentId),
        { reason: 'Transferred by support agent' },
        axiosConfig
      );
      setShowTransfer(false);
      addToast('Chat transferred successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to transfer chat', 'error');
    }
  };

  return (
    <div className="flex flex-col w-full h-screen bg-background overflow-hidden relative">
      
      {/* Decorative Background for Premium App Feel */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary-500 blur-[100px]"></div>
        <div className="absolute top-[60%] -left-[10%] w-[40%] h-[40%] rounded-full bg-violet-500 blur-[120px]"></div>
      </div>

      {/* Floating Glass Header */}
      <div className="z-40 p-4 shrink-0">
        <header className="flex items-center justify-between gap-4 px-6 py-4 glass-elevated border border-surface-200/50 rounded-2xl w-full mx-auto max-w-[1200px] shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-100/80 text-surface-500 hover:text-foreground transition-all duration-300 font-bold text-sm tracking-wide"
          >
            <ChevronLeft size={18} />
            Exit Chat
          </button>

          {kbName && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 shadow-sm backdrop-blur-md">
              <Bot size={16} className="text-primary-600" />
              <span className="text-[13px] font-bold text-primary-700 truncate max-w-[200px]">
                {kbName}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
             {id && id !== 'new' && (
               <PresenceIndicators resourceId={id} resourceType="chat" />
             )}
             <button
               onClick={() => setShowConfirmClear(true)}
               disabled={messages.length === 0}
               className="p-2.5 rounded-xl hover:bg-rose-50 text-surface-400 hover:text-rose-500 hover:shadow-sm hover:border hover:border-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-transparent"
               title="Clear Session"
             >
               <Trash2 size={18} />
             </button>
          </div>
        </header>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 z-30 mx-4 max-w-[1200px] xl:mx-auto w-full">
           <div className="flex items-center gap-3 px-5 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 font-medium text-sm rounded-xl animate-fade-in-up">
             <AlertTriangle size={16} className="flex-shrink-0" />
             <span className="flex-1">{error}</span>
             <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity p-1 bg-rose-500/10 rounded-md">
               <X size={14} />
             </button>
           </div>
        </div>
      )}

      {/* Embedded Handoff State */}
      {id && id !== 'new' && messages.length > 1 && (
        <div className="relative z-30 px-4 pt-2 shrink-0 max-w-[1200px] mx-auto w-full">
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 px-5 py-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
            <div className="text-[13px] flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-600"><AlertTriangle size={14} /></div>
              {handoffStatus?.assignedAgent?.name ? (
                <span><strong className="text-amber-700">Human Support Active:</strong> Handled by {handoffStatus.assignedAgent.name}</span>
              ) : handoffStatus?.handoffRequested ? (
                <span className="font-bold text-amber-600">Escalation Requested — Routing to human agent</span>
              ) : (
                <span className="text-surface-600 font-medium">Standard automated AI support</span>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!isAgent && !handoffStatus?.handoffRequested && (
                <Button variant="primary" size="sm" onClick={requestHumanHandoff} disabled={requestingHandoff} className="shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 border-none">
                  {requestingHandoff ? 'Signaling...' : 'Escalate to Human'}
                </Button>
              )}
              {isAgent && !handoffStatus?.assignedAgent && (
                <Button variant="primary" size="sm" onClick={takeOverChat} className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 border-none">
                  Take Over Thread
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-24 space-y-6 scrollbar-thin scrollbar-thumb-surface-200 scrollbar-track-transparent max-w-[1200px] mx-auto w-full relative z-10"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 relative">
            <div className="absolute inset-0 bg-primary-500/10 blur-[100px] rounded-full w-64 h-64 mx-auto pointer-events-none"></div>
            <div className="w-20 h-20 rounded-3xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shadow-inner relative z-10">
              <Sparkles className="w-10 h-10 text-primary-500" />
            </div>
            <div className="text-center space-y-2 relative z-10">
              <h2 className="heading-3 text-foreground">Initiate Thread</h2>
              <p className="text-surface-500 font-medium text-sm">Send a message to begin AI analysis.</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' || m.role === 'human' ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
              <div className="max-w-[85%] sm:max-w-lg lg:max-w-xl space-y-1.5 flex flex-col">
                
                {/* Meta details above bubble */}
                {(m.role === 'human' || m.role === 'system' || m.role === 'user') && (
                  <div className={`text-[10px] uppercase tracking-widest font-bold px-4 ${m.role === 'user' || m.role === 'human' ? 'text-right text-primary-600/70' : 'text-left text-surface-400'}`}>
                    {m.senderName ? `${m.senderName} ${m.senderRole ? `(${m.senderRole})` : ''}` : m.role}
                  </div>
                )}
                {m.role === 'assistant' && (
                  <div className="text-[10px] uppercase tracking-widest font-bold px-4 text-left text-indigo-500/70 flex items-center gap-1">
                     <Bot size={10} /> Copilot
                  </div>
                )}

                {/* Primary Message Bubble Design (iMessage/Modern style) */}
                <div
                  className={`px-5 py-4 ${
                    m.role === 'user'
                      ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm shadow-md shadow-primary-500/10 self-end'
                      : m.role === 'human'
                      ? 'bg-amber-500 text-white rounded-2xl rounded-tr-sm shadow-md shadow-amber-500/10 self-end'
                      : m.role === 'system'
                      ? 'bg-surface-200/50 text-surface-600 rounded-2xl rounded-tl-sm border border-surface-200/50 self-start text-[13px] font-medium'
                      : 'bg-card text-foreground rounded-2xl rounded-tl-sm border border-surface-200 shadow-sm self-start'
                  }`}
                >
                  <div className="prose prose-slate dark:prose-invert max-w-none text-[14.5px] leading-relaxed">
                     <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Inline Action Bar Below Assistant Response */}
                {m.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-1.5 px-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(m.content, m.id)}
                      className={`p-1.5 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1 ${copiedMessageId === m.id ? 'text-primary-600 bg-primary-100' : 'text-surface-400 hover:text-surface-600 hover:bg-surface-100'}`}
                      title="Copy Output"
                    >
                      {copiedMessageId === m.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedMessageId === m.id && "Copied"}
                    </button>

                    <button
                      onClick={() => handleFeedback(m.id!, 1)}
                      className={`p-1.5 rounded-lg transition-colors ${feedbackGiven[m.id!] === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'text-surface-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      title="Mark accurate"
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button
                      onClick={() => handleFeedback(m.id!, -1)}
                      className={`p-1.5 rounded-lg transition-colors ${feedbackGiven[m.id!] === -1 ? 'bg-rose-500/10 text-rose-600' : 'text-surface-400 hover:text-rose-500 hover:bg-rose-50'}`}
                      title="Mark inaccurate"
                    >
                      <ThumbsDown size={12} />
                    </button>

                    {i === messages.length - 1 && !streaming && showSuggestionsFor === i && suggestions.length > 0 && (
                      <button onClick={() => setShowSuggestionsFor(null)} className="ml-auto text-[10px] font-bold text-surface-400 hover:text-surface-600">
                        Hide Follow-ups
                      </button>
                    )}
                  </div>
                )}

                {/* AI Follow-Ups */}
                {showSuggestionsFor === i && suggestions.length > 0 && (
                  <div className="space-y-2 mt-2 self-start max-w-[90%]">
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest pl-2">Follow-up prompts</p>
                    <div className="flex flex-wrap gap-2">
                       {suggestions.map((s, si) => (
                         <button
                           key={si}
                           onClick={() => { setInput(s); setShowSuggestionsFor(null); }}
                           className="text-left px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-[12px] font-medium hover:bg-primary-100 transition-colors shadow-sm"
                         >
                           {s}
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                {/* AI Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-1 self-start">
                    <button
                      onClick={() => setShowSources(showSources === i ? null : i)}
                      className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-surface-400 hover:text-surface-600 border border-surface-200 hover:bg-surface-50 rounded-full transition-colors"
                    >
                      <Info size={12} />
                      {m.sources.length} Indexed Sources
                    </button>
                    {showSources === i && (
                      <div className="space-y-2 mt-2 px-3">
                        {m.sources.map((s: any, si: number) => (
                          <div key={si} className="p-3 rounded-xl bg-surface-50 border border-surface-200/60 text-[12px] text-surface-600">
                            <strong className="text-surface-800">Source {si + 1}:</strong>
                            <p className="mt-1 font-mono text-[11px] opacity-80 leading-relaxed border-l-2 border-primary-500/30 pl-2">
                              "{s.content?.slice(0, 150) || 'No preview'}..."
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

        {/* Pulse Loading indicator */}
        {streaming && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-surface-200 shadow-sm max-w-[200px]">
              <Loader2 size={16} className="animate-spin text-primary-500" />
              <span className="text-[13px] font-bold text-surface-500 animate-pulse">Generating</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Composer Shell (Fixed at bottom) */}
      <div className="relative z-40 bg-card border-t border-surface-200/60 p-4 shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1200px] mx-auto space-y-4">
          
          {/* ----- AGENT / STAFF CONTROLS ----- */}
          {isAgent && (
             <div className="flex flex-col gap-3">
               
               {/* Human Intercept Bar */}
               <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2 w-full animate-fade-in-up transition-all">
                  <div className="flex items-center justify-center p-2 rounded-xl bg-amber-500/20 text-amber-600 shrink-0">
                     <AlertTriangle size={18} />
                  </div>
                  <input
                    type="text"
                    value={humanInput}
                    onChange={(e) => setHumanInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendHumanMessage(); } }}
                    placeholder="Intercept as human support agent..."
                    className="flex-1 bg-transparent border-none text-[14px] text-foreground placeholder:text-amber-600/50 outline-none focus:ring-0"
                    disabled={sendingHuman}
                  />
                  <Button size="sm" variant="glass" className="bg-amber-500 text-white hover:bg-amber-600 border-none shadow-sm shrink-0" onClick={handleSendHumanMessage} disabled={sendingHuman || !humanInput.trim()}>
                     {sendingHuman ? <Loader2 size={16} className="animate-spin" /> : 'Send Intercept'}
                  </Button>
               </div>

               {/* Control Strip */}
               <div className="flex gap-2 items-center flex-wrap px-1">
                  <Button variant="ghost" size="sm" onClick={() => setShowTransfer(!showTransfer)} className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">
                     <ArrowRightLeft size={14} className="mr-1.5" /> Transfer
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAiToolbelt(!showAiToolbelt)} className={`${showAiToolbelt ? 'bg-primary-500/10 text-primary-600' : 'text-surface-500'} font-bold uppercase tracking-wider text-[10px]`}>
                     <Zap size={14} className="mr-1.5" /> Ops Toolbelt
                  </Button>
               </div>

               {/* Expanded Ops Toolbelt */}
               {showAiToolbelt && (
                 <Card elevated className="p-4 mt-2 bg-gradient-to-br from-primary-500/5 to-purple-500/5 border-primary-500/10 space-y-4">
                    <div className="flex gap-2">
                      <input
                        value={aiToolSearch}
                        onChange={(e) => setAiToolSearch(e.target.value)}
                        placeholder="Search toolkit..."
                        className="w-1/3 min-w-[200px] px-3 py-1.5 rounded-lg bg-white/50 dark:bg-black/20 border border-primary-500/20 text-[13px] outline-none focus:ring-2 focus:ring-primary-500/30"
                      />
                      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                         {['all', 'responses', 'analysis', 'planning'].map((cat) => (
                           <button key={cat} onClick={() => setAiToolCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${aiToolCategory === cat ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}>
                             {cat}
                           </button>
                         ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                       {filteredTools.map(({ value, label }) => (
                         <div key={value} className="relative group/tool">
                            <button
                               onClick={() => setAiToolMode(value)}
                               className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold transition-all ${aiToolMode === value ? 'bg-primary-500/10 border-primary-500/40 text-primary-700 border shadow-sm' : 'bg-surface-50 border border-surface-200 text-surface-600 hover:border-primary-500/30'}`}
                            >
                               {label}
                            </button>
                         </div>
                       ))}
                    </div>

                    <div className="flex gap-2 items-center pt-2 border-t border-primary-500/10">
                       <Button size="sm" variant="primary" className="shadow-primary-500/30" onClick={handleRequestAIAssistance} disabled={aiToolLoading}>
                          {aiToolLoading ? 'Scanning...' : 'Execute Tool'}
                       </Button>
                       {aiToolResult && (
                         <>
                           <Button size="sm" variant="ghost" onClick={handleInsertAiIntoReply}>Insert below</Button>
                           <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50" onClick={() => setAiToolResult('')}>Discard</Button>
                         </>
                       )}
                    </div>

                    {aiToolResult && (
                      <div className="p-4 bg-white/80 dark:bg-black/40 rounded-xl border border-primary-500/20 text-[13px] font-medium leading-relaxed max-h-[200px] overflow-y-auto text-foreground shadow-inner">
                         {aiToolResult}
                      </div>
                    )}
                 </Card>
               )}

               {showTransfer && agents.length > 0 && (
                 <div className="flex gap-2 flex-wrap items-center p-2 rounded-xl bg-surface-50 border border-surface-200/50 mt-1">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 pl-2 pr-4 w-full md:w-auto">Transfer to</p>
                   {agents.map((agent: any) => (
                     <Button key={agent.id} size="sm" variant="glass" onClick={() => handleTransferChat(agent.id)}>
                       {agent.name || agent.email}
                     </Button>
                   ))}
                 </div>
               )}
             </div>
          )}

          {/* ----- USER / CUSTOMER CONTROLS ----- */}
          {!isAgent && (
             <div className="w-full">
               <div className="flex gap-2 items-center mb-3 overflow-x-auto scrollbar-hide pb-1">
                 <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-primary-500/10 text-primary-600 mr-2 shrink-0">
                    <Zap size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Copilot</span>
                 </div>
                 {[
                   ['summary', 'Summarize'],
                   ['next_steps', 'What\'s Next'],
                   ['customer_reply', 'Draft Msg']
                 ].map(([value, label]) => (
                   <button
                     key={value}
                     onClick={() => setUserAiMode(value)}
                     className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors border ${userAiMode === value ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-transparent text-surface-500 border-surface-200 hover:bg-surface-50'}`}
                   >
                     {label}
                   </button>
                 ))}
                 <div className="ml-auto flex gap-1">
                   <Button size="sm" variant={userAiResult ? 'ghost' : 'outline'} onClick={runUserCopilot} disabled={userAiLoading} className="text-[11px] h-7 px-3">
                      Run Copilot
                   </Button>
                   {userAiResult && (
                     <Button size="sm" variant="primary" onClick={handleInsertUserAi} className="text-[11px] h-7 px-3">
                       Add to input
                     </Button>
                   )}
                 </div>
               </div>

               {userAiResult && (
                 <div className="mb-3 p-3 bg-surface-50 border border-surface-200 rounded-xl text-[13px] relative group text-foreground font-medium shadow-inner">
                    {userAiResult}
                    <button onClick={() => setUserAiResult('')} className="absolute -top-2 -right-2 p-1 bg-surface-200 text-surface-600 rounded-full hover:bg-surface-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                 </div>
               )}
             </div>
          )}

          {/* ----- MAIN COMPOSER ----- */}
          <div className="relative flex items-end gap-2">
            
            {/* File Preview Thumbnail */}
            {attachedFile && (
              <div className="absolute -top-12 left-4 px-3 py-1.5 rounded-lg bg-surface-900 text-white text-[12px] font-bold shadow-lg flex items-center gap-2 animate-fade-in">
                <File size={14} />
                <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="opacity-60 hover:opacity-100"><X size={12}/></button>
              </div>
            )}
            
            {/* File Upload Button */}
            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept=".pdf,.txt,.docx,.md,.png,.jpg,.jpeg,.gif" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || streaming}
              className="p-3.5 rounded-full bg-surface-100 text-surface-500 hover:bg-surface-200 hover:text-surface-700 transition-colors disabled:opacity-50 shrink-0 mb-1 pointer-events-auto"
            >
              {uploading ? <Loader2 size={18} className="animate-spin text-primary-500" /> : <Paperclip size={18} />}
            </button>
            
            {/* Main Text Area Container */}
            <div className="flex-1 bg-surface-50 border border-surface-200 rounded-3xl p-1 shadow-inner focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all flex items-end">
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend();
                   }
                 }}
                 rows={1}
                 placeholder={isAgent ? "Ask the AI system..." : "Describe your problem..."}
                 className="flex-1 bg-transparent px-4 py-3 min-h-[44px] max-h-[160px] resize-none outline-none text-[15px] font-medium text-foreground placeholder:text-surface-400 border-none custom-scrollbar"
                 disabled={streaming}
               />
               
               {/* Send Button */}
               <div className="p-1 shrink-0">
                  <button
                    onClick={handleSend}
                    disabled={streaming || uploading || (!input.trim() && !attachedFile)}
                    className="p-3 rounded-2xl bg-primary-500 hover:bg-primary-600 disabled:bg-surface-200 disabled:text-surface-400 text-white transition-all shadow-md shadow-primary-500/20 disabled:shadow-none pointer-events-auto"
                  >
                    {streaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
               </div>
            </div>
          </div>
          <div className="text-center pt-1">
             <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400">Memory Engine AI</p>
          </div>
        </div>
      </div>

      {/* Clear Confirm Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-surface-200 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="heading-3 text-center mb-2">Clear Conversation</h3>
            <p className="text-surface-500 text-center mb-8 font-medium">This will permanently delete the current chat history. This action cannot be reversed.</p>
            <div className="flex gap-3">
              <Button fullWidth variant="ghost" onClick={() => setShowConfirmClear(false)}>Cancel</Button>
              <Button fullWidth variant="primary" className="bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 border-none" onClick={clearChat}>Erase</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
