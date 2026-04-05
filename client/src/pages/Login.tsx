import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { useUser } from '@clerk/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bot, ShieldCheck, ArrowRight, BadgeCheck, Clock3, Users2 } from 'lucide-react';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

const Login = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const syncSession = async () => {
      if (!isSignedIn || !user || syncing) return;

      try {
        setSyncing(true);
        setSyncError(null);

        const payload = {
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || user.username || 'User',
          picture: user.imageUrl,
        };

        const res = await axios.post(API_ENDPOINTS.AUTH_CLERK, payload, axiosConfig);

        // Store JWT token in localStorage for API requests
        if (res.data.token) {
          localStorage.setItem('auth_token', res.data.token);
        }

        if (res.data.user) {
          setUser(res.data.user);
        }

        navigate('/');
      } catch (err: any) {
        setSyncError(err.response?.data?.error || 'Failed to create platform session');
      } finally {
        setSyncing(false);
      }
    };

    syncSession();
  }, [isSignedIn, user, syncing, navigate, setUser]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Gradient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl opacity-25"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-bl from-secondary/10 to-transparent rounded-full blur-3xl opacity-25"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 xl:gap-14 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
              <Bot className="h-4 w-4 text-primary" />
              Intelligent Support Platform
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Support that feels{' '}
                <span className="gradient-text">fast, human, and organized</span>
              </h1>
              <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                One workspace for customers, support agents, and admins - with AI copilots, human handoff, ticket routing, and clear operational visibility.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Secure by default',
                  text: 'Role-aware access and protected support workflows.'
                },
                {
                  icon: Users2,
                  title: 'Human handoff',
                  text: 'Agents can step in instantly when a conversation needs them.'
                },
                {
                  icon: Clock3,
                  title: 'Always efficient',
                  text: 'Automated queues, smarter context, and fewer manual steps.'
                }
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="lg:flex justify-center">
            <div className="w-full max-w-sm">
              {/* Glass Card */}
              <div className="glass-elevated p-8 space-y-8 shadow-xl border border-border/40">
                {/* Heading */}
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                  <p className="text-sm text-muted-foreground">Access your workspace, tickets, chats, and support tools.</p>
                  {syncing && <p className="text-xs text-primary">Setting up your platform access...</p>}
                  {syncError && <p className="text-xs text-destructive">{syncError}</p>}
                </div>

                {/* Clerk Auth Actions */}
                <div className="space-y-4">
                  <Show when="signed-out">
                    <div className="flex items-center justify-center gap-3">
                      <SignInButton />
                      <SignUpButton />
                    </div>
                  </Show>

                  <Show when="signed-in">
                    <div className="flex flex-col items-center gap-3">
                      <UserButton />
                      <p className="text-xs text-muted-foreground">You are signed in.</p>
                    </div>
                  </Show>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/20"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="px-2 bg-card text-muted-foreground">Secure & Encrypted</span>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Secure, role-based access keeps customer conversations, support queues, and admin controls in one clean workspace.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <span>Need access for your team?</span>
                  <span className="text-primary font-medium flex items-center gap-1">
                    Create account <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-gradient-to-bl from-secondary/5 to-transparent rounded-full blur-3xl -z-10"></div>
    </div>
  );
};

export default Login;
