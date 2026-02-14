import { useState } from 'react';
import DoctorsList from '../components/DoctorsList';
import NewsList from '../components/NewsList';
import UsersList from '../components/UsersList';
import './DashboardPage.css';

function DashboardPage({ adminData, token, apiUrl, onLogout }) {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🏥 FitFaat Admin Portal</h1>
            <p>Welcome, {adminData?.name || 'Admin'}</p>
          </div>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Normal Users
          </button>
          <button
            className={`tab-button ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            👨‍⚕️ Doctors
          </button>
          <button
            className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            📰 News
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'users' && (
            <UsersList token={token} apiUrl={apiUrl} />
          )}
          {activeTab === 'doctors' && (
            <DoctorsList token={token} apiUrl={apiUrl} />
          )}
          {activeTab === 'news' && (
            <NewsList token={token} apiUrl={apiUrl} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
