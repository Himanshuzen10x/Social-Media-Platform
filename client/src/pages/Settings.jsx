import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account'); // 'account', 'password', 'privacy', 'danger'

  // Account State
  const [email, setEmail] = useState(user?.email || '');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState({ type: '', text: '' });

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Privacy State
  const [profileVisibility, setProfileVisibility] = useState(user?.profileVisibility || 'public');
  const [batchCrushEnabled, setBatchCrushEnabled] = useState(user?.batchCrushEnabled !== false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState({ type: '', text: '' });

  // Danger Zone State
  const [deleting, setDeleting] = useState(false);

  // 1. Save Account Info (Email)
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    setAccountMsg({ type: '', text: '' });

    try {
      const res = await API.put('/users/settings/account', { email });
      setUser(res.data);
      const stored = JSON.parse(localStorage.getItem('user')) || {};
      stored.email = res.data.email;
      localStorage.setItem('user', JSON.stringify(stored));

      setAccountMsg({ type: 'success', text: 'Email updated successfully!' });
    } catch (err) {
      setAccountMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update email' });
    } finally {
      setSavingAccount(false);
    }
  };

  // 2. Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and Confirm password do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await API.put('/users/settings/password', { currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: res.data.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // 3. Save Privacy & Batch Crush Settings
  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    setSavingPrivacy(true);
    setPrivacyMsg({ type: '', text: '' });

    try {
      const res = await API.put('/users/settings/account', { profileVisibility, batchCrushEnabled });
      setUser(res.data);
      const stored = JSON.parse(localStorage.getItem('user')) || {};
      stored.profileVisibility = res.data.profileVisibility;
      stored.batchCrushEnabled = res.data.batchCrushEnabled;
      localStorage.setItem('user', JSON.stringify(stored));

      setPrivacyMsg({ type: 'success', text: 'Privacy & Batch Crush preferences saved!' });
    } catch (err) {
      setPrivacyMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSavingPrivacy(false);
    }
  };

  // 4. Delete Account Permanently
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ ARE YOU ABSOLUTELY SURE?\n\nThis will permanently delete your account, posts, messages, and matches. This action CANNOT be undone!'
    );
    if (!confirmed) return;

    const secondConfirm = window.prompt(
      `Type your username "${user.username}" to permanently delete your account:`
    );
    if (secondConfirm !== user.username) {
      alert('Username confirmation failed. Account was NOT deleted.');
      return;
    }

    setDeleting(true);
    try {
      await API.delete('/users/account');
      alert('Your account has been permanently deleted.');
      logout();
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="home-layout-wrapper">
      <div className="home-layout">

        {/* LEFT SIDEBAR COLUMN */}
        <aside className="home-left-col">
          <div className="user-profile-summary-card">
            <div className="profile-photo-container">
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.username} className="user-square-avatar" />
              ) : (
                <div className="user-square-avatar-placeholder">
                  {user?.username ? user.username[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <h3 className="summary-username">{user?.username}</h3>
            <Link to={`/profile/${user?._id}`} className="edit-profile-link">View My Profile</Link>
          </div>

          {/* Navigation Menu */}
          <nav className="side-nav-menu">
            <Link to="/" className="side-menu-item">
              <span className="side-menu-icon">🌐</span> Public Feed
            </Link>
            <Link to="/friend-feed" className="side-menu-item">
              <span className="side-menu-icon">👥</span> Friend Feed
            </Link>
            <Link to="/messages" className="side-menu-item">
              <span className="side-menu-icon">💬</span> Messages
            </Link>
            <Link to="/events" className="side-menu-item">
              <span className="side-menu-icon">📢</span> Campus Events
            </Link>
          </nav>

          {/* Sponsored Promo Offer Card */}
          <div className="sidebar-promo-card">
            <div className="promo-card-body">
              <div className="promo-box-inner">
                <span className="promo-header-text">SPECIAL OFFER</span>
                <span className="promo-bold-yellow">CAMPUS BOOKSTORE</span>
                <span className="promo-subtext-white">BACK TO SCHOOL SALE! MASSIVE SAVINGS!</span>
                <span className="promo-action-btn">SHOP NOW</span>
              </div>
            </div>
          </div>

          <hr className="side-divider" />
          <div className="side-menu-item-static active" style={{ fontWeight: 'bold' }}>
            <span className="side-menu-icon">⚙️</span> Settings & Privacy
          </div>
        </aside>

        {/* CENTER MAIN SETTINGS AREA */}
        <main className="home-center-col">

          {/* Settings Top Card */}
          <div className="widget-card settings-main-card">
            <div className="widget-header">
              <span>⚙️ Account & Privacy Settings</span>
            </div>

            {/* Settings Tab Header */}
            <div className="settings-tabs-header">
              <button
                onClick={() => setActiveTab('account')}
                className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              >
                👤 Account
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`settings-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
              >
                🔒 Password
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`settings-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              >
                👁️ Privacy & Crush
              </button>
              <button
                onClick={() => setActiveTab('danger')}
                className={`settings-tab-btn danger-tab ${activeTab === 'danger' ? 'active' : ''}`}
              >
                ⚠️ Danger Zone
              </button>
            </div>

            <div className="settings-tab-content">

              {/* TAB 1: ACCOUNT SETTINGS */}
              {activeTab === 'account' && (
                <form onSubmit={handleSaveAccount} className="settings-form-panel">
                  <h3>👤 Account Information</h3>
                  <p className="settings-subtext">Update your registered email address.</p>

                  {accountMsg.text && (
                    <div className={`settings-alert-box ${accountMsg.type}`}>
                      {accountMsg.text}
                    </div>
                  )}

                  <div className="form-group-field">
                    <label>Username (Static):</label>
                    <input type="text" value={user?.username || ''} disabled className="disabled-input" />
                  </div>

                  <div className="form-group-field">
                    <label>Email Address:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      required
                    />
                  </div>

                  <div className="settings-btn-row">
                    <button type="submit" className="btn-save-settings" disabled={savingAccount}>
                      {savingAccount ? 'Saving...' : 'Save Email'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: PASSWORD CHANGE */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="settings-form-panel">
                  <h3>🔒 Security & Password</h3>
                  <p className="settings-subtext">Change your password to keep your account safe.</p>

                  {passwordMsg.text && (
                    <div className={`settings-alert-box ${passwordMsg.type}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="form-group-field">
                    <label>Current Password:</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="form-group-field">
                    <label>New Password (min 6 characters):</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="form-group-field">
                    <label>Confirm New Password:</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <div className="settings-btn-row">
                    <button type="submit" className="btn-save-settings" disabled={updatingPassword}>
                      {updatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: PRIVACY & BATCH CRUSH */}
              {activeTab === 'privacy' && (
                <form onSubmit={handleSavePrivacy} className="settings-form-panel">
                  <h3>👁️ Privacy & Feature Settings</h3>
                  <p className="settings-subtext">Control who can view your profile and toggle campus features.</p>

                  {privacyMsg.text && (
                    <div className={`settings-alert-box ${privacyMsg.type}`}>
                      {privacyMsg.text}
                    </div>
                  )}

                  {/* Profile Visibility Radio Options */}
                  <div className="settings-section-box">
                    <label className="section-title-lbl">Profile Visibility:</label>

                    <label className="radio-option-item">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={profileVisibility === 'public'}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                      />
                      <span>🌐 <strong>Public (Everyone)</strong> - Anyone on CampusConnect can view your profile</span>
                    </label>

                    <label className="radio-option-item">
                      <input
                        type="radio"
                        name="visibility"
                        value="friends"
                        checked={profileVisibility === 'friends'}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                      />
                      <span>👥 <strong>Friends Only</strong> - Only confirmed friends can view your profile details</span>
                    </label>
                  </div>

                  <hr className="widget-divider" />

                  {/* Batch Crush Toggle */}
                  <div className="settings-section-box">
                    <label className="section-title-lbl">Batch Crush (Secret Admirer) Feature:</label>
                    <label className="checkbox-option-item">
                      <input
                        type="checkbox"
                        checked={batchCrushEnabled}
                        onChange={(e) => setBatchCrushEnabled(e.target.checked)}
                      />
                      <span>💖 <strong>Enable Batch Crush button on my profile</strong></span>
                    </label>
                    <p className="settings-hint-text">
                      When enabled, batchmates can secretly add you as a crush. Matches stay 100% confidential until both add each other!
                    </p>
                  </div>

                  <div className="settings-btn-row">
                    <button type="submit" className="btn-save-settings" disabled={savingPrivacy}>
                      {savingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: DANGER ZONE */}
              {activeTab === 'danger' && (
                <div className="settings-form-panel danger-panel">
                  <h3 className="danger-title">⚠️ Danger Zone</h3>
                  <p className="settings-subtext">
                    Permanently delete your account and all associated data from The Batchmates.
                  </p>

                  <div className="danger-box-warning">
                    <strong>Warning:</strong> Deleting your account will remove your profile, posts, comments, direct messages, and Batch Crush matches permanently.
                  </div>

                  <div className="settings-btn-row">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="btn-danger-delete"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : '🗑️ Delete Account Permanently'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="home-right-col">
          <div className="widget-card">
            <div className="widget-header">
              <span>Privacy Guarantee</span>
            </div>
            <div className="widget-body">
              <p className="promo-desc" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                🔒 Your privacy and data security are our top priorities. You can adjust your visibility or delete your data at any time.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default Settings;
