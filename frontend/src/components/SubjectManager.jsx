import { useState, useEffect } from 'react';
import { subjectsAPI } from '../services/api';

import ConfirmModal from './ConfirmModal';
import ExpandableSection from './ExpandableSection';

function SubjectManager() {
  const [subjects, setSubjects] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, subjectId: null });
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'theory', credits: 1 });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      showNotification('Name and code are required', 'error');
      return;
    }
    
    if (formData.credits <= 0) {
      showNotification('Credits must be greater than 0', 'error');
      return;
    }
    
    try {
      await subjectsAPI.create(formData);
      setFormData({ name: '', code: '', type: 'theory', credits: 1 });
      loadSubjects();
      // Form will auto-close via closeForm callback
      showNotification('Subject added successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error creating subject';
      showNotification(errorMsg, 'error');
    }
  };

  const deleteSubject = async (id) => {
    try {
      await subjectsAPI.delete(id);
      loadSubjects();
      showNotification('Subject deleted successfully!');
      setConfirmModal({ isOpen: false, subjectId: null });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error deleting subject';
      showNotification(errorMsg, 'error');
    }
  };

  return (
    <div>
      {/* Notification Popup */}
      {notification && (
        <div className="notification-overlay">
          <div className={`notification-popup ${notification.type === 'error' ? 'error' : 'success'}`}>
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === 'error' ? '❌' : '✅'}
              </div>
              <div className="notification-message">
                {notification.message}
              </div>
              <button className="notification-close" onClick={() => setNotification(null)}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Overview */}
      <div className="row">
        <div className="col-12">
          <div className="card marks-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📚 Subjects Overview</h5>

            </div>
            <div className="card-body">
              {subjects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No subjects added yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Credits</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(subject => (
                        <tr key={subject.id}>
                          <td>{subject.type === 'lab' ? '🔬' : '🎓'} {subject.name}</td>
                          <td><span className="badge bg-primary">{subject.code}</span></td>
                          <td><span className="badge bg-secondary">{subject.type === 'lab' ? '🔬 Lab' : '🎓 Theory'}</span></td>
                          <td><span className="badge bg-info">{subject.credits}</span></td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => setConfirmModal({ isOpen: true, subjectId: subject.id })}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Add Subject Section */}
      <div className="row mt-3">
        <div className="col-12">
          <ExpandableSection 
            title="➕ Add New Subject"
            onToggle={(isOpen) => showNotification(`Add Subject form ${isOpen ? 'opened' : 'closed'}`)}
          >
            {(closeForm) => (
              <form onSubmit={(e) => {
                handleSubmit(e);
                closeForm();
              }}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Subject Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Subject Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Type</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                      >
                        <option value="theory">🎓 Theory</option>
                        <option value="lab">🔬 Lab</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Credits</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.credits}
                        onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success flex-fill">
                    ✨ Add Subject
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={closeForm}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </form>
            )}
          </ExpandableSection>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, subjectId: null })}
        onConfirm={() => deleteSubject(confirmModal.subjectId)}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? All attendance data, marks, and timetable entries for this subject will be permanently lost. This action cannot be undone."
      />
    </div>
  );
}

export default SubjectManager;