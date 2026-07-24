import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [friendStatuses, setFriendStatuses] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await API.get(`/users?search=${query}`);
      setResults(res.data);

      // Fetch friend status for each result
      const statuses = {};
      await Promise.all(
        res.data
          .filter(u => u._id !== user._id)
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
      console.error(err);
    }
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
    if (userId === user._id) return null;

    const status = friendStatuses[userId];
    const isLoading = loadingStates[userId];

    if (status === 'friends') {
      return <span className="search-friend-badge friends">✓ Friends</span>;
    }
    if (status === 'request_sent') {
      return <span className="search-friend-badge pending">⏳ Sent</span>;
    }
    if (status === 'request_received') {
      return <span className="search-friend-badge received">📬 Accept</span>;
    }
    return (
      <button
        onClick={(e) => { e.preventDefault(); handleAddFriend(userId); }}
        className="search-add-friend-btn"
        disabled={isLoading}
      >
        {isLoading ? '...' : '➕ Add'}
      </button>
    );
  };

  return (
    <div className="search-page">
      <h1>Search Users</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by username..." />
        <button type="submit">Search</button>
      </form>
      <div className="search-results">
        {results.map(u => (
          <div key={u._id} className="user-card">
            <Link to={`/profile/${u._id}`} className="user-card-link">
              {u.profilePic ? (
                <img src={u.profilePic} alt={u.username} className="avatar avatar-img" />
              ) : (
                <div className="avatar">{u.username[0].toUpperCase()}</div>
              )}
              <div>
                <strong>{u.username}</strong>
                <p>{u.bio || 'No bio'}</p>
              </div>
            </Link>
            {renderFriendBadge(u._id)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;
