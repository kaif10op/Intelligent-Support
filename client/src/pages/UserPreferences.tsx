import { useEffect, useState } from 'react';
import { Settings, Bell, Mic, Save, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

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
    theme: 'dark',
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

  const loadPreferences = async () => {
    try {
      // In production, fetch from API: GET /api/user/preferences
      // For now, use localStorage
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
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
      // Save to localStorage (in production, POST to API)
      localStorage.setItem('userPreferences', JSON.stringify(preferences));

      // In production:
      // await axios.post('http://localhost:8000/api/user/preferences', preferences, {
      //   withCredentials: true
      // });

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
      <div className="flex items-center justify-center min-h-96 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-elevated border border-primary/30 rounded-lg p-6 space-y-3">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">User Preferences</h1>
            <p className="text-muted-foreground mt-1">Customize your experience and settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/30 overflow-x-auto">
        {[
          { id: 'general', label: 'General', icon: Settings },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'voice', label: 'Voice', icon: Mic }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Display Settings</h3>

              {/* Theme */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="input-base w-full"
                >
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
                <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="input-base w-full"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
                <p className="text-xs text-muted-foreground">Select your preferred language</p>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="input-base w-full"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="MST">Mountain Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="IST">India Standard Time</option>
                  <option value="CET">Central European Time</option>
                </select>
                <p className="text-xs text-muted-foreground">Select your timezone for accurate times</p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>

              {/* Email Notifications */}
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email for important updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-card/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Chat Notifications */}
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-foreground">Chat Notifications</p>
                  <p className="text-xs text-muted-foreground">Get notified about new chat messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.chatNotifications}
                    onChange={(e) => handleChange('chatNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-card/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Ticket Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-foreground">Ticket Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates on your tickets</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.ticketNotifications}
                    onChange={(e) => handleChange('ticketNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-card/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Voice Settings</h3>

              {/* Voice Gender */}
              <div className="space-y-2 pb-4 border-b border-border/30">
                <label className="text-sm font-medium text-foreground">Voice Gender</label>
                <select
                  value={preferences.voice}
                  onChange={(e) => handleChange('voice', e.target.value)}
                  className="input-base w-full"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
                <p className="text-xs text-muted-foreground">Choose preferred voice for text-to-speech</p>
              </div>

              {/* Speech-to-Text */}
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-foreground">Speech-to-Text (STT)</p>
                  <p className="text-xs text-muted-foreground">Enable microphone input for easier chatting</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.sttEnabled}
                    onChange={(e) => handleChange('sttEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-card/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Text-to-Speech */}
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-foreground">Text-to-Speech (TTS)</p>
                  <p className="text-xs text-muted-foreground">Hear responses read aloud</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.ttsEnabled}
                    onChange={(e) => handleChange('ttsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-card/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Auto-play (Conditional) */}
              {preferences.ttsEnabled && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="font-medium text-foreground">Auto-play Voice Responses</p>
                    <p className="text-xs text-muted-foreground">Automatically play text-to-speech without clicking</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.autoplay}
                      onChange={(e) => handleChange('autoplay', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-card/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-6 border-t border-border/30">
        <button
          onClick={savePreferences}
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
            saving
              ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserPreferences;
