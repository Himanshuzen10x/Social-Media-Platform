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
  const [activeTab, setActiveTab] = useState('posts');
  const [uploadingPic, setUploadingPic] = useState(false);

  const isOwn = currentUser._id === id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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

  const handleSaveBio = async () => {
    try {
      const res = await API.put('/users/profile', { bio });
      setProfile(res.data);
      setEditBio(false);
      const stored = JSON.parse(localStorage.getItem('user'));
      stored.bio = bio;
      localStorage.setItem('user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingPic(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadRes.data.url;

      // Update profile
      const res = await API.put('/users/profile', { bio: profile.bio, profilePic: imageUrl });
      setProfile(res.data);

      // Update local storage
      const stored = JSON.parse(localStorage.getItem('user'));
      stored.profilePic = imageUrl;
      localStorage.setItem('user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      alert('Error uploading profile picture');
      console.error(err);
    } finally {
      setUploadingPic(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const likedPosts = posts.filter(p => p.likes.includes(currentUser._id));

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="loading">User not found</div>;

  const renderAvatar = () => {
    if (profile.profilePic) {
      return <img src={profile.profilePic} alt={profile.username} className="avatar-large avatar-img" />;
    }
    return <div className="avatar-large">{profile.username[0].toUpperCase()}</div>;
  };

  return (
    <div className="profile-page">
      <div className="profile-cover"></div>
      <div className="profile-header">
        <div className="profile-top">
          <div className="profile-avatar-wrapper">
            {renderAvatar()}
            {isOwn && (
              <label className="profile-pic-upload-btn" title={uploadingPic ? 'Uploading...' : 'Change profile picture'}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleProfilePicUpload}
                  hidden
                  disabled={uploadingPic}
                />
                {uploadingPic ? '⏳' : '📷'}
              </label>
            )}
          </div>
          {isOwn && (
            <button onClick={() => setEditBio(true)} className="btn-follow" style={{marginTop: '12px'}}>Edit profile</button>
          )}
        </div>

        <h2>{profile.username}</h2>
        <div className="profile-handle">@{profile.username.toLowerCase()}</div>

        {editBio ? (
          <div className="edit-bio">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Write your bio..." rows={3} />
            <div>
              <button onClick={handleSaveBio}>Save</button>
              <button onClick={() => setEditBio(false)} className="btn-cancel">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="bio">{profile.bio || 'No bio yet.'}</p>
        )}

        <div className="profile-stats">
          <span><strong>{posts.length}</strong> Posts</span>
        </div>
      </div>

      <div className="profile-tabs">
        <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>Posts</button>
        <button className={activeTab === 'likes' ? 'active' : ''} onClick={() => setActiveTab('likes')}>Likes</button>
      </div>

      <div className="posts-list">
        {activeTab === 'posts' ? (
          posts.length === 0 ? (
            <p className="no-posts">No posts yet.</p>
          ) : (
            posts.map(post => (
              <Post key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
            ))
          )
        ) : (
          likedPosts.length === 0 ? (
            <p className="no-posts">No liked posts.</p>
          ) : (
            likedPosts.map(post => (
              <Post key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
            ))
          )
        )}
      </div>
    </div>
  );
}

export default Profile;
