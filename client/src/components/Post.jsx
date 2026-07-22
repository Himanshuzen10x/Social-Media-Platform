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
      // Toggle like locally
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
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user._id}`} className="post-user">
          <div className="avatar">{post.user.username[0].toUpperCase()}</div>
          <span>{post.user.username}</span>
        </Link>
        <div className="post-meta">
          <span className="post-time">{timeAgo(post.createdAt)}</span>
          {isOwner && <button onClick={handleDelete} className="btn-delete">✕</button>}
        </div>
      </div>

      <p className="post-text">{post.text}</p>

      <div className="post-actions">
        <button onClick={handleLike} className={`btn-like ${isLiked ? 'liked' : ''}`}>
          {isLiked ? '❤️' : '🤍'} {post.likes.length}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          💬 {post.comments.length}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {post.comments.map((c, i) => (
            <div key={i} className="comment">
              <strong>{c.user?.username || 'User'}:</strong> {c.text}
            </div>
          ))}
          <form onSubmit={handleComment} className="comment-form">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Post;
