import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';
import NotificationToast from './components/NotificationToast';
import DashboardPage from './pages/DashboardPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorLoginPage from './pages/DoctorLoginPage';
import LoginPage from './pages/LoginPage';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('admin'); // 'admin' or 'doctor'
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' or 'doctor'

  useEffect(() => {
    // Check for existing tokens
    const adminToken = localStorage.getItem('adminToken');
    const doctorToken = localStorage.getItem('doctorToken');
    
    if (adminToken) {
      setToken(adminToken);
      setUserType('admin');
      verifyToken(adminToken, 'admin');
    } else if (doctorToken) {
      setToken(doctorToken);
      setUserType('doctor');
      verifyToken(doctorToken, 'doctor');
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
    } else {
      localStorage.setItem('doctorToken', loginToken);
      localStorage.removeItem('adminToken');
    }
    setToken(loginToken);
    setUserData(user);
    setUserType(type);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('doctorToken');
    setToken(null);
    setIsLoggedIn(false);
    setUserData(null);
    setLoginMode('admin');
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
        loginMode === 'admin' ? (
          <LoginPage 
            onLogin={(token) => handleLogin(token, null, 'admin')} 
            apiUrl={API_BASE_URL}
            onSwitchToDoctor={() => setLoginMode('doctor')}
          />
        ) : (
          <DoctorLoginPage 
            onLogin={(token, doctor) => handleLogin(token, doctor, 'doctor')} 
            apiUrl={API_BASE_URL}
            onSwitchToAdmin={() => setLoginMode('admin')}
          />
        )
      ) : (
        userType === 'admin' ? (
          <DashboardPage 
            adminData={userData} 
            token={token}
            apiUrl={API_BASE_URL}
            onLogout={handleLogout}
          />
        ) : (
          <DoctorDashboard 
            doctorData={userData} 
            token={token}
            apiUrl={API_BASE_URL}
            onLogout={handleLogout}
          />
        )
      )}
    </div>
  );
}

export default App;
