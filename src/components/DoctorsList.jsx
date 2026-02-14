import axios from 'axios';
import { useEffect, useState } from 'react';
import './DoctorsList.css';

function DoctorsList({ token, apiUrl }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDoctors(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch doctors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/doctors/${doctorId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchDoctors();
        setSelectedDoctor(null);
      }
    } catch (err) {
      alert('Failed to approve doctor');
      console.error(err);
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/doctors/${doctorId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchDoctors();
        setSelectedDoctor(null);
      }
    } catch (err) {
      alert('Failed to reject doctor');
      console.error(err);
    }
  };

  const handleVerifyDoctor = async (doctorId) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/doctors/${doctorId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchDoctors();
        setSelectedDoctor(null);
      }
    } catch (err) {
      alert('Failed to verify doctor');
      console.error(err);
    }
  };

  const handleUnverifyDoctor = async (doctorId) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/doctors/${doctorId}/unverify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchDoctors();
        setSelectedDoctor(null);
      }
    } catch (err) {
      alert('Failed to unverify doctor');
      console.error(err);
    }
  };

  const handleBlockDoctor = async (doctorId, block = true) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/doctors/${doctorId}/block`,
        { isBlocked: block },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        fetchDoctors();
        setSelectedDoctor(null);
      }
    } catch (err) {
      alert(`Failed to ${block ? 'block' : 'unblock'} doctor`);
      console.error(err);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch =
      doctor.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      doctor.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="loading">Loading doctors...</div>;
  }

  return (
    <div className="doctors-list-container">
      <div className="list-header">
        <h2>All Doctors ({filteredDoctors.length})</h2>
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="doctors-table-wrapper">
        <table className="doctors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Status</th>
              <th>License</th>
              <th>Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No doctors found
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>
                    <div className="doctor-name">
                      {doctor.personalInfo?.firstName} {doctor.personalInfo?.lastName}
                    </div>
                  </td>
                  <td>{doctor.userEmail}</td>
                  <td>{doctor.professionalInfo?.specialization || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${doctor.status}`}>
                      {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                    </span>
                  </td>
                  <td>{doctor.professionalInfo?.licenseNumber || 'N/A'}</td>
                  <td>{new Date(doctor.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() => setSelectedDoctor(doctor)}
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

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Doctor Details</h3>
              <button
                className="close-button"
                onClick={() => setSelectedDoctor(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Personal Information */}
              <div className="section">
                <h4>Personal Information</h4>
                <div className="detail-row">
                  <div className="detail-label">Name:</div>
                  <div className="detail-value">
                    {selectedDoctor.personalInfo?.firstName} {selectedDoctor.personalInfo?.lastName}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Email:</div>
                  <div className="detail-value">{selectedDoctor.userEmail}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Phone:</div>
                  <div className="detail-value">{selectedDoctor.personalInfo?.phone || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Date of Birth:</div>
                  <div className="detail-value">
                    {selectedDoctor.personalInfo?.dateOfBirth 
                      ? new Date(selectedDoctor.personalInfo.dateOfBirth).toLocaleDateString() 
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="section">
                <h4>Professional Information</h4>
                <div className="detail-row">
                  <div className="detail-label">Specialization:</div>
                  <div className="detail-value">{selectedDoctor.professionalInfo?.specialization || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">License Number:</div>
                  <div className="detail-value">{selectedDoctor.professionalInfo?.licenseNumber || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">License Expiry:</div>
                  <div className="detail-value">
                    {selectedDoctor.professionalInfo?.licenseExpiry 
                      ? new Date(selectedDoctor.professionalInfo.licenseExpiry).toLocaleDateString() 
                      : 'N/A'}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Years of Experience:</div>
                  <div className="detail-value">{selectedDoctor.professionalInfo?.yearsOfExperience || 'N/A'}</div>
                </div>
              </div>

              {/* Status Information */}
              <div className="section">
                <h4>Status & Verification</h4>
                <div className="detail-row">
                  <div className="detail-label">Application Status:</div>
                  <div className="detail-value">
                    <span className={`status-badge ${selectedDoctor.status}`}>
                      {selectedDoctor.status.charAt(0).toUpperCase() + selectedDoctor.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Verified:</div>
                  <div className="detail-value">
                    {selectedDoctor.isVerified ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Active:</div>
                  <div className="detail-value">
                    {selectedDoctor.isActive ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Submitted Date:</div>
                  <div className="detail-value">
                    {new Date(selectedDoctor.submittedAt).toLocaleString()}
                  </div>
                </div>
                {selectedDoctor.approvedAt && (
                  <div className="detail-row">
                    <div className="detail-label">Approved Date:</div>
                    <div className="detail-value">
                      {new Date(selectedDoctor.approvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Clinic Information */}
              {selectedDoctor.clinicInfo && (
                <div className="section">
                  <h4>Clinic Information</h4>
                  <div className="detail-row">
                    <div className="detail-label">Clinic Name:</div>
                    <div className="detail-value">{selectedDoctor.clinicInfo?.name || 'N/A'}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Address:</div>
                    <div className="detail-value">{selectedDoctor.clinicInfo?.address || 'N/A'}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Phone:</div>
                    <div className="detail-value">{selectedDoctor.clinicInfo?.phone || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedDoctor.adminNotes && (
                <div className="section">
                  <h4>Admin Notes</h4>
                  <div className="admin-notes">{selectedDoctor.adminNotes}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedDoctor.status === 'pending' && (
                <>
                  <button
                    className="approve-button"
                    onClick={() => handleApproveDoctor(selectedDoctor.id)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleRejectDoctor(selectedDoctor.id)}
                  >
                    ✕ Reject
                  </button>
                </>
              )}
              {selectedDoctor.status === 'approved' && (
                <>
                  {!selectedDoctor.isVerified ? (
                    <button
                      className="verify-button"
                      onClick={() => handleVerifyDoctor(selectedDoctor.id)}
                    >
                      ✓ Verify
                    </button>
                  ) : (
                    <button
                      className="unverify-button"
                      onClick={() => handleUnverifyDoctor(selectedDoctor.id)}
                    >
                      ✕ Unverify
                    </button>
                  )}
                  <button
                    className="block-button"
                    onClick={() => handleBlockDoctor(selectedDoctor.id, true)}
                  >
                    🚫 Block
                  </button>
                </>
              )}
              <button
                className="close-modal-button"
                onClick={() => setSelectedDoctor(null)}
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

export default DoctorsList;
