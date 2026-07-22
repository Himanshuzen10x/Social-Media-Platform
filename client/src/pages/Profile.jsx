import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import Post from '../components/Post';

function Profile() {
  const { id } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editBio, setEditBio] = useState(false);
  const [bio, setBio] = useState('');

  const isOwn = currentUser._id === id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          API.get(`/users/${id}`),
          API.get(`/posts/user/${id}`)
        ]);
        setProfile(userRes.data);
        setPosts(postsRes.data);
        setBio(userRes.data.bio || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFollow = async () => {
    try {
      await API.put(`/users/follow/${id}`);
      const res = await API.get(`/users/${id}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBio = async () => {
    try {
      const res = await API.put('/users/profile', { bio });
      setProfile(res.data);
      setEditBio(false);
      // Update stored user
      const stored = JSON.parse(localStorage.getItem('user'));
      stored.bio = bio;
      localStorage.setItem('user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      console.error(err);
    }
  };

  const isFollowing = profile?.followers?.some(f => (f._id || f) === currentUser._id);

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="loading">User not found</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-large">{profile.username[0].toUpperCase()}</div>
        <h2>{profile.username}</h2>

        {editBio ? (
          <div className="edit-bio">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Write your bio..." />
            <div>
              <button onClick={handleSaveBio}>Save</button>
              <button onClick={() => setEditBio(false)} className="btn-cancel">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="bio">{profile.bio || 'No bio yet'} {isOwn && <button onClick={() => setEditBio(true)} className="btn-edit">Edit</button>}</p>
        )}

        <div className="profile-stats">
          <span><strong>{posts.length}</strong> Posts</span>
          <span><strong>{profile.followers?.length || 0}</strong> Followers</span>
          <span><strong>{profile.following?.length || 0}</strong> Following</span>
        </div>

        {!isOwn && (
          <button onClick={handleFollow} className={`btn-follow ${isFollowing ? 'following' : ''}`}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div className="posts-list">
        <h3>Posts</h3>
        {posts.length === 0 ? (
          <p className="no-posts">No posts yet.</p>
        ) : (
          posts.map(post => (
            <Post key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
          ))
        )}
      </div>
    </div>
  );
}

export default Profile;
