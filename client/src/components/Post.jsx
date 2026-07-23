import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Post({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isLiked = post.likes.includes(user._id);
  const isOwner = post.user._id === user._id;

  const handleLike = async () => {
    try {
      await API.put(`/posts/like/${post._id}`);
      const updatedLikes = isLiked
        ? post.likes.filter(id => id !== user._id)
        : [...post.likes, user._id];
      onUpdate({ ...post, likes: updatedLikes });
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await API.post(`/posts/comment/${post._id}`, { text: commentText });
      onUpdate(res.data);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await API.delete(`/posts/${post._id}`);
      onDelete(post._id);
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderAvatar = (username, profilePic, size = 'small') => {
    if (profilePic) {
      return (
        <img
          src={profilePic}
          alt={username}
          className={size === 'small' ? 'avatar avatar-img' : 'avatar-large avatar-img'}
        />
      );
    }
    return (
      <div className={size === 'small' ? 'avatar' : 'avatar-large'}>
        {username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user._id}`} className="post-user">
          {renderAvatar(post.user.username, post.user.profilePic)}
          <div className="post-user-info">
            <div>
              <span className="post-username">{post.user.username}</span>
              <span className="post-handle"> @{post.user.username.toLowerCase()}</span>
              <span className="post-handle"> · {timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </Link>
        {isOwner && <button onClick={handleDelete} className="btn-delete" title="Delete">✕</button>}
      </div>

      <p className="post-text">{post.text}</p>

      {post.image && (
        <div className="post-image-container">
          <img src={post.image} alt="Post" className="post-image" loading="lazy" />
        </div>
      )}

      <div className="post-actions">
        <button onClick={() => setShowComments(!showComments)} className="comment-btn">
          💬 {post.comments.length > 0 && post.comments.length}
        </button>
        <button onClick={handleLike} className={`like-btn ${isLiked ? 'liked' : ''}`}>
          {isLiked ? '♥' : '♡'} {post.likes.length > 0 && post.likes.length}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {post.comments.map((c, i) => (
            <div key={i} className="comment">
              <strong>{c.user?.username || 'User'}</strong> {c.text}
            </div>
          ))}
          <form onSubmit={handleComment} className="comment-form">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post your reply..."
            />
            <button type="submit">Reply</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Post;
