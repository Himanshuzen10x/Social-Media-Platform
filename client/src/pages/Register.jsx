import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="classic-landing-wrapper">
      {/* 1. TOP HEADER BAR */}
      <header className="classic-header">
        <div className="classic-header-content">
          <div className="header-left-brand">
            <div className="college-network-avatar">
              <div className="avatar-face-graphic">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="College Network"
                  className="face-matrix-img"
                />
              </div>
              <div className="brand-subtext-box">
                <span className="brand-title">THE COLLEGE NETWORK</span>
                <span className="brand-subtitle">CONNECT. SHARE. CODE.</span>
              </div>
            </div>
          </div>

          <div className="header-right-brand">
            <h1 className="classic-main-logo">The Batchmates</h1>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER BLUE BAR WITH WELCOME TEXT & RIGHT LINKS */}
      <div className="classic-subheader-bar">
        <div className="subheader-container">
          <h2>Welcome to The Batchmates!</h2>
          <div className="classic-header-links">
            <Link to="/login" className="header-link">login</Link>
            <Link to="/register" className="header-link active">register</Link>
            <a href="#about" onClick={(e) => e.preventDefault()} className="header-link">about</a>
          </div>
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN LANDING CONTAINER */}
      <div className="classic-main-container">
        <div className="classic-landing-grid">
          
          {/* LEFT COLUMN: DOTTED REGISTER FORM BOX */}
          <div className="classic-login-box">
            {error && <div className="classic-error-msg">{error}</div>}
            <form onSubmit={handleSubmit} className="classic-login-form">
              <div className="classic-form-row">
                <label>Name:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Full Name"
                />
              </div>

              <div className="classic-form-row">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="College Email"
                />
              </div>

              <div className="classic-form-row">
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 chars"
                />
              </div>

              <div className="classic-login-actions-single">
                <button type="submit" className="btn-classic-action">register</button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: WELCOME TO THE BATCHMATES CARD */}
          <div className="classic-welcome-card">
            <h3 className="welcome-card-title">[ Registration ]</h3>

            <p className="welcome-card-text">
              The Batchmates is an online directory that connects people through social networks at colleges.
            </p>

            <p className="welcome-card-text bold-text">
              We have opened up The Batchmates for popular consumption at GCET
            </p>

            <p className="welcome-card-text">
              You can use The Batchmates to:
            </p>

            <ul className="welcome-bullet-list">
              <li>Search for people at your school</li>
              <li>Find out who are in your classes</li>
              <li>Look up your friends' friends</li>
              <li>See a visualization of your social network</li>
            </ul>

            <p className="welcome-card-text get-started-text">
              To get started, fill out the registration form on the left. If you already have an account, click Login.
            </p>

            <div className="welcome-bottom-buttons">
              <button onClick={() => document.querySelector('.classic-login-form input')?.focus()} className="btn-large-blue">
                Register
              </button>
              <Link to="/login" className="btn-large-blue">Login</Link>
            </div>
          </div>

        </div>
      </div>

      {/* 4. FOOTER BAR */}
      <footer className="classic-landing-footer">
        <div className="footer-links-row">
          <a href="#about" onClick={(e) => e.preventDefault()}>about</a>
          <a href="#contact" onClick={(e) => e.preventDefault()}>contact</a>
          <a href="#faq" onClick={(e) => e.preventDefault()}>faq</a>
          <a href="#terms" onClick={(e) => e.preventDefault()}>terms</a>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>privacy</a>
        </div>
        <p className="footer-copyright">The Batchmates © 2004</p>
      </footer>
    </div>
  );
}

export default Register;
