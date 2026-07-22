import { useState } from 'react';
import { API } from '../context/AuthContext';

function CreatePost({ onPostCreated }) {
  const [text, setText] = useState('');
  const maxChars = 280;

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

  const charClass = text.length > 260 ? 'danger' : text.length > 220 ? 'warning' : '';

  return (
    <form className="create-post" onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxChars))}
        placeholder="What's happening?"
        rows={3}
      />
      <div className="create-post-footer">
        <span className={`char-count ${charClass}`}>{text.length}/{maxChars}</span>
        <button type="submit" disabled={!text.trim()}>Post</button>
      </div>
    </form>
  );
}

export default CreatePost;
