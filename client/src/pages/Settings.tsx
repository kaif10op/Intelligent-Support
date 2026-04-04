import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { User, Lock, Moon } from 'lucide-react';
import { Card, Button } from '../components/ui';

const Settings = () => {
  const { user } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setDarkMode(savedTheme === 'dark');
  }, []);

  const toggleDarkMode = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6">
          <h1 className="heading-1">Account Settings</h1>
          <p className="text-surface-600 mt-1">Manage your profile, security, and preferences</p>
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
                <Button variant="ghost" size="sm">
                  Change Avatar
                </Button>
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

              {/* Manage Passwords Button */}
              <Button
                variant="outline"
                fullWidth
                className="mt-4"
              >
                Manage Passwords
              </Button>
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
                  <p className="text-xs text-surface-600">Coming soon</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full transition-all ${
                    darkMode ? 'bg-primary-500' : 'bg-surface-300'
                  }`}></div>
                  <span className={`absolute w-5 h-5 bg-white rounded-full transition-all ${
                    darkMode ? 'translate-x-5' : 'translate-x-0.5'
                  } top-0.5 left-0.5`}></span>
                </label>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-surface-900">Notifications</h3>
                  <p className="text-xs text-surface-600">Get email updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                  <div className="w-11 h-6 bg-surface-300 rounded-full"></div>
                  <span className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5"></span>
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
