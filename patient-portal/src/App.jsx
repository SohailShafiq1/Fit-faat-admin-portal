import React, { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import PatientDashboard from './components/PatientDashboard'

const API_URL = 'http://localhost:5001/api'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('patient_token')
    const userData = localStorage.getItem('patient_user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (err) {
        console.error('Failed to parse user data:', err)
        localStorage.removeItem('patient_token')
        localStorage.removeItem('patient_user')
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('patient_token', token)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('patient_token')
    localStorage.removeItem('patient_user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center medical-gradient">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen medical-gradient">
      {user ? (
        <PatientDashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App