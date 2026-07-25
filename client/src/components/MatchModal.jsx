import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MatchModal({ matchedUser, currentUser, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Generate floating hearts dynamically
    const container = document.querySelector('.match-hearts-container');
    if (!container) return;

    const heartSymbols = ['💖', '💗', '💕', '✨', '💖', '💝', '🌸'];
    
    for (let i = 0; i < 25; i++) {
      const heart = document.createElement('div');
      heart.className = 'floating-heart-particle';
      heart.innerText = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.animationDuration = `${3 + Math.random() * 4}s`;
      heart.style.animationDelay = `${Math.random() * 2}s`;
      heart.style.fontSize = `${1.2 + Math.random() * 1.5}rem`;
      container.appendChild(heart);
    }
  }, []);

  const handleSendMessage = () => {
    onClose();
    navigate('/messages');
  };

  if (!matchedUser) return null;

  return (
    <div className="match-modal-overlay">
      {/* Floating Hearts Particles Background */}
      <div className="match-hearts-container"></div>

      {/* Main Glowing Card */}
      <div className="match-modal-card">
        <div className="match-badge-pill">💖 MUTUAL MATCH</div>

        <h2 className="match-title-gradient">IT'S A MATCH!</h2>
        
        <p className="match-subtext">
          You and <strong>{matchedUser.username}</strong> secretly added each other to your <strong>Batch Crush</strong> list!
        </p>

        {/* Avatars Pulse Row */}
        <div className="match-avatars-row">
          <div className="match-avatar-box left-avatar">
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} alt={currentUser.username} className="match-img" />
            ) : (
              <div className="match-placeholder-img">{currentUser?.username?.[0]?.toUpperCase()}</div>
            )}
            <span className="match-user-label">You</span>
          </div>

          <div className="match-heart-pulse-center">
            <span className="pulsing-heart-icon">💖</span>
          </div>

          <div className="match-avatar-box right-avatar">
            {matchedUser.profilePic ? (
              <img src={matchedUser.profilePic} alt={matchedUser.username} className="match-img" />
            ) : (
              <div className="match-placeholder-img">{matchedUser.username[0].toUpperCase()}</div>
            )}
            <span className="match-user-label">{matchedUser.username}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="match-modal-actions">
          <button onClick={handleSendMessage} className="btn-match-chat">
            💬 Send Message Now
          </button>
          <button onClick={onClose} className="btn-match-dismiss">
            ✨ Keep Exploring
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchModal;
