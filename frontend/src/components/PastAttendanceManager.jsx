import { useState, useEffect } from 'react';
import { pastAttendanceAPI, subjectsAPI, holidaysAPI } from '../services/api';

function PastAttendanceManager() {
  const [subjects, setSubjects] = useState([]);
  const [pastEntries, setPastEntries] = useState([]);
  const [semester, setSemester] = useState({});
  const [formData, setFormData] = useState({
    subject_id: '',
    date: '',
    status: 'present',
    reason: ''
  });
  const [notification, setNotification] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEntries, setBulkEntries] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subjectsRes, semesterRes] = await Promise.all([
        subjectsAPI.getAll(),
        holidaysAPI.getSemester()
      ]);
      setSubjects(subjectsRes.data || []);
      setSemester(semesterRes.data || {});
      
      // Load past attendance separately with error handling
      try {
        const pastRes = await pastAttendanceAPI.getAll();
        setPastEntries(pastRes.data || []);
      } catch (pastError) {
        console.log('Past attendance not available yet');
        setPastEntries([]);
      }
    } catch (error) {
      showNotification('Error loading data', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const validateDate = (date) => {
    if (!semester.start_date || !semester.end_date) {
      return 'No active semester found';
    }
    
    if (date < semester.start_date || date > semester.end_date) {
      return 'Date outside semester range';
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return 'Cannot add past attendance for future dates';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dateError = validateDate(formData.date);
    if (dateError) {
      showNotification(dateError, 'error');
      return;
    }
    
    if (!formData.reason.trim()) {
      showNotification('Reason is mandatory for past attendance', 'error');
      return;
    }
    
    try {
      await pastAttendanceAPI.add(formData);
      showNotification('Past attendance added successfully', 'success');
      setFormData({ subject_id: '', date: '', status: 'present', reason: '' });
      loadData();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error adding past attendance';
      showNotification(errorMsg, 'error');
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkEntries.length === 0) {
      showNotification('No entries to process', 'error');
      return;
    }
    
    try {
      const response = await pastAttendanceAPI.bulkAdd({ entries: bulkEntries });
      const { successCount, failureCount, errors } = response.data;
      
      let message = `Bulk import completed: ${successCount} success, ${failureCount} failed`;
      if (errors && errors.length > 0) {
        message += `\nFirst few errors: ${errors.slice(0, 3).join(', ')}`;
      }
      
      showNotification(message, failureCount > 0 ? 'warning' : 'success');
      setBulkEntries([]);
      loadData();
    } catch (error) {
      showNotification('Error processing bulk import', 'error');
    }
  };

  const addBulkEntry = () => {
    setBulkEntries([...bulkEntries, {
      subject_id: '',
      date: '',
      status: 'present',
      reason: ''
    }]);
  };

  const updateBulkEntry = (index, field, value) => {
    const updated = [...bulkEntries];
    updated[index][field] = value;
    setBulkEntries(updated);
  };

  const removeBulkEntry = (index) => {
    setBulkEntries(bulkEntries.filter((_, i) => i !== index));
  };

  const deletePastEntry = async (id) => {
    try {
      await pastAttendanceAPI.delete(id);
      showNotification('Past attendance entry deleted', 'success');
      loadData();
    } catch (error) {
      showNotification('Error deleting entry', 'error');
    }
  };

  return (
    <div>
      {/* Notification Modal */}
      {notification && (
        <div className={`alert alert-${notification.type === 'error' ? 'danger' : 
          notification.type === 'warning' ? 'warning' : 'success'} alert-dismissible fade show`} 
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '300px' }}>
          <div style={{ whiteSpace: 'pre-line' }}>{notification.message}</div>
          <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
        </div>
      )}

      {/* Semester Info */}
      {semester.semester_name && (
        <div className="alert alert-info mb-4">
          <h6>📅 Active Semester: {semester.semester_name}</h6>
          <small>Period: {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}</small>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="d-flex gap-2 mb-4">
        <button 
          className={`btn ${!bulkMode ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setBulkMode(false)}
        >
          📝 Single Entry
        </button>
        <button 
          className={`btn ${bulkMode ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setBulkMode(true)}
        >
          📊 Bulk Entry
        </button>
      </div>

      {!bulkMode ? (
        /* Single Entry Mode */
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>🔵 Add Past Attendance</h5>
                <small className="text-muted">For students who joined mid-semester</small>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <select
                      className="form-select"
                      value={formData.subject_id}
                      onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.type === 'lab' ? '🔬' : '🎓'} {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      min={semester.start_date}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <small className="text-muted">
                      Range: {semester.start_date} to {new Date().toISOString().split('T')[0]}
                    </small>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="status"
                          value="present"
                          checked={formData.status === 'present'}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        />
                        <label className="form-check-label">✅ Present</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="status"
                          value="absent"
                          checked={formData.status === 'absent'}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        />
                        <label className="form-check-label">❌ Absent</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Reason *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      placeholder="e.g., Joined mid-semester, Medical leave, etc."
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    🔵 Add Past Attendance
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>📋 Past Attendance Entries</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {pastEntries.length === 0 ? (
                  <p className="text-muted">No past attendance entries</p>
                ) : (
                  pastEntries.map(entry => (
                    <div key={entry.id} className="border rounded p-2 mb-2">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>🔵 {entry.subject_name}</strong><br/>
                          <small>{new Date(entry.date).toLocaleDateString()} - 
                            {entry.status === 'present' ? ' ✅ Present' : ' ❌ Absent'}
                          </small><br/>
                          <small className="text-muted">Reason: {entry.reason}</small>
                        </div>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deletePastEntry(entry.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bulk Entry Mode */
        <div className="card">
          <div className="card-header">
            <h5>📊 Bulk Past Attendance Entry</h5>
            <small className="text-muted">Add multiple past attendance entries at once</small>
          </div>
          <div className="card-body">
            <div className="d-flex gap-2 mb-3">
              <button className="btn btn-success" onClick={addBulkEntry}>
                ➕ Add Row
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleBulkSubmit}
                disabled={bulkEntries.length === 0}
              >
                💾 Process All ({bulkEntries.length})
              </button>
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setBulkEntries([])}
              >
                🗑️ Clear All
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkEntries.map((entry, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={entry.subject_id}
                          onChange={(e) => updateBulkEntry(index, 'subject_id', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                              {subject.type === 'lab' ? '🔬' : '🎓'} {subject.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={entry.date}
                          onChange={(e) => updateBulkEntry(index, 'date', e.target.value)}
                          min={semester.start_date}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={entry.status}
                          onChange={(e) => updateBulkEntry(index, 'status', e.target.value)}
                        >
                          <option value="present">✅ Present</option>
                          <option value="absent">❌ Absent</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={entry.reason}
                          onChange={(e) => updateBulkEntry(index, 'reason', e.target.value)}
                          placeholder="Reason"
                          required
                        />
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeBulkEntry(index)}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {bulkEntries.length === 0 && (
              <div className="text-center text-muted py-4">
                Click "Add Row" to start adding bulk entries
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PastAttendanceManager;