import axios from 'axios';
import { useEffect, useState } from 'react';
import './PatientDetailsView.css';

function PatientDetailsView({ appointment, token, apiUrl }) {
  const [patientData, setPatientData] = useState(null);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointment) {
      loadPatientDetails();
      loadDailyLogs();
    }
  }, [appointment]);

  const loadPatientDetails = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/chat/appointment/${appointment._id}/patient-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPatientData(response.data.patient);
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
    }
  };

  const loadDailyLogs = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/daily-logs/user/${appointment.user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDailyLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Error loading daily logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="patient-details-loading">
        <div className="spinner"></div>
        <p>Loading patient data...</p>
      </div>
    );
  }

  const patient = appointment.user;
  const stats = patientData || {};

  return (
    <div className="patient-details-view">
      <div className="patient-details-header">
        <h2>Patient Details</h2>
        <p>Complete health and activity overview</p>
      </div>

      <div className="patient-details-content">
        {/* Personal Information */}
        <div className="details-card">
          <h3>👤 Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <value>{patient.firstName} {patient.lastName}</value>
            </div>
            <div className="info-item">
              <label>Email</label>
              <value>{patient.email}</value>
            </div>
            <div className="info-item">
              <label>Gender</label>
              <value>{patient.gender || 'Not specified'}</value>
            </div>
            <div className="info-item">
              <label>Date of Birth</label>
              <value>
                {patient.dateOfBirth 
                  ? new Date(patient.dateOfBirth).toLocaleDateString()
                  : 'Not specified'
                }
              </value>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="details-card">
          <h3>📊 Health Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">⚖️</div>
              <div className="metric-info">
                <label>Weight</label>
                <value>{stats.currentWeight || patient.weight || 'N/A'} kg</value>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">📏</div>
              <div className="metric-info">
                <label>Height</label>
                <value>{patient.height || 'N/A'} cm</value>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-info">
                <label>BMI</label>
                <value>
                  {patient.weight && patient.height
                    ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
                    : 'N/A'
                  }
                </value>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">🏆</div>
              <div className="metric-info">
                <label>Target Weight</label>
                <value>{patient.targetWeight || 'N/A'} kg</value>
              </div>
            </div>
          </div>
        </div>

        {/* Fitness Goals */}
        <div className="details-card">
          <h3>🎯 Fitness Goals</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Primary Goal</label>
              <value>
                {patient.fitnessGoal === 1 ? 'Weight Loss' :
                 patient.fitnessGoal === 2 ? 'Muscle Gain' :
                 patient.fitnessGoal === 3 ? 'Maintenance' :
                 patient.fitnessGoal === 4 ? 'Endurance' :
                 'Not specified'}
              </value>
            </div>
            <div className="info-item">
              <label>Activity Level</label>
              <value>
                {patient.activityLevel === 1 ? 'Sedentary' :
                 patient.activityLevel === 2 ? 'Lightly Active' :
                 patient.activityLevel === 3 ? 'Moderately Active' :
                 patient.activityLevel === 4 ? 'Very Active' :
                 patient.activityLevel === 5 ? 'Extra Active' :
                 'Not specified'}
              </value>
            </div>
          </div>
        </div>

        {/* Daily Calorie Targets */}
        <div className="details-card">
          <h3>🔥 Daily Targets</h3>
          <div className="targets-grid">
            <div className="target-item">
              <div className="target-icon">🔥</div>
              <div className="target-info">
                <label>Calorie Target</label>
                <value>{stats.dailyCalorieTarget || 2000} cal</value>
              </div>
            </div>
            <div className="target-item">
              <div className="target-icon">💧</div>
              <div className="target-info">
                <label>Hydration Target</label>
                <value>{stats.dailyHydrationTarget || 2.5} L</value>
              </div>
            </div>
            <div className="target-item">
              <div className="target-icon">🥩</div>
              <div className="target-info">
                <label>Protein Target</label>
                <value>{stats.proteinTarget || 150} g</value>
              </div>
            </div>
            <div className="target-item">
              <div className="target-icon">🍞</div>
              <div className="target-info">
                <label>Carbs Target</label>
                <value>{stats.carbsTarget || 250} g</value>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="details-card">
          <h3>📈 Recent Activity</h3>
          {dailyLogs.length > 0 ? (
            <div className="activity-list">
              {dailyLogs.slice(0, 7).map((log, index) => (
                <div key={log._id || index} className="activity-item">
                  <div className="activity-date">
                    {new Date(log.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="activity-stats">
                    <div className="activity-stat">
                      <span className="stat-icon">🔥</span>
                      <span>{log.achievedCalories || 0} cal</span>
                    </div>
                    <div className="activity-stat">
                      <span className="stat-icon">💧</span>
                      <span>{log.achieviedHydration || 0} L</span>
                    </div>
                    <div className="activity-stat">
                      <span className="stat-icon">🏋️</span>
                      <span>{log.workoutCalories || 0} cal burned</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activity">
              <p>📊 No activity logs yet</p>
              <span>Patient hasn't logged any daily activities</span>
            </div>
          )}
        </div>

        {/* Medical Notes */}
        <div className="details-card">
          <h3>📋 Medical Notes</h3>
          <div className="info-item">
            <label>Health Conditions</label>
            <value>{patient.healthConditions || 'None reported'}</value>
          </div>
          <div className="info-item">
            <label>Allergies</label>
            <value>{patient.allergies || 'None reported'}</value>
          </div>
          <div className="info-item">
            <label>Medications</label>
            <value>{patient.medications || 'None reported'}</value>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDetailsView;
