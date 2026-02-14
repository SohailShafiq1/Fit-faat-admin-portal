import axios from 'axios';
import { useEffect, useState } from 'react';
import './UsersList.css';

function UsersList({ token, apiUrl }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, block = true) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/users/${userId}/block`,
        { isActive: !block },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchUsers();
        setSelectedUser(null);
      }
    } catch (err) {
      alert(`Failed to ${block ? 'block' : 'unblock'} user`);
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="users-list-container">
      <div className="list-header">
        <h2>All Users ({filteredUsers.length})</h2>
        <input
          type="text"
          placeholder="Search by email or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id.substring(0, 8)}...</td>
                  <td>
                    <div className="user-name">{user.username}</div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.status === 'Active' ? 'active' : 'inactive'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() => setSelectedUser(user)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button
                className="close-button"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <div className="detail-label">User ID:</div>
                <div className="detail-value">{selectedUser.id}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Username:</div>
                <div className="detail-value">{selectedUser.username}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Email:</div>
                <div className="detail-value">{selectedUser.email}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Status:</div>
                <div className="detail-value">
                  {selectedUser.status === 'Active' ? '✅ Active' : '❌ Inactive'}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Joined:</div>
                <div className="detail-value">
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Name:</div>
                <div className="detail-value">{selectedUser.name}</div>
              </div>
              {selectedUser.appointmentsCount > 0 && (
                <div className="detail-row">
                  <div className="detail-label">Appointments:</div>
                  <div className="detail-value">{selectedUser.appointmentsCount}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedUser.status === 'Active' ? (
                <button
                  className="block-button"
                  onClick={() => handleBlockUser(selectedUser.id, true)}
                >
                  🚫 Block User
                </button>
              ) : (
                <button
                  className="unblock-button"
                  onClick={() => handleBlockUser(selectedUser.id, false)}
                >
                  ✓ Unblock User
                </button>
              )}
              <button
                className="close-modal-button"
                onClick={() => setSelectedUser(null)}
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

export default UsersList;
