import { Link } from 'react-router-dom';

function Terms() {
  return (
    <div className="about-page-wrapper">
      <div className="about-container">
        
        {/* HEADER */}
        <div className="about-hero-card">
          <div className="about-hero-badge">📜 LEGAL & GUIDELINES</div>
          <h1 className="about-hero-title">Terms of Service</h1>
          <p className="about-hero-subtitle">
            Please review the guidelines and terms governing your use of <strong>The Batchmates</strong> college network platform.
          </p>
        </div>

        {/* CONTENT CARD */}
        <div className="about-section-card terms-content-card">
          <div className="policy-block">
            <h3>1. Acceptance of Terms</h3>
            <p>
              By registering an account or accessing <strong>The Batchmates</strong>, you agree to comply with these Terms of Service 
              and all applicable campus guidelines. If you do not agree to these terms, please do not use the platform.
            </p>
          </div>

          <div className="policy-block">
            <h3>2. Campus Community & User Conduct</h3>
            <p>
              The Batchmates is dedicated to fostering a friendly, inclusive, and respectful campus environment. 
              Users agree not to:
            </p>
            <ul>
              <li>Post objectionable, abusive, harassing, or hate-speech content.</li>
              <li>Upload explicit, adult, or NSFW imagery (monitored by AWS Rekognition AI moderation).</li>
              <li>Impersonate fellow students, faculty, or campus administrators.</li>
              <li>Attempt unauthorized access to other users' accounts or private messages.</li>
            </ul>
          </div>

          <div className="policy-block">
            <h3>3. Content Ownership & Responsibility</h3>
            <p>
              You retain ownership of all status updates, images, and polls created on your account. 
              By posting content, you grant The Batchmates a non-exclusive license to host and display the content within the campus platform.
            </p>
          </div>

          <div className="policy-block">
            <h3>4. Interactive Features & Polls Integrity</h3>
            <p>
              Campus polls and voting features are provided for community engagement. Manipulating poll results, 
              automating votes, or creating deceptive options is strictly prohibited.
            </p>
          </div>

          <div className="policy-block">
            <h3>5. Account Termination & Moderation</h3>
            <p>
              We reserve the right to suspend or terminate accounts that violate community standards, 
              post inappropriate media, or engage in malicious activity without prior notice.
            </p>
          </div>

          <div className="policy-block">
            <h3>6. Educational Disclaimer</h3>
            <p>
              The Batchmates is an independent web application developed for educational and community building purposes 
              by <strong>Himanshu Khare</strong>.
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

export default Terms;
