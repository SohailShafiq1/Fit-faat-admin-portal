import { useEffect, useState } from 'react';
import './NotificationToast.css';

function NotificationToast() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Add to window for easy access from anywhere
    window.showNotification = (message, type = 'info', duration = 5000) => {
      const id = Date.now();
      const notification = { id, message, type, duration };
      
      setNotifications((prev) => [...prev, notification]);

      // Auto-remove notification after duration
      const timer = setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== id)
        );
      }, duration);

      return () => clearTimeout(timer);
    };

    // Also listen for custom events
    const handleShowNotification = (event) => {
      const notification = event.detail;
      const id = notification.id || Date.now();
      
      setNotifications((prev) => [...prev, { ...notification, id }]);

      // Auto-remove notification after duration
      const timer = setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== id)
        );
      }, notification.duration);

      return () => clearTimeout(timer);
    };

    window.addEventListener('showNotification', handleShowNotification);

    return () => {
      window.removeEventListener('showNotification', handleShowNotification);
      delete window.showNotification;
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-toast notification-${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '⚠'}
            {notification.type === 'info' && 'ℹ'}
          </div>
          <div className="notification-content">
            <p>{notification.message}</p>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationToast;
