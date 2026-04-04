import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Send, MessageCircle, User as UserIcon, FileText, Clock, AlertCircle, CheckCircle, MessageSquare, Zap, ArrowRightLeft, Calendar, Mail } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/useAuthStore';
import { apiUrl, axiosConfig } from '../config/api';
import { Button, Card, Badge } from '../components/ui';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  userId: string;
  assignedToId?: string;
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

type DetailTab = 'overview' | 'chats' | 'tickets' | 'notes';

const TicketDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const isAgent = user?.role === 'SUPPORT_AGENT' || user?.role === 'ADMIN';

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

  // Fetch ticket and user details
  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);

      // Get ticket details
      const ticketRes = await axios.get(apiUrl(`/api/tickets/${id}`), axiosConfig);
      const ticketData = ticketRes.data;
      setTicket(ticketData);

      // Get user profile
      if (ticketData.userId) {
        try {
          const userRes = await axios.get(apiUrl(`/api/admin/users/${ticketData.userId}`), axiosConfig);
          setUserProfile(userRes.data);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      }

      // Get ticket notes
      try {
        const notesRes = await axios.get(apiUrl(`/api/tickets/${id}/messages`), axiosConfig);
        setTicketNotes(notesRes.data || []);
      } catch (err) {
        console.error('Failed to fetch notes:', err);
      }

      // Fetch user's other tickets
      if (ticketData.userId) {
        try {
          const ticketsRes = await axios.get(apiUrl('/api/tickets'), axiosConfig);
          const userTicketList = (ticketsRes.data?.data || []).filter((t: any) => t.userId === ticketData.userId);
          setUserTickets(userTicketList);
        } catch (err) {
          console.error('Failed to fetch user tickets:', err);
        }
      }

      // If support agent, fetch support agents for transfer
      if (isAgent) {
        try {
          const agentRes = await axios.get(apiUrl('/api/admin/users'), axiosConfig);
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
  };

  const loadUserChats = async () => {
    try {
      const res = await axios.get(apiUrl('/api/chat'), axiosConfig);
      const allChats = res.data?.data || [];
      const userChat = allChats.find((c: any) => c.userId === ticket?.userId);
      setUserChats(userChat ? [userChat] : []);
    } catch (err) {
      console.error('Failed to fetch user chats:', err);
    }
  };

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
      addToast(`Ticket status updated to ${status}`, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/tickets')} className="p-2 hover:bg-card rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Ticket not found</h1>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800'
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-violet-100 text-violet-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  };

  const StatusIcon = ticket.status === 'OPEN' ? AlertCircle : ticket.status === 'IN_PROGRESS' ? Clock : CheckCircle;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/50 border-b border-border/50 sticky top-0 z-40 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tickets')}
              className="p-2 hover:bg-card/50 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold truncate">{ticket.title}</h1>
              <p className="text-muted-foreground text-sm">{ticket.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={statusColors[ticket.status]}>
              <StatusIcon size={14} className="mr-1" />
              {ticket.status}
            </Badge>
            <Badge className={priorityColors[ticket.priority]}>
              {ticket.priority}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Ticket Overview */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              Ticket Details
            </h2>
            <div className="space-y-3">
              <p className="text-foreground">{ticket.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Created</p>
                  <p className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Updated</p>
                  <p className="font-medium">{new Date(ticket.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Status Update */}
            {isAgent && (
              <div className="border-t border-border/50 pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Change Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant={ticket.status === status ? 'primary' : 'outline'}
                      onClick={() => handleUpdateTicketStatus(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Tabs */}
          <div className="border-b border-border/50">
            <div className="flex gap-6">
              {(['overview', 'chats', 'tickets', 'notes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'chats') loadUserChats();
                  }}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && userProfile && (
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <UserIcon size={18} className="text-primary" />
                Customer Profile
              </h3>
              <div className="space-y-3">
                {userProfile.picture && (
                  <img
                    src={userProfile.picture}
                    alt={userProfile.name}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="text-muted-foreground text-sm">Name</p>
                  <p className="font-medium">{userProfile.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail size={16} />
                    {userProfile.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Member Since</p>
                  <p className="font-medium">{new Date(userProfile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-4">
              {userChats.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  No chats found for this user
                </Card>
              ) : (
                userChats.map(chat => (
                  <Card key={chat.id} className="p-4 cursor-pointer hover:bg-card/50 transition-colors" onClick={() => loadChatMessages(chat.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <MessageCircle size={18} className="text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{chat.title || 'Chat'}</p>
                          <p className="text-xs text-muted-foreground">{chat.messageCount || 0} messages</p>
                        </div>
                      </div>
                      <Calendar size={16} className="text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                ))
              )}

              {selectedChat && (
                <Card className="p-6 space-y-4">
                  <h3 className="font-semibold">Chat Messages</h3>
                  <div className="bg-card/50 rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        className={`flex ${msg.role === 'user' || msg.role === 'human' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.role === 'user' || msg.role === 'human'
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : msg.role === 'system'
                              ? 'bg-gray-200 text-gray-800 rounded'
                              : 'bg-secondary text-secondary-foreground rounded-bl-none'
                          }`}
                        >
                          {msg.senderName && (
                            <p className="text-xs opacity-75 mb-1">{msg.senderName}</p>
                          )}
                          <p className="text-sm break-words">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isAgent && (
                    <div className="border-t border-border/50 pt-4 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setShowTransfer(!showTransfer)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                          <ArrowRightLeft size={16} />
                          Transfer
                        </button>
                        <button
                          onClick={() => addToast('AI Help - Get suggestions', 'info')}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors text-sm font-medium"
                        >
                          <Zap size={16} />
                          AI Help
                        </button>
                      </div>

                      {showTransfer && (
                        <div className="flex gap-2 flex-wrap p-3 bg-card/50 rounded-lg">
                          {agents.map(agent => (
                            <Button
                              key={agent.id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransferChat(agent.id)}
                            >
                              {agent.name || agent.email}
                            </Button>
                          ))}
                          <Button size="sm" variant="outline" onClick={() => setShowTransfer(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}

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
                          placeholder="Reply to customer..."
                          className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm placeholder:text-muted-foreground"
                          disabled={sendingHuman}
                        />
                        <Button
                          size="sm"
                          onClick={handleSendHumanMessage}
                          disabled={sendingHuman || !humanInput.trim()}
                        >
                          {sendingHuman ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-3">
              {userTickets.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  No other tickets from this user
                </Card>
              ) : (
                userTickets.map(t => (
                  <Card
                    key={t.id}
                    className={`p-4 cursor-pointer hover:bg-card/50 transition-colors ${t.id === ticket.id ? 'border-primary' : ''}`}
                    onClick={() => {
                      if (t.id !== ticket.id) {
                        navigate(`/ticket/${t.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.id}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={statusColors[t.status]}>
                          {t.status}
                        </Badge>
                        <Badge className={priorityColors[t.priority]}>
                          {t.priority}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold">Ticket Notes</h3>
              {ticketNotes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {ticketNotes.map((note: any, idx: number) => (
                    <div key={note.id || idx} className="p-3 bg-card/50 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">{new Date(note.createdAt).toLocaleString()}</p>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-3 bg-primary/5 border-primary/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('chats')}
              >
                <MessageCircle size={16} className="mr-2" />
                View Customer Chat
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('tickets')}
              >
                <FileText size={16} className="mr-2" />
                View Other Tickets
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/chat?kbId=${ticket.id}`)}
              >
                <MessageSquare size={16} className="mr-2" />
                Start Chat with AI
              </Button>
            </div>
          </Card>

          {ticket.assignedToId && (
            <Card className="p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
              <p className="font-semibold">{ticket.assignedToId}</p>
            </Card>
          )}

          <Card className="p-4 space-y-2 bg-card/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ticket Meta</p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-mono text-xs break-all">{ticket.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">User ID</p>
                <p className="font-mono text-xs break-all">{ticket.userId}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
