import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { HelpCircle, BookOpen, MessageSquare, Shield, Sparkles, Users, ArrowRight, CheckCircle2, LifeBuoy } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/70 backdrop-blur">
        <div className="px-6 py-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">
            <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
            Getting started
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 max-w-3xl">
              <h1 className="heading-1">
                {isAdmin ? 'Support workspace guide' : 'Welcome to Intelligent Support'}
              </h1>
              <p className="text-surface-600 text-lg leading-relaxed">
                {isAdmin
                  ? 'A concise guide for agents and admins to manage chats, tickets, handoff, and customer context efficiently.'
                  : 'A simple support platform where customers get AI answers first, support agents can join when needed, and admins can oversee everything.'}
              </p>
            </div>
            <div className="flex gap-3">
              {!user && (
                <>
                  <Link to="/login">
                    <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline">Create account</Button>
                  </Link>
                </>
              )}
              {user && (
                <Link to="/">
                  <Button variant="primary">Go to workspace</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card elevated className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">What this is for</h2>
            </div>
            <p className="text-sm text-surface-600 leading-relaxed">
              Intelligent Support combines AI chat, human handoff, tickets, knowledge bases, and admin oversight in one workspace so teams can support users with less effort and better visibility.
            </p>
          </Card>

          <Card elevated className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">How to use it</h2>
            </div>
            <ul className="space-y-2 text-sm text-surface-600">
              {quickStartSteps.map((step) => (
                <li key={step} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card elevated className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">Roles at a glance</h2>
            </div>
            <p className="text-sm text-surface-600 leading-relaxed">
              Different people use the product differently, but the flow stays simple: AI first, human when needed, admin oversight when necessary.
            </p>
          </Card>
        </div>

        <Card elevated className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            <h2 className="heading-4">Who uses what</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleCards.map(({ title, icon: Icon, bullets }) => (
              <div key={title} className="rounded-2xl border border-surface-200 bg-surface-50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-surface-900">{title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-surface-600">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card elevated className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary-500" />
            <h2 className="heading-4">How roles are created</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roleCreationNotes.map((note) => (
              <div key={note} className="rounded-xl border border-border bg-card p-4 text-sm text-surface-600">
                {note}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card elevated className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">Support workflow</h2>
            </div>
            <div className="space-y-3">
              {workflowSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm text-surface-600 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card elevated className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">Need-to-know FAQs</h2>
            </div>
            <div className="space-y-2 divide-y divide-surface-200">
              <details className="group">
                <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-surface-900">
                  <span>Can a human join an AI chat?</span>
                  <span className="text-surface-600 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <p className="pb-4 text-sm text-surface-600 leading-relaxed">
                  Yes. Support agents can step in, and admins can take over any conversation when needed.
                </p>
              </details>
              <details className="group">
                <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-surface-900">
                  <span>What happens when a ticket is created?</span>
                  <span className="text-surface-600 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <p className="pb-4 text-sm text-surface-600 leading-relaxed">
                  Tickets can be auto-assigned to available agents, then reassigned if someone is inactive or overloaded.
                </p>
              </details>
              <details className="group">
                <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-surface-900">
                  <span>Where do I start first?</span>
                  <span className="text-surface-600 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <p className="pb-4 text-sm text-surface-600 leading-relaxed">
                  Start with the dashboard, then open Help again any time you need a refresher on roles or workflows.
                </p>
              </details>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
