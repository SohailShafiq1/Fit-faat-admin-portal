import React, { useState, useEffect } from 'react'
import { LogOut, Calendar, MessageCircle, Video, Phone, Clock } from 'lucide-react'
import ChatInterface from './ChatInterface'
import VideoCallModal from './VideoCallModal'

const API_URL = 'http://localhost:5001/api'

export default function PatientDashboard({ user, onLogout }) {
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('patient_token')
      const response = await fetch(`${API_URL}/appointments/my-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      console.log('📅 Appointments response:', data)
      
      if (data.success) {
        // Sort appointments by date (newest first)
        const sortedAppointments = (data.appointments || []).sort((a, b) => {
          const dateA = new Date(a.appointmentDate || a.date)
          const dateB = new Date(b.appointmentDate || b.date)
          return dateB - dateA // Newest first
        })
        setAppointments(sortedAppointments)
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChat = (appointment) => {
    setSelectedAppointment(appointment)
    setShowChat(true)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return { backgroundColor: '#dcfce7', color: '#166534' }
      case 'pending': return { backgroundColor: '#fef3c7', color: '#92400e' }
      case 'completed': return { backgroundColor: '#dbeafe', color: '#1e40af' }
      default: return { backgroundColor: '#f3f4f6', color: '#374151' }
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '20px' }}>Loading your appointments...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Welcome back!</h1>
            <p style={{ color: '#6b7280', marginTop: '8px', margin: 0 }}>
              {user.username || user.name || 'Patient'} • ID: {user.id?.slice(-8) || 'N/A'}
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#fecaca'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#fee2e2'}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Appointments */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Calendar style={{ width: '24px', height: '24px', color: '#2563eb' }} />
          Your Appointments
        </h2>

        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Calendar style={{ width: '64px', height: '64px', color: '#d1d5db', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>No appointments yet</h3>
            <p style={{ color: '#9ca3af' }}>Your upcoming appointments will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appointments.map((appointment) => (
              <div key={appointment._id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        Dr. {appointment.doctorId?.name || appointment.doctor?.name || 'Unknown'}
                      </h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        ...getStatusStyle(appointment.status)
                      }}>
                        {appointment.status || 'pending'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '16px', height: '16px' }} />
                        <span>{formatDate(appointment.appointmentDate || appointment.date)}</span>
                      </div>
                      {appointment.purpose && (
                        <span style={{ color: '#6b7280' }}>• {appointment.purpose}</span>
                      )}
                    </div>

                    {appointment.notes && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenChat(appointment)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#bfdbfe'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#dbeafe'}
                    >
                      <MessageCircle style={{ width: '16px', height: '16px' }} />
                      <span>Chat</span>
                    </button>
                    
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#bbf7d0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#dcfce7'}
                    >
                      <Video style={{ width: '16px', height: '16px' }} />
                      <span>Video</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && selectedAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '896px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <ChatInterface 
              appointment={selectedAppointment} 
              user={user} 
              onClose={() => setShowChat(false)} 
            />
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      <VideoCallModal />
    </div>
  )
}