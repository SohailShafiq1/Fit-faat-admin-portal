import axios from 'axios';
import { useEffect, useState } from 'react';
import NotificationService from '../utils/NotificationService';
import './NewsList.css';

function NewsList({ token, apiUrl }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    image: ''
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/admin/news`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setNews(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch news');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/admin/news`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        NotificationService.showInAppNotification(
          '✅ News created successfully and published!',
          'success',
          5000
        );
        setFormData({ title: '', description: '', category: 'general', image: '' });
        setShowForm(false);
        fetchNews();
      }
    } catch (err) {
      NotificationService.showInAppNotification(
        '❌ Failed to create news',
        'error',
        5000
      );
      console.error(err);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (window.confirm('Are you sure you want to delete this news?')) {
      try {
        const response = await axios.delete(`${apiUrl}/admin/news/${newsId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          NotificationService.showInAppNotification(
            '✅ News deleted successfully!',
            'success',
            5000
          );
          fetchNews();
          setSelectedNews(null);
        }
      } catch (err) {
        NotificationService.showInAppNotification(
          '❌ Failed to delete news',
          'error',
          5000
        );
        console.error(err);
      }
    }
  };

  const handlePublishToggle = async (newsId, isPublished) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/news/${newsId}/publish`,
        { isPublished: !isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchNews();
      }
    } catch (err) {
      NotificationService.showInAppNotification(
        '❌ Failed to update news status',
        'error',
        5000
      );
      console.error(err);
    }
  };

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading news...</div>;
  }

  return (
    <div className="news-list-container">
      <div className="list-header">
        <h2>📰 News Management ({filteredNews.length})</h2>
        <button
          className="add-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add News'}
        </button>
      </div>

      {/* Add News Form */}
      {showForm && (
        <div className="add-news-form">
          <h3>Create New News</h3>
          <form onSubmit={handleCreateNews}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                required
                maxLength="200"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter news title"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                required
                maxLength="2000"
                rows="5"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter detailed description"
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="health">Health</option>
                  <option value="fitness">Fitness</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="wellness">Wellness</option>
                </select>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <button type="submit" className="submit-button">
              📤 Publish News
            </button>
          </form>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search news by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="news-grid">
        {filteredNews.length === 0 ? (
          <div className="no-data">No news found</div>
        ) : (
          filteredNews.map((item) => (
            <div key={item._id} className="news-card">
              {item.image && (
                <div className="news-image">
                  <img src={item.image} alt={item.title} />
                </div>
              )}
              <div className="news-content">
                <div className="news-header">
                  <h3>{item.title}</h3>
                  <span className={`status-badge ${item.isPublished ? 'published' : 'draft'}`}>
                    {item.isPublished ? '📢 Published' : '📝 Draft'}
                  </span>
                </div>
                <p className="news-category">
                  {item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
                </p>
                <p className="news-description">
                  {item.description.length > 100
                    ? item.description.substring(0, 100) + '...'
                    : item.description}
                </p>
                <div className="news-footer">
                  <span className="news-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <span className="news-views">👁 {item.views} views</span>
                </div>
                <div className="news-actions">
                  <button
                    className="view-button"
                    onClick={() => setSelectedNews(item)}
                  >
                    View
                  </button>
                  <button
                    className={`publish-button ${item.isPublished ? 'active' : ''}`}
                    onClick={() => handlePublishToggle(item._id, item.isPublished)}
                  >
                    {item.isPublished ? '✓ Published' : 'Publish'}
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteNews(item._id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* News Details Modal */}
      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedNews.title}</h3>
              <button
                className="close-button"
                onClick={() => setSelectedNews(null)}
              >
                ✕
              </button>
            </div>

            {selectedNews.image && (
              <div className="modal-image">
                <img src={selectedNews.image} alt={selectedNews.title} />
              </div>
            )}

            <div className="modal-body">
              <div className="detail-row">
                <label>Category:</label>
                <span>
                  {selectedNews.category?.charAt(0).toUpperCase() +
                    selectedNews.category?.slice(1)}
                </span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status-badge ${selectedNews.isPublished ? 'published' : 'draft'}`}>
                  {selectedNews.isPublished ? '📢 Published' : '📝 Draft'}
                </span>
              </div>
              <div className="detail-row">
                <label>Created By:</label>
                <span>{selectedNews.adminName}</span>
              </div>
              <div className="detail-row">
                <label>Created Date:</label>
                <span>{new Date(selectedNews.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <label>Views:</label>
                <span>{selectedNews.views}</span>
              </div>
              <div className="detail-section">
                <label>Description:</label>
                <div className="news-full-description">{selectedNews.description}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className={`publish-button ${selectedNews.isPublished ? 'active' : ''}`}
                onClick={() => {
                  handlePublishToggle(selectedNews._id, selectedNews.isPublished);
                  setSelectedNews(null);
                }}
              >
                {selectedNews.isPublished ? '✓ Unpublish' : '📤 Publish'}
              </button>
              <button
                className="delete-button"
                onClick={() => {
                  handleDeleteNews(selectedNews._id);
                }}
              >
                🗑 Delete
              </button>
              <button
                className="close-modal-button"
                onClick={() => setSelectedNews(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsList;
