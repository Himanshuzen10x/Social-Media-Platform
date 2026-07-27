import { useState } from 'react';
import { useAuth, API } from '../context/AuthContext';

function CreatePost({ onPostCreated, isFriendFeed = false }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Poll State
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const maxChars = 280;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check validity
    const validPollOptions = pollOptions.filter(o => o.trim().length > 0);
    const hasValidPoll = showPollBuilder && pollQuestion.trim() && validPollOptions.length >= 2;

    if (!text.trim() && !imageFile && !hasValidPoll) return;
    setUploading(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await API.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      let pollData = undefined;
      if (hasValidPoll) {
        pollData = {
          question: pollQuestion.trim(),
          options: validPollOptions.map(o => o.trim())
        };
      }

      const res = await API.post('/posts', { text, image: imageUrl, poll: pollData });
      onPostCreated(res.data);

      // Reset Form
      setText('');
      setImageFile(null);
      setImagePreview(null);
      setShowPollBuilder(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating post');
    } finally {
      setUploading(false);
    }
  };

  const validPollOptions = pollOptions.filter(o => o.trim().length > 0);
  const isPollValid = showPollBuilder && pollQuestion.trim() && validPollOptions.length >= 2;
  const isSubmitDisabled = (!text.trim() && !imageFile && !isPollValid) || uploading;

  return (
    <div className="create-post-card">
      {isFriendFeed ? (
        <div className="create-post-header-top">
          <span className="create-post-title-center">Update Status</span>
          <button type="button" className="btn-post-update-top" onClick={() => alert('Ready to post update')}>
            Post Update
          </button>
        </div>
      ) : (
        <div className="create-post-header-title">Update Status</div>
      )}

      <form className="create-post-form" onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          placeholder={isFriendFeed ? "What's happening on campus?" : "What's on your mind?"}
          rows={3}
        />

        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button type="button" onClick={removeImage} className="remove-image-btn" title="Remove image">✕</button>
          </div>
        )}

        {/* INLINE POLL BUILDER */}
        {showPollBuilder && (
          <div className="poll-builder-card">
            <div className="poll-builder-header">
              <span className="poll-builder-title">📊 Campus Poll Builder</span>
              <button
                type="button"
                className="btn-close-poll"
                onClick={() => setShowPollBuilder(false)}
              >
                ✕ Remove Poll
              </button>
            </div>

            <div className="form-group-field" style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                POLL QUESTION:
              </label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="e.g. Which Tech Stack is best for 2026 placements?"
              />
            </div>

            <div className="poll-options-builder-list">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="poll-option-row">
                  <span className="option-num-pill">{idx + 1}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(idx)}
                      className="btn-remove-opt"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={handleAddPollOption}
                className="btn-add-poll-option-sm"
              >
                ➕ Add Option
              </button>
            )}
          </div>
        )}

        <div className="create-post-footer">
          <div className="create-post-actions-left">
            <label className="btn-add-photo" title="Add Photo">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                hidden
              />
              📷 Photo
            </label>

            <button
              type="button"
              className={`btn-link-action ${showPollBuilder ? 'poll-active' : ''}`}
              onClick={() => setShowPollBuilder(!showPollBuilder)}
              title="Create Poll & Attach Link"
            >
              <img src="/link-icon.png" alt="Link" className="btn-png-link-icon" />
              <span>Poll / Link</span>
            </button>
          </div>

          <button type="submit" className="btn-post-submit" disabled={isSubmitDisabled}>
            {uploading ? (isFriendFeed ? 'Sharing...' : 'Posting...') : (isFriendFeed ? 'Share' : 'Post')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
