import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for New Event
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('GCET Official');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date.trim() || !time.trim() || !location.trim()) return;

    setSubmitting(true);
    try {
      const res = await API.post('/events', {
        title,
        description,
        category,
        date,
        time,
        location,
        organizer
      });
      setEvents([res.data, ...events]);
      setShowCreateModal(false);

      // Reset Form
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRSVP = async (eventId) => {
    try {
      const res = await API.put(`/events/rsvp/${eventId}`);
      setEvents(events.map(ev => ev._id === eventId ? res.data : ev));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await API.delete(`/events/${eventId}`);
      setEvents(events.filter(ev => ev._id !== eventId));
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const filteredEvents = activeCategory === 'All'
    ? events
    : events.filter(ev => ev.category === activeCategory);

  const categoriesList = ['All', 'Tech', 'Cultural', 'Sports', 'Academic', 'General'];

  return (
    <div className="home-layout-wrapper">
      <div className="home-layout">

        {/* COLUMN 1: LEFT SIDEBAR */}
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
            <Link to="/events" className="side-menu-item active">
              <span className="side-menu-icon">📢</span> Campus Events
            </Link>
          </nav>

          {/* Vertical Sponsored Offer Card */}
          <div className="sidebar-promo-card">
            <div className="promo-card-body">
              <div className="promo-box-inner">
                <span className="promo-header-text">SPECIAL OFFER</span>
                <span className="promo-bold-yellow">CAMPUS BOOKSTORE</span>
                <span className="promo-subtext-white">BACK TO SCHOOL SALE! MASSIVE SAVINGS!</span>
                <span className="promo-subtext-white">TEXTBOOKS • SUPPLIES • GEAR</span>
                <span className="promo-action-btn">SHOP NOW</span>
              </div>
            </div>
          </div>

          <hr className="side-divider" />
          <div className="side-menu-item-static">
            <span className="side-menu-icon">⚙️</span> Settings
          </div>
        </aside>

        {/* COLUMN 2: CENTER MAIN EVENTS CONTENT */}
        <main className="home-center-col">

          {/* Events Header Card */}
          <div className="create-post-card">
            <div className="events-header-banner-row">
              <div className="events-banner-title">
                📢 Campus Notice Board & Event Hub
              </div>
              {(user?.isAdmin || user?.isOrganizer) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-create-event-top"
                >
                  + Post Official Event
                </button>
              )}
            </div>
          </div>

          {/* Category Filters Bar */}
          <div className="events-category-filters">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`event-cat-btn ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Events Cards List */}
          {loading ? (
            <div className="loading">Loading campus events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="widget-card">
              <div className="events-empty-msg">
                <span className="events-empty-icon">📅</span>
                <p>No upcoming events found for "<strong>{activeCategory}</strong>".</p>
              </div>
            </div>
          ) : (
            <div className="events-cards-list">
              {filteredEvents.map(ev => {
                const isAttending = ev.attendees?.some(att => (att._id || att)?.toString() === user?._id?.toString());
                const canDelete = (ev.createdBy?._id || ev.createdBy)?.toString() === user?._id?.toString() || user?.isAdmin;

                return (
                  <div key={ev._id} className="event-card-item">
                    <div className="event-card-top-bar">
                      <span className="event-date-pill">{ev.date} • {ev.time}</span>
                      <span className="event-cat-badge">{ev.category}</span>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteEvent(ev._id)}
                          className="btn-delete-event-sm"
                          title="Delete Event"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <h3 className="event-card-title">{ev.title}</h3>
                    
                    <div className="event-card-meta">
                      <span>📍 <strong>Location:</strong> {ev.location}</span>
                      <span>🏢 <strong>Organizer:</strong> {ev.organizer}</span>
                    </div>

                    <p className="event-card-desc">{ev.description}</p>

                    {/* RSVP Action & Attendees Footer Bar */}
                    <div className="event-card-footer">
                      <button
                        onClick={() => handleToggleRSVP(ev._id)}
                        className={`btn-event-rsvp ${isAttending ? 'attending' : ''}`}
                      >
                        {isAttending ? '🎟️ Attending ✓' : '➕ RSVP / Attending'}
                      </button>

                      <div className="event-attendees-preview">
                        <span className="attendees-count-text">
                          <strong>{ev.attendees?.length || 0}</strong> Attending
                        </span>
                        <div className="attendees-avatars-row">
                          {ev.attendees?.slice(0, 4).map((attUser, idx) => (
                            <div key={attUser._id || idx} className="attendee-mini-avatar" title={attUser.username}>
                              {attUser.profilePic ? (
                                <img src={attUser.profilePic} alt={attUser.username} />
                              ) : (
                                <span>{attUser.username?.[0]?.toUpperCase()}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* COLUMN 3: RIGHT SIDEBAR */}
        <aside className="home-right-col">
          <div className="widget-card">
            <div className="widget-header">
              <span>Notice Rules</span>
            </div>
            <div className="widget-body">
              <p className="promo-desc" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                🎓 All events posted on The Batchmates are verified by Campus Admins & Club Leads for official GCET activities.
              </p>
            </div>
          </div>

          <div className="widget-card sidebar-promo-card">
            <div className="widget-header">
              <span>Special Offer</span>
            </div>
            <div className="widget-body promo-card-body">
              <div className="promo-banner-box">
                <div className="promo-img-box">
                  <span className="promo-badge-gold">STUDENT DEALS</span>
                  <div className="promo-text-mock">TECH 20% OFF</div>
                </div>
              </div>
              <strong className="promo-title">Student Deals!</strong>
              <p className="promo-desc">Get 20% off all tech with your university email address.</p>
            </div>
          </div>
        </aside>

      </div>

      {/* CREATE EVENT MODAL (OPTION 2 ADMIN / ORGANIZER ONLY) */}
      {showCreateModal && (
        <div className="modal-overlay-bg">
          <div className="create-event-modal-card">
            <div className="create-event-header">
              <h3>+ Post Official Campus Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close-modal">✕</button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="create-event-form">
              <div className="form-group-field">
                <label>Event Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Tech Hackathon 2024"
                  required
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group-field">
                  <label>Organizer Name:</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="e.g. Coding Club GCET"
                    required
                  />
                </div>

                <div className="form-group-field">
                  <label>Category:</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Tech">Tech</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group-field">
                  <label>Date:</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g. NOV 05, 2024"
                    required
                  />
                </div>

                <div className="form-group-field">
                  <label>Time:</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 4:00 PM"
                    required
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Location / Venue:</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium, Campus"
                  required
                />
              </div>

              <div className="form-group-field">
                <label>Description & Details:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide event details, eligibility, rules..."
                  rows={3}
                  required
                />
              </div>

              <div className="create-event-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel-modal">
                  Cancel
                </button>
                <button type="submit" className="btn-post-submit" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
