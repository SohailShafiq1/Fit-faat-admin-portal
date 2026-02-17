import axios from 'axios';
import { useState } from 'react';
import './LoginPage.css';

function LoginPage({ onLogin, apiUrl, onSwitchToDoctor }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginResponse = await axios.post(`${apiUrl}/admin-auth/login`, {
        email,
        password
      });

      if (loginResponse.data.token) {
        onLogin(loginResponse.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      const signupResponse = await axios.post(`${apiUrl}/admin-auth/register`, {
        name,
        email,
        password,
        confirmPassword
      });

      if (signupResponse.data.token) {
        onLogin(signupResponse.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🏥 FitFaat</h1>
          <h2>Admin Portal</h2>
          <p>Manage Users & Doctors</p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="form-toggle">
              <p>Don't have an account? 
                <button 
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="toggle-link"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="login-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>

            <div className="form-toggle">
              <p>Already have an account? 
                <button 
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                    setName('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="toggle-link"
                >
                  Log in here
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p>Only registered admins can access this portal</p>
          <button 
            type="button"
            onClick={onSwitchToDoctor}
            className="doctor-login-link"
          >
            👨‍⚕️ Doctors Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
