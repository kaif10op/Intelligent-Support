import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { User, Lock, Moon } from 'lucide-react';

const Settings = () => {
  const { user } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setDarkMode(savedTheme === 'dark');
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#f5f5f5');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-muted', '#666666');
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
    } else {
      root.style.setProperty('--bg-primary', '#0a0a0a');
      root.style.setProperty('--bg-card', '#1a1a1a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-muted', '#999999');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
    }
  };

  const toggleDarkMode = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, security, and preferences.</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <section className="glass-elevated border border-border/50 rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
          </div>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-primary flex items-center justify-center bg-primary/10 flex-shrink-0 overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Change Avatar
              </button>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Full Name</label>
              <input
                type="text"
                defaultValue={user?.name}
                readOnly
                className="w-full px-4 py-2.5 bg-muted/30 text-muted-foreground rounded-lg border border-border/30 cursor-not-allowed"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Email Address</label>
              <input
                type="email"
                defaultValue={user?.email}
                readOnly
                className="w-full px-4 py-2.5 bg-muted/30 text-muted-foreground rounded-lg border border-border/30 cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="glass-elevated border border-border/50 rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Security & Role</h2>
          </div>

          <div className="space-y-4">
            {/* Account Type */}
            <div className="flex items-center justify-between py-3 border-b border-border/20">
              <span className="text-sm text-muted-foreground">Account Type:</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                user?.role === 'ADMIN'
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-muted/10 text-muted-foreground'
              }`}>
                {user?.role}
              </span>
            </div>

            {/* Auth Status */}
            <div className="flex items-center justify-between py-3 border-b border-border/20">
              <span className="text-sm text-muted-foreground">Passcode/Auto-Login:</span>
              <span className="text-xs font-medium text-emerald-400">Active (Google Auth)</span>
            </div>

            {/* Manage Passwords Button */}
            <button className="w-full px-4 py-2.5 border border-border/50 text-foreground font-medium rounded-lg hover:bg-card/50 transition-colors text-sm mt-4">
              Manage Passwords
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="glass-elevated border border-border/50 rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <Moon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">App Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-border/20">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">Dark Mode</h3>
                <p className="text-xs text-muted-foreground">Toggle between light and dark theme.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full transition-all ${
                  darkMode ? 'bg-primary' : 'bg-muted/50'
                } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary`}></div>
                <span className={`absolute w-5 h-5 bg-white rounded-full transition-all ${
                  darkMode ? 'translate-x-5' : 'translate-x-0.5'
                } top-0.5 left-0.5`}></span>
              </label>
            </div>

            {/* Notifications Toggle (Coming Soon) */}
            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">Get email alerts about KB activities.</p>
              </div>
              <div className="relative inline-flex items-center cursor-not-allowed opacity-50">
                <div className="w-11 h-6 bg-muted/50 rounded-full"></div>
                <span className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5"></span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
