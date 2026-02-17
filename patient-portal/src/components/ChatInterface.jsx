import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Video, Phone, Paperclip, Smile } from 'lucide-react'
import { io } from 'socket.io-client'
import { format } from 'date-fns'
import useVideoCall from '../hooks/useVideoCall'

const API_URL = 'http://localhost:5001/api'
const SOCKET_URL = 'http://localhost:5001'

export default function ChatInterface({ appointment, user, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const { startCall, incomingCall, callState } = useVideoCall()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('patient_token')
    console.log('🔗 Connecting socket with token:', token ? 'Present' : 'Missing')
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']  // Add fallback transport
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully, joining appointment:', appointment._id)
      setConnected(true)
      
      // Join the appointment chat room
      newSocket.emit('join-appointment-chat', {
        appointmentId: appointment._id,
        userId: user.id,
        userRole: 'user' // patient role
      })
    })

    newSocket.on('chat-joined', (data) => {
      console.log('✅ Joined chat room:', data)
    })

    newSocket.on('new-message', (message) => {
      console.log('📨 New message received:', message)
      setMessages(prev => [...prev, message])
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [appointment._id, user.id])

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('patient_token')
        const response = await fetch(`${API_URL}/chat/appointment/${appointment._id}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        console.log('Messages response:', data)
        
        if (data.success) {
          setMessages(data.messages || [])
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [appointment._id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    const messageData = {
      appointmentId: appointment._id,
      message: newMessage,
      sender: user.id,
      senderModel: 'User',
      timestamp: new Date()
    }

    try {
      // Send via socket
      socket.emit('send-message', messageData)
      
      // Clear input
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleVideoCall = () => {
    const doctorName = appointment.doctorId?.personalInfo 
      ? `${appointment.doctorId.personalInfo.firstName} ${appointment.doctorId.personalInfo.lastName}`
      : 'Doctor'
    
    const callData = {
      receiverId: appointment.doctorId?._id,
      receiverName: doctorName,
      appointmentId: appointment._id,
      userId: user.id,
      userName: user.username || user.name || 'Patient'
    }

    console.log('📞 Patient initiating video call:', callData)
    startCall(callData)
  }

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm')
  }

  const isMyMessage = (message) => {
    return message.sender === user.id
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                Dr
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Dr. {appointment.doctorId?.personalInfo?.firstName || 'Unknown'} {appointment.doctorId?.personalInfo?.lastName || 'Doctor'}
              </h3>
              <p className="text-sm text-gray-600">
                {connected ? '🟢 Online' : '🔴 Connecting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleVideoCall}
              className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Video Call</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No messages yet. Start the conversation!</div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message._id || index}
                className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl chat-bubble ${
                    isMyMessage(message)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    isMyMessage(message) ? 'text-purple-200' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={!connected}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || !connected}
              className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}