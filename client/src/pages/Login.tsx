import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { useUser } from '@clerk/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bot, ShieldCheck, ArrowRight, BadgeCheck, Clock3, Users2 } from 'lucide-react';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui';

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
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8 page-enter">
      {/* Animated Orb Backgrounds */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="absolute inset-0 mesh-gradient pointer-events-none opacity-50"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 xl:gap-16 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Bot className="h-4 w-4" />
                Intelligent Support
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-foreground leading-[1.1]">
                  Support that feels{' '}<br className="hidden sm:block" />
                  <span className="gradient-text drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">fast, human, and organized</span>
                </h1>
                <p className="max-w-xl text-lg text-surface-600 leading-relaxed font-medium">
                  One premium workspace for customers, support agents, and admins — powered by AI copilots, seamless human handoff, and unified ticket routing.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Secure Access',
                  text: 'Role-aware protection.'
                },
                {
                  icon: Users2,
                  title: 'Human Handoff',
                  text: 'Seamless escalation.'
                },
                {
                  icon: Clock3,
                  title: 'High Efficiency',
                  text: 'Automated workflows.'
                }
              ].map(({ icon: Icon, title, text }, idx) => (
                <div key={title} className={`glass p-5 transition-transform hover:-translate-y-1 duration-300 stagger-${idx + 1} flex flex-col gap-3 group`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-heading text-foreground tracking-tight">{title}</h3>
                    <p className="text-xs text-surface-500 mt-1 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="lg:flex justify-end relative">
            {/* Decorative ring around card */}
            <div className="absolute inset-0 max-w-[420px] ml-auto rounded-[2rem] bg-gradient-to-b from-primary-500/20 to-accent-500/5 blur-xl -z-10 pointer-events-none" />
            
            <div className="w-full max-w-[420px] mx-auto lg:ml-auto">
              <div className="glass-elevated p-8 sm:p-10 space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                
                {/* Heading */}
                <div className="space-y-2 text-center relative z-10">
                  <h2 className="text-2xl font-bold font-heading text-foreground tracking-tight">Welcome back</h2>
                  <p className="text-sm text-surface-500">Access your secure workspace.</p>
                  
                  {syncing && (
                    <div className="pt-2 animate-pulse flex flex-col items-center gap-2">
                       <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                       <p className="text-xs font-medium text-primary-500">Securing session...</p>
                    </div>
                  )}
                  {syncError && <p className="text-xs font-medium text-rose-500 pt-2">{syncError}</p>}
                </div>

                {/* Clerk Auth Actions */}
                <div className="space-y-6 relative z-10">
                  <Show when="signed-out">
                    <div className="flex flex-col gap-3">
                      <SignInButton mode="modal">
                        <Button variant="primary" fullWidth size="lg" className="text-[15px]">Sign In to Workspace</Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button variant="glass" fullWidth size="lg" className="text-[15px]">Create Account</Button>
                      </SignUpButton>
                    </div>
                  </Show>

                  <Show when="signed-in">
                    <div className="flex flex-col flex-1 items-center gap-4 bg-surface-50/50 border border-border/50 rounded-2xl p-6">
                      <UserButton 
                        appearance={{
                          elements: {
                            avatarBox: "w-16 h-16 ring-4 ring-primary-500/20 ring-offset-4 ring-offset-card shadow-xl",
                            userButtonPopoverCard: "shadow-2xl border-border bg-card",
                          }
                        }}
                      />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Session Active</p>
                        <p className="text-xs text-surface-500 mt-1">If you are not redirected, refresh the page.</p>
                      </div>
                    </div>
                  </Show>

                  {/* Divider */}
                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center pt-2">
                      <div className="w-full border-t border-surface-200/50"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                      <span className="px-3 bg-card text-surface-400">Enterprise Grade</span>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-xl border bg-surface-50/50 backdrop-blur-sm p-4 relative z-10" style={{ borderColor: 'var(--glass-border)' }}>
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-[11px] leading-relaxed text-surface-600 font-medium tracking-wide">
                      End-to-end secure, role-based access keeps your customers, support queue, and administration fully isolated and protected.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 flex flex-col items-center gap-4 relative z-10">
                  <Link to="/help" className="text-xs font-semibold text-primary-500 hover:text-primary-400 transition-colors flex items-center gap-1 group/link">
                    Read the quick start guide
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
