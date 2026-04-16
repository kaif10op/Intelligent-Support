import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { User, Lock, Moon, LayoutGrid, ShieldCheck, Mail, Sun, Monitor, Laptop } from 'lucide-react';
import { Card } from '../components/ui';
import { UserButton } from '@clerk/react';
import { applyTheme, getStoredTheme, type ThemeMode } from '../utils/theme';

const Settings = () => {
  const { user } = useAuthStore();
  const [darkMode, setDarkMode] = useState<ThemeMode>(getStoredTheme());

  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newTheme: ThemeMode = darkMode === 'dark' ? 'light' : 'dark';
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Sticky Header */}
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="px-6 py-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between max-w-[1000px] mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 shadow-sm">
                <LayoutGrid className="w-3.5 h-3.5" />
                Workspace Settings
              </div>
              <h1 className="heading-1">Account & Preferences</h1>
              <p className="text-surface-500 max-w-2xl text-[15px] leading-relaxed">
                Manage your identity, role permissions, and interface preferences across the platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-8 overflow-y-auto w-full">
         <div className="max-w-[1000px] mx-auto pb-12 w-full space-y-8 animate-fade-in-up delay-100">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
               {/* Left Column */}
               <div className="space-y-8">
                 
                 {/* Profile Section */}
                 <Card elevated className="p-0 overflow-hidden">
                   <div className="px-8 py-6 border-b border-surface-200/50 bg-surface-50/30 flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="heading-4">Profile Information</h2>
                        <p className="text-xs text-surface-500 mt-1">Managed via Clerk Identity</p>
                      </div>
                   </div>

                   <div className="p-8 space-y-8">
                      {/* Avatar Management */}
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl group-hover:bg-primary-500/30 transition-all"></div>
                          <div className="w-28 h-28 rounded-full border-4 border-background flex items-center justify-center bg-primary-100 flex-shrink-0 overflow-hidden relative z-10 shadow-xl">
                            {user?.picture ? (
                              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-12 h-12 text-primary-500" />
                            )}
                          </div>
                        </div>
                        <div className="text-center sm:text-left space-y-3">
                           <UserButton 
                              appearance={{
                                elements: {
                                  avatarBox: 'hidden', // Hide the button's default avatar since we show a large one above, wait, UserButton requires the avatar to click. Let's show it normally below the text.
                                  userButtonTrigger: 'w-full rounded-xl',
                                  userButtonPopoverCard: 'shadow-2xl border border-border/50 bg-card rounded-2xl p-2'
                                }
                              }}
                           />
                           <p className="text-xs font-semibold text-surface-600 bg-surface-100 px-3 py-2 rounded-lg border border-surface-200 inline-block">
                             Click the button above to manage identity
                           </p>
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-surface-100">
                        {/* Name Field */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-surface-500 uppercase tracking-widest">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                            <input
                              type="text"
                              defaultValue={user?.name}
                              readOnly
                              className="w-full pl-11 pr-4 py-3 bg-surface-50/50 text-surface-900 dark:text-surface-100 font-medium rounded-xl border border-surface-200 cursor-not-allowed opacity-80"
                            />
                          </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-surface-500 uppercase tracking-widest">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                            <input
                              type="email"
                              defaultValue={user?.email}
                              readOnly
                              className="w-full pl-11 pr-4 py-3 bg-surface-50/50 text-surface-900 dark:text-surface-100 font-medium rounded-xl border border-surface-200 cursor-not-allowed opacity-80"
                            />
                          </div>
                        </div>
                      </div>
                   </div>
                 </Card>

                 {/* Appearance Preferences */}
                 <Card elevated className="p-0 overflow-hidden">
                   <div className="px-8 py-6 border-b border-surface-200/50 bg-surface-50/30 flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="heading-4">Appearance</h2>
                        <p className="text-xs text-surface-500 mt-1">Customize the platform UI</p>
                      </div>
                   </div>
                   
                   <div className="p-8">
                      <div className="flex items-center justify-between p-5 rounded-2xl border border-surface-200 hover:border-violet-500/30 bg-card hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 text-left">
                          <div className={`p-2.5 rounded-xl ${darkMode === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                             {darkMode === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">Theme Preference</h3>
                            <p className="text-xs text-surface-500 mt-1">Currently using {darkMode} mode</p>
                          </div>
                        </div>
                        
                        <button
                          role="switch"
                          aria-checked={darkMode === 'dark'}
                          onClick={toggleDarkMode}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background ${
                            darkMode === 'dark' ? 'bg-primary-500' : 'bg-surface-300'
                          }`}
                        >
                          <span
                            className={`inline-block w-5 h-5 transform rounded-full bg-white shadow transition-transform ${
                              darkMode === 'dark' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                   </div>
                 </Card>
               </div>

               {/* Right Column / Security */}
               <div className="space-y-8">
                  <Card elevated gradient className="p-0 border-0">
                     <div className="px-6 py-6 border-b border-white/10 flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-md">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="heading-4 text-white">Security Context</h2>
                        </div>
                     </div>
                     <div className="p-6 space-y-6">
                        <div className="space-y-4">
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Platform Role</p>
                              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                   <ShieldCheck className={`w-5 h-5 ${user?.role === 'ADMIN' ? 'text-rose-400' : user?.role === 'SUPPORT_AGENT' ? 'text-amber-400' : 'text-emerald-400'}`} />
                                   <span className="text-sm font-bold text-white">{user?.role?.replace('_', ' ')}</span>
                                </div>
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              </div>
                           </div>

                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Auth Provider</p>
                              <div className="p-3 rounded-xl bg-black/20 border border-white/10 backdrop-blur-sm flex items-center gap-3 text-sm font-medium text-white">
                                <Laptop className="w-4 h-4 text-white/70" />
                                <div className="flex-1">Clerk Identity (OAuth)</div>
                              </div>
                           </div>
                        </div>

                        <div className="pt-4 mt-2 border-t border-white/10 text-xs text-white/70 leading-relaxed font-medium">
                           Password resets, 2FA settings, and session revokes are securely managed directly through your active Clerk provider panel.
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Settings;
