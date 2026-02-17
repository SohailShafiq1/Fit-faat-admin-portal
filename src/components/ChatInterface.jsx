import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import './ChatInterface.css';

function ChatInterface({ appointment, token, apiUrl, socket, doctorMode = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (appointment && socket) {
      loadMessages();
      
      // Join the appointment chat room
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
  }, [appointment, socket]);

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
    setMessages(prev =>
      prev.map(msg =>
        data.messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
      )
    );
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
    if (!newMessage.trim() || sending || !socket) return;

    try {
      setSending(true);

      // Send via socket.io
      socket.emit('send-message', {
        appointmentId: appointment._id,
        message: newMessage.trim()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            {appointment.user?.firstName?.[0]}{appointment.user?.lastName?.[0]}
          </div>
          <div className="chat-header-info">
            <h3>{appointment.user?.firstName} {appointment.user?.lastName}</h3>
            <p>Appointment: {new Date(appointment.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="video-call-button" title="Start Video Call">
            📹
          </button>
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
    </div>
  );
}

export default ChatInterface;
