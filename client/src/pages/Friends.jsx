import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import Post from '../components/Post';

function Friends() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [friendsPosts, setFriendsPosts] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);

  // Chat State
  const [activeChatFriend, setActiveChatFriend] = useState(null); // Friend object currently chatting with
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchUnreadCounts();
  }, [activeTab]);

  // Live polling for chat messages when a chat modal is open
  useEffect(() => {
    if (!activeChatFriend) return;

    fetchConversation(activeChatFriend._id);
    const interval = setInterval(() => {
      fetchConversation(activeChatFriend._id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeChatFriend]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (activeChatFriend) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChatFriend]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'feed') {
        const res = await API.get('/posts/friends-feed');
        setFriendsPosts(res.data);
      } else if (activeTab === 'friends') {
        const res = await API.get('/friends/list');
        setFriendsList(res.data);
      } else if (activeTab === 'requests') {
        const res = await API.get('/friends/requests');
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await API.get('/messages/unread/count');
      setUnreadCounts(res.data.byFriend || {});
    } catch (err) {
      // ignore
    }
  };

  const fetchConversation = async (friendId, isBackground = false) => {
    try {
      const res = await API.get(`/messages/${friendId}`);
      setMessages(res.data);
      // Clear unread count for this friend locally
      setUnreadCounts(prev => ({ ...prev, [friendId]: 0 }));
    } catch (err) {
      if (!isBackground) console.error(err);
    }
  };

  const handleOpenChat = (friend) => {
    setActiveChatFriend(friend);
    setMessages([]);
    setMessageText('');
  };

  const handleCloseChat = () => {
    setActiveChatFriend(null);
    setMessages([]);
    setMessageText('');
    fetchUnreadCounts();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatFriend || sendingMsg) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSendingMsg(true);

    try {
      const res = await API.post('/messages', {
        recipientId: activeChatFriend._id,
        text: textToSend
      });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending message');
      setMessageText(textToSend);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAccept = async (fromUserId) => {
    try {
      await API.put(`/friends/accept/${fromUserId}`);
      setRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r.from._id !== fromUserId)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (fromUserId) => {
    try {
      await API.put(`/friends/reject/${fromUserId}`);
      setRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r.from._id !== fromUserId)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to unfriend?')) return;
    try {
      await API.delete(`/friends/remove/${friendId}`);
      setFriendsList(prev => prev.filter(f => f._id !== friendId));
      if (activeChatFriend && activeChatFriend._id === friendId) {
        handleCloseChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setFriendsPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setFriendsPosts(prev => prev.filter(p => p._id !== postId));
  };

  const renderAvatar = (u, size = 'normal') => {
    const avatarClass = size === 'small' ? 'avatar-small' : 'avatar';
    if (u.profilePic) {
      return <img src={u.profilePic} alt={u.username} className={`${avatarClass} avatar-img`} />;
    }
    return <div className={avatarClass}>{u.username[0].toUpperCase()}</div>;
  };

  const formatMsgTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h2>👥 Friends</h2>
      </div>

      <div className="friends-tabs">
        <button
          className={activeTab === 'feed' ? 'active' : ''}
          onClick={() => setActiveTab('feed')}
        >
          📰 Friends Feed
        </button>
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          👥 My Friends
        </button>
        <button
          className={`${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📬 Requests
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {/* Friends Feed Tab */}
          {activeTab === 'feed' && (
            <div className="posts-list">
              {friendsPosts.length === 0 ? (
                <div className="friends-empty-state">
                  <div className="empty-icon">🤝</div>
                  <h3>No friends' posts yet</h3>
                  <p>Add friends to see their posts here!</p>
                  <Link to="/search" className="btn-find-friends">Find Friends</Link>
                </div>
              ) : (
                friendsPosts.map(post => (
                  <Post
                    key={post._id}
                    post={post}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                  />
                ))
              )}
            </div>
          )}

          {/* My Friends Tab */}
          {activeTab === 'friends' && (
            <div className="friends-list-container">
              {friendsList.length === 0 ? (
                <div className="friends-empty-state">
                  <div className="empty-icon">👋</div>
                  <h3>No friends yet</h3>
                  <p>Start by searching for people and sending friend requests!</p>
                  <Link to="/search" className="btn-find-friends">Find Friends</Link>
                </div>
              ) : (
                friendsList.map(friend => {
                  const unread = unreadCounts[friend._id] || 0;
                  return (
                    <div key={friend._id} className="friend-card">
                      <Link to={`/profile/${friend._id}`} className="friend-card-info">
                        {renderAvatar(friend)}
                        <div className="friend-card-details">
                          <strong>{friend.username}</strong>
                          <span className="friend-card-handle">@{friend.username.toLowerCase()}</span>
                          {friend.bio && <p className="friend-card-bio">{friend.bio}</p>}
                        </div>
                      </Link>
                      <div className="friend-card-actions">
                        <button
                          onClick={() => handleOpenChat(friend)}
                          className="btn-chat-action"
                        >
                          💬 Chat
                          {unread > 0 && <span className="chat-unread-badge">{unread}</span>}
                        </button>
                        <button
                          onClick={() => handleUnfriend(friend._id)}
                          className="btn-unfriend"
                        >
                          Unfriend
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="requests-container">
              {/* Received Requests */}
              <div className="requests-section">
                <h3 className="requests-section-title">
                  📥 Received Requests
                  {requests.received.length > 0 && (
                    <span className="requests-count">{requests.received.length}</span>
                  )}
                </h3>
                {requests.received.length === 0 ? (
                  <p className="no-requests">No pending requests</p>
                ) : (
                  requests.received.map(req => (
                    <div key={req._id} className="request-card">
                      <Link to={`/profile/${req.from._id}`} className="request-card-info">
                        {renderAvatar(req.from)}
                        <div className="request-card-details">
                          <strong>{req.from.username}</strong>
                          <span className="request-card-handle">@{req.from.username.toLowerCase()}</span>
                          {req.from.bio && <p className="request-card-bio">{req.from.bio}</p>}
                        </div>
                      </Link>
                      <div className="request-actions">
                        <button
                          onClick={() => handleAccept(req.from._id)}
                          className="btn-accept"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.from._id)}
                          className="btn-reject"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sent Requests */}
              <div className="requests-section">
                <h3 className="requests-section-title">📤 Sent Requests</h3>
                {requests.sent.length === 0 ? (
                  <p className="no-requests">No sent requests</p>
                ) : (
                  requests.sent.map(req => (
                    <div key={req._id} className="request-card request-card-sent">
                      <Link to={`/profile/${req.to._id}`} className="request-card-info">
                        {renderAvatar(req.to)}
                        <div className="request-card-details">
                          <strong>{req.to.username}</strong>
                          <span className="request-card-handle">@{req.to.username.toLowerCase()}</span>
                        </div>
                      </Link>
                      <span className="request-pending-badge">⏳ Pending</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 💬 CHAT MODAL WINDOW */}
      {activeChatFriend && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            {/* Chat Modal Header */}
            <div className="chat-modal-header">
              <Link to={`/profile/${activeChatFriend._id}`} className="chat-modal-user">
                {renderAvatar(activeChatFriend, 'small')}
                <div>
                  <strong>{activeChatFriend.username}</strong>
                  <span className="chat-online-status">● Active Chat</span>
                </div>
              </Link>
              <button onClick={handleCloseChat} className="chat-modal-close" title="Close chat">✕</button>
            </div>

            {/* Chat Messages Stream */}
            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div className="chat-empty-state">
                  <span>👋</span>
                  <p>Say hi to {activeChatFriend.username}!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div
                      key={msg._id || index}
                      className={`chat-message-bubble ${isMine ? 'mine' : 'theirs'}`}
                    >
                      <div className="chat-message-text">{msg.text}</div>
                      <span className="chat-message-time">{formatMsgTime(msg.createdAt)}</span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message ${activeChatFriend.username}...`}
                maxLength={1000}
                autoFocus
              />
              <button type="submit" disabled={!messageText.trim() || sendingMsg}>
                {sendingMsg ? '...' : 'Send 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Friends;
