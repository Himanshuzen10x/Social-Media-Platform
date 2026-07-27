import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="about-page-wrapper">
      <div className="about-container">
        
        {/* HERO HEADER */}
        <div className="about-hero-card">
          <div className="about-hero-badge">🎓 COLLEGE NETWORK PLATFORM</div>
          <h1 className="about-hero-title">The Batchmates</h1>
          <p className="about-hero-subtitle">
            A modern, feature-rich social network built specifically for college students to connect, 
            share campus updates, run live polls, participate in events, and build lasting friendships.
          </p>
        </div>

        {/* DEVELOPER FEATURE CARD */}
        <div className="about-developer-card">
          <div className="developer-header-row">
            <div className="developer-avatar-wrapper">
              <div className="developer-avatar-placeholder">HK</div>
            </div>
            <div className="developer-info-meta">
              <span className="developer-role-tag">🚀 CREATOR & LEAD DEVELOPER</span>
              <h2 className="developer-name">Himanshu Khare</h2>
              <p className="developer-headline">Full-Stack Developer & Tech Enthusiast</p>
            </div>
          </div>

          <p className="developer-bio-text">
            Hey there! 👋 I'm <strong>Himanshu Khare</strong>, the creator and lead developer behind <strong>The Batchmates</strong>. 
            I designed and engineered this platform from scratch using the MERN stack (MongoDB, Express.js, React, Node.js) 
            to deliver a seamless, responsive, and vibrant campus experience for students.
          </p>

          <div className="developer-social-links">
            <a
              href="https://instagram.com/himanshuk.hare"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn instagram-btn"
            >
              <span className="social-icon">📸</span>
              <span className="social-text">Instagram: <strong>@himanshuk.hare</strong></span>
            </a>

            <a
              href="https://github.com/Himanshuzen10x"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn github-btn"
            >
              <span className="social-icon">🐙</span>
              <span className="social-text">GitHub: <strong>Himanshuzen10x</strong></span>
            </a>
          </div>
        </div>

        {/* PROJECT FEATURES GRID */}
        <div className="about-section-card">
          <h3 className="about-section-heading">🌟 Key Features</h3>
          <div className="features-grid-3col">
            <div className="feature-grid-item">
              <div className="feature-item-icon">💬</div>
              <h4>Direct 1-on-1 Messaging</h4>
              <p>Real-time chat messaging with friends, instant delivery, and live polling.</p>
            </div>

            <div className="feature-grid-item">
              <div className="feature-item-icon">📊</div>
              <h4>Campus Polls & Voting</h4>
              <p>Create interactive polls with live animated percentage bars and instant voting results.</p>
            </div>

            <div className="feature-grid-item">
              <div className="feature-item-icon">💘</div>
              <h4>Secret Crush Matching</h4>
              <p>100% private crush tags. Get notified with a celebration match modal when interest is mutual!</p>
            </div>

            <div className="feature-grid-item">
              <div className="feature-item-icon">📢</div>
              <h4>Campus Events Board</h4>
              <p>Discover upcoming tech hackathons, cultural fests, and campus workshops.</p>
            </div>

            <div className="feature-grid-item">
              <div className="feature-item-icon">📱</div>
              <h4>Mobile Responsive Design</h4>
              <p>Optimized 3-column Facebook/Twitter style UI that adapts seamlessly on desktop and mobile.</p>
            </div>

            <div className="feature-grid-item">
              <div className="feature-item-icon">🔒</div>
              <h4>AI Image Moderation & Auth</h4>
              <p>Protected JWT authentication, Cloudinary media storage, and AWS Rekognition NSFW safety filtering.</p>
            </div>
          </div>
        </div>

        {/* TECH STACK SECTION */}
        <div className="about-section-card">
          <h3 className="about-section-heading">🛠️ Tech Stack & Infrastructure</h3>
          <div className="tech-stack-pills-row">
            <span className="tech-pill">React.js (Vite)</span>
            <span className="tech-pill">Node.js</span>
            <span className="tech-pill">Express.js</span>
            <span className="tech-pill">MongoDB Atlas</span>
            <span className="tech-pill">Mongoose ODM</span>
            <span className="tech-pill">JWT Auth</span>
            <span className="tech-pill">Cloudinary API</span>
            <span className="tech-pill">Vercel Deployment</span>
            <span className="tech-pill">Netlify Hosting</span>
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

export default About;
