import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { X, Send, Video, Phone, Paperclip, Smile } from 'lucide-react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import useVideoCall from '../hooks/useVideoCall';
import VideoCallModal from './VideoCallModal';
import './ChatInterface.css';

const API_URL = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

function ChatInterface({ 
  appointment, 
  token, 
  apiUrl, 
  socket, 
  doctorMode = false, 
  doctorData,
  user,
  onClose 
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [patientSocket, setPatientSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Use patient video call hook if in patient mode
  const { startCall, incomingCall, callState } = doctorMode ? {} : useVideoCall();

  // Initialize video call for doctors (existing functionality)
  const videoCall = doctorMode ? useVideoCall({
    socket,
    token,
    apiUrl,
    userId: doctorData?._id || doctorData?.id,
    userName: doctorData?.name || `Dr. ${doctorData?.firstName} ${doctorData?.lastName}`
  }) : null;

  // Scroll to bottom of messages  // Fetch existing messages for patient mode
  useEffect(() => {
    if (!doctorMode && appointment) {
      const fetchMessages = async () => {
        try {
          const patientToken = localStorage.getItem('patient_token');
          const response = await fetch(`${API_URL}/chat/appointment/${appointment._id}/messages`, {
            headers: {
              'Authorization': `Bearer ${patientToken}`
            }
          });

          const data = await response.json();
          console.log('Patient messages response:', data);
          
          if (data.success) {
            setMessages(data.messages || []);
          }
        } catch (err) {
          console.error('Failed to fetch patient messages:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchMessages();
    }
  }, [doctorMode, appointment]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection for patient mode
  useEffect(() => {
    if (!doctorMode && appointment && user) {
      const patientToken = localStorage.getItem('patient_token');
      console.log('🔗 Connecting patient socket with token:', patientToken ? 'Present' : 'Missing');
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: patientToken
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✅ Patient socket connected successfully, joining appointment:', appointment._id);
        setConnected(true);
        
        // Join the appointment chat room
        newSocket.emit('join-appointment-chat', {
          appointmentId: appointment._id,
          userId: user.id,
          userRole: 'user' // patient role
        });
      });

      newSocket.on('chat-joined', (data) => {
        console.log('✅ Joined chat room:', data);
      });

      newSocket.on('new-message', (message) => {
        console.log('📨 New message received:', message);
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Patient socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Patient socket connection error:', error);
        setConnected(false);
      });

      setPatientSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [doctorMode, appointment, user]);

  // Debug: Log video call initialization for doctor mode
  useEffect(() => {
    if (doctorMode) {
      console.log('ChatInterface mounted/updated with:');
      console.log('- doctorData:', doctorData);
      console.log('- userId:', doctorData?._id || doctorData?.id);
      console.log('- userName:', doctorData?.name || `Dr. ${doctorData?.firstName} ${doctorData?.lastName}`);
      console.log('- socket:', socket);
      console.log('- token:', token ? 'present' : 'missing');
    }
  }, [doctorMode, doctorData, socket, token]);

  useEffect(() => {
    if (doctorMode && appointment && socket) {
      loadMessages();
      
      // Join the appointment chat room for doctor
      socket.emit('join-appointment', { appointmentId: appointment._id });

      // Listen for socket events
      socket.on('joined', handleJoined);
      socket.on('new-message', handleNewMessage);
      socket.on('messages-read', handleMessagesRead);
      socket.on('error', handleSocketError);

      return () => {
        socket.off('joined', handleJoined);
        socket.off('new-message', handleNewMessage);
        socket.off('messages-read', handleMessagesRead);
        socket.off('error', handleSocketError);
      };
    }
  }, [doctorMode, appointment, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleJoined = (data) => {
    console.log('Joined chat:', data);
    markAsRead();
  };

  const handleNewMessage = (data) => {
    console.log('New message received:', data);
    setMessages(prev => [...prev, data]);
    if (data.senderRole !== 'doctor') {
      markAsRead();
    }
  };

  const handleMessagesRead = (data) => {
    console.log('Messages marked as read:', data);
    // Handle different data structures for message read events
    if (data.messageIds && Array.isArray(data.messageIds)) {
      setMessages(prev =>
        prev.map(msg =>
          data.messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
        )
      );
    } else if (data.appointmentId) {
      // Mark all messages as read for this appointment
      setMessages(prev =>
        prev.map(msg => ({ ...msg, isRead: true }))
      );
    }
  };

  const handleSocketError = (data) => {
    console.error('Socket error:', data);
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiUrl}/chat/appointment/${appointment._id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await axios.put(
        `${apiUrl}/chat/appointment/${appointment._id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      if (doctorMode) {
        // Doctor mode: use existing socket
        if (!socket) return;
        socket.emit('send-message', {
          appointmentId: appointment._id,
          message: newMessage.trim()
        });
      } else {
        // Patient mode: use patient API and socket
        const patientToken = localStorage.getItem('patient_token');
        const response = await fetch(`${API_URL}/chat/appointment/${appointment._id}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${patientToken}`
          },
          body: JSON.stringify({
            content: newMessage.trim(),
            appointmentId: appointment._id
          })
        });

        const data = await response.json();
        console.log('Message sent:', data);

        if (data.success && patientSocket) {
          // Emit via patient socket
          patientSocket.emit('send-message', {
            appointmentId: appointment._id,
            content: newMessage.trim(),
            senderId: user.id,
            senderRole: 'user'
          });
        }
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleVideoCall = () => {
    if (!doctorMode) {
      // Patient mode video call
      console.log('Patient video call button clicked');
      if (!patientSocket || !user) {
        console.error('Patient socket or user data not available');
        alert('Unable to start video call. Please refresh the page.');
        return;
      }
      
      const callData = {
        appointmentId: appointment._id,
        userId: user.id,
        receiverId: appointment.doctorId?._id || appointment.doctorId,
        userName: user.username || user.name || 'Patient'
      };
      
      console.log('📞 Starting patient call:', callData);
      startCall(callData);
      return;
    }

    // Doctor mode video call (existing functionality)
    console.log('Doctor video call button clicked');
    console.log('Doctor data:', doctorData);
    console.log('Socket:', socket);
    console.log('Appointment:', appointment);
    
    if (!socket) {
      console.error('Socket not connected');
      alert('Socket connection not established. Please refresh the page.');
      return;
    }
    
    if (!doctorData) {
      console.error('Doctor data not available');
      alert('Doctor information not loaded. Please refresh the page.');
      return;
    }
    
    if (!appointment) {
      console.error('Appointment data not available');
      alert('Appointment information not available.');
      return;
    }
    
    // Handle both appointment.user (populated) and appointment.userId (not populated)
    const patientId = appointment.user?._id || appointment.userId;
    const patientName = appointment.user ? 
      `${appointment.user.firstName} ${appointment.user.lastName}` : 
      (appointment.userName || 'Patient');
    
    if (!patientId) {
      console.error('Patient ID not available in appointment:', appointment);
      alert('Patient information not available.');
      return;
    }
    
    console.log('Initiating video call to:', patientName, 'ID:', patientId);
    console.log('📞 Call details:', {
      receiverId: patientId,
      receiverName: patientName,
      appointmentId: appointment._id,
      roomName: `appointment_${appointment._id}`,
      callerId: doctorData?._id || doctorData?.id,
      callerName: doctorData?.name || `Dr. ${doctorData?.firstName} ${doctorData?.lastName}`
    });
    
    videoCall.startCall(
      patientId,
      patientName,
      appointment._id
    );
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-avatar">
            {doctorMode ? (
              appointment.user ? 
                `${appointment.user.firstName?.[0] || ''}${appointment.user.lastName?.[0] || ''}` :
                (appointment.userName?.[0] || '?')
            ) : (
              appointment.doctorId?.name?.[0] || appointment.doctor?.name?.[0] || 'D'
            )}
          </div>
          <div className="chat-header-info">
            <h3>
              {doctorMode ? (
                appointment.user ? 
                  `${appointment.user.firstName} ${appointment.user.lastName}` :
                  (appointment.userName || 'Patient')
              ) : (
                `Dr. ${appointment.doctorId?.name || appointment.doctor?.name || 'Doctor'}`
              )}
            </h3>
            <p>Appointment: {new Date(appointment.appointmentDate || appointment.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button 
            className="video-call-button" 
            title="Start Video Call"
            onClick={handleVideoCall}
            style={{ marginRight: '8px' }}
          >
            📹
          </button>
          {!doctorMode && onClose && (
            <button 
              className="close-chat-button" 
              title="Close Chat"
              onClick={onClose}
              style={{ 
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">💬</div>
            <p>No messages yet</p>
            <span>Start the conversation!</span>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="date-separator">
                <span>{date}</span>
              </div>
              {msgs.map((msg, index) => {
                const isDoctor = msg.senderRole === 'doctor';
                const isMine = doctorMode ? isDoctor : !isDoctor;

                return (
                  <div
                    key={msg._id || index}
                    className={`message ${isMine ? 'mine' : 'theirs'}`}
                  >
                    {!isMine && (
                      <div className="message-avatar">
                        {isDoctor ? '👨‍⚕️' : '👤'}
                      </div>
                    )}
                    <div className="message-content">
                      <div className="message-bubble">
                        <p>{msg.message}</p>
                      </div>
                      <div className="message-meta">
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                        {isMine && msg.isRead && (
                          <span className="message-read">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="chat-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={sending}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="send-button"
        >
          {sending ? '⏳' : '📤'}
        </button>
      </form>

      {/* Video Call Modal */}
      {doctorMode ? (
        <VideoCallModal
          remoteVideoRef={videoCall?.remoteVideoRef}
          localVideoRef={videoCall?.localVideoRef}
          incomingCall={videoCall?.incomingCall}
          isConnecting={videoCall?.isConnecting}
          isConnected={videoCall?.isConnected}
          isAudioEnabled={videoCall?.isAudioEnabled}
          isVideoEnabled={videoCall?.isVideoEnabled}
          onAcceptCall={videoCall?.acceptCall}
          onRejectCall={videoCall?.rejectCall}
          onToggleAudio={videoCall?.toggleAudio}
          onToggleVideo={videoCall?.toggleVideo}
          onEndCall={videoCall?.disconnectCall}
        />
      ) : (
        <VideoCallModal />
      )}
    </div>
  );
}

export default ChatInterface;
