import { useState } from 'react';
import { API } from '../context/AuthContext';

function CreatePost({ onPostCreated }) {
  const [text, setText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await API.post('/posts', { text });
      onPostCreated(res.data);
      setText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating post');
    }
  };

  return (
    <form className="create-post" onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        maxLength={500}
      />
      <button type="submit" disabled={!text.trim()}>Post</button>
    </form>
  );
}

export default CreatePost;
