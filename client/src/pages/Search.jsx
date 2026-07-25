import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Search() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [friendStatuses, setFriendStatuses] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await API.get(`/users?search=${encodeURIComponent(searchTerm)}`);
      setResults(res.data);

      // Fetch friend status for each result
      const statuses = {};
      await Promise.all(
        res.data
          .filter(u => u._id !== user?._id)
          .map(async (u) => {
            try {
              const statusRes = await API.get(`/friends/status/${u._id}`);
              statuses[u._id] = statusRes.data.status;
            } catch {
              statuses[u._id] = 'none';
            }
          })
      );
      setFriendStatuses(statuses);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam) {
      setQuery(qParam);
      performSearch(qParam);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query });
    performSearch(query);
  };

  const handleAddFriend = async (userId) => {
    setLoadingStates(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await API.post(`/friends/request/${userId}`);
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: res.data.status === 'accepted' ? 'friends' : 'request_sent'
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  const renderFriendBadge = (userId) => {
    if (userId === user?._id) {
      return <span className="badge-yourself">You</span>;
    }

    const status = friendStatuses[userId];
    const isLoading = loadingStates[userId];

    if (status === 'friends') {
      return <span className="search-friend-badge friends">✓ Friends</span>;
    }
    if (status === 'request_sent') {
      return <span className="search-friend-badge pending">⏳ Request Sent</span>;
    }
    if (status === 'request_received') {
      return <span className="search-friend-badge received">📬 Respond</span>;
    }
    return (
      <button
        onClick={(e) => { e.preventDefault(); handleAddFriend(userId); }}
        className="btn-add-friend-search"
        disabled={isLoading}
      >
        {isLoading ? '...' : '+ Add Friend'}
      </button>
    );
  };

  return (
    <div className="home-layout-wrapper">
      <div className="home-layout">

        {/* COLUMN 1: LEFT SIDEBAR */}
        <aside className="home-left-col">
          {/* User Profile Snapshot */}
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
            <div className="summary-username">{user?.username}</div>
            <Link to={`/profile/${user?._id}`} className="edit-profile-link">
              View My Profile
            </Link>
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
            <Link to="/search" className="side-menu-item active">
              <span className="side-menu-icon">🔍</span> Search Users
            </Link>

            {/* Vertical Sponsored Offer Card */}
            <div className="sidebar-promo-card">
              <div className="promo-card-body">
                <div className="promo-box-inner">
                  <span className="promo-header-text">SPECIAL OFFER</span>
                  <span className="promo-bold-yellow">CAMPUS BOOKSTORE</span>
                  <span className="promo-subtext-white">BACK TO SCHOOL SALE! MASSIVE SAVINGS!</span>
                  <span className="promo-subtext-white">TEXTBOOKS • SUPPLIES • GEAR</span>
                  <span className="promo-action-btn">SHOP NOW</span>
                  <span className="promo-footer-text">Valid with GCET ID</span>
                </div>
              </div>
            </div>

            <hr className="side-divider" />
            <div className="side-menu-item-static">
              <span className="side-menu-icon">⚙️</span> Settings
            </div>
          </nav>
        </aside>

        {/* COLUMN 2: CENTER MAIN SEARCH CONTENT */}
        <main className="home-center-col">
          {/* Search Form Header Box */}
          <div className="create-post-card">
            <div className="create-post-header-title">
              🔍 Campus Directory & User Search
            </div>
            <div className="search-box-body">
              <form onSubmit={handleSearchSubmit} className="search-main-form">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter name, email, or department..."
                  className="search-input-field"
                />
                <button type="submit" className="btn-post-submit" disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
          </div>

          {/* Search Results Box */}
          <div className="widget-card">
            <div className="widget-header">
              <span>
                {hasSearched ? `Search Results (${results.length})` : 'Search Students & Friends'}
              </span>
              {hasSearched && query && (
                <span className="widget-header-link">Query: "{query}"</span>
              )}
            </div>

            <div className="search-results-container">
              {!hasSearched ? (
                <div className="search-placeholder-msg">
                  <span className="search-icon-big">🔎</span>
                  <p>Type a name or keyword above to search students across GCET network.</p>
                </div>
              ) : results.length === 0 ? (
                <div className="search-placeholder-msg">
                  <span className="search-icon-big">❌</span>
                  <p>No students found matching "<strong>{query}</strong>". Try searching another term!</p>
                </div>
              ) : (
                <div className="search-results-list">
                  {results.map((u) => (
                    <div key={u._id} className="search-result-row">
                      <Link to={`/profile/${u._id}`} className="search-user-avatar-link">
                        {u.profilePic ? (
                          <img src={u.profilePic} alt={u.username} className="widget-avatar" />
                        ) : (
                          <div className="widget-avatar-placeholder">
                            {u.username ? u.username[0].toUpperCase() : 'U'}
                          </div>
                        )}
                      </Link>

                      <div className="search-user-info-col">
                        <Link to={`/profile/${u._id}`} className="search-user-name">
                          {u.username}
                        </Link>
                        <p className="search-user-bio">
                          {u.bio || 'The Batchmates Student • GCET'}
                        </p>
                      </div>

                      <div className="search-user-action-col">
                        {renderFriendBadge(u._id)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* COLUMN 3: RIGHT SIDEBAR */}
        <aside className="home-right-col">
          {/* Campus Events Widget */}
          <div className="widget-card">
            <div className="widget-header">
              <span>Campus Events</span>
            </div>
            <div className="widget-body events-widget-body">
              <div className="event-item">
                <span className="event-date-red">OCT 28 • 4:00 PM</span>
                <strong className="event-title">Annual Tech Hackathon 2024</strong>
                <span className="event-location">Main Auditorium, Campus</span>
              </div>
              <div className="event-item">
                <span className="event-date-red">NOV 02 • 6:30 PM</span>
                <strong className="event-title">Campus Music & Cultural Fest</strong>
                <span className="event-location">Open Air Ground</span>
              </div>
            </div>
          </div>

          {/* Student Deals Promo Box */}
          <div className="widget-card">
            <div className="widget-header">
              <span>Special Offer</span>
            </div>
            <div className="widget-body">
              <div className="promo-banner-box textbooks-banner">
                <div className="promo-img-box">
                  <span className="promo-badge-gold">STUDENT DEALS</span>
                  <span className="promo-text-mock">TECH 20% OFF</span>
                </div>
              </div>
              <strong className="promo-title">University Tech Outlet</strong>
              <p className="promo-desc">
                Get 20% off all laptops & accessories with your university email address.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default Search;
