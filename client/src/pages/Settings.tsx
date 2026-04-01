import { useAuthStore } from '../store/useAuthStore.js';
import { User, Lock, Moon } from 'lucide-react';

const Settings = () => {
  const { user } = useAuthStore();

  return (
    <div className="settings-page fade-in">
      <header className="page-header">
        <h1>Account Settings</h1>
        <p>Manage your profile, security, and preferences.</p>
      </header>

      <div className="settings-grid">
        <section className="settings-section glass">
          <div className="section-header">
            <User size={20} color="#8a2be2" />
            <h2>Profile Information</h2>
          </div>
          <div className="profile-edit">
            <div className="avatar-large">
              {user?.picture ? <img src={user.picture} alt="" /> : <User size={48} />}
              <button className="change-btn">Change Avatar</button>
            </div>
            <div className="input-group">
                <label>Full Name</label>
                <input type="text" defaultValue={user?.name} readOnly />
            </div>
            <div className="input-group">
                <label>Email Address</label>
                <input type="email" defaultValue={user?.email} readOnly />
            </div>
          </div>
        </section>

        <section className="settings-section glass">
          <div className="section-header">
            <Lock size={20} color="#8a2be2" />
            <h2>Security & Role</h2>
          </div>
          <div className="security-info">
             <div className="info-row">
                <span>Account Type:</span>
                <span className={`role-badge ${user?.role}`}>{user?.role}</span>
             </div>
             <div className="info-row">
                <span>Passcode/Auto-Login:</span>
                <span>Active (Google Auth)</span>
             </div>
             <button className="secondary-btn">Manage Passwords</button>
          </div>
        </section>

        <section className="settings-section glass">
          <div className="section-header">
            <Moon size={20} color="#8a2be2" />
            <h2>App Preferences</h2>
          </div>
          <div className="preference-list">
             <div className="pref-item">
                <div className="pref-info">
                   <h3>Dark Mode</h3>
                   <p>Toggle between light and dark theme.</p>
                </div>
                <div className="toggle active"></div>
             </div>
             <div className="pref-item">
                <div className="pref-info">
                   <h3>Notifications</h3>
                   <p>Get email alerts about KB activities.</p>
                </div>
                <div className="toggle"></div>
             </div>
          </div>
        </section>
      </div>

      <style>{`
        .settings-page { display: flex; flex-direction: column; gap: 32px; }
        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; }
        .settings-section { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
        .section-header { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; }
        .avatar-large { display: flex; flex-direction: column; align-items: center; gap: 16px; margin: 0 auto; }
        .avatar-large img { width: 100px; height: 100px; border-radius: 50%; border: 2px solid var(--accent-primary); }
        .change-btn { background: none; border: none; color: var(--accent-primary); font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.85rem; color: var(--text-muted); }
        .input-group input { background: rgba(0,0,0,0.2) !important; color: #aaa; cursor: not-allowed; }
        .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; margin-bottom: 16px; }
        .pref-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pref-info h3 { font-size: 1rem; margin-bottom: 4px; }
        .pref-info p { font-size: 0.8rem; }
        .toggle { width: 44px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 12px; position: relative; cursor: pointer; }
        .toggle.active { background: var(--accent-primary); }
        .toggle::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: 0.2s; }
        .toggle.active::after { left: 23px; }
        .role-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
        .role-badge.ADMIN { background: rgba(0, 210, 255, 0.1); color: #00d2ff; }
        .role-badge.USER { background: rgba(255, 255, 255, 0.1); color: var(--text-muted); }
        .secondary-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 10px; border-radius: 8px; color: #fff; font-weight: 500; cursor: pointer; transition: 0.2s; width: 100%; margin-top: 8px; }
        .secondary-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Settings;
