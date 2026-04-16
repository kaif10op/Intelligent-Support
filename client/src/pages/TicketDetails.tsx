import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Send, MessageCircle, User as UserIcon, FileText, Clock, AlertCircle, CheckCircle, MessageSquare, Zap, ArrowRightLeft, Calendar, Mail, CheckCircle2, Bot } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/useAuthStore';
import { apiUrl, axiosConfig } from '../config/api';
import { Button, Card } from '../components/ui';
import PresenceIndicators from '../components/PresenceIndicators';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  userId: string;
  assignedToId?: string;
  chatId?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'human' | 'system';
  content: string;
  createdAt?: string;
  senderName?: string;
}

interface TicketContextResponse {
  ticket: any;
  user: UserProfile;
  assignedTo?: { id: string; name: string; email: string; role: string } | null;
  context: {
    ticketHistory: Ticket[];
    recentChats: any[];
    knowledgeBaseInteractions: { kbId: string; title: string; interactions: number; lastUsedAt: string }[];
    currentTicketNotes: any[];
  };
}

type DetailTab = 'overview' | 'chats' | 'tickets' | 'notes';

const TicketDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const normalizedRole = (user?.role || '').toUpperCase();
  const isAgent = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes(normalizedRole);

  // Data states
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userChats, setUserChats] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [ticketNotes, setTicketNotes] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [humanInput, setHumanInput] = useState('');
  const [sendingHuman, setSendingHuman] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [kbInteractions, setKbInteractions] = useState<{ kbId: string; title: string; interactions: number; lastUsedAt: string }[]>([]);
  
  // AI states
  const [ticketAiMode, setTicketAiMode] = useState('next_steps');
  const [ticketAiLoading, setTicketAiLoading] = useState(false);
  const [ticketAiOutput, setTicketAiOutput] = useState('');
  const [ticketRunbookLoading, setTicketRunbookLoading] = useState(false);
  
  const [chatAiMode, setChatAiMode] = useState('customer_reply');
  const [chatAiLoading, setChatAiLoading] = useState(false);
  const [chatAiOutput, setChatAiOutput] = useState('');
  const [chatAiPackLoading, setChatAiPackLoading] = useState(false);

  // Fetch ticket and user details
  const fetchTicketDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Get unified ticket context
      const contextRes = await axios.get(apiUrl(`/api/tickets/${id}/context`), axiosConfig);
      const contextData: TicketContextResponse = contextRes.data;
      const ticketData = contextData.ticket;
      
      setTicket(ticketData);
      setUserProfile(contextData.user || null);
      setTicketNotes(contextData.context.currentTicketNotes || []);
      setUserTickets((contextData.context.ticketHistory || []).filter((t: any) => t.id !== ticketData.id));
      setUserChats(contextData.context.recentChats || []);
      setKbInteractions(contextData.context.knowledgeBaseInteractions || []);

      // If support agent, fetch support agents for transfer
      if (isAgent) {
        try {
          const agentRes = await axios.get(apiUrl('/api/tickets/agents'), axiosConfig);
          const agentList = (agentRes.data?.data || []).filter((a: any) => a.role === 'SUPPORT_AGENT' || a.role === 'ADMIN');
          setAgents(agentList.filter((a: any) => a.id !== user?.id));
        } catch (err) {
          console.error('Failed to fetch agents:', err);
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load ticket details';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, isAgent, user?.id, addToast]);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id, fetchTicketDetails]);

  const loadUserChats = async () => {}; // already loaded from context endpoint

  const loadChatMessages = async (chatId: string) => {
    try {
      const res = await axios.get(apiUrl(`/api/chat/${chatId}`), axiosConfig);
      const formatted = (res.data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content,
        createdAt: m.createdAt,
        senderName: m.senderName
      }));
      setChatMessages(formatted);
      setSelectedChat(res.data);
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    }
  };

  const handleSendHumanMessage = async () => {
    if (!humanInput.trim() || !selectedChat) return;

    setSendingHuman(true);
    try {
      await axios.post(
        apiUrl(`/api/chat/human/${selectedChat.id}/message`),
        { message: humanInput },
        axiosConfig
      );

      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'human',
        content: humanInput,
        senderName: user?.name || 'Support Agent'
      }]);

      setHumanInput('');
      addToast('Message sent to customer', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to send message', 'error');
    } finally {
      setSendingHuman(false);
    }
  };

  const handleTransferChat = async (targetAgentId: string) => {
    if (!selectedChat) return;
    try {
      await axios.post(
        apiUrl(`/api/chat/human/${selectedChat.id}/transfer/${targetAgentId}`),
        { reason: 'Transferred by support agent' },
        axiosConfig
      );
      addToast('Chat transferred successfully', 'success');
      setShowTransfer(false);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to transfer chat', 'error');
    }
  };

  const handleUpdateTicketStatus = async (status: string) => {
    try {
      await axios.put(
        apiUrl(`/api/tickets/${id}`),
        { status },
        axiosConfig
      );
      setTicket(prev => prev ? { ...prev, status: status as any } : null);
      addToast(`Ticket marked as ${status.replace('_', ' ').toLowerCase()}`, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  const runTicketCopilot = async () => {
    if (!ticket) return;
    try {
      setTicketAiLoading(true);
      const context = `${ticket.title}\n${ticket.description}`;
      const res = await axios.post(
        apiUrl('/api/tickets/ai/copilot'),
        { flow: 'problem_solving', mode: ticketAiMode, context, ticketId: ticket.id },
        axiosConfig
      );
      setTicketAiOutput(res.data?.suggestion || 'No output generated.');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to run ticket copilot', 'error');
    } finally {
      setTicketAiLoading(false);
    }
  };

  const runTicketRunbook = async () => {
    if (!ticket) return;
    try {
      setTicketRunbookLoading(true);
      const packModes = ['summary', 'diagnostic_checklist', 'next_steps', 'qa_validation_plan', 'customer_update'];
      const context = `Ticket: ${ticket.title}\nDescription: ${ticket.description}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}`;
      const res = await axios.post(
        apiUrl('/api/tickets/ai/copilot'),
        { flow: 'problem_solving', mode: 'summary', modes: packModes, context, ticketId: ticket.id },
        axiosConfig
      );
      const combined = Array.isArray(res.data?.outputs)
        ? res.data.outputs.map((o: any) => `## ${o.mode}\n${o.suggestion}`).join('\n\n')
        : res.data?.suggestion || 'No output generated.';
      setTicketAiOutput(combined);
      addToast('AI runbook generated', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to generate AI runbook', 'error');
    } finally {
      setTicketRunbookLoading(false);
    }
  };

  const insertTicketAiToReply = () => {
    if (!ticketAiOutput) return;
    setHumanInput(prev => (prev ? `${prev}\n\n${ticketAiOutput}` : ticketAiOutput));
    addToast('AI output inserted into response box', 'success');
    setActiveTab('chats');
  };

  const runChatAiCopilot = async () => {
    if (!selectedChat) return;
    try {
      setChatAiLoading(true);
      const conversation = chatMessages.slice(-12).map(m => `${m.role}: ${m.content}`).join('\n');
      const res = await axios.post(
        apiUrl('/api/tickets/ai/copilot'),
        { flow: 'problem_solving', mode: chatAiMode, context: conversation, ticketId: ticket?.id },
        axiosConfig
      );
      setChatAiOutput(res.data?.suggestion || 'No output generated.');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to run chat AI copilot', 'error');
    } finally {
      setChatAiLoading(false);
    }
  };

  const runChatAiPack = async () => {
    if (!selectedChat) return;
    try {
      setChatAiPackLoading(true);
      const conversation = chatMessages.slice(-12).map(m => `${m.role}: ${m.content}`).join('\n');
      const modes = ['summary', 'customer_reply', 'next_steps', 'handoff_bundle'];
      const res = await axios.post(
        apiUrl('/api/tickets/ai/copilot'),
        { flow: 'problem_solving', mode: 'summary', modes, context: conversation, ticketId: ticket?.id },
        axiosConfig
      );
      const combined = Array.isArray(res.data?.outputs)
        ? res.data.outputs.map((o: any) => `## ${o.mode}\n${o.suggestion}`).join('\n\n')
        : res.data?.suggestion || 'No output generated.';
      setChatAiOutput(combined);
      addToast('Chat AI pack completed', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to run chat AI pack', 'error');
    } finally {
      setChatAiPackLoading(false);
    }
  };

  const insertChatAiToReply = () => {
    if (!chatAiOutput) return;
    setHumanInput(prev => (prev ? `${prev}\n\n${chatAiOutput}` : chatAiOutput));
    addToast('Chat AI output inserted into reply box', 'success');
  };

  const handleOpenRelatedChat = () => {
    if (!ticket) return;
    if (ticket.chatId) {
      navigate(`/chat/${ticket.chatId}`);
      return;
    }

    if (!isAgent) {
      addToast('No related chat is linked to this ticket yet', 'error');
      return;
    }

    (async () => {
      try {
        const res = await axios.post(apiUrl(`/api/tickets/${ticket.id}/init-chat`), {}, axiosConfig);
        const chatId = res.data?.chat?.id;
        if (chatId) {
          setTicket(prev => prev ? { ...prev, chatId } : prev);
          addToast('Support chat started from ticket', 'success');
          navigate(`/chat/${chatId}`);
          return;
        }
        addToast('Failed to initialize related chat', 'error');
      } catch (err: any) {
        addToast(err.response?.data?.error || 'Failed to initialize related chat', 'error');
      }
    })();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent page-enter gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
          <div className="relative bg-card p-4 rounded-full shadow-lg">
             <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        </div>
        <p className="text-sm text-surface-500 font-bold uppercase tracking-widest animate-pulse mt-2">Loading Context</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen p-6 bg-transparent flex items-center justify-center page-enter">
        <Card elevated className="max-w-md w-full text-center p-12 border-rose-500/20 bg-rose-500/5">
           <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
           <h1 className="heading-3 text-foreground mb-2">Ticket Not Found</h1>
           <p className="text-surface-500 mb-8 max-w-sm mx-auto">This ticket may have been deleted or you don't have access.</p>
           <Button variant="primary" onClick={() => navigate('/tickets')} icon={<ChevronLeft size={16} />}>
             Back to Queue
           </Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      default: return 'bg-surface-500/10 text-surface-600 border border-surface-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'URGENT': return 'bg-rose-500 text-white';
      case 'HIGH': return 'bg-amber-500 text-white';
      case 'MEDIUM': return 'bg-sky-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  const StatusIcon = ticket.status === 'OPEN' ? AlertCircle : ticket.status === 'IN_PROGRESS' ? Clock : CheckCircle;

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Premium Sticky Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-surface-200/50 sticky top-0 z-40 transition-all">
        <div className="px-6 py-6 md:py-8 max-w-[1400px] mx-auto">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-surface-500 hover:text-surface-900 transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Ticket Queue
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
               <h1 className="heading-1 leading-tight tracking-tight mb-2 pr-4">{ticket.title}</h1>
               <div className="flex items-center gap-3">
                 <p className="font-mono text-sm text-surface-400">ID: {ticket.id}</p>
                 <div className="w-1 h-1 rounded-full bg-surface-300"></div>
                 <PresenceIndicators resourceId={ticket.id} resourceType="ticket" />
               </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${getStatusColor(ticket.status)}`}>
                <StatusIcon size={14} />
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center shadow-sm ${getPriorityColor(ticket.priority)}`}>
                <Zap size={12} className="mr-1 opacity-70" />
                {ticket.priority} Priority
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto w-full">
         <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up delay-100 pb-12">
            
            {/* Main Content Column */}
            <div className="col-span-1 lg:col-span-8 space-y-6">
               
               {/* Core Information Card */}
               <Card elevated className="p-0 overflow-hidden">
                 <div className="px-8 py-5 bg-surface-50/50 border-b border-surface-200/50 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/10 text-primary-600">
                      <FileText size={18} />
                    </div>
                    <h2 className="heading-4">Description Setup</h2>
                 </div>
                 <div className="p-8">
                   <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
                     <p className="text-[15px] leading-relaxed text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{ticket.description}</p>
                   </div>
                   
                   <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200 flex flex-wrap gap-x-8 gap-y-4">
                     <div>
                       <p className="text-[10px] uppercase tracking-widest font-bold text-surface-500 mb-1">Created Timeline</p>
                       <p className="text-sm font-medium text-foreground">{new Date(ticket.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                     </div>
                     <div>
                       <p className="text-[10px] uppercase tracking-widest font-bold text-surface-500 mb-1">Last Updated</p>
                       <p className="text-sm font-medium text-foreground">{new Date(ticket.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short'})}</p>
                     </div>
                     {ticket.assignedToId && (
                       <div>
                         <p className="text-[10px] uppercase tracking-widest font-bold text-surface-500 mb-1">Assigned Agent</p>
                         <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold">A</div>
                            <p className="text-sm font-medium text-foreground">{ticket.assignedToId}</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>

                 {isAgent && (
                   <div className="px-8 py-4 bg-surface-50/80 border-t border-surface-200/50">
                     <p className="text-[11px] font-bold uppercase tracking-widest text-surface-500 mb-3">Update Status Flow</p>
                     <div className="flex flex-wrap gap-2">
                       {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
                         <Button
                           key={status}
                           size="sm"
                           variant={ticket.status === status ? 'primary' : 'glass'}
                           onClick={() => handleUpdateTicketStatus(status)}
                           className={ticket.status === status ? 'shadow-md shadow-primary-500/20' : ''}
                         >
                           {status.replace('_', ' ')}
                         </Button>
                       ))}
                     </div>
                   </div>
                 )}
               </Card>

               {/* Central Context Tabs */}
               <Card elevated className="p-0 overflow-hidden">
                 <div className="border-b border-surface-200/50 bg-surface-50/30 px-2 pt-2">
                   <div className="flex overflow-x-auto scrollbar-hide gap-1">
                     {(['overview', 'chats', 'tickets', 'notes'] as const).map(tab => (
                       <button
                         key={tab}
                         onClick={() => { setActiveTab(tab); if (tab === 'chats') loadUserChats(); }}
                         className={`relative px-5 py-3.5 text-sm font-bold transition-all whitespace-nowrap overflow-hidden rounded-t-xl group ${
                           activeTab === tab
                             ? 'text-primary-600 bg-card'
                             : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100/50'
                         }`}
                       >
                         {tab === 'overview' ? 'Customer Profile' : 
                          tab === 'chats' ? 'Chat Context' : 
                          tab === 'tickets' ? 'Other Tickets' : 'Internal Notes'}
                         
                         {/* Bottom active line */}
                         {activeTab === tab && (
                           <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 shadow-[0_-2px_8px_rgba(99,102,241,0.5)]"></div>
                         )}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="p-8">
                   {/* TAB: OVERVIEW */}
                   {activeTab === 'overview' && userProfile && (
                     <div className="space-y-6 animate-fade-in">
                       <div className="flex items-center gap-5 pb-6 border-b border-surface-100">
                         {userProfile.picture ? (
                           <img src={userProfile.picture} alt={userProfile.name} className="w-16 h-16 rounded-full shadow-sm border border-surface-200" />
                         ) : (
                           <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-surface-400 shadow-inner">
                              <UserIcon size={24} />
                           </div>
                         )}
                         <div>
                           <h3 className="heading-4">{userProfile.name}</h3>
                           <p className="text-surface-500 font-medium flex items-center gap-2 mt-1">
                             <Mail size={14} />
                             {userProfile.email}
                           </p>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                           <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-2">Member Since</p>
                           <p className="font-medium text-foreground">{new Date(userProfile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                         </div>
                         <div>
                           <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-3">KB Interactions Activity</p>
                           {kbInteractions.length === 0 ? (
                             <p className="text-sm font-medium text-surface-500 bg-surface-50 p-3 rounded-lg border border-surface-200/50">No KB interactions found</p>
                           ) : (
                             <div className="space-y-2">
                               {kbInteractions.slice(0, 5).map(kb => (
                                 <div key={kb.kbId} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-50 border border-surface-200/50 text-sm">
                                   <span className="font-medium text-foreground truncate max-w-[150px]">{kb.title}</span>
                                   <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-md">{kb.interactions} chat{kb.interactions !== 1 ? 's' : ''}</span>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   )}

                   {/* TAB: CHATS */}
                   {activeTab === 'chats' && (
                     <div className="space-y-6 animate-fade-in">
                        {userChats.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-surface-200 rounded-3xl bg-surface-50/50">
                             <MessageCircle className="w-10 h-10 text-surface-300 mx-auto mb-4" />
                             <h4 className="heading-4 mb-2 text-surface-700">No Chat History</h4>
                             <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">Customer has not interacted via chat prior to or regarding this ticket.</p>
                             {isAgent && (
                               <Button variant="primary" onClick={handleOpenRelatedChat} icon={<MessageSquare size={16} />}>
                                  Start First Linked Chat
                               </Button>
                             )}
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mb-1">Recent Conversations</p>
                            {userChats.map(chat => (
                              <div
                                key={chat.id}
                                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  selectedChat?.id === chat.id 
                                    ? 'border-primary-500 bg-primary-50/50 shadow-md ring-1 ring-primary-500/20' 
                                    : 'border-surface-200/60 hover:border-primary-300 hover:bg-surface-50'
                                }`}
                                onClick={() => loadChatMessages(chat.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-lg ${selectedChat?.id === chat.id ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30' : 'bg-surface-100 text-surface-500'}`}>
                                    <MessageCircle size={18} />
                                  </div>
                                  <div>
                                    <p className={`font-bold text-[14px] ${selectedChat?.id === chat.id ? 'text-primary-700' : 'text-foreground'}`}>{chat.title || 'Support Session'}</p>
                                    <p className="text-xs font-medium text-surface-500 mt-0.5">{chat.messageCount || 0} messages total</p>
                                  </div>
                                </div>
                                <div className="hidden sm:block text-xs font-medium text-surface-400">
                                  <Calendar size={14} className="inline mr-1" />
                                  {new Date(chat?.updatedAt || Date.now()).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedChat && (
                          <div className="mt-8 border-t border-surface-200 pt-6">
                            <h4 className="heading-4 mb-4 flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-primary-500" />
                              Chat Viewer
                            </h4>
                            
                            <div className="bg-surface-50 border border-surface-200/60 rounded-2xl p-5 max-h-[400px] overflow-y-auto space-y-4 mb-5 shadow-inner">
                              {chatMessages.length === 0 && <p className="text-center text-surface-400 py-4 text-sm font-medium">Loading messages...</p>}
                              {chatMessages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`flex ${msg.role === 'user' || msg.role === 'human' ? 'justify-end' : 'justify-start'}`}>
                                  <div className="max-w-[80%] space-y-1">
                                    {msg.senderName && (
                                      <p className={`text-[10px] font-bold uppercase tracking-wider pl-2 ${msg.role === 'user' || msg.role === 'human' ? 'text-right text-primary-600/70' : 'text-surface-500'}`}>
                                        {msg.senderName}
                                      </p>
                                    )}
                                    <div className={`px-5 py-3.5 text-[14px] leading-relaxed shadow-sm ${
                                      msg.role === 'user' || msg.role === 'human'
                                        ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm'
                                        : msg.role === 'system'
                                        ? 'bg-surface-200/60 text-surface-700 rounded-2xl border border-border/60 italic'
                                        : 'bg-card border border-surface-200 rounded-2xl rounded-tl-sm text-foreground'
                                    }`}>
                                      {msg.content}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {isAgent && (
                              <div className="space-y-4">
                                {/* AI Toolkit Bar */}
                                <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                  <Button variant="ghost" size="sm" onClick={() => setShowTransfer(!showTransfer)} className="text-surface-600 hover:bg-surface-200/50">
                                    <ArrowRightLeft size={16} className="mr-1.5" /> Transfer
                                  </Button>
                                  <div className="w-px h-4 bg-amber-500/20 mx-1 border-hidden rounded"></div>
                                  <Button variant="outline" size="sm" onClick={runChatAiCopilot} loading={chatAiLoading} className="border-amber-500/30 text-amber-600 hover:bg-amber-50 shadow-none">
                                    <Zap size={15} className="mr-1.5 text-amber-500" /> AI Helper
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={runChatAiPack} loading={chatAiPackLoading} className="border-amber-500/30 text-amber-600 hover:bg-amber-50 shadow-none">
                                    Run Deep AI Pack
                                  </Button>
                                  
                                  <div className="flex items-center gap-1.5 ml-auto bg-surface-100 rounded-lg p-1 border border-surface-200">
                                    {[
                                      ['customer_reply', 'Reply'],
                                      ['summary', 'Sum'],
                                      ['next_steps', 'Steps'],
                                      ['escalation_check', 'Esc']
                                    ].map(([value, label]) => (
                                      <button
                                        key={value}
                                        onClick={() => setChatAiMode(value)}
                                        className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                                          chatAiMode === value
                                            ? 'bg-white shadow-sm text-amber-600'
                                            : 'text-surface-500 hover:text-surface-700 hover:bg-surface-200/50'
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* AI Output Box */}
                                {chatAiOutput && (
                                  <div className="relative p-5 rounded-2xl border border-amber-500/30 bg-amber-50/50 text-[14px] whitespace-pre-wrap leading-relaxed">
                                    <div className="absolute top-3 right-3 flex gap-2">
                                      <Button size="sm" variant="primary" onClick={insertChatAiToReply}>Use Text</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setChatAiOutput('')}>Discard</Button>
                                    </div>
                                    <span className="font-bold text-amber-700 block mb-2 text-[11px] uppercase tracking-widest"><Zap size={12} className="inline mr-1"/> AI Output</span>
                                    {chatAiOutput}
                                  </div>
                                )}

                                {/* Agent Details */}
                                {showTransfer && (
                                  <div className="flex gap-2 flex-wrap p-4 bg-surface-50 rounded-xl border border-surface-200/60 animate-fade-in">
                                    <p className="w-full text-[11px] font-bold uppercase tracking-widest text-surface-500 mb-1">Select new assignee</p>
                                    {agents.map(agent => (
                                      <Button key={agent.id} size="sm" variant="outline" onClick={() => handleTransferChat(agent.id)} className="shadow-none">
                                        {agent.name || agent.email}
                                      </Button>
                                    ))}
                                    <Button size="sm" variant="ghost" className="text-surface-500" onClick={() => setShowTransfer(false)}>Cancel</Button>
                                  </div>
                                )}

                                {/* Support Chat Box */}
                                <div className="flex gap-3 items-end">
                                  <div className="flex-1">
                                    <textarea
                                      value={humanInput}
                                      onChange={(e) => setHumanInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSendHumanMessage();
                                        }
                                      }}
                                      placeholder="Reply directly to the customer... (Press Enter to send)"
                                      className="w-full px-5 py-3.5 min-h-[50px] max-h-[200px] resize-y rounded-xl bg-surface-50 border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm shadow-inner transition-all outline-none"
                                      disabled={sendingHuman}
                                    />
                                  </div>
                                  <Button variant="primary" className="mb-1" onClick={handleSendHumanMessage} disabled={sendingHuman || !humanInput.trim()}>
                                    {sendingHuman ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                     </div>
                   )}

                   {/* TAB: TICKETS */}
                   {activeTab === 'tickets' && (
                     <div className="space-y-4 animate-fade-in">
                       {userTickets.length === 0 ? (
                         <div className="text-center py-12 border border-surface-200 rounded-3xl bg-surface-50/50 text-surface-500">
                           <FileText className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                           <p className="font-bold">No Other Tickets</p>
                           <p className="text-sm mt-1">This is the single active support profile track.</p>
                         </div>
                       ) : (
                         <div className="grid gap-3">
                           {userTickets.map(t => (
                             <div
                               key={t.id}
                               className="p-4 rounded-xl border border-surface-200/60 flex items-center justify-between cursor-pointer hover:border-primary-400 hover:shadow-md transition-all group bg-card"
                               onClick={() => {
                                 if (t.id !== ticket.id) navigate(`/ticket/${t.id}`);
                               }}
                             >
                               <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                 <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                    <FileText size={18} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-bold text-[14px] text-foreground truncate">{t.title}</p>
                                    <p className="text-xs text-surface-400 font-mono mt-0.5 truncate">{t.id}</p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2 flex-shrink-0">
                                 <span className={`hidden sm:inline-block px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(t.status)}`}>{t.status}</span>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   )}

                   {/* TAB: NOTES */}
                   {activeTab === 'notes' && (
                     <div className="animate-fade-in">
                       {ticketNotes.length === 0 ? (
                         <div className="text-center py-12 border border-dashed border-primary-500/20 rounded-3xl bg-primary-500/5">
                           <CheckCircle2 className="w-10 h-10 text-primary-400/50 mx-auto mb-3" />
                           <p className="font-bold text-primary-700/70">No Internal Notes</p>
                           <p className="text-sm font-medium text-primary-600/50 mt-1 max-w-sm mx-auto">Use ticket messages or the AI copilot to generate trace elements here.</p>
                         </div>
                       ) : (
                         <div className="space-y-4">
                           {ticketNotes.map((note: any, idx: number) => (
                             <div key={note.id || idx} className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/60 relative">
                               <div className="absolute top-5 right-5 text-amber-500/30">
                                 <FileText size={40} />
                               </div>
                               <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600/80 mb-3 relative z-10">
                                 {new Date(note.createdAt).toLocaleString()}
                               </p>
                               <div className="text-sm text-foreground relative z-10 whitespace-pre-wrap leading-relaxed font-medium">
                                 {note.content}
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               </Card>
            </div>

            {/* Side Tools Column */}
            <div className="col-span-1 lg:col-span-4 space-y-6">
              
              {/* Quick Actions Panel */}
              <Card elevated className="p-0 border-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-t border-t-white/30 relative overflow-hidden backdrop-blur-md">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none"></div>
                 
                 <div className="px-6 py-5 flex items-center gap-3 border-b border-white/10 relative z-10">
                   <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                     <Zap size={18} />
                   </div>
                   <h3 className="heading-4">Action Center</h3>
                 </div>
                 
                 <div className="p-6 relative z-10 space-y-3">
                    <Button variant="glass" fullWidth className="justify-start shadow-sm border-white/20 bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/30 text-indigo-900 dark:text-indigo-100 font-semibold" onClick={() => setActiveTab('chats')}>
                      <MessageCircle size={16} className="mr-3 opacity-70" /> Examine Customer Log
                    </Button>
                    <Button variant="glass" fullWidth className="justify-start shadow-sm border-white/20 bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/30 text-indigo-900 dark:text-indigo-100 font-semibold" onClick={() => setActiveTab('tickets')}>
                      <FileText size={16} className="mr-3 opacity-70" /> Link Similar Cases
                    </Button>
                    
                    <div className="py-2">
                       <div className="h-px bg-white/20 w-full rounded"></div>
                    </div>
                    
                    <Button variant="primary" fullWidth className="justify-center shadow-lg shadow-indigo-500/25" onClick={handleOpenRelatedChat}>
                      <ArrowRightLeft size={16} className="mr-2" /> Connect Live Session
                    </Button>
                 </div>
              </Card>

              {/* AI Copilot Side Panel */}
              <Card elevated className="p-0 border-0 rounded-3xl bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-t border-t-white/30 relative overflow-hidden backdrop-blur-md">
                 <div className="px-6 py-5 flex items-center gap-3 border-b border-white/10">
                   <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                     <Bot size={18} />
                   </div>
                   <h3 className="heading-4">Ticket Copilot</h3>
                 </div>
                 
                 <div className="p-6 space-y-5">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        ['summary', 'Auto Sum'],
                        ['diagnostic_checklist', 'Verify Fix'],
                        ['resolution_plan', 'Plan Out'],
                        ['qa_validation_plan', 'QA Pass'],
                        ['customer_reply', 'Draft Reply']
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setTicketAiMode(value)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                            ticketAiMode === value
                              ? 'bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-white/50'
                              : 'bg-white/40 dark:bg-black/20 text-amber-900 dark:text-amber-100 hover:bg-white/60 border border-white/20'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button fullWidth variant="glass" className="bg-amber-500 text-white hover:bg-amber-600 border-none justify-center shadow-lg shadow-amber-500/20" onClick={runTicketCopilot} loading={ticketAiLoading}>
                         Single Task
                      </Button>
                      <Button fullWidth variant="glass" className="bg-orange-600 text-white hover:bg-orange-700 border-none justify-center shadow-lg shadow-orange-600/20" onClick={runTicketRunbook} loading={ticketRunbookLoading}>
                         Full Runbook
                      </Button>
                    </div>

                    {ticketAiOutput && (
                      <div className="animate-fade-in-up">
                         <div className="p-4 rounded-xl bg-white/70 dark:bg-black/40 border border-white/30 dark:border-white/10 text-sm whitespace-pre-wrap leading-relaxed shadow-inner max-h-[400px] overflow-y-auto mt-2">
                           {ticketAiOutput}
                         </div>
                         <div className="flex gap-2 mt-3 justify-end">
                           <Button size="sm" variant="glass" className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20" onClick={insertTicketAiToReply}>Apply Text</Button>
                           <Button size="sm" variant="ghost" className="text-amber-700 hover:bg-amber-500/10" onClick={() => setTicketAiOutput('')}>Wipe</Button>
                         </div>
                      </div>
                    )}
                 </div>
              </Card>

            </div>
         </div>
      </div>
    </div>
  );
};

export default TicketDetails;
