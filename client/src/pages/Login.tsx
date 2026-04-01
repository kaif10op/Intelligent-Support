import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore.js';
import { useNavigate } from 'react-router-dom';
import { Bot, ShieldCheck, Zap } from 'lucide-react';

const Login = () => {
  const { setUser, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSuccess = async (response: any) => {
    try {
      const { credential } = response;
      const res = await axios.post('http://localhost:8000/api/auth/google', { token: credential });
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      console.error('Google login failed', err);
    }
  };

  return (
    <div className="login-page">
      <div className="glow-bg"></div>
      
      <div className="hero-section glass fade-in">
        <div className="logo-container">
          <div className="icon-glow">
            <Bot size={48} color="#8a2be2" />
          </div>
          <h1>AI CUSTOMER SUPPORT</h1>
          <p>The next generation of RAG-powered knowledge management.</p>
        </div>

        <div className="features-grid">
          <div className="feature">
            <ShieldCheck size={24} color="#00d2ff" />
            <h3>Secure Data</h3>
            <p>Your documents are encrypted and protected.</p>
          </div>
          <div className="feature">
            <Zap size={24} color="#ff0080" />
            <h3>Hyper Fast</h3>
            <p>Instant answers with vector-powered search.</p>
          </div>
        </div>

        <div className="login-action">
          <p>Please sign in with your Google account to get started.</p>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log('Login Failed')}
            useOneTap
            theme="filled_black"
            shape="pill"
          />
        </div>
      </div>

      <style>{`
        .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 24px; }
        .glow-bg { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle at 30% 30%, rgba(138, 43, 226, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(0, 210, 255, 0.1) 0%, transparent 50%); z-index: -1; }
        .hero-section { max-width: 800px; padding: 64px; text-align: center; display: flex; flex-direction: column; gap: 48px; border-radius: 32px; background: rgba(10, 10, 10, 0.6); }
        .logo-container h1 { font-size: 2.5rem; margin-top: 16px; letter-spacing: 4px; }
        .icon-glow { width: 80px; height: 80px; margin: 0 auto; background: rgba(138, 43, 226, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(138, 43, 226, 0.3); }
        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; text-align: left; }
        .feature { padding: 24px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid var(--glass-border); transition: var(--transition-smooth); }
        .feature:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
        .feature h3 { margin: 12px 0 8px 0; font-size: 1.1rem; }
        .login-action { display: flex; flex-direction: column; align-items: center; gap: 16px; border-top: 1px solid var(--glass-border); padding-top: 48px; }
        .login-action p { font-size: 0.9rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default Login;
