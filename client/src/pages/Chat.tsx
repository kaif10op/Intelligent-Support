import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Bot, ChevronLeft, Loader2, Info, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, AlertTriangle, Paperclip, File, X, Copy, Trash2, Check, Zap, ArrowRightLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';
import { useAuthStore } from '../store/useAuthStore';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';
import PresenceIndicators from '../components/PresenceIndicators';

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

const AI_WORKFLOW_PACKS = [
  { id: 'escalation-pack', label: 'Escalation Pack', modes: ['summary', 'priority_assessment', 'sla_risk', 'escalation_check'] },
  { id: 'resolution-pack', label: 'Resolution Pack', modes: ['root_cause', 'next_steps', 'verification_steps', 'resolution_plan'] },
  { id: 'customer-update-pack', label: 'Customer Update Pack', modes: ['sentiment', 'empathetic_reply', 'customer_update_short', 'customer_update_detailed'] },
  { id: 'quality-pack', label: 'Quality Pack', modes: ['qa_test_scenarios', 'policy_compliance_check', 'risk_matrix', 'closure_checklist'] },
  { id: 'handoff-pack', label: 'Handoff Pack', modes: ['summary', 'blocker_identification', 'action_items', 'handoff_note'] },
  { id: 'closure-pack', label: 'Closure Pack', modes: ['summary', 'concise_reply', 'closure_checklist', 'incident_update'] }
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
  const [sendingHuman, setSendingHuman] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [humanInput, setHumanInput] = useState('');
  const [handoffStatus, setHandoffStatus] = useState<any>(null);
  const [requestingHandoff, setRequestingHandoff] = useState(false);
  const [aiToolMode, setAiToolMode] = useState('draft_reply');
  const [aiToolResult, setAiToolResult] = useState('');
  const [aiToolLoading, setAiToolLoading] = useState(false);
  const [aiToolSearch, setAiToolSearch] = useState('');
  const [aiToolCategory, setAiToolCategory] = useState<string>('all');
  const [aiToolHistory, setAiToolHistory] = useState<Array<{
    mode: string;
    label: string;
    output: string;
    createdAt: string;
  }>>([]);
  const [aiFavoriteTools, setAiFavoriteTools] = useState<string[]>([]);
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
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
  const favoriteTools = useMemo(
    () => AI_TOOL_OPTIONS.filter((tool) => aiFavoriteTools.includes(tool.value)),
    [aiFavoriteTools]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chat.aiToolFavorites');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setAiFavoriteTools(parsed.filter((v) => typeof v === 'string'));
      }
    } catch {
      // ignore malformed local data
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat.aiToolFavorites', JSON.stringify(aiFavoriteTools));
  }, [aiFavoriteTools]);

  // Fetch chat history and KB info
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
            // Fallback: If no assistant message exists yet, create one
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
  }, [id, kbId, subscribeTo, unsubscribeFrom, onChatMessage, navigate]);

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

  const loadHandoffStatus = async () => {
    if (!id || id === 'new') return;
    try {
      const res = await axios.get(API_ENDPOINTS.CHAT_HUMAN_STATUS(id), axiosConfig);
      setHandoffStatus(res.data);
    } catch {
      // keep quiet to avoid noisy UI if feature unavailable
    }
  };

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

  const runAiTool = async (mode: string, writeResult = true) => {
    if (!id || id === 'new') {
      addToast('Open a specific chat to run AI tools', 'info');
      return '';
    }

    try {
      setAiToolLoading(true);
      const res = await axios.post(
        API_ENDPOINTS.CHAT_HUMAN_ASSIST(id),
        {
          context: messages[messages.length - 1]?.content || '',
          mode
        },
        axiosConfig
      );
      const output = res.data.suggestion || 'No output generated.';
      if (writeResult) setAiToolResult(output);
      const selectedTool = AI_TOOL_OPTIONS.find(t => t.value === mode);
      setAiToolHistory(prev => [
        {
          mode,
          label: selectedTool?.label || mode,
          output,
          createdAt: new Date().toISOString()
        },
        ...prev.slice(0, 7)
      ]);
      return output;
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to get AI assistance', 'error');
      return '';
    } finally {
      setAiToolLoading(false);
    }
  };

  const handleRequestAIAssistance = async () => {
    await runAiTool(aiToolMode, true);
  };

  const handleInsertAiIntoReply = () => {
    if (!aiToolResult) return;
    setHumanInput(prev => (prev ? `${prev}\n\n${aiToolResult}` : aiToolResult));
    addToast('AI output inserted into reply box', 'success');
  };

  const handleCopyAiResult = async () => {
    if (!aiToolResult) return;
    try {
      await navigator.clipboard.writeText(aiToolResult);
      addToast('AI output copied', 'success');
    } catch {
      addToast('Failed to copy AI output', 'error');
    }
  };

  const handleReuseHistory = (item: { mode: string; output: string }) => {
    setAiToolMode(item.mode);
    setAiToolResult(item.output);
  };

  const runUserCopilot = async () => {
    if (!id || id === 'new') {
      addToast('Open a specific conversation to use AI copilot', 'info');
      return;
    }
    try {
      setUserAiLoading(true);
      const context = messages[messages.length - 1]?.content || input || '';
      const res = await axios.post(
        API_ENDPOINTS.TICKET_AI_COPILOT,
        {
          flow: 'problem_solving',
          mode: userAiMode,
          context
        },
        axiosConfig
      );
      setUserAiResult(res.data?.suggestion || 'No output generated.');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to run AI copilot', 'error');
    } finally {
      setUserAiLoading(false);
    }
  };

  const runUserCopilotPack = async () => {
    if (!id || id === 'new') {
      addToast('Open a specific conversation to use AI copilot', 'info');
      return;
    }
    try {
      setUserAiLoading(true);
      const context = messages.slice(-8).map((m) => `${m.role}: ${m.content}`).join('\n') || input || '';
      const modes = ['summary', 'next_steps', 'customer_reply', 'description_improver'];
      const res = await axios.post(
        API_ENDPOINTS.TICKET_AI_COPILOT,
        {
          flow: 'problem_solving',
          mode: 'summary',
          modes,
          context
        },
        axiosConfig
      );
      const combined = Array.isArray(res.data?.outputs)
        ? res.data.outputs.map((o: any) => `## ${o.mode}\n${o.suggestion}`).join('\n\n')
        : res.data?.suggestion || 'No output generated.';
      setUserAiResult(combined);
      addToast('AI customer pack completed', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to run AI customer pack', 'error');
    } finally {
      setUserAiLoading(false);
    }
  };

  const handleInsertUserAi = () => {
    if (!userAiResult) return;
    setInput((prev) => (prev ? `${prev}\n\n${userAiResult}` : userAiResult));
    addToast('AI output inserted into chat input', 'success');
  };

  const toggleFavoriteTool = (mode: string) => {
    setAiFavoriteTools((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const runWorkflowPack = async (packId: string) => {
    const pack = AI_WORKFLOW_PACKS.find((p) => p.id === packId);
    if (!pack || aiToolLoading) return;
    setRunningWorkflow(pack.id);
    try {
      const outputs: string[] = [];
      for (const mode of pack.modes) {
        const output = await runAiTool(mode, false);
        const label = AI_TOOL_OPTIONS.find((t) => t.value === mode)?.label || mode;
        if (output) outputs.push(`## ${label}\n${output}`);
      }
      if (outputs.length > 0) {
        setAiToolResult(outputs.join('\n\n'));
        addToast(`${pack.label} completed`, 'success');
      }
    } finally {
      setRunningWorkflow(null);
    }
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

  // Fetch available agents for transfer
  useEffect(() => {
    loadHandoffStatus();
  }, [id]);

  useEffect(() => {
    if (isAgent && showTransfer) {
      const fetchAgents = async () => {
        try {
          const res = await axios.get(API_ENDPOINTS.TICKET_AGENTS, axiosConfig);
          const agentList = res.data?.data || [];
          setAgents(agentList.filter((a: any) => a.id !== user?.id));
        } catch (err) {
          console.error('Failed to fetch agents:', err);
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
  }, [isAgent, id, filteredTools]);

  // Auto-fetch suggestions when streaming completes
  useEffect(() => {
    if (!streaming && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only fetch suggestions for assistant messages that just finished
      if (lastMessage.role === 'assistant' && lastMessage.content.length > 0) {
        // Auto-fetch suggestions for the last message
        getSuggestions(messages.length - 1);
      }
    }
  }, [streaming, messages, id]);

  return (
    <div className="flex flex-col w-full h-screen bg-background overflow-hidden">
      {/* Header - Fixed */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
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

        {id && id !== 'new' && (
          <PresenceIndicators resourceId={id} resourceType="chat" />
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
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm animate-fadeIn">
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

      {/* Handoff Banner */}
      {id && id !== 'new' && messages.length > 1 && (
        <div className="px-6 pt-3">
          <div className="rounded-lg border border-border/50 bg-card/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {handoffStatus?.assignedAgent?.name ? (
                <>
                  <span className="font-medium">Human Support:</span> Assigned to {handoffStatus.assignedAgent.name}
                </>
              ) : handoffStatus?.handoffRequested ? (
                <span className="font-medium text-amber-500">Human handoff requested - waiting for an agent</span>
              ) : (
                <span className="text-muted-foreground">AI support active</span>
              )}
            </div>
            <div className="flex gap-2">
              {!isAgent && !handoffStatus?.handoffRequested && (
                <button
                  onClick={requestHumanHandoff}
                  disabled={requestingHandoff}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-60"
                >
                  {requestingHandoff ? 'Requesting...' : 'Request Human'}
                </button>
              )}
              {isAgent && !handoffStatus?.assignedAgent && (
                <button
                  onClick={takeOverChat}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium"
                >
                  Take Over
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Container - Scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
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
              className={`flex ${m.role === 'user' || m.role === 'human' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`max-w-lg space-y-2`}>
                {/* Sender Info for Human/System Messages */}
                {(m.role === 'human' || m.role === 'system') && (
                  <div className="text-xs text-muted-foreground px-4">
                    {m.senderName} {m.senderRole && `(${m.senderRole})`}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-6 py-4 ${
                    m.role === 'user'
                      ? 'bg-primary/20 border border-primary/30 text-foreground'
                      : m.role === 'human'
                      ? 'bg-blue-500/20 border border-blue-500/30 text-foreground'
                      : m.role === 'system'
                      ? 'bg-gray-600/20 border border-gray-600/30 text-muted-foreground italic'
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

                    {/* Suggestions toggle - only show if we have suggestions */}
                    {i === messages.length - 1 && !streaming && showSuggestionsFor === i && suggestions.length > 0 && (
                      <button
                        onClick={() => setShowSuggestionsFor(null)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-secondary hover:bg-card/50 transition-colors"
                      >
                        <ChevronUp size={14} /> Hide suggestions
                      </button>
                    )}
                  </div>
                )}

                {/* Follow-Up Suggestions - Auto-displayed */}
                {showSuggestionsFor === i && suggestions.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs font-medium text-secondary px-4">💡 Follow-up suggestions:</p>
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
        {/* Support Agent Panel */}
        {isAgent && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowTransfer(!showTransfer)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors text-sm font-medium"
              title="Transfer to another agent"
            >
              <ArrowRightLeft size={16} />
              Transfer
            </button>

            <button
              onClick={handleRequestAIAssistance}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors text-sm font-medium"
              title="Get AI suggestion for response"
            >
              <Zap size={16} />
              Run AI Tool
            </button>
          </div>
        )}

        {/* User AI Copilot */}
        {!isAgent && (
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">AI Copilot</p>
              <p className="text-xs text-muted-foreground">Problem-solving helper for customers</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                ['summary', 'Summarize issue'],
                ['next_steps', 'What to do next'],
                ['customer_reply', 'Draft clear message'],
                ['description_improver', 'Improve details']
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setUserAiMode(value)}
                  className={`px-2 py-1 rounded-md text-xs border ${
                    userAiMode === value
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-card/40 border-border/40 text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
              <div className="flex gap-2">
                <button
                  onClick={runUserCopilot}
                  disabled={userAiLoading}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {userAiLoading ? 'Running...' : 'Run Copilot'}
                </button>
                <button
                  onClick={runUserCopilotPack}
                  disabled={userAiLoading}
                  className="px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/20 disabled:opacity-50"
                >
                  Run Full Pack
                </button>
                {userAiResult && (
                  <button
                    onClick={handleInsertUserAi}
                  className="px-3 py-2 rounded-lg bg-secondary/20 text-secondary text-sm hover:bg-secondary/30"
                >
                  Insert
                </button>
              )}
              {userAiResult && (
                <button
                  onClick={() => setUserAiResult('')}
                  className="px-3 py-2 rounded-lg bg-card/50 text-muted-foreground text-sm hover:bg-card"
                >
                  Clear
                </button>
              )}
            </div>
            {userAiResult && (
              <div className="p-3 rounded-lg bg-background/70 border border-border/40 text-sm whitespace-pre-wrap">
                {userAiResult}
              </div>
            )}
          </div>
        )}

        {/* AI Tools Panel for staff (10+ modes) */}
        {isAgent && (
          <div className="space-y-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-500">AI Toolbelt</p>
              <p className="text-xs text-muted-foreground">40 tools: search, filter, run, reuse</p>
            </div>
            {(!id || id === 'new') && (
              <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                Select a specific conversation to run tools. Toolbelt is now always visible for support/admin users.
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-2">
              <input
                value={aiToolSearch}
                onChange={(e) => setAiToolSearch(e.target.value)}
                placeholder="Search tools..."
                className="flex-1 px-3 py-2 rounded-lg bg-card/40 border border-border/50 text-sm outline-none focus:border-amber-500"
              />
              <div className="flex gap-2 flex-wrap">
                {['all', 'responses', 'analysis', 'planning', 'risk', 'documentation', 'knowledge'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAiToolCategory(cat)}
                    className={`px-2 py-1 rounded-md text-xs border ${
                      aiToolCategory === cat
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                        : 'bg-card/30 border-border/40 text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {favoriteTools.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Pinned tools</p>
                <div className="flex flex-wrap gap-2">
                  {favoriteTools.map(({ value, label }) => (
                    <button
                      key={`fav-${value}`}
                      onClick={() => setAiToolMode(value)}
                      className={`px-2 py-1 rounded-md text-xs border ${
                        aiToolMode === value
                          ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                          : 'bg-card/30 border-border/40 text-muted-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 max-h-52 overflow-y-auto pr-1">
              {filteredTools.map(({ value, label }) => (
                <div key={value} className="relative">
                  <button
                    onClick={() => setAiToolMode(value)}
                    className={`w-full px-2 py-2 pr-6 rounded-lg text-xs border transition-colors text-left ${
                      aiToolMode === value
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                        : 'bg-card/40 border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                    title="Click to select this tool"
                  >
                    {label}
                  </button>
                  <button
                    onClick={() => toggleFavoriteTool(value)}
                    className={`absolute top-1 right-1 text-[10px] px-1 rounded ${
                      aiFavoriteTools.includes(value) ? 'text-amber-500' : 'text-muted-foreground'
                    }`}
                    title={aiFavoriteTools.includes(value) ? 'Unpin tool' : 'Pin tool'}
                  >
                    {aiFavoriteTools.includes(value) ? '★' : '☆'}
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">One-click workflows</p>
                <button
                  onClick={async () => {
                    if (aiToolLoading) return;
                    setRunningWorkflow('agent-speed-pack');
                    try {
                      const modes = ['summary', 'root_cause', 'next_steps', 'customer_update_detailed'];
                      const outputs: string[] = [];
                      for (const mode of modes) {
                        const output = await runAiTool(mode, false);
                        const label = AI_TOOL_OPTIONS.find((t) => t.value === mode)?.label || mode;
                        if (output) outputs.push(`## ${label}\n${output}`);
                      }
                      if (outputs.length) {
                        setAiToolResult(outputs.join('\n\n'));
                        addToast('Agent speed pack completed', 'success');
                      }
                    } finally {
                      setRunningWorkflow(null);
                    }
                  }}
                  disabled={!!runningWorkflow || aiToolLoading}
                  className="px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-xs text-amber-500 disabled:opacity-50"
                >
                  {runningWorkflow === 'agent-speed-pack' ? 'Running Speed Pack...' : 'Run Speed Pack'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_WORKFLOW_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => runWorkflowPack(pack.id)}
                    disabled={!!runningWorkflow || aiToolLoading}
                    className="px-3 py-1.5 rounded-md bg-card/40 border border-border/40 text-xs text-foreground hover:border-amber-500/40 disabled:opacity-50"
                  >
                    {runningWorkflow === pack.id ? `Running ${pack.label}...` : pack.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Shortcuts: `Ctrl/Cmd + Enter` run selected tool, `Alt + 1..9` quick-select visible tools.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRequestAIAssistance}
                disabled={aiToolLoading}
                className="px-3 py-2 rounded-lg bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 disabled:opacity-50"
              >
                {aiToolLoading ? 'Running...' : 'Run Selected Tool'}
              </button>
              {aiToolResult && (
                <button
                  onClick={handleInsertAiIntoReply}
                  className="px-3 py-2 rounded-lg bg-secondary/20 text-secondary text-sm hover:bg-secondary/30"
                >
                  Insert to Reply
                </button>
              )}
              {aiToolResult && (
                <button
                  onClick={handleCopyAiResult}
                  className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20"
                >
                  Copy
                </button>
              )}
              {aiToolResult && (
                <button
                  onClick={() => setAiToolResult('')}
                  className="px-3 py-2 rounded-lg bg-card/50 text-muted-foreground text-sm hover:bg-card"
                >
                  Clear
                </button>
              )}
            </div>
            {aiToolResult && (
              <div className="p-3 rounded-lg bg-background/70 border border-border/40 text-sm whitespace-pre-wrap">
                {aiToolResult}
              </div>
            )}
            {aiToolHistory.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recent AI outputs</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiToolHistory.map((item, idx) => (
                    <button
                      key={`${item.mode}-${item.createdAt}-${idx}`}
                      onClick={() => handleReuseHistory(item)}
                      className="text-left p-2 rounded-lg bg-card/40 border border-border/30 hover:border-amber-500/40"
                    >
                      <p className="text-xs font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.output}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transfer Agent Selector */}
        {isAgent && showTransfer && agents.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {agents.map((agent: any) => (
              <button
                key={agent.id}
                onClick={() => handleTransferChat(agent.id)}
                className="px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                {agent.name || agent.email}
              </button>
            ))}
            <button
              onClick={() => setShowTransfer(false)}
              className="px-3 py-2 rounded-lg bg-card/50 text-muted-foreground hover:bg-card/80 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Human Message Input (for support agents/admins) */}
        {isAgent && (
          <div className="space-y-3 p-4 rounded-lg bg-card/50 border border-secondary/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-secondary uppercase tracking-wide">
                {user?.role === 'ADMIN' ? '👨‍💼 Admin Response' : '👤 Support Agent Response'}
              </label>
              <span className="text-xs text-muted-foreground">Direct human reply mode</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={humanInput}
                onChange={(e) => setHumanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendHumanMessage();
                  }
                }}
                placeholder="Type your response to send to customer..."
                className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-border/50 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-foreground placeholder:text-muted-foreground text-sm"
                disabled={sendingHuman}
              />
              <button
                onClick={handleSendHumanMessage}
                disabled={sendingHuman || !humanInput.trim()}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-secondary-foreground transition-colors disabled:cursor-not-allowed font-medium text-sm"
              >
                {sendingHuman ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        )}

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
