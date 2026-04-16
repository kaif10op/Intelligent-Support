import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { HelpCircle, BookOpen, MessageSquare, Shield, Sparkles, Users, ArrowRight, CheckCircle2, LifeBuoy, Zap } from 'lucide-react';
import { Button, Card } from '../components/ui';

const roleCards = [
  {
    title: 'Customer',
    icon: MessageSquare,
    bullets: [
      'Ask questions in chat and get AI answers first.',
      'Request a human handoff if you need a person.',
      'Track open tickets and view updates in one place.'
    ]
  },
  {
    title: 'Support Agent',
    icon: LifeBuoy,
    bullets: [
      'Join live chats when a human step-in is needed.',
      'Use the customer context panel for past chats and tickets.',
      'Manage assigned tickets and respond faster with AI assist.'
    ]
  },
  {
    title: 'Admin',
    icon: Shield,
    bullets: [
      'View and manage users, tickets, and support queues.',
      'Override assignments and take over any conversation.',
      'Monitor platform health and team workload.'
    ]
  }
];

const quickStartSteps = [
  'Sign in or create your account.',
  'Choose your role by the workspace you land in.',
  'Open chat for questions, tickets for issues, or knowledge bases for content.',
  'Use the Help page any time you need a refresher.'
];

const workflowSteps = [
  'Customer asks a question or creates a ticket.',
  'AI helps first and gathers context.',
  'Support can take over instantly when needed.',
  'Admins can supervise, reassign, and resolve edge cases.'
];

const roleCreationNotes = [
  'The first account created in a fresh workspace becomes an Admin automatically.',
  'All later signups are created as regular Users by default.',
  'Admins can promote trusted teammates to Support Agent or Admin from the Admin page.',
  'Support Agents handle chats and tickets, while Admins can manage everything.'
];

