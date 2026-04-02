import React, { useEffect, useState } from 'react';
import { Settings, Bell, Mic, Save } from 'lucide-react';
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        Loading preferences...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <Settings size={32} />
          <div>
            <h1>User Preferences</h1>
            <p>Customize your experience and settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { id: 'general', label: 'General', icon: Settings },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'voice', label: 'Voice', icon: Mic }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.id ? styles.tabButtonActive : {})
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* General Tab */}
        {activeTab === 'general' && (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <h3>Display Settings</h3>

              <div style={styles.settingGroup}>
                <label>Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  style={styles.select}
                >
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
                <small>Choose your preferred color scheme</small>
              </div>

              <div style={styles.settingGroup}>
                <label>Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  style={styles.select}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
                <small>Select your preferred language</small>
              </div>

              <div style={styles.settingGroup}>
                <label>Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  style={styles.select}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="MST">Mountain Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="IST">India Standard Time</option>
                  <option value="CET">Central European Time</option>
                </select>
                <small>Select your timezone for accurate times</small>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <h3>Notification Preferences</h3>

              <div style={styles.toggleGroup}>
                <div style={styles.toggleContent}>
                  <div>
                    <p>Email Notifications</p>
                    <small>Receive email for important updates</small>
                  </div>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>

              <div style={styles.toggleGroup}>
                <div style={styles.toggleContent}>
                  <div>
                    <p>Chat Notifications</p>
                    <small>Get notified about new chat messages</small>
                  </div>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.chatNotifications}
                    onChange={(e) => handleChange('chatNotifications', e.target.checked)}
                  />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>

              <div style={styles.toggleGroup}>
                <div style={styles.toggleContent}>
                  <div>
                    <p>Ticket Notifications</p>
                    <small>Receive updates on your tickets</small>
                  </div>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.ticketNotifications}
                    onChange={(e) => handleChange('ticketNotifications', e.target.checked)}
                  />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <div style={styles.tabContent}>
            <div style={styles.section}>
              <h3>Voice Settings</h3>

              <div style={styles.settingGroup}>
                <label>Voice Gender</label>
                <select
                  value={preferences.voice}
                  onChange={(e) => handleChange('voice', e.target.value)}
                  style={styles.select}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
                <small>Choose preferred voice for text-to-speech</small>
              </div>

              <div style={styles.toggleGroup}>
                <div style={styles.toggleContent}>
                  <div>
                    <p>Speech-to-Text (STT)</p>
                    <small>Enable microphone input for easier chatting</small>
                  </div>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.sttEnabled}
                    onChange={(e) => handleChange('sttEnabled', e.target.checked)}
                  />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>

              <div style={styles.toggleGroup}>
                <div style={styles.toggleContent}>
                  <div>
                    <p>Text-to-Speech (TTS)</p>
                    <small>Hear responses read aloud</small>
                  </div>
                </div>
                <label style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={preferences.ttsEnabled}
                    onChange={(e) => handleChange('ttsEnabled', e.target.checked)}
                  />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>

              {preferences.ttsEnabled && (
                <div style={styles.toggleGroup}>
                  <div style={styles.toggleContent}>
                    <div>
                      <p>Auto-play Voice Responses</p>
                      <small>Automatically play text-to-speech without clicking</small>
                    </div>
                  </div>
                  <label style={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={preferences.autoplay}
                      onChange={(e) => handleChange('autoplay', e.target.checked)}
                    />
                    <span style={styles.toggleSlider}></span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={styles.footer}>
        <button
          onClick={savePreferences}
          disabled={saving}
          style={{
            ...styles.saveButton,
            ...(saving ? styles.saveButtonDisabled : {})
          }}
        >
          {saving ? (
            <>
              <div style={styles.spinner}></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#0a0e27',
    color: '#fff',
    minHeight: '100vh'
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '12px'
  } as React.CSSProperties,
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #00d2ff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: 'rgba(0,210,255,0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(0,210,255,0.2)'
  } as React.CSSProperties,
  headerContent: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start'
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(0,210,255,0.2)',
    paddingBottom: '12px'
  } as React.CSSProperties,
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s ease'
  } as React.CSSProperties,
  tabButtonActive: {
    color: '#00d2ff',
    borderColor: '#00d2ff'
  } as React.CSSProperties,
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  section: {
    padding: '20px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(0,210,255,0.2)'
  } as React.CSSProperties,
  settingGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(0,210,255,0.1)'
  },
  select: {
    padding: '8px 12px',
    backgroundColor: 'rgba(0,210,255,0.1)',
    border: '1px solid #00d2ff',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer'
  } as React.CSSProperties,
  toggleGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(0,210,255,0.1)'
  } as React.CSSProperties,
  toggleContent: {
    flex: 1
  } as React.CSSProperties,
  toggle: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '44px',
    height: '24px'
  } as React.CSSProperties,
  toggleSlider: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,210,255,0.3)',
    borderRadius: '12px',
    transition: 'all 0.3s ease'
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(0,210,255,0.2)'
  } as React.CSSProperties,
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 32px',
    backgroundColor: '#00d2ff',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  } as React.CSSProperties,
  saveButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  } as React.CSSProperties
};

export default UserPreferences;
