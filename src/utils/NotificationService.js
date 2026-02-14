// Notification utility for handling in-app and browser notifications
export const NotificationService = {
  // Request permission for browser notifications
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Show browser notification (like Instagram)
  showBrowserNotification: (title, options = {}) => {
    if (Notification.permission === 'granted') {
      const defaultOptions = {
        icon: '/fitfaat-logo.png', // Add your logo path
        badge: '/fitfaat-badge.png',
        tag: 'fitfaat-news',
        requireInteraction: false,
        ...options
      };

      const notification = new Notification(title, defaultOptions);

      // Handle notification click
      notification.addEventListener('click', () => {
        window.focus();
        notification.close();
      });

      return notification;
    }
  },

  // Show in-app toast notification
  showInAppNotification: (message, type = 'info', duration = 5000) => {
    const notification = {
      id: Date.now(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      duration
    };

    // Dispatch custom event for components to listen to
    const event = new CustomEvent('showNotification', { detail: notification });
    window.dispatchEvent(event);

    return notification.id;
  },

  // Show news notification (combined browser + in-app)
  showNewsNotification: async (news) => {
    const title = `📰 New News: ${news.title}`;
    const options = {
      body: news.description.substring(0, 100) + '...',
      image: news.image || undefined,
      tag: `news-${news._id}`
    };

    // Show browser notification
    this.showBrowserNotification(title, options);

    // Show in-app notification
    this.showInAppNotification(
      `${title}\n${news.description.substring(0, 100)}...`,
      'info',
      8000
    );
  }
};

export default NotificationService;
