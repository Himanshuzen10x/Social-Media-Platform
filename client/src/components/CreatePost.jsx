import { useState } from 'react';
import { API } from '../context/AuthContext';

function CreatePost({ onPostCreated }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const maxChars = 280;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    setUploading(true);

    try {
      let imageUrl = '';

      // Upload image to Cloudinary if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await API.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      const res = await API.post('/posts', { text, image: imageUrl });
      onPostCreated(res.data);
      setText('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating post');
    } finally {
      setUploading(false);
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

      {imagePreview && (
        <div className="image-preview-container">
          <img src={imagePreview} alt="Preview" className="image-preview" />
          <button type="button" onClick={removeImage} className="remove-image-btn" title="Remove image">✕</button>
        </div>
      )}

      <div className="create-post-footer">
        <div className="create-post-actions-left">
          <label className="image-upload-label" title="Add image">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              hidden
            />
            📷
          </label>
          <span className={`char-count ${charClass}`}>{text.length}/{maxChars}</span>
        </div>
        <button type="submit" disabled={(!text.trim() && !imageFile) || uploading}>
          {uploading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}

export default CreatePost;
