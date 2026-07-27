import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Friends({ defaultTab = 'messages' }) {
  const { user } = useAuth();
  const [friendsList, setFriendsList] = useState([]);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const chatBodyRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Fetch Friends List
  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await API.get('/friends/list');
        const list = res.data || [];
        setFriendsList(list);

        // Auto select first friend for chat on desktop if none selected
        if (list.length > 0 && !activeChatFriend) {
          // On mobile screens, don't auto select so user sees inboxes list first
          if (window.innerWidth > 768) {
            setActiveChatFriend(list[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  // Fetch Conversation Messages when activeChatFriend changes
  useEffect(() => {
    if (!activeChatFriend) return;

    const fetchMessages = async () => {
      try {
        const res = await API.get(`/messages/${activeChatFriend._id}`);
        const newMsgs = res.data || [];

        setMessages(prev => {
          if (
            prev.length !== newMsgs.length ||
            (newMsgs.length > 0 && prev[prev.length - 1]?._id !== newMsgs[newMsgs.length - 1]?._id)
          ) {
            return newMsgs;
          }
          return prev;
        });

        // Clear unread count for this friend
        setUnreadCounts(prev => ({ ...prev, [activeChatFriend._id]: 0 }));
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChatFriend]);

  // Scroll inner chat container to bottom when messages count changes or friend switches
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, activeChatFriend?._id]);

  const handleSelectFriendChat = (friend) => {
    setActiveChatFriend(friend);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatFriend || sendingMsg) return;

    setSendingMsg(true);
    try {
      const res = await API.post('/messages/send', {
        recipientId: activeChatFriend._id,
        text: messageText
      });

      setMessages(prev => [...prev, res.data]);
      setMessageText('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAvatar = (u, className = 'inbox-avatar') => {
    if (u.profilePic) {
      return <img src={u.profilePic} alt={u.username} className={`${className} avatar-img`} />;
    }
    return <div className={className}>{u.username[0].toUpperCase()}</div>;
  };

  return (
    <div className="home-layout-wrapper messages-static-wrapper">
      <div className={`messages-3col-layout ${activeChatFriend ? 'mobile-chat-active' : 'mobile-inbox-active'}`}>
        
        {/* COLUMN 1: LEFT NAVIGATION SIDEBAR */}
        <aside className="home-left-col messages-left-col">
          <div className="user-profile-summary-card">
            <div className="profile-photo-container">
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.username} className="user-square-avatar" />
              ) : (
                <div className="user-square-avatar-placeholder">{user?.username?.[0]?.toUpperCase()}</div>
              )}
            </div>
            <h3 className="summary-username">{user?.username}</h3>
            <Link to={`/profile/${user?._id}`} className="edit-profile-link">View Profile</Link>
          </div>

          <nav className="side-nav-menu">
            <Link to="/" className="side-menu-item">
              <span className="side-menu-icon">🌐</span> Public Feed
            </Link>
            <Link to="/friend-feed" className="side-menu-item">
              <span className="side-menu-icon">👥</span> Friend Feed
            </Link>
            <Link to="/messages" className="side-menu-item active">
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
                <p className="promo-subtext-white">MASSIVE SAVINGS! TEXTBOOKS • SUPPLIES</p>
                <span className="promo-action-btn">SHOP NOW!</span>
              </div>
            </div>
          </div>

          <hr className="side-divider" />
          <nav className="side-nav-menu secondary-menu">
            <Link to="/settings" className="side-menu-item">
              <span className="side-menu-icon">⚙️</span> Settings & Privacy
            </Link>
          </nav>
        </aside>

        {/* COLUMN 2: CENTER ACTIVE CHAT WINDOW */}
        <main className="chat-window-card">
          {activeChatFriend ? (
            <>
              {/* Chat Top Header */}
              <div className="chat-window-header">
                <button
                  type="button"
                  className="btn-mobile-back-inbox"
                  onClick={() => setActiveChatFriend(null)}
                >
                  ← Inboxes
                </button>

                <div className="chat-header-user-info">
                  <span className="online-indicator-dot">🟢</span>
                  <strong className="chat-header-username">{activeChatFriend.username}</strong>
                  <span className="chat-header-status">(Active now)</span>
                </div>

                <div className="chat-header-actions">
                  <Link to={`/profile/${activeChatFriend._id}`} className="btn-header-action">
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="chat-messages-body" ref={chatBodyRef}>
                <div className="chat-date-separator">
                  <span>Today</span>
                </div>

                {messages.length === 0 ? (
                  <div className="chat-stream-empty">
                    <p>Say hello to {activeChatFriend.username}! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = (msg.sender?._id || msg.sender) === user._id;
                    return (
                      <div
                        key={msg._id || index}
                        className={`msg-row-wrapper ${isMine ? 'mine-row' : 'theirs-row'}`}
                      >
                        {!isMine && renderAvatar(activeChatFriend, 'msg-avatar')}
                        
                        <div className="msg-content-wrapper">
                          <div className={`msg-bubble ${isMine ? 'mine-bubble' : 'theirs-bubble'}`}>
                            {msg.text}
                          </div>
                          <span className="msg-timestamp">{formatMsgTime(msg.createdAt)}</span>
                        </div>

                        {isMine && renderAvatar(user, 'msg-avatar')}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar Footer */}
              <form onSubmit={handleSendMessage} className="chat-input-bar">
                <div className="chat-input-row">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Write a message..."
                    rows={2}
                  />
                  <button
                    type="submit"
                    className="btn-send-msg"
                    disabled={!messageText.trim() || sendingMsg}
                  >
                    {sendingMsg ? '...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a friend from Inboxes to start messaging.</p>
            </div>
          )}
        </main>

        {/* COLUMN 3: RIGHT INBOXES CONVERSATION LIST */}
        <aside className="inboxes-col-card">
          <div className="inboxes-header">
            <span className="inboxes-title">Inboxes</span>
          </div>

          <div className="inboxes-list-body">
            {friendsList.length === 0 ? (
              <div className="inbox-empty">
                <p>No connections yet.</p>
                <Link to="/search" className="btn-find-friends-sm">Find Friends</Link>
              </div>
            ) : (
              friendsList.map(friend => {
                const isSelected = activeChatFriend && activeChatFriend._id === friend._id;
                const unread = unreadCounts[friend._id] || 0;
                return (
                  <div
                    key={friend._id}
                    className={`inbox-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectFriendChat(friend)}
                  >
                    {renderAvatar(friend, 'inbox-user-avatar')}
                    <div className="inbox-item-details">
                      <div className="inbox-top-line">
                        <strong className="inbox-username">{friend.username}</strong>
                        <span className="inbox-time">Active</span>
                      </div>
                      <p className="inbox-preview-text">
                        {friend.bio ? <em>{friend.bio}</em> : <em>Click to open chat</em>}
                      </p>
                    </div>
                    {unread > 0 && <span className="inbox-unread-dot">{unread}</span>}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Friends;
