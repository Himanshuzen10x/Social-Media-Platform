import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
