import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';
import NotificationToast from './components/NotificationToast';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin-auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAdminData(response.data.admin);
        setIsLoggedIn(true);
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('adminToken');
      setToken(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loginToken) => {
    localStorage.setItem('adminToken', loginToken);
    setToken(loginToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsLoggedIn(false);
    setAdminData(null);
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
        <LoginPage onLogin={handleLogin} apiUrl={API_BASE_URL} />
      ) : (
        <DashboardPage 
          adminData={adminData} 
          token={token}
          apiUrl={API_BASE_URL}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
