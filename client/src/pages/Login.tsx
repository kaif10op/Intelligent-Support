import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { useUser } from '@clerk/react';
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bot, ShieldCheck, ArrowRight, Clock3, Users2, Sparkles, MessageSquare, Zap, Brain, ChevronRight, Star } from 'lucide-react';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

/* ───── Animated particle grid background ───── */
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    const count = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.o})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

/* ───── Floating metric badge ───── */
const FloatingBadge = ({ icon: Icon, label, value, delay, className = '' }: { icon: any; label: string; value: string; delay: string; className?: string }) => (
  <div
    className={`absolute hidden lg:flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-lg animate-float ${className}`}
    style={{
      animationDelay: delay,
      background: 'var(--glass-bg)',
      borderColor: 'var(--glass-border)',
    }}
  >
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/10 flex items-center justify-center">
      <Icon className="w-4 h-4 text-primary-500" />
    </div>
    <div>
      <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const Login = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);

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

  // Rotate features
  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(p => (p + 1) % 4), 3500);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI Copilot Engine',
      desc: 'Real-time AI suggestions, auto-triage, and intelligent routing that learns from every interaction.',
      gradient: 'from-indigo-500 to-violet-600',
      glow: 'rgba(99,102,241,0.25)',
    },
    {
      icon: Users2,
      title: 'Seamless Handoff',
      desc: 'Zero-friction escalation from AI to human agents with full context preservation.',
      gradient: 'from-cyan-500 to-blue-600',
      glow: 'rgba(6,182,212,0.25)',
    },
    {
      icon: Zap,
      title: 'Smart Automation',
      desc: 'Automated workflows, SLA tracking, and predictive analytics powered by machine learning.',
      gradient: 'from-amber-500 to-orange-600',
      glow: 'rgba(245,158,11,0.25)',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      desc: 'Role-based access control, audit trails, and end-to-end encryption for every workspace.',
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'rgba(16,185,129,0.25)',
    },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '< 2s', label: 'Response Time' },
    { value: '50K+', label: 'Tickets Resolved' },
    { value: '4.9★', label: 'User Rating' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ───── Animated Background ───── */}
      <ParticleCanvas />

      {/* Ambient gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary-500/[0.07] blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.06] blur-[100px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[80px] pointer-events-none" />

      {/* ───── Top Navigation Bar ───── */}
      <nav className="relative z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold font-heading text-foreground tracking-tight">Intelligent Support</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full">Beta</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/help" className="text-sm font-medium text-surface-500 hover:text-foreground transition-colors hidden sm:inline-block">
              Documentation
            </Link>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-sm font-semibold text-primary-500 hover:text-primary-400 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-2 ring-primary-500/20 ring-offset-2 ring-offset-background",
                  }
                }}
              />
            </Show>
          </div>
        </div>
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="relative z-10 px-6 pt-12 pb-20 lg:pt-16 lg:pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 xl:gap-20 items-center">

            {/* Left: Hero Content */}
            <div className="space-y-10">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-primary-500/20 bg-primary-500/[0.08] px-5 py-2.5 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">All Systems Operational</span>
              </div>

              {/* Main heading */}
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-extrabold font-heading tracking-[-0.03em] text-foreground leading-[1.08]">
                  Customer support{' '}
                  <br className="hidden sm:block" />
                  that runs on{' '}
                  <span className="relative inline-block">
                    <span className="gradient-text drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">intelligence</span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                      <path d="M2 6C50 2 150 2 198 6" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </h1>
                <p className="max-w-lg text-lg sm:text-xl text-surface-500 leading-relaxed font-medium">
                  One unified platform for AI-powered conversations, smart ticket routing, and seamless human escalation — built for teams that ship fast.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <button className="group relative px-8 py-4 rounded-2xl text-white font-bold text-[15px] overflow-hidden transition-all duration-300 shadow-[0_4px_25px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-[length:200%_100%] animate-gradient-shift" />
                      <span className="relative flex items-center gap-2">
                        Get Started Free
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="px-8 py-4 rounded-2xl font-bold text-[15px] text-foreground border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>
                      Sign In to Dashboard
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link to="/">
                    <button className="group relative px-8 py-4 rounded-2xl text-white font-bold text-[15px] overflow-hidden transition-all duration-300 shadow-[0_4px_25px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500" />
                      <span className="relative flex items-center gap-2">
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </button>
                  </Link>
                </Show>
              </div>

              {/* Syncing / Error messages */}
              {syncing && (
                <div className="flex items-center gap-3 text-primary-500">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Securing your session...</span>
                </div>
              )}
              {syncError && <p className="text-sm font-medium text-rose-500">{syncError}</p>}

              {/* Trust stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                {stats.map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-extrabold font-heading text-foreground tracking-tight">{value}</p>
                    <p className="text-xs font-medium text-surface-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Feature Showcase */}
            <div className="relative">
              {/* Floating badges */}
              <FloatingBadge icon={MessageSquare} label="Active Chats" value="1,247" delay="0s" className="top-[-30px] left-[-20px] z-20" />
              <FloatingBadge icon={Sparkles} label="AI Accuracy" value="97.8%" delay="1s" className="bottom-[60px] right-[-30px] z-20" />

              {/* Main feature card */}
              <div className="relative glass-elevated p-1 overflow-hidden">
                {/* Animated border gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 via-accent-500/10 to-primary-500/20 bg-[length:200%_100%] animate-gradient-shift opacity-60" />

                <div className="relative rounded-[14px] overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                  {/* Feature header */}
                  <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.15em] text-surface-400">Live Preview</span>
                    </div>
                    <div className="flex gap-1">
                      {features.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveFeature(i)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                            activeFeature === i
                              ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 shadow-sm'
                              : 'text-surface-400 hover:text-surface-600'
                          }`}
                        >
                          {f.title.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active feature content */}
                  <div className="p-8 min-h-[320px] flex flex-col justify-center relative">
                    {/* Background glow */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full blur-[80px] transition-all duration-700"
                      style={{ background: features[activeFeature].glow }}
                    />

                    <div className="relative space-y-6 transition-all duration-500" key={activeFeature}>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${features[activeFeature].gradient} flex items-center justify-center shadow-xl`} style={{ boxShadow: `0 8px 30px ${features[activeFeature].glow}` }}>
                        {(() => { const Icon = features[activeFeature].icon; return <Icon className="w-7 h-7 text-white" />; })()}
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold font-heading text-foreground tracking-tight">
                          {features[activeFeature].title}
                        </h3>
                        <p className="text-surface-500 leading-relaxed font-medium max-w-sm">
                          {features[activeFeature].desc}
                        </p>
                      </div>

                      {/* Feature pills */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {['Real-time', 'Scalable', 'Secure', 'Fast'].map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-100/80 dark:bg-surface-800/50 text-surface-500 border" style={{ borderColor: 'var(--glass-border)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-2 mt-8">
                      {features.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveFeature(i)}
                          className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                          style={{ width: activeFeature === i ? '32px' : '12px', background: activeFeature === i ? 'transparent' : 'var(--glass-border)' }}
                        >
                          {activeFeature === i && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-progress" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Trusted By / Social Proof ───── */}
      <section className="relative z-10 px-6 py-16 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-surface-400 mb-10">
            Trusted by forward-thinking support teams
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: 'SOC 2 Compliant', desc: 'Enterprise security standards' },
              { icon: Clock3, title: '99.9% Uptime', desc: 'SLA-backed reliability' },
              { icon: Star, title: '4.9/5 Rating', desc: 'Loved by support teams' },
              { icon: Zap, title: '2s Avg Response', desc: 'Lightning-fast AI replies' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group text-center p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/5 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                  <Icon className="w-5 h-5 text-primary-500" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">{title}</h4>
                <p className="text-xs text-surface-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="relative z-10 px-6 py-8 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-surface-400">
            <Bot className="w-4 h-4" />
            <span className="text-xs font-medium">© 2026 Intelligent Support. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/help" className="text-xs font-medium text-surface-400 hover:text-primary-500 transition-colors flex items-center gap-1">
              Documentation <ChevronRight className="w-3 h-3" />
            </Link>
            <a href="mailto:support@intelligentsupport.dev" className="text-xs font-medium text-surface-400 hover:text-primary-500 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
