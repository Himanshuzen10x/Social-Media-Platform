import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../context/AuthContext';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await API.get(`/users?search=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="search-page">
      <h1>Search Users</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by username..." />
        <button type="submit">Search</button>
      </form>
      <div className="search-results">
        {results.map(user => (
          <Link key={user._id} to={`/profile/${user._id}`} className="user-card">
            <div className="avatar">{user.username[0].toUpperCase()}</div>
            <div>
              <strong>{user.username}</strong>
              <p>{user.bio || 'No bio'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Search;
