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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading your appointments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back!</h1>
            <p className="text-gray-600 mt-2">
              {user.username || user.name || 'Patient'} • ID: {user.id?.slice(-8) || 'N/A'}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-purple-600" />
          Your Appointments
        </h2>

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No appointments found</h3>
            <p className="text-gray-500">Book an appointment to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment, index) => (
              <div key={appointment._id} className={`border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow ${index === 0 ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
                {index === 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      Latest Appointment
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Dr. {appointment.doctorId?.personalInfo?.firstName || 'Unknown'} {appointment.doctorId?.personalInfo?.lastName || 'Doctor'}
                    </h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDate(appointment.appointmentDate || appointment.date)}</span>
                    </div>
                    {appointment.doctorId?.professionalInfo?.specialization && (
                      <p className="text-sm text-gray-500 mt-1">
                        {appointment.doctorId.professionalInfo.specialization}
                      </p>
                    )}
                    {appointment.description && (
                      <p className="text-sm text-gray-600 mt-1">{appointment.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status || 'Scheduled'}
                  </span>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleOpenChat(appointment)}
                    className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={() => handleOpenChat(appointment)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      index === 0 
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Call</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && selectedAppointment && (
        <ChatInterface
          appointment={selectedAppointment}
          user={user}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Video Call Component */}
      <VideoCallModal />
    </div>
  )
}