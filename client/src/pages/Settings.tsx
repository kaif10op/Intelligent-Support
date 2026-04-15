import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { User, Lock, Moon, LayoutGrid, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur">
        <div className="px-6 py-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">
            <LayoutGrid className="w-3.5 h-3.5 text-primary-500" />
            Workspace settings
          </div>
          <h1 className="heading-1">Account Settings</h1>
          <p className="text-surface-600 max-w-2xl">Manage your profile, access, and workspace preferences from one clean place.</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <Card elevated className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-surface-200">
              <User className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">Profile Information</h2>
            </div>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full border-2 border-primary-500 flex items-center justify-center bg-primary-100 flex-shrink-0 overflow-hidden">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary-500" />
                  )}
                </div>
                <div className="text-center space-y-2">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-9 h-9 mx-auto',
                        userButtonPopoverCard: 'shadow-xl border border-border/50'
                      }
                    }}
                  />
                  <p className="text-xs text-surface-500">Use the profile menu to manage your identity and account details.</p>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label className="label">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  readOnly
                  className="w-full px-4 py-2.5 bg-surface-100 text-surface-600 rounded-lg border border-surface-200 cursor-not-allowed"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  readOnly
                  className="w-full px-4 py-2.5 bg-surface-100 text-surface-600 rounded-lg border border-surface-200 cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* Security Section */}
          <Card elevated className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-surface-200">
              <Lock className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">Security & Role</h2>
            </div>

            <div className="space-y-4">
              {/* Account Type */}
              <div className="flex items-center justify-between py-3 border-b border-surface-200">
                <span className="text-sm text-surface-600">Account Type:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  user?.role === 'ADMIN'
                    ? 'bg-blue-100 text-blue-800'
                    : user?.role === 'SUPPORT_AGENT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-surface-100 text-surface-700'
                }`}>
                  {user?.role}
                </span>
              </div>

              {/* Auth Status */}
              <div className="flex items-center justify-between py-3 border-b border-surface-200">
                <span className="text-sm text-surface-600">Authentication:</span>
                <span className="text-xs font-medium text-green-600">Active (Google)</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-xs text-surface-600">
                Password and security settings are managed through your identity provider in the profile menu.
              </div>
            </div>
          </Card>

          {/* Preferences Section */}
          <Card elevated className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-surface-200">
              <Moon className="w-5 h-5 text-primary-500" />
              <h2 className="heading-4">Preferences</h2>
            </div>

            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-surface-200">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-surface-900">Dark Mode</h3>
                  <p className="text-xs text-surface-600">Saved locally and applied on refresh</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={darkMode === 'dark'} onChange={toggleDarkMode} className="sr-only peer" />
                  <div className={`w-11 h-6 rounded-full transition-all ${
                    darkMode === 'dark' ? 'bg-primary-500' : 'bg-surface-300'
                  }`}></div>
                  <span className={`absolute w-5 h-5 bg-card border border-border rounded-full transition-all ${
                    darkMode === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
                  } top-0.5 left-0.5`}></span>
                </label>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 text-xs text-surface-500">
                <ShieldCheck className="mt-0.5 w-4 h-4 text-primary-500" />
                <span>Notification and automation controls are centralized in role-aware workflows for support and admin users.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
