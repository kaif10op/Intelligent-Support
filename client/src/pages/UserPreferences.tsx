import { useEffect, useState } from 'react';
import { Settings, Bell, Mic, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Card, Select, Button, NavigationTabs } from '../components/ui';
import { applyTheme, getStoredTheme } from '../utils/theme';

interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  chatNotifications: boolean;
  ticketNotifications: boolean;
  voice: 'male' | 'female';
  sttEnabled: boolean;
  ttsEnabled: boolean;
  autoplay: boolean;
  timezone: string;
}

const UserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    theme: getStoredTheme(),
    emailNotifications: true,
    chatNotifications: true,
    ticketNotifications: true,
    voice: 'female',
    sttEnabled: true,
    ttsEnabled: true,
    autoplay: false,
    timezone: 'UTC'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'voice'>('general');
  const { addToast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  const loadPreferences = async () => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      } else {
        setPreferences((prev) => ({ ...prev, theme: getStoredTheme() }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      addToast('Preferences saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      addToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof UserPreferences, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur">
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Settings className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="heading-1">User Preferences</h1>
              <p className="text-surface-600 mt-1">Customize your experience and settings</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <NavigationTabs
              tabs={[
                { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
                { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
                { id: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" /> }
              ]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as any)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-3xl space-y-8">
          {/* General Tab */}
          {activeTab === 'general' && (
            <Card elevated className="p-6 space-y-6">
              <h3 className="heading-4">Display Settings</h3>

              <Select
                label="Theme"
                value={preferences.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                options={[
                  { value: 'dark', label: 'Dark Mode' },
                  { value: 'light', label: 'Light Mode' }
                ]}
                helperText="Choose your preferred color scheme"
              />

              <Select
                label="Language"
                value={preferences.language}
                onChange={(e) => handleChange('language', e.target.value)}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' }
                ]}
                helperText="Select your preferred language"
              />

              <Select
                label="Timezone"
                value={preferences.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                options={[
                  { value: 'UTC', label: 'UTC' },
                  { value: 'EST', label: 'Eastern Time' },
                  { value: 'CST', label: 'Central Time' },
                  { value: 'MST', label: 'Mountain Time' },
                  { value: 'PST', label: 'Pacific Time' },
                  { value: 'IST', label: 'India Standard Time' },
                  { value: 'CET', label: 'Central European Time' }
                ]}
                helperText="Select your timezone for accurate times"
              />
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card elevated className="p-6 space-y-6">
              <h3 className="heading-4">Notification Preferences</h3>

              {/* Email Notifications */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-200">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-surface-900">Email Notifications</p>
                  <p className="text-xs text-surface-600">Receive email for important updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:h-5 after:w-5 after:rounded-full after:border after:border-surface-300 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Chat Notifications */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-200">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-surface-900">Chat Notifications</p>
                  <p className="text-xs text-surface-600">Get notified about new chat messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.chatNotifications}
                    onChange={(e) => handleChange('chatNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:h-5 after:w-5 after:rounded-full after:border after:border-surface-300 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Ticket Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-surface-900">Ticket Notifications</p>
                  <p className="text-xs text-surface-600">Receive updates on your tickets</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.ticketNotifications}
                    onChange={(e) => handleChange('ticketNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:h-5 after:w-5 after:rounded-full after:border after:border-surface-300 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </Card>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <Card elevated className="p-6 space-y-6">
              <h3 className="heading-4">Voice Settings</h3>

              <Select
                label="Voice Gender"
                value={preferences.voice}
                onChange={(e) => handleChange('voice', e.target.value)}
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' }
                ]}
                helperText="Choose preferred voice for text-to-speech"
              />

              {/* Speech-to-Text */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-200">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-surface-900">Speech-to-Text (STT)</p>
                  <p className="text-xs text-surface-600">Enable microphone input for easier chatting</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.sttEnabled}
                    onChange={(e) => handleChange('sttEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:h-5 after:w-5 after:rounded-full after:border after:border-surface-300 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Text-to-Speech */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-200">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-surface-900">Text-to-Speech (TTS)</p>
                  <p className="text-xs text-surface-600">Hear responses read aloud</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.ttsEnabled}
                    onChange={(e) => handleChange('ttsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:h-5 after:w-5 after:rounded-full after:border after:border-surface-300 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Auto-play */}
              {preferences.ttsEnabled && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="font-medium text-surface-900">Auto-play Voice Responses</p>
                    <p className="text-xs text-surface-600">Automatically play text-to-speech without clicking</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.autoplay}
                      onChange={(e) => handleChange('autoplay', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:h-5 after:w-5 after:rounded-full after:border after:border-surface-300 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              )}
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-center pt-6 border-t border-surface-200">
            <Button
              variant="primary"
              size="lg"
              onClick={savePreferences}
              loading={saving}
              disabled={saving}
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