const Help = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT';

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Sticky Header */}
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="px-6 py-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between max-w-[1200px] mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 shadow-sm">
                <HelpCircle className="w-3.5 h-3.5" />
                Documentation
              </div>
              <h1 className="heading-1 max-w-3xl">
                {isAdmin ? 'Platform Support Guide' : 'Platform Quick Start'}
              </h1>
              <p className="text-surface-500 max-w-3xl text-[15px] leading-relaxed">
                {isAdmin
                  ? 'A definitive reference for agents and admins to navigate chat workflows, ticket queues, roles, and AI integrations.'
                  : 'Learn how to get AI-powered answers instantly, log support requests, and escalate to humans seamlessly.'}
              </p>
            </div>
            
            <div className="flex gap-3 shrink-0">
              {!user && (
                <>
                  <Link to="/login">
                    <Button variant="outline" className="border-surface-300">Sign In</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
              {user && (
                <Link to="/">
                  <Button variant="primary" icon={<Zap className="w-4 h-4" />}>Back to Dashboard</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto w-full">
        <div className="max-w-[1200px] mx-auto pb-16 space-y-8 animate-fade-in-up delay-100">
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card elevated className="p-8 border-t-4 border-t-primary-500 group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2.5 rounded-xl bg-primary-100 text-primary-600 group-hover:scale-110 transition-transform">
                   <Sparkles className="w-5 h-5" />
                 </div>
                 <h2 className="heading-4">Core Purpose</h2>
               </div>
               <p className="text-[13px] text-surface-600 leading-relaxed font-medium">
                 Intelligent Support unifies AI conversational copilots, human handover, ticket queues, knowledge bases, and admin monitoring within a strictly protected workspace environment.
               </p>
             </Card>

             <Card elevated className="p-8 border-t-4 border-t-sky-500 group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600 group-hover:scale-110 transition-transform">
                   <BookOpen className="w-5 h-5" />
                 </div>
                 <h2 className="heading-4">How To Engage</h2>
               </div>
               <ul className="space-y-3">
                 {quickStartSteps.map((step) => (
                   <li key={step} className="flex gap-3 text-[13px] font-medium text-surface-600">
                     <CheckCircle2 className="mt-0.5 w-4 h-4 text-sky-500 flex-shrink-0" />
                     <span>{step}</span>
                   </li>
                 ))}
               </ul>
             </Card>

             <Card elevated className="p-8 border-t-4 border-t-amber-500 group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                   <Users className="w-5 h-5" />
                 </div>
                 <h2 className="heading-4">Access Layers</h2>
               </div>
               <p className="text-[13px] text-surface-600 leading-relaxed font-medium">
                 Permissions dictate visibility. The pipeline stays linear: automated AI responses first, escalated support team access next, and overarching admin control lastly.
               </p>
             </Card>
           </div>

           <Card elevated className="p-0 overflow-hidden">
             <div className="px-8 py-6 border-b border-surface-200/50 bg-surface-50/30 flex items-center justify-between">
                <div>
                   <h2 className="heading-3">Role Capabilities</h2>
                   <p className="text-sm text-surface-500 mt-1">What you can do heavily depends on your platform identity.</p>
                </div>
                <div className="p-3 rounded-xl bg-primary-100 text-primary-500 hidden sm:block">
                  <Shield className="w-6 h-6" />
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-200/50">
               {roleCards.map(({ title, icon: Icon, bullets }) => (
                 <div key={title} className="p-8 hover:bg-surface-50 transition-colors">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-surface-100 text-surface-600 flex items-center justify-center border border-surface-200 shadow-sm">
                       <Icon className="w-5 h-5" />
                     </div>
                     <h3 className="font-bold text-lg text-foreground">{title}</h3>
                   </div>
                   <ul className="space-y-4">
                     {bullets.map((bullet) => (
                       <li key={bullet} className="flex gap-3 text-[13px] text-surface-600 font-medium">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
                         <span>{bullet}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               ))}
             </div>
           </Card>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                 {/* Workflow Card */}
                 <Card elevated className="p-8">
                   <div className="flex items-center gap-3 mb-6">
                     <LifeBuoy className="w-6 h-6 text-emerald-500" />
                     <h2 className="heading-3">Resolution Flow</h2>
                   </div>
                   <div className="relative border-l-2 border-emerald-500/20 ml-3 space-y-6 pb-2">
                     {workflowSteps.map((step, index) => (
                       <div key={step} className="relative pl-6">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center z-10">
                            <span className="sr-only">Step {index + 1}</span>
                         </div>
                         <div className="glass p-4 rounded-xl -mt-3 shadow-sm font-medium text-[13px] text-surface-600 transition-all hover:bg-emerald-50/50">
                           <span className="font-bold text-emerald-700 mr-2">Step {index + 1}:</span> {step}
                         </div>
                       </div>
                     ))}
                   </div>
                 </Card>

                 {/* Permissions Setup */}
                 <Card elevated className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className="w-6 h-6 text-rose-500" />
                      <h2 className="heading-3">Role Allocation</h2>
                    </div>
                    <div className="grid gap-3">
                      {roleCreationNotes.map((note) => (
                        <div key={note} className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-[13px] font-medium text-surface-700 dark:text-surface-300">
                          <CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                 </Card>
              </div>

              {/* FAQs */}
              <Card elevated className="p-8 h-full">
                 <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                     <MessageSquare className="w-6 h-6 text-primary-500" />
                     <h2 className="heading-3">Frequent Questions</h2>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <details className="group [&_summary::-webkit-details-marker]:hidden bg-surface-50/50 rounded-xl border border-surface-200 overflow-hidden">
                     <summary className="px-5 py-4 cursor-pointer flex justify-between items-center font-bold text-[13px] hover:bg-surface-100/50 transition-colors">
                       <span className="text-surface-900">Can a human override the AI Copilot?</span>
                       <span className="transition duration-300 group-open:rotate-45 p-1 rounded-full bg-surface-200 text-surface-600">
                         <PlusIcon className="w-3.5 h-3.5" />
                       </span>
                     </summary>
                     <div className="px-5 pb-5 pt-1 text-[13px] text-surface-600 leading-relaxed font-medium bg-surface-50/50 border-t border-surface-200/50">
                       Absolutely. Support agents receive notifications when human escalation is requested, and admins possess universal rights to take over any active thread.
                     </div>
                   </details>
                   
                   <details className="group [&_summary::-webkit-details-marker]:hidden bg-surface-50/50 rounded-xl border border-surface-200 overflow-hidden">
                     <summary className="px-5 py-4 cursor-pointer flex justify-between items-center font-bold text-[13px] hover:bg-surface-100/50 transition-colors">
                       <span className="text-surface-900">What is the lifecycle of a new submitted ticket?</span>
                       <span className="transition duration-300 group-open:rotate-45 p-1 rounded-full bg-surface-200 text-surface-600">
                         <PlusIcon className="w-3.5 h-3.5" />
                       </span>
                     </summary>
                     <div className="px-5 pb-5 pt-1 text-[13px] text-surface-600 leading-relaxed font-medium bg-surface-50/50 border-t border-surface-200/50">
                       Tickets begin as "Open" and pool in the central queue. Admins can run auto-routing processes to assign them out, or agents can manually claim them.
                     </div>
                   </details>
                   
                   <details className="group [&_summary::-webkit-details-marker]:hidden bg-surface-50/50 rounded-xl border border-surface-200 overflow-hidden">
                     <summary className="px-5 py-4 cursor-pointer flex justify-between items-center font-bold text-[13px] hover:bg-surface-100/50 transition-colors">
                       <span className="text-surface-900">I am lost. Where do I begin?</span>
                       <span className="transition duration-300 group-open:rotate-45 p-1 rounded-full bg-surface-200 text-surface-600">
                         <PlusIcon className="w-3.5 h-3.5" />
                       </span>
                     </summary>
                     <div className="px-5 pb-5 pt-1 text-[13px] text-surface-600 leading-relaxed font-medium bg-surface-50/50 border-t border-surface-200/50">
                       The main dashboard is the nerve center. Monitor your assigned chat notifications or queue counts there. Return to this documentation anytime you get stuck on platform mechanics.
                     </div>
                   </details>
                 </div>
                 
                 <div className="mt-8 pt-8 border-t border-surface-200 px-2">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-surface-500 mb-2">Platform Version</p>
                    <p className="text-sm font-medium text-foreground">Intelligent Support v.2.0 (Premium Layout)</p>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};

// Extracted internal icon
const PlusIcon = (props: React.ComponentProps<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

export default Help;
