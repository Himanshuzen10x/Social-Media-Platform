import { Link } from 'react-router-dom';

function Privacy() {
  return (
    <div className="about-page-wrapper">
      <div className="about-container">
        
        {/* HEADER */}
        <div className="about-hero-card">
          <div className="about-hero-badge">🔒 DATA SECURITY & PRIVACY</div>
          <h1 className="about-hero-title">Privacy Policy</h1>
          <p className="about-hero-subtitle">
            Learn how <strong>The Batchmates</strong> protects your personal information, messages, and secret crush privacy.
          </p>
        </div>

        {/* CONTENT CARD */}
        <div className="about-section-card terms-content-card">
          <div className="policy-block">
            <h3>1. Information We Collect</h3>
            <p>
              To provide campus networking features, we collect essential account details during registration and profile creation:
            </p>
            <ul>
              <li><strong>Account Credentials:</strong> Username, Email address, and Password (encrypted via Bcrypt hashing).</li>
              <li><strong>Profile Information:</strong> Bio, Profile Picture, Major, Graduation Year, and Interests.</li>
              <li><strong>User Content:</strong> Status updates, campus polls, comments, and direct chat messages.</li>
            </ul>
          </div>

          <div className="policy-block">
            <h3>2. Secret Crush Privacy Guarantee 💘</h3>
            <p>
              Your secret crush selections are <strong>100% confidential and private</strong>. 
              The target user is never notified when you add them to your Secret Crush list. 
              Identities are revealed <em>only when a mutual crush match is confirmed by both students</em>.
            </p>
          </div>

          <div className="policy-block">
            <h3>3. How Information Is Used</h3>
            <p>
              We use collected information solely to power platform functionality:
            </p>
            <ul>
              <li>Displaying your status updates and polls on Public & Friend Feeds.</li>
              <li>Connecting you with fellow batchmates via Friend Requests.</li>
              <li>Delivering 1-on-1 private chat messages between confirmed friends.</li>
              <li>Preventing unauthorized logins and securing session access using JWT tokens.</li>
            </ul>
          </div>

          <div className="policy-block">
            <h3>4. Data Storage & Security</h3>
            <p>
              Your data is stored securely in cloud-hosted MongoDB Atlas databases with encrypted connections (SSL/TLS). 
              Media uploads are processed securely via Cloudinary and AWS Rekognition AI moderation.
            </p>
          </div>

          <div className="policy-block">
            <h3>5. Third-Party Sharing</h3>
            <p>
              We <strong>do not sell, rent, or trade</strong> your personal data or email address to third-party advertisers or external market data brokers.
            </p>
          </div>

          <div className="policy-block">
            <h3>6. Contact & Data Control</h3>
            <p>
              You have full control to edit your profile info, update account passwords, or request data deletion by contacting lead developer 
              <strong>Himanshu Khare</strong> (<a href="https://instagram.com/himanshuk.hare" target="_blank" rel="noopener noreferrer">@himanshuk.hare</a>).
            </p>
          </div>
        </div>

        {/* NAVIGATION FOOTER */}
        <div className="about-footer-nav">
          <Link to="/" className="btn-back-home-lg">← Back to Public Feed</Link>
        </div>

      </div>
    </div>
  );
}

export default Privacy;
