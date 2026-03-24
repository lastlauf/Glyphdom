import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [tab, setTab] = useState('signup');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {submitted ? (
          <div className="auth-success">
            <h2 className="auth-title">Coming Soon</h2>
            <p className="auth-desc">
              Account creation is launching soon. Upload your own images and video to create custom ASCII animations.
            </p>
            <Link to="/" className="cta-primary" style={{ marginTop: '24px' }}>
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => setTab('signup')}
              >
                Sign Up
              </button>
              <button
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => setTab('login')}
              >
                Log In
              </button>
            </div>

            <h2 className="auth-title">
              {tab === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="auth-desc">
              {tab === 'signup'
                ? 'Upload images and video. Save and share your ASCII creations.'
                : 'Sign in to access your saved animations.'}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {tab === 'signup' && (
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Username"
                  required
                />
              )}
              <input
                type="email"
                className="auth-input"
                placeholder="Email"
                required
              />
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                required
              />
              <button type="submit" className="auth-submit">
                {tab === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
