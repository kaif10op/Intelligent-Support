import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore.js';
import { useNavigate } from 'react-router-dom';
import { Bot, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

const Login = () => {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSuccess = async (response: any) => {
    try {
      const { credential } = response;
      const res = await axios.post('http://localhost:8000/api/auth/google',
        { token: credential },
        { withCredentials: true }
      );
      setUser(res.data.user);
      navigate('/');
    } catch (err: any) {
      console.error('Google login failed', err);
      alert(err.response?.data?.error || 'Authentication with backend failed. Please try again.');
    }
  };

  const handleFailure = () => {
    console.error('Google Login Failed to initialize');
    alert(`Google Login failed to initialize. Please check your browser's third-party cookie settings.`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Gradient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-bl from-secondary/20 to-transparent rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-12">
            {/* Logo & Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">SUPPORT AI</h2>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="text-foreground">Intelligent </span>
                  <span className="gradient-text">Support</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  RAG-powered knowledge management and AI-driven customer support. Faster responses. Smarter answers.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex gap-4 items-start group cursor-pointer">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Enterprise Secure</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your documents are encrypted and protected with bank-level security.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start group cursor-pointer">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Zap className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground mt-1">Instant answers with vector-powered semantic search across your knowledge base.</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-border/50">
              <div>
                <div className="text-3xl font-bold text-primary">105+</div>
                <p className="text-sm text-muted-foreground mt-1">Features Built</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary">99.9%</div>
                <p className="text-sm text-muted-foreground mt-1">Uptime SLA</p>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="lg:flex justify-center">
            <div className="w-full max-w-sm">
              {/* Glass Card */}
              <div className="glass-elevated p-8 space-y-8">
                {/* Heading */}
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-foreground">Get Started</h2>
                  <p className="text-sm text-muted-foreground">Sign in with your Google account to unlock the full potential of AI-powered support.</p>
                </div>

                {/* Google Sign In */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleSuccess}
                      onError={handleFailure}
                      theme="filled_black"
                      shape="pill"
                    />
                  </div>

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
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">
                    By signing in, you agree to our Terms of Service and Privacy Policy. Your data is encrypted and never shared.
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <span>First time here?</span>
                  <span className="text-primary font-medium flex items-center gap-1">
                    Create account <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex items-center justify-center gap-6 px-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">5M+</div>
                  <p className="text-xs text-muted-foreground mt-1">Conversations</p>
                </div>
                <div className="w-px h-8 bg-border/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">1K+</div>
                  <p className="text-xs text-muted-foreground mt-1">Customers</p>
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
