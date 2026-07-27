import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';

function Post({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [voting, setVoting] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isLiked = post.likes.includes(user._id);
  const isOwner = post.user._id === user._id;

  // Poll Stats
  const hasPoll = post.poll && post.poll.options && post.poll.options.length >= 2;
  let totalVotes = 0;
  let hasVoted = false;
  let userVotedOptionIndex = -1;

  if (hasPoll) {
    post.poll.options.forEach((opt, idx) => {
      const voteCount = opt.votes ? opt.votes.length : 0;
      totalVotes += voteCount;
      if (opt.votes && opt.votes.some(vId => (vId._id || vId)?.toString() === user._id?.toString())) {
        hasVoted = true;
        userVotedOptionIndex = idx;
      }
    });
  }

  const handleVote = async (optionIndex) => {
    if (voting) return;
    setVoting(true);
    try {
      const res = await API.put(`/posts/poll/vote/${post._id}`, { optionIndex });
      onUpdate(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

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
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await API.post(`/posts/comment/${post._id}`, { text: commentText });
      onUpdate(res.data);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
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
    if (secs < 60) return `${secs} seconds ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} ${mins === 1 ? 'hour' : 'hours'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderAvatar = (username, profilePic) => {
    if (profilePic) {
      return (
        <img
          src={profilePic}
          alt={username}
          className="post-user-avatar avatar-img"
        />
      );
    }
    return (
      <div className="post-user-avatar">
        {username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user-info">
          <Link to={`/profile/${post.user._id}`}>
            {renderAvatar(post.user.username, post.user.profilePic)}
          </Link>
          <div className="post-user-meta">
            <Link to={`/profile/${post.user._id}`} className="post-username">
              {post.user.username}
            </Link>
            <span className="post-time">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        {isOwner && (
          <button onClick={handleDelete} className="btn-delete-post" title="Delete post">···</button>
        )}
      </div>

      {post.text && <p className="post-text">{post.text}</p>}

      {/* RENDER INTERACTIVE CAMPUS POLL */}
      {hasPoll && (
        <div className="post-poll-card">
          <div className="poll-question-header">
            <span className="poll-badge">📊 CAMPUS POLL</span>
            <h4 className="poll-question-title">{post.poll.question}</h4>
          </div>

          <div className="poll-options-render-list">
            {post.poll.options.map((opt, idx) => {
              const voteCount = opt.votes ? opt.votes.length : 0;
              const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              const isMyChoice = userVotedOptionIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => handleVote(idx)}
                  className={`poll-option-render-item ${hasVoted ? 'voted-mode' : ''} ${isMyChoice ? 'my-vote' : ''}`}
                >
                  {/* Animated Progress Bar Fill */}
                  {hasVoted && (
                    <div
                      className={`poll-progress-bar-fill ${isMyChoice ? 'my-bar' : ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  )}

                  <div className="poll-option-content-row">
                    <span className="poll-option-text">
                      {isMyChoice && <span className="my-vote-check">✓ </span>}
                      {opt.optionText}
                    </span>

                    {hasVoted ? (
                      <span className="poll-option-stats">
                        <strong>{percentage}%</strong> ({voteCount})
                      </span>
                    ) : (
                      <span className="poll-vote-cta">Vote 🗳️</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="poll-footer-meta">
            <span>{totalVotes} {totalVotes === 1 ? 'Vote' : 'Votes'}</span>
            <span>• {hasVoted ? 'You voted' : 'Click any option to vote'}</span>
          </div>
        </div>
      )}

      {post.image && (
        <div className="post-image-container">
          <img src={post.image} alt="Post content" className="post-image" loading="lazy" />
        </div>
      )}

      {/* Summary Counts Line */}
      {(post.likes.length > 0 || post.comments.length > 0) && (
        <div className="post-stats-summary">
          {post.likes.length > 0 && (
            <span className="stats-likes">👍 {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</span>
          )}
          {post.comments.length > 0 && (
            <span className="stats-comments" onClick={() => setShowComments(!showComments)}>
              💬 {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
            </span>
          )}
        </div>
      )}

      <div className="post-actions-bar">
        <button onClick={handleLike} className={`action-btn ${isLiked ? 'liked' : ''}`}>
          👍 Like
        </button>
        <button onClick={() => setShowComments(!showComments)} className="action-btn">
          💬 Comment
        </button>
        <button onClick={() => alert('Post shared!')} className="action-btn">
          ↗️ Share
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {post.comments.map((c, i) => (
            <div key={i} className="comment-item">
              <strong>{c.user?.username || 'User'}</strong> {c.text}
            </div>
          ))}
          <form onSubmit={handleComment} className="comment-form">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={submittingComment}
            />
            <button type="submit" disabled={submittingComment || !commentText.trim()}>
              {submittingComment ? 'Posting...' : 'Comment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Post;
