import axios from 'axios';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import ChatInterface from '../components/ChatInterface';
import DietPlanGenerator from '../components/DietPlanGenerator';
import PatientDetailsView from '../components/PatientDetailsView';
import './DoctorDashboard.css';

function DoctorDashboard({ doctorData, token, apiUrl, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeView, setActiveView] = useState('chats'); // 'chats', 'diet-plans', 'patient-details'
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    loadAppointments();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('user-new-message', (data) => {
      if (data.appointmentId && !data.isSender) {
        updateUnreadCount(data.appointmentId);
      }
    });

    setSocket(newSocket);
  };

  const loadAppointments = async () => {
    try {
      // Get doctor's appointments using the doctor ID
      const response = await axios.get(`${apiUrl}/appointments/doctor/${doctorData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAppointments(response.data.appointments || []);
        loadUnreadCounts(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCounts = async (appointmentsList) => {
    try {
      const counts = {};
      const response = await axios.get(
        `${apiUrl}/chat/unread-by-appointment`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const unreadData = response.data.unreadCounts || [];
        unreadData.forEach(item => {
          counts[item._id] = item.count;
        });
      }
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const updateUnreadCount = (appointmentId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [appointmentId]: (prev[appointmentId] || 0) + 1
    }));
  };

  const clearUnreadCount = (appointmentId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [appointmentId]: 0
    }));
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    clearUnreadCount(appointment._id);
  };

  if (loading) {
    return (
      <div className="doctor-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      {/* Header */}
      <header className="doctor-dashboard-header">
        <div className="header-left">
          <h1>👨‍⚕️ Doctor Portal</h1>
          <p>Welcome, Dr. {doctorData?.name || 'Doctor'}</p>
        </div>
        <div className="header-right">
          <button onClick={onLogout} className="logout-button">
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="doctor-dashboard-content">
        {/* Sidebar */}
        <aside className="doctor-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-button ${activeView === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveView('chats')}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-label">Chats</span>
              {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                <span className="unread-badge">
                  {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>

            <button
              className={`nav-button ${activeView === 'diet-plans' ? 'active' : ''}`}
              onClick={() => setActiveView('diet-plans')}
              disabled={!selectedAppointment}
            >
              <span className="nav-icon">🥗</span>
              <span className="nav-label">Diet Plans</span>
            </button>

            <button
              className={`nav-button ${activeView === 'patient-details' ? 'active' : ''}`}
              onClick={() => setActiveView('patient-details')}
              disabled={!selectedAppointment}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-label">Patient Info</span>
            </button>

            <button
              className={`nav-button ${activeView === 'video-call' ? 'active' : ''}`}
              onClick={() => setActiveView('video-call')}
              disabled={!selectedAppointment}
            >
              <span className="nav-icon">📹</span>
              <span className="nav-label">Video Call</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="doctor-main-content">
          {activeView === 'chats' && (
            <div className="chats-view">
              <div className="appointments-list">
                <h2>Your Consultations</h2>
                {appointments.length === 0 ? (
                  <div className="empty-state">
                    <p>📅 No appointments found</p>
                  </div>
                ) : (
                  appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className={`appointment-card ${selectedAppointment?._id === appointment._id ? 'selected' : ''}`}
                      onClick={() => handleAppointmentSelect(appointment)}
                    >
                      <div className="appointment-avatar">
                        {appointment.user?.firstName?.[0]}{appointment.user?.lastName?.[0]}
                      </div>
                      <div className="appointment-info">
                        <h3>{appointment.user?.firstName} {appointment.user?.lastName}</h3>
                        <p className="appointment-date">
                          {new Date(appointment.date).toLocaleDateString()}
                        </p>
                        <p className="appointment-status">{appointment.status}</p>
                      </div>
                      {unreadCounts[appointment._id] > 0 && (
                        <span className="unread-count">
                          {unreadCounts[appointment._id]}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="chat-container">
                {selectedAppointment ? (
                  <ChatInterface
                    appointment={selectedAppointment}
                    token={token}
                    apiUrl={apiUrl}
                    socket={socket}
                    doctorMode={true}
                    doctorData={doctorData}
                  />
                ) : (
                  <div className="no-chat-selected">
                    <div className="no-chat-icon">💬</div>
                    <h3>Select a consultation to start chatting</h3>
                    <p>Choose a patient from the list to view and send messages</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'diet-plans' && selectedAppointment && (
            <Diet PlanGenerator
              appointment={selectedAppointment}
              token={token}
              apiUrl={apiUrl}
              doctorData={doctorData}
            />
          )}

          {activeView === 'patient-details' && selectedAppointment && (
            <PatientDetailsView
              appointment={selectedAppointment}
              token={token}
              apiUrl={apiUrl}
            />
          )}

          {activeView === 'video-call' && selectedAppointment && (
            <div className="video-call-view">
              <div className="video-call-placeholder">
                <div className="video-icon">📹</div>
                <h2>Video Call</h2>
                <p>Video call with {selectedAppointment.user?.firstName} {selectedAppointment.user?.lastName}</p>
                <button className="start-call-button">
                  Start Video Call
                </button>
                <p className="video-note">Video calling feature coming soon!</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboard;
