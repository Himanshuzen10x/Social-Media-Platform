import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import CreatePost from '../components/CreatePost';
import Post from '../components/Post';
import MatchModal from '../components/MatchModal';

function Profile() {
  const { id } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bio Edit State
  const [editBio, setEditBio] = useState(false);
  const [bio, setBio] = useState('');

  // About Me Edit State
  const [editAbout, setEditAbout] = useState(false);
  const [major, setMajor] = useState('');
  const [graduating, setGraduating] = useState('');
  const [interests, setInterests] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);

  // Batch Crush / Secret Admirer State
  const [isCrush, setIsCrush] = useState(false);
  const [crushLoading, setCrushLoading] = useState(false);
  const [activeMatchModal, setActiveMatchModal] = useState(null);

  const [uploadingPic, setUploadingPic] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');
  const [friendLoading, setFriendLoading] = useState(false);

  const isOwn = currentUser._id === id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, postsRes] = await Promise.all([
          API.get(`/users/${id}`),
          API.get(`/posts/user/${id}`)
        ]);
        setProfile(userRes.data);
        setPosts(postsRes.data);

        // Populate Form Fields
        setBio(userRes.data.bio || '');
        setMajor(userRes.data.major || '');
        setGraduating(userRes.data.graduating || '');
        setInterests(userRes.data.interests || '');

        // Check if currentUser already marked target user as secret crush
        if (!isOwn && currentUser?.secretCrushes) {
          setIsCrush(currentUser.secretCrushes.includes(id));
        }

        if (!isOwn) {
          try {
            const statusRes = await API.get(`/friends/status/${id}`);
            setFriendStatus(statusRes.data.status);
          } catch {
            setFriendStatus('none');
          }
        }

        // Fetch Friends for Grid Widget
        try {
          if (isOwn) {
            const friendsRes = await API.get('/friends/list');
            setFriendsList(friendsRes.data || []);
          } else {
            setFriendsList(userRes.data.friends || []);
          }
        } catch {
          setFriendsList([]);
        }

        // Fetch People You May Know Suggestions for Right Sidebar
        try {
          const usersRes = await API.get('/users?search=');
          setSuggestions((usersRes.data || []).filter(u => u._id !== currentUser._id && u._id !== id).slice(0, 2));
        } catch {
          setSuggestions([]);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, currentUser._id, isOwn, currentUser.secretCrushes]);

  const handleSaveBio = async () => {
    try {
      const res = await API.put('/users/profile', { bio });
      setProfile(res.data);
      setEditBio(false);
      const stored = JSON.parse(localStorage.getItem('user')) || {};
      stored.bio = bio;
      localStorage.setItem('user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAboutMe = async () => {
    setSavingAbout(true);
    try {
      const res = await API.put('/users/profile', { major, graduating, interests });
      setProfile(res.data);
      setEditAbout(false);
      const stored = JSON.parse(localStorage.getItem('user')) || {};
      stored.major = major;
      stored.graduating = graduating;
      stored.interests = interests;
      localStorage.setItem('user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      console.error(err);
      alert('Failed to update About Me');
    } finally {
      setSavingAbout(false);
    }
  };

  // Handle Secret Crush Toggle
  const handleCrushToggle = async () => {
    setCrushLoading(true);
    try {
      const res = await API.post(`/users/crush/${id}`);
      setIsCrush(res.data.isCrush);

      // Update current user's secretCrushes in AuthContext & LocalStorage
      const storedUser = JSON.parse(localStorage.getItem('user')) || {};
      let updatedCrushes = storedUser.secretCrushes ? [...storedUser.secretCrushes] : [];
      if (res.data.isCrush) {
        if (!updatedCrushes.includes(id)) updatedCrushes.push(id);
      } else {
        updatedCrushes = updatedCrushes.filter(cId => cId !== id);
      }
      storedUser.secretCrushes = updatedCrushes;
      localStorage.setItem('user', JSON.stringify(storedUser));
      setUser(storedUser);

      // IF MUTUAL MATCH: POP UP FULL-SCREEN CELEBRATION MODAL IMMEDIATELY!
      if (res.data.isMatch && res.data.matchedUser) {
        setActiveMatchModal(res.data.matchedUser);
        setFriendStatus('friends'); // Auto-friend on mutual match!
      }

    } catch (err) {
      console.error(err);
      alert('Failed to update Secret Crush');
    } finally {
      setCrushLoading(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadRes.data.url;

      const res = await API.put('/users/profile', { profilePic: imageUrl });
      setProfile(res.data);

      const stored = JSON.parse(localStorage.getItem('user')) || {};
      stored.profilePic = imageUrl;
      localStorage.setItem('user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      alert('Error uploading profile picture');
      console.error(err);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleFriendAction = async () => {
    setFriendLoading(true);
    try {
      if (friendStatus === 'none') {
        await API.post(`/friends/request/${id}`);
        setFriendStatus('request_sent');
      } else if (friendStatus === 'request_received') {
        await API.put(`/friends/accept/${id}`);
        setFriendStatus('friends');
      } else if (friendStatus === 'friends') {
        if (!window.confirm('Are you sure you want to unfriend?')) {
          setFriendLoading(false);
          return;
        }
        await API.delete(`/friends/remove/${id}`);
        setFriendStatus('none');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFriendLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleAddFriend = async (userId) => {
    try {
      await API.post(`/friends/request/${userId}`);
      setSuggestions(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="loading">User not found</div>;

  const friendsCount = profile.friends ? profile.friends.length : friendsList.length;

  return (
    <div className="home-layout profile-page-layout">
      {/* MUTUAL MATCH FULL-SCREEN CELEBRATION MODAL */}
      {activeMatchModal && (
        <MatchModal
          matchedUser={activeMatchModal}
          currentUser={currentUser}
          onClose={() => setActiveMatchModal(null)}
        />
      )}

      {/* LEFT SIDEBAR COLUMN */}
      <aside className="home-left-col">
        {/* User Profile Summary Card */}
        <div className="user-profile-summary-card">
          <div className="profile-photo-container">
            {profile.profilePic ? (
              <img src={profile.profilePic} alt={profile.username} className="user-square-avatar" />
            ) : (
              <div className="user-square-avatar-placeholder">{profile.username[0].toUpperCase()}</div>
            )}
          </div>
          <h3 className="summary-username">{profile.username}</h3>
          {isOwn ? (
            <Link to={`/profile/${currentUser._id}`} className="edit-profile-link">Edit Profile</Link>
          ) : (
            <div className="edit-profile-link">Campus Member</div>
          )}
        </div>

        {/* Side Navigation Menu */}
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

        {/* PROMO OFFER CARD */}
        <div className="widget-card sidebar-promo-card">
          <div className="widget-header uppercase-header">
            <span>SPECIAL OFFER</span>
          </div>
          <div className="widget-body promo-card-body">
            <div className="promo-box-inner">
              <span className="promo-header-text">CAMPUS BOOKSTORE</span>
              <strong className="promo-bold-yellow">BACK TO SCHOOL SALE!</strong>
              <p className="promo-subtext-white">MASSIVE SAVINGS! TEXTBOOKS • SUPPLIES • GEAR</p>
              <span className="promo-action-btn">SHOP NOW!</span>
            </div>
          </div>
        </div>

        <hr className="side-divider" />

        {/* SETTINGS SECTION */}
        <nav className="side-nav-menu secondary-menu">
          <div className="side-menu-title">Settings</div>
          <Link to="/settings" className="side-menu-item">
            <span className="side-menu-icon">⚙️</span> Settings & Privacy
          </Link>
        </nav>
      </aside>

      {/* CENTER MAIN AREA */}
      <main className="home-center-col profile-center-col">

        {/* 1. TOP PROFILE HEADER BANNER CARD */}
        <div className="profile-main-banner-card">
          <div className="banner-avatar-wrapper">
            {profile.profilePic ? (
              <img src={profile.profilePic} alt={profile.username} className="banner-square-avatar" />
            ) : (
              <div className="banner-square-avatar-placeholder">{profile.username[0].toUpperCase()}</div>
            )}

            {isOwn && (
              <label className="banner-avatar-upload-btn" title={uploadingPic ? 'Uploading...' : 'Change Photo'}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleProfilePicUpload}
                  hidden
                  disabled={uploadingPic}
                />
                {uploadingPic ? '⏳' : '📷 Edit'}
              </label>
            )}
          </div>

          <div className="banner-details-col">
            <div className="banner-top-row">
              <h2 className="banner-user-fullname">{profile.username}</h2>
              {isOwn ? (
                <button onClick={() => setEditBio(!editBio)} className="btn-edit-profile-action">
                  Edit Bio
                </button>
              ) : (
                <div className="profile-action-buttons-group">
                  <button
                    onClick={handleFriendAction}
                    className={`btn-edit-profile-action ${friendStatus === 'friends' ? 'btn-friends' : ''}`}
                    disabled={friendLoading || friendStatus === 'request_sent'}
                  >
                    {friendLoading ? '...' : friendStatus === 'friends' ? '✓ Friends' : friendStatus === 'request_sent' ? '⏳ Sent' : '➕ Add Friend'}
                  </button>

                  {/* BATCH CRUSH / SECRET ADMIRER BUTTON */}
                  <button
                    onClick={handleCrushToggle}
                    className={`btn-crush-action ${isCrush ? 'is-crush-active' : ''}`}
                    disabled={crushLoading}
                    title={isCrush ? 'You secretly added this batchmate to your crush list' : 'Add secretly to your crush list'}
                  >
                    {crushLoading ? '...' : isCrush ? '💖 Secret Crush' : '🤍 Batch Crush'}
                  </button>
                </div>
              )}
            </div>

            {/* Bio Section */}
            {editBio ? (
              <div className="edit-bio-inline">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  placeholder="Write a brief intro bio..."
                  rows={2}
                />
                <div className="edit-bio-btn-row">
                  <button onClick={handleSaveBio} className="btn-save-bio">Save</button>
                  <button onClick={() => setEditBio(false)} className="btn-cancel-bio">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="banner-user-quote">
                "{profile.bio || 'Student at GCET Network. Welcome to my profile page!'}"
              </p>
            )}

            {/* Bottom Meta Stats */}
            <div className="banner-stats-bar">
              <span><strong>{friendsCount}</strong> Friends</span>
              <span><strong>{posts.length}</strong> Posts</span>
              <span>GCET Campus</span>
            </div>
          </div>
        </div>

        {/* 2. SUB-COLUMNS GRID */}
        <div className="profile-subcolumns-grid">

          {/* LEFT SUB-COLUMN */}
          <div className="profile-subcol-left">

            {/* Editable About Me Widget Card */}
            <div className="widget-card">
              <div className="widget-header">
                <span>About Me</span>
                {isOwn && (
                  <button
                    onClick={() => setEditAbout(!editAbout)}
                    className="widget-header-link-btn"
                  >
                    {editAbout ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>

              <div className="widget-body about-me-body">
                {editAbout ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveAboutMe(); }} className="edit-about-form">
                    <div className="edit-about-field">
                      <label>MAJOR:</label>
                      <input
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </div>

                    <div className="edit-about-field">
                      <label>GRADUATING:</label>
                      <input
                        type="text"
                        value={graduating}
                        onChange={(e) => setGraduating(e.target.value)}
                        placeholder="e.g. 2026"
                      />
                    </div>

                    <div className="edit-about-field">
                      <label>INTERESTS:</label>
                      <input
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="e.g. Coding, Music, Gaming"
                      />
                    </div>

                    <div className="edit-bio-btn-row" style={{ marginTop: '8px' }}>
                      <button type="submit" className="btn-save-bio" disabled={savingAbout}>
                        {savingAbout ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setEditAbout(false)} className="btn-cancel-bio">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p><strong>MAJOR:</strong> {profile.major || (isOwn ? <em className="empty-text">Click Edit to add</em> : 'Not specified')}</p>
                    <p><strong>GRADUATING:</strong> {profile.graduating || (isOwn ? <em className="empty-text">Click Edit to add</em> : 'Not specified')}</p>
                    <p><strong>INTERESTS:</strong> {profile.interests || (isOwn ? <em className="empty-text">Click Edit to add</em> : 'Not specified')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Friends 3x2 Grid Widget */}
            <div className="widget-card">
              <div className="widget-header">
                <span>Friends</span>
                <span className="widget-count-badge">{friendsCount}</span>
              </div>
              <div className="widget-body friends-grid-body">
                {friendsList.length === 0 ? (
                  <p className="widget-empty">No friends added yet</p>
                ) : (
                  <div className="friends-3x2-grid">
                    {friendsList.slice(0, 6).map((friend, idx) => (
                      <Link key={friend._id || idx} to={`/profile/${friend._id}`} className="friends-grid-item">
                        {friend.profilePic ? (
                          <img src={friend.profilePic} alt={friend.username} className="friends-grid-photo" />
                        ) : (
                          <div className="friends-grid-photo-placeholder">{friend.username[0].toUpperCase()}</div>
                        )}
                        <span className="friends-grid-name">{friend.username.split(' ')[0]}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <hr className="widget-divider" />
                <Link to="/messages" className="widget-footer-link">View All Friends</Link>
              </div>
            </div>

          </div>

          {/* RIGHT SUB-COLUMN */}
          <div className="profile-subcol-right">

            {/* Status Post Box */}
            {isOwn && <CreatePost onPostCreated={handlePostCreated} />}

            {/* User's Posts Feed */}
            <div className="posts-list">
              {posts.length === 0 ? (
                <div className="no-posts">
                  <p>No status updates posted yet.</p>
                </div>
              ) : (
                posts.map(post => (
                  <Post
                    key={post._id}
                    post={post}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                  />
                ))
              )}
            </div>

          </div>

        </div>

      </main>

      {/* RIGHT SIDEBAR COLUMN */}
      <aside className="home-right-col">
        {/* PROMO OFFER WIDGET */}
        <div className="widget-card sidebar-promo-card">
          <div className="widget-header">
            <span>Special Offer</span>
          </div>
          <div className="widget-body promo-card-body">
            <div className="promo-banner-box">
              <div className="promo-img-box">
                <span className="promo-badge-gold">STUDENT DEALS</span>
                <div className="promo-text-mock">TECH 20% OFF</div>
              </div>
            </div>
            <strong className="promo-title">Student Deals!</strong>
            <p className="promo-desc">Get 20% off all tech with your university email address. Valid this week only.</p>
          </div>
        </div>

        {/* People You May Know Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <span>People You May Know</span>
          </div>
          <div className="widget-body">
            {suggestions.length === 0 ? (
              <p className="widget-empty">No suggestions right now</p>
            ) : (
              suggestions.map(sugUser => (
                <div key={sugUser._id} className="suggestion-widget-item">
                  <div className="suggestion-user-row">
                    {sugUser.profilePic ? (
                      <img src={sugUser.profilePic} alt={sugUser.username} className="widget-avatar" />
                    ) : (
                      <div className="widget-avatar-placeholder">{sugUser.username[0].toUpperCase()}</div>
                    )}
                    <div className="widget-user-details">
                      <strong>{sugUser.username}</strong>
                      <span className="mutual-friends-text">1 mutual friend</span>
                      <button onClick={() => handleAddFriend(sugUser._id)} className="btn-add-friend-widget">
                        👤+ Add
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Profile;
