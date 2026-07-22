import { useState, useEffect } from 'react';
import { API } from '../context/AuthContext';
import CreatePost from '../components/CreatePost';
import Post from '../components/Post';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await API.get('/posts/feed');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home-page">
      <div className="feed-header">Home</div>
      <CreatePost onPostCreated={handlePostCreated} />
      <div className="posts-list">
        {posts.length === 0 ? (
          <p className="no-posts">No posts yet. Be the first to post!</p>
        ) : (
          posts.map(post => (
            <Post key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
          ))
        )}
      </div>
    </div>
  );
}

export default Home;
