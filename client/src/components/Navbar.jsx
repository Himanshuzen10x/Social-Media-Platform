import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

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
    // Poll every 30 seconds for new requests
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">XChat</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/search">Explore</Link>
          <Link to="/friends" className="nav-friends-link">
            Friends
            {pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </Link>
          <Link to={`/profile/${user._id}`} className="nav-profile-link">
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.username} className="nav-avatar nav-avatar-img" />
            ) : (
              <span className="nav-avatar">{user.username[0].toUpperCase()}</span>
            )}
            Profile
          </Link>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
