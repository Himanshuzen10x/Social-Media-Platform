import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import CreatePost from '../components/CreatePost';
import Post from '../components/Post';

function Home({ defaultFeed = 'public' }) {
  const { user } = useAuth();
  const location = useLocation();
  const [feedType, setFeedType] = useState(defaultFeed);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [friendStatuses, setFriendStatuses] = useState({});
  const [addingFriend, setAddingFriend] = useState({});

  useEffect(() => {
    if (location.pathname === '/friend-feed') {
      setFeedType('friends');
    } else if (location.pathname === '/') {
      setFeedType('public');
    } else {
      setFeedType(defaultFeed);
    }
  }, [location.pathname, defaultFeed]);

  // Initial Fetch on feedType change
  const fetchInitialPosts = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const endpoint = feedType === 'friends' ? '/posts/friends-feed?page=1' : '/posts/feed?page=1';
      const res = await API.get(endpoint);
      const fetchedPosts = res.data || [];
      setPosts(fetchedPosts);
      if (fetchedPosts.length < 10) {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [feedType]);

  // Infinite Scroll: Fetch next page of posts
  const fetchMorePosts = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const endpoint = feedType === 'friends'
        ? `/posts/friends-feed?page=${nextPage}`
        : `/posts/feed?page=${nextPage}`;

      const res = await API.get(endpoint);
      const newPosts = res.data || [];

      if (newPosts.length > 0) {
        setPosts(prev => {
          // Avoid duplicate posts
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNew = newPosts.filter(p => !existingIds.has(p._id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
      }

      if (newPosts.length < 10) {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [feedType, page, hasMore, loading, loadingMore]);

  const fetchSidebarData = async () => {
    if (!user?._id) return;
    try {
      if (feedType === 'public') {
        const reqRes = await API.get('/friends/requests');
        setFriendRequests(reqRes.data.received || []);

        const usersRes = await API.get('/users?search=');
        const candidateUsers = (usersRes.data || []).filter(u => u._id !== user._id);

        const statuses = {};
        const eligibleSuggestions = [];

        await Promise.all(
          candidateUsers.slice(0, 10).map(async (candidate) => {
            try {
              const statusRes = await API.get(`/friends/status/${candidate._id}`);
              const st = statusRes.data.status;
              statuses[candidate._id] = st;
              if (st === 'none') {
                eligibleSuggestions.push(candidate);
              }
            } catch {
              statuses[candidate._id] = 'none';
              eligibleSuggestions.push(candidate);
            }
          })
        );

        setSuggestions(eligibleSuggestions.slice(0, 4));
        setFriendStatuses(statuses);
      } else {
        const friendsRes = await API.get('/friends/list');
        setOnlineFriends((friendsRes.data || []).slice(0, 4));
      }
    } catch (err) {
      console.error('Sidebar fetch error:', err);
    }
  };

  useEffect(() => {
    fetchInitialPosts();
    fetchSidebarData();
  }, [feedType, fetchInitialPosts, user?._id]);

  // Window Scroll Listener for Infinite Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 350) {
        fetchMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchMorePosts]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleAcceptRequest = async (fromUserId) => {
    try {
      await API.put(`/friends/accept/${fromUserId}`);
      setFriendRequests(prev => prev.filter(r => r.from._id !== fromUserId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleIgnoreRequest = async (fromUserId) => {
    try {
      await API.put(`/friends/reject/${fromUserId}`);
      setFriendRequests(prev => prev.filter(r => r.from._id !== fromUserId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async (userId, username = '') => {
    if (addingFriend[userId]) return;
    setAddingFriend(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await API.post(`/friends/request/${userId}`);
      const newStatus = res.data.status === 'accepted' ? 'friends' : 'request_sent';
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: newStatus
      }));
      alert(res.data.message || `Friend request sent to ${username || 'user'}!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not send friend request');
    } finally {
      setAddingFriend(prev => ({ ...prev, [userId]: false }));
    }
  };

  const isFriendFeed = feedType === 'friends';

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
            <div className="summary-username">{user?.username}</div>
            <Link to={`/profile/${user?._id}`} className="edit-profile-link">
              Edit Profile
            </Link>
          </div>

          <nav className="side-nav-menu">
            <Link
              to="/"
              className={`side-menu-item ${!isFriendFeed ? 'active' : ''}`}
              onClick={() => setFeedType('public')}
            >
              <span className="side-menu-icon">🌐</span> Public Feed
            </Link>
            <Link
              to="/friend-feed"
              className={`side-menu-item ${isFriendFeed ? 'active' : ''}`}
              onClick={() => setFeedType('friends')}
            >
              <span className="side-menu-icon">👥</span> Friend Feed
            </Link>
            <Link to="/messages" className="side-menu-item">
              <span className="side-menu-icon">💬</span> Messages
            </Link>
            <Link to="/events" className="side-menu-item">
              <span className="side-menu-icon">📢</span> Campus Events
            </Link>
          </nav>

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

          <nav className="side-nav-menu secondary-menu">
            <div className="side-menu-title">Settings</div>
            <Link to="/settings" className="side-menu-item">
              <span className="side-menu-icon">⚙️</span> Settings & Privacy
            </Link>
          </nav>
        </aside>

        {/* CENTER MAIN FEED COLUMN */}
        <main className="home-center-col">
          <CreatePost onPostCreated={handlePostCreated} isFriendFeed={isFriendFeed} />

          {loading ? (
            <div className="loading">Loading feed...</div>
          ) : (
            <>
              <div className="posts-list">
                {posts.length === 0 ? (
                  <div className="no-posts">
                    <p>{isFriendFeed ? "No friend updates yet." : "No status updates yet. Share what's on your mind!"}</p>
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

              {/* INFINITE SCROLL BOTTOM LOADERS & INDICATORS */}
              {loadingMore && (
                <div className="infinite-scroll-loader">
                  <span className="loader-spinner">⏳</span> Loading more updates...
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div className="infinite-scroll-end">
                  🎉 You're all caught up!
                </div>
              )}
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR COLUMN */}
        <aside className="home-right-col">
          {isFriendFeed ? (
            <>
              <div className="widget-card">
                <div className="widget-header">
                  <span>Friends Online</span>
                </div>
                <div className="widget-body">
                  {onlineFriends.length === 0 ? (
                    <p className="widget-empty">No friends online right now</p>
                  ) : (
                    onlineFriends.map(friend => (
                      <div key={friend._id} className="online-friend-row">
                        <span className="online-dot">🟢</span>
                        {friend.profilePic ? (
                          <img src={friend.profilePic} alt={friend.username} className="widget-avatar" />
                        ) : (
                          <div className="widget-avatar-placeholder">{friend.username[0].toUpperCase()}</div>
                        )}
                        <Link to={`/messages`} className="online-friend-name">{friend.username}</Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="widget-card">
                <div className="widget-header">
                  <span>Campus Events</span>
                  <Link to="/events" className="widget-header-link">See All</Link>
                </div>
                <div className="widget-body events-widget-body">
                  <div className="event-item">
                    <span className="event-date-red">NOV 05</span>
                    <strong className="event-title">Annual Tech Hackathon</strong>
                    <span className="event-location">Main Computer Center</span>
                  </div>
                  <div className="event-item">
                    <span className="event-date-red">NOV 12</span>
                    <strong className="event-title">Cultural Music Fest</strong>
                    <span className="event-location">Open Air Auditorium</span>
                  </div>
                  <Link to="/events" className="widget-footer-link">View All Events</Link>
                </div>
              </div>

              <div className="widget-card sidebar-promo-card">
                <div className="widget-header uppercase-header">
                  <span>SPECIAL OFFER</span>
                </div>
                <div className="widget-body promo-card-body">
                  <div className="promo-banner-box textbooks-banner">
                    <div className="promo-img-box">
                      <span className="promo-badge-blue">50% OFF RENTALS!</span>
                      <div className="promo-text-mock">TEXTBOOKS</div>
                    </div>
                  </div>
                  <strong className="promo-title">Rent Books for Cheap!</strong>
                  <p className="promo-desc">Save 50% on all engineering textbooks this semester.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="widget-card">
                <div className="widget-header">
                  <span>Friend Requests</span>
                  <Link to="/messages" className="widget-header-link">See All</Link>
                </div>
                <div className="widget-body">
                  {friendRequests.length === 0 ? (
                    <div className="request-widget-item">
                      <div className="request-widget-user">
                        <div className="widget-avatar-placeholder">M</div>
                        <div className="widget-user-details">
                          <strong>Marcus Wright</strong>
                          <div className="widget-btn-row">
                            <button onClick={() => alert('Confirmed')} className="btn-confirm">Confirm</button>
                            <button onClick={() => alert('Ignored')} className="btn-ignore">Ignore</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    friendRequests.map(req => (
                      <div key={req._id} className="request-widget-item">
                        <div className="request-widget-user">
                          {req.from.profilePic ? (
                            <img src={req.from.profilePic} alt={req.from.username} className="widget-avatar" />
                          ) : (
                            <div className="widget-avatar-placeholder">{req.from.username[0].toUpperCase()}</div>
                          )}
                          <div className="widget-user-details">
                            <strong>{req.from.username}</strong>
                            <div className="widget-btn-row">
                              <button onClick={() => handleAcceptRequest(req.from._id)} className="btn-confirm">Confirm</button>
                              <button onClick={() => handleIgnoreRequest(req.from._id)} className="btn-ignore">Ignore</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="widget-card">
                <div className="widget-header">
                  <span>People You May Know</span>
                </div>
                <div className="widget-body">
                  {suggestions.length === 0 ? (
                    <div style={{ padding: '12px 8px', textAlign: 'center', color: '#65676b', fontSize: '0.88rem' }}>
                      <span>No new suggestions.</span>
                      <br />
                      <Link to="/search" style={{ color: 'var(--primary-blue)', fontWeight: 600, marginTop: '4px', display: 'inline-block' }}>
                        Find members 🔍
                      </Link>
                    </div>
                  ) : (
                    suggestions.map(sugUser => {
                      const status = friendStatuses[sugUser._id];
                      const isAdding = addingFriend[sugUser._id];

                      return (
                        <div key={sugUser._id} className="suggestion-widget-item">
                          <div className="suggestion-user-row">
                            <Link to={`/profile/${sugUser._id}`}>
                              {sugUser.profilePic ? (
                                <img src={sugUser.profilePic} alt={sugUser.username} className="widget-avatar" />
                              ) : (
                                <div className="widget-avatar-placeholder">{sugUser.username[0].toUpperCase()}</div>
                              )}
                            </Link>
                            <div className="widget-user-details">
                              <Link to={`/profile/${sugUser._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <strong>{sugUser.username}</strong>
                              </Link>
                              <span className="mutual-friends-text">Campus Member</span>
                              {status === 'request_sent' ? (
                                <button className="btn-add-friend-widget sent" disabled style={{ opacity: 0.75, cursor: 'default', backgroundColor: '#e4e6eb', color: '#050505' }}>
                                  ⏳ Request Sent
                                </button>
                              ) : status === 'friends' ? (
                                <button className="btn-add-friend-widget friends" disabled style={{ opacity: 0.75, cursor: 'default', backgroundColor: '#e7f3ff', color: 'var(--primary-blue)' }}>
                                  ✓ Friends
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAddFriend(sugUser._id, sugUser.username)}
                                  className="btn-add-friend-widget"
                                  disabled={isAdding}
                                >
                                  {isAdding ? 'Sending...' : '👤+ Add Friend'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <Link to="/search" className="widget-footer-link">View All Suggestions</Link>
                </div>
              </div>

              <div className="widget-card sidebar-promo-card">
                <div className="widget-header uppercase-header">
                  <span>SPECIAL OFFER</span>
                </div>
                <div className="widget-body promo-card-body">
                  <div className="promo-banner-box">
                    <div className="promo-img-box">
                      <span className="promo-badge-gold">20% OFF DEALS</span>
                      <div className="promo-text-mock">TEXTBOOKS</div>
                    </div>
                  </div>
                  <strong className="promo-title">Campus Bookstore Sale</strong>
                  <p className="promo-desc">Get your textbooks for the spring semester early and save 20% on all used books.</p>
                </div>
              </div>
            </>
          )}
        </aside>

      </div>
    </div>
  );
}

export default Home;
