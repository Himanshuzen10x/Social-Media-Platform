import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth, API } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Friends from './pages/Friends';
import Events from './pages/Events';
import Settings from './pages/Settings';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import MatchModal from './components/MatchModal';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return !user ? children : <Navigate to="/" />;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const [unseenMatch, setUnseenMatch] = useState(null);

  useEffect(() => {
    if (!user) return;

    const checkUnseenMatches = async () => {
      try {
        const res = await API.get('/users/unseen-matches');
        if (res.data && res.data.length > 0) {
          const matchItem = res.data[0];
          setUnseenMatch(matchItem.user);
        }
      } catch (err) {
        // silently ignore
      }
    };

    checkUnseenMatches();
  }, [user]);

  const handleCloseMatchModal = async () => {
    if (unseenMatch) {
      try {
        await API.post(`/users/mark-match-seen/${unseenMatch._id}`);
      } catch (err) {
        console.error(err);
      }
      setUnseenMatch(null);
    }
  };

  return (
    <>
      <Navbar />

      {/* GLOBAL DELAYED BATCH CRUSH CELEBRATION MODAL FOR LOGGED IN USER */}
      {unseenMatch && (
        <MatchModal
          matchedUser={unseenMatch}
          currentUser={user}
          onClose={handleCloseMatchModal}
        />
      )}

      <div className="app-main-content">
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Home defaultFeed="public" /></PrivateRoute>} />
          <Route path="/friend-feed" element={<PrivateRoute><Home defaultFeed="friends" /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Friends defaultTab="messages" /></PrivateRoute>} />
          <Route path="/friends" element={<PrivateRoute><Friends defaultTab="messages" /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </div>

      {user && location.pathname !== '/messages' && location.pathname !== '/friends' && (
        <footer className="campus-page-footer">
          <div className="footer-left">
            <span>© 2004 The Batchmates</span>
            <Link to="/about">About</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="footer-right">
            <span>🎓 Educational Use Only</span>
          </div>
        </footer>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
