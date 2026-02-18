import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';
import NotificationToast from './components/NotificationToast';
import DashboardPage from './pages/DashboardPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorLoginPage from './pages/DoctorLoginPage';
import LoginPage from './pages/LoginPage';
import LoginForm from './components/LoginForm';
import PatientDashboard from './components/PatientDashboard';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('admin'); // 'admin', 'doctor', or 'patient'
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginMode, setLoginMode] = useState('admin'); // 'admin', 'doctor', or 'patient'

  useEffect(() => {
    // Check for existing tokens
    const adminToken = localStorage.getItem('adminToken');
    const doctorToken = localStorage.getItem('doctorToken');
    const patientToken = localStorage.getItem('patient_token');
    const patientUser = localStorage.getItem('patient_user');
    
    if (adminToken) {
      setToken(adminToken);
      setUserType('admin');
      verifyToken(adminToken, 'admin');
    } else if (doctorToken) {
      setToken(doctorToken);
      setUserType('doctor');
      verifyToken(doctorToken, 'doctor');
    } else if (patientToken && patientUser) {
      setToken(patientToken);
      setUserType('patient'); 
      try {
        const user = JSON.parse(patientUser);
        setUserData(user);
        setIsLoggedIn(true);
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse patient user data:', err);
        localStorage.removeItem('patient_token');
        localStorage.removeItem('patient_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (authToken, type) => {
    try {
      if (type === 'admin') {
        const response = await axios.get(`${API_BASE_URL}/admin-auth/verify`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success) {
          setUserData(response.data.admin);
          setIsLoggedIn(true);
          setUserType('admin');
        } else {
          throw new Error('Admin verification failed');
        }
      } else {
        // For doctors, verify they have an approved doctor account
        const response = await axios.get(`${API_BASE_URL}/doctors/status`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.doctor.status === 'approved') {
          setUserData(response.data.doctor);
          setIsLoggedIn(true);
          setUserType('doctor');
        } else {
          throw new Error('Doctor verification failed or account not approved');
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      if (type === 'admin') {
        localStorage.removeItem('adminToken');
      } else {
        localStorage.removeItem('doctorToken');
      }
      setToken(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loginToken, user, type = 'admin') => {
    if (type === 'admin') {
      localStorage.setItem('adminToken', loginToken);
      localStorage.removeItem('doctorToken');
      localStorage.removeItem('patient_token');
      localStorage.removeItem('patient_user');
    } else if (type === 'doctor') {
      localStorage.setItem('doctorToken', loginToken);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('patient_token');
      localStorage.removeItem('patient_user');
    } else if (type === 'patient') {
      localStorage.setItem('patient_token', loginToken);
      localStorage.setItem('patient_user', JSON.stringify(user));
      localStorage.removeItem('adminToken');
      localStorage.removeItem('doctorToken');
    }
    setToken(loginToken);
    setUserData(user);
    setUserType(type);
    setIsLoggedIn(true);
  };

  const handlePatientLogin = (user, token) => {
    handleLogin(token, user, 'patient');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('patient_token');
    localStorage.removeItem('patient_user');
    setToken(null);
    setIsLoggedIn(false);
    setUserData(null);
    setLoginMode('admin'); // Reset to admin login mode
  };

  if (loading) {
    return (
      <div className="app">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <NotificationToast />
      {!isLoggedIn ? (
        <div>
          {/* Login Mode Selector */}
          <div style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            zIndex: 1000,
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => setLoginMode('admin')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: loginMode === 'admin' ? '#3b82f6' : '#6b7280',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Admin
            </button>
            <button
              onClick={() => setLoginMode('doctor')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: loginMode === 'doctor' ? '#3b82f6' : '#6b7280',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Doctor
            </button>
            <button
              onClick={() => setLoginMode('patient')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: loginMode === 'patient' ? '#3b82f6' : '#6b7280',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Patient
            </button>
          </div>

          {/* Login Forms */}
          {loginMode === 'admin' ? (
            <LoginPage 
              onLogin={(token) => handleLogin(token, null, 'admin')} 
              apiUrl={API_BASE_URL}
              onSwitchToDoctor={() => setLoginMode('doctor')}
            />
          ) : loginMode === 'doctor' ? (
            <DoctorLoginPage 
              onLogin={(token, doctor) => handleLogin(token, doctor, 'doctor')} 
              apiUrl={API_BASE_URL}
              onSwitchToAdmin={() => setLoginMode('admin')}
            />
          ) : (
            <LoginForm onLogin={handlePatientLogin} />
          )}
        </div>
      ) : (
        userType === 'admin' ? (
          <DashboardPage 
            adminData={userData} 
            token={token}
            apiUrl={API_BASE_URL}
            onLogout={handleLogout}
          />
        ) : userType === 'doctor' ? (
          <DoctorDashboard 
            doctorData={userData} 
            token={token}
            apiUrl={API_BASE_URL}
            onLogout={handleLogout}
          />
        ) : (
          <PatientDashboard 
            user={userData} 
            onLogout={handleLogout} 
          />
        )
      )}
    </div>
  );
}

export default App;
