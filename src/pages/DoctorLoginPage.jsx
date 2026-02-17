import axios from 'axios';
import { useState } from 'react';
import './DoctorLoginPage.css';

function DoctorLoginPage({ onLogin, apiUrl, onSwitchToAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Login as user using the same auth endpoint as mobile app
      const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
        identifier: email,
        password
      });

      if (!loginResponse.data.success) {
        setError(loginResponse.data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      const token = loginResponse.data.token;

      // Step 2: Check if user is an approved doctor
      const doctorResponse = await axios.get(`${apiUrl}/doctors/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!doctorResponse.data.success) {
        setError('You do not have a doctor account. Please register as a doctor in the mobile app first.');
        setLoading(false);
        return;
      }

      const doctor = doctorResponse.data.doctor;

      // Step 3: Check if doctor is approved
      if (doctor.status !== 'approved') {
        setError(`Your doctor account is ${doctor.status}. Only approved doctors can access the portal.`);
        setLoading(false);
        return;
      }

      // Success - pass token and doctor data to parent
      onLogin(token, doctor);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-login-container">
      <div className="doctor-login-card">
        <div className="doctor-login-header">
          <div className="doctor-icon">👨‍⚕️</div>
          <h1>FitFaat</h1>
          <h2>Doctor Portal</h2>
          <p>Manage Patients & Consultations</p>
        </div>

        <form onSubmit={handleLogin} className="doctor-login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <span className="label-icon">📧</span>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@fitfaat.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔒</span>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="doctor-login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span className="button-icon">🏥</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="doctor-login-footer">
          <p>Authorized Healthcare Professionals Only</p>
          <p className="footer-note">Secure & HIPAA Compliant</p>
          {onSwitchToAdmin && (
            <button 
              type="button"
              onClick={onSwitchToAdmin}
              className="back-to-admin-link"
            >
              ← Back to Admin Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorLoginPage;
