import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchPendingRequests = async () => {
      try {
        const res = await API.get('/friends/requests');
        setPendingCount(res.data.received.length);
      } catch (err) {
        // silently fail
      }
    };
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  if (!user) return null;

  return (
    <>
      {/* DESKTOP & MOBILE TOP HEADER */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">The Batchmates</Link>

          <form onSubmit={handleSearchSubmit} className="nav-search-form">
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Home
            </NavLink>
            <NavLink to={`/profile/${user._id}`} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Profile
            </NavLink>
            <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Messages
              {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Events
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Settings
            </NavLink>
            <button onClick={handleLogout} className="nav-link-btn" title="Log Out">
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM STICKY NAVIGATION BAR (Only visible on screens <= 768px) */}
      <div className="mobile-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'mob-nav-item active' : 'mob-nav-item')}>
          <span className="mob-nav-icon">🌐</span>
          <span className="mob-nav-label">Feed</span>
        </NavLink>

        <NavLink to="/friend-feed" className={({ isActive }) => (isActive ? 'mob-nav-item active' : 'mob-nav-item')}>
          <span className="mob-nav-icon">👥</span>
          <span className="mob-nav-label">Friends</span>
        </NavLink>

        <NavLink to="/messages" className={({ isActive }) => (isActive ? 'mob-nav-item active' : 'mob-nav-item')}>
          <span className="mob-nav-icon">💬</span>
          <span className="mob-nav-label">Chat</span>
          {pendingCount > 0 && <span className="mob-badge">{pendingCount}</span>}
        </NavLink>

        <NavLink to="/events" className={({ isActive }) => (isActive ? 'mob-nav-item active' : 'mob-nav-item')}>
          <span className="mob-nav-icon">📢</span>
          <span className="mob-nav-label">Events</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'mob-nav-item active' : 'mob-nav-item')}>
          <span className="mob-nav-icon">⚙️</span>
          <span className="mob-nav-label">Settings</span>
        </NavLink>

        <NavLink to={`/profile/${user._id}`} className={({ isActive }) => (isActive ? 'mob-nav-item active' : 'mob-nav-item')}>
          <span className="mob-nav-icon">👤</span>
          <span className="mob-nav-label">Profile</span>
        </NavLink>
      </div>
    </>
  );
}

export default Navbar;
