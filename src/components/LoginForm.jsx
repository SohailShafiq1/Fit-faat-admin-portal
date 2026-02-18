import React, { useState } from 'react'
import { LogIn, Eye, EyeOff, User, Lock } from 'lucide-react'

const API_URL = 'http://localhost:5001/api'

export default function LoginForm({ onLogin }) {
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!credentials.identifier || !credentials.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: credentials.identifier,
          password: credentials.password,
        }),
      })

      const data = await response.json()
      console.log('Login response:', data)

      if (data.success) {
        // Store patient-specific data
        localStorage.setItem('patient_user', JSON.stringify(data.user))
        onLogin(data.user, data.token)
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        padding: '32px',
        width: '100%',
        maxWidth: '448px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#dbeafe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <User style={{ width: '40px', height: '40px', color: '#2563eb' }} />
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Patient Login</h1>
          <p style={{ color: '#6b7280' }}>Access your health dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Identifier Field */}
          <div>
            <label htmlFor="identifier" style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '8px' 
            }}>
              Email or Username
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9ca3af', 
                width: '20px', 
                height: '20px' 
              }} />
              <input
                id="identifier"
                type="text"
                value={credentials.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email or username"
                disabled={loading}
                onFocus={(e) => {
                  e.target.style.outline = 'none'
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '8px' 
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9ca3af', 
                width: '20px', 
                height: '20px' 
              }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '48px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
                disabled={loading}
                onFocus={(e) => {
                  e.target.style.outline = 'none'
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
                disabled={loading}
                onMouseOver={(e) => e.target.style.color = '#6b7280'}
                onMouseOut={(e) => e.target.style.color = '#9ca3af'}
              >
                {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !credentials.identifier || !credentials.password}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: loading || !credentials.identifier || !credentials.password ? '#9ca3af' : '#2563eb',
              color: 'white',
              fontWeight: '500',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading || !credentials.identifier || !credentials.password ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              fontSize: '16px'
            }}
            onMouseOver={(e) => {
              if (!loading && credentials.identifier && credentials.password) {
                e.target.style.backgroundColor = '#1d4ed8'
              }
            }}
            onMouseOut={(e) => {
              if (!loading && credentials.identifier && credentials.password) {
                e.target.style.backgroundColor = '#2563eb'
              }
            }}
          >
            {loading ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <>
                <LogIn style={{ width: '20px', height: '20px' }} />
                <span>Login to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          <p>Need help? Contact your healthcare provider</p>
        </div>
      </div>
      
      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}