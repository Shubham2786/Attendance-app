import { useState, useEffect } from 'react';
import { holidaysAPI, nonWorkingDaysAPI, attendanceAPI, subjectsAPI } from '../services/api';
import PastAttendanceManager from './PastAttendanceManager';
import ConfirmModal from './ConfirmModal';

function HolidayManager() {
  const [activeTab, setActiveTab] = useState('holidays');
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [nonWorkingDays, setNonWorkingDays] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [semester, setSemester] = useState({});
  
  // Form states
  const [formData, setFormData] = useState({ name: '', start_date: '', end_date: '', type: 'short' });
  const [semesterData, setSemesterData] = useState({ semester_name: '', start_date: '', end_date: '', current_semester: '' });
  const [manualAttendance, setManualAttendance] = useState({ subject_id: '', date: '', status: 'present', reason: '' });
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, holidayId: null });



  const days = [
    { value: 0, name: '🌅 Sunday' },
    { value: 1, name: '💼 Monday' },
    { value: 2, name: '💼 Tuesday' },
    { value: 3, name: '💼 Wednesday' },
    { value: 4, name: '💼 Thursday' },
    { value: 5, name: '💼 Friday' },
    { value: 6, name: '🌆 Saturday' }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load data functions
  const loadHolidays = async () => {
    try {
      const response = await holidaysAPI.getAll();
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      setHolidays([]);
    }
  };

  const loadNonWorkingDays = async () => {
    try {
      const response = await nonWorkingDaysAPI.getAll();
      setNonWorkingDays(response.data || []);
    } catch (error) {
      console.error('Error loading non-working days:', error);
      setNonWorkingDays([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await attendanceAPI.getAll();
      setAttendance(response.data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setAttendance([]);
    }
  };

  const loadSemester = async () => {
    try {
      const response = await holidaysAPI.getSemester();
      setSemester(response.data || {});
    } catch (error) {
      console.error('Error loading semester:', error);
      setSemester({});
    }
  };



  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'holidays') {
      loadHolidays();
    } else if (activeTab === 'semester') {
      loadSemester();
      loadNonWorkingDays(); // Load non-working days for calculation
    } else if (activeTab === 'attendance') {
      loadSubjects();
      loadAttendance();
    } else if (activeTab === 'nonworking') {
      loadNonWorkingDays();
    }
  }, [activeTab]);

  // Event handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const holidayData = formData.type === 'short' 
        ? { ...formData, end_date: formData.start_date }
        : formData;
      await holidaysAPI.create(holidayData);
      setFormData({ name: '', start_date: '', end_date: '', type: 'short' });
      loadHolidays();
      showNotification('Holiday added successfully!');
      
      // Trigger calendar refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('holidayUpdated', { detail: holidayData }));
      }, 200);
    } catch (error) {
      console.error('Error creating holiday:', error);
      showNotification('Error adding holiday: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleSemesterSubmit = async (e) => {
    e.preventDefault();
    try {
      await holidaysAPI.createSemester(semesterData);
      setSemesterData({ semester_name: '', start_date: '', end_date: '', current_semester: '' });
      loadSemester();
    } catch (error) {
      console.error('Error setting semester:', error);
      showNotification('Error setting semester: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleManualAttendance = async (e) => {
    e.preventDefault();
    try {
      await attendanceAPI.markManual(manualAttendance);
      setManualAttendance({ subject_id: '', date: '', status: 'present', reason: '' });
      loadAttendance();
    } catch (error) {
      console.error('Error marking manual attendance:', error);
      showNotification('Error marking attendance: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleAttendanceEdit = async (attendanceId, newStatus) => {
    try {
      await attendanceAPI.update(attendanceId, { status: newStatus, reason: 'Edited via Settings' });
      loadAttendance();
      setEditingAttendance(null);
    } catch (error) {
      console.error('Error updating attendance:', error);
      showNotification(error.response?.data?.error || 'Error updating attendance', 'error');
    }
  };

  const deleteHoliday = async (id) => {
    try {
      await holidaysAPI.delete(id);
      loadHolidays();
      showNotification('Holiday deleted successfully!');
      setConfirmModal({ isOpen: false, holidayId: null });
      
      // Trigger calendar refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('holidayUpdated', { detail: { deleted: id } }));
      }, 200);
    } catch (error) {
      console.error('Error deleting holiday:', error);
      showNotification('Error deleting holiday', 'error');
    }
  };

  const addNonWorkingDay = async (dayValue) => {
    const day = days.find(d => d.value === parseInt(dayValue));
    try {
      await nonWorkingDaysAPI.create({
        day_of_week: day.value,
        day_name: day.name
      });
      loadNonWorkingDays();
      showNotification(`${day.name} marked as non-working day`);
    } catch (error) {
      console.error('Error adding non-working day:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      showNotification(errorMessage, 'error');
    }
  };

  const removeNonWorkingDay = async (id) => {
    try {
      await nonWorkingDaysAPI.delete(id);
      loadNonWorkingDays();
      showNotification('Working day restored successfully!');
    } catch (error) {
      console.error('Error removing non-working day:', error);
      showNotification('Error restoring working day: ' + (error.response?.data?.error || error.message), 'error');
    }
  };



  // Helper functions
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getDaysDifference = (dateStr) => {
    if (!dateStr) return 999;
    try {
      const today = new Date();
      const attDate = new Date(dateStr);
      const diffTime = today - attDate;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  const isAttendanceEditable = (dateStr) => {
    const daysDiff = getDaysDifference(dateStr);
    return daysDiff >= 0 && daysDiff <= 2;
  };

  const calculateSemesterDetails = () => {
    if (!semesterData?.start_date || !semesterData?.end_date) return null;
    
    try {
      const start = new Date(semesterData.start_date);
      const end = new Date(semesterData.end_date);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const nonWorkingDayNumbers = nonWorkingDays.map(nwd => nwd.day_of_week);
      
      let totalDays = 0;
      let workingDays = 0;
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        totalDays++;
        const dayOfWeek = currentDate.getDay();
        if (!nonWorkingDayNumbers.includes(dayOfWeek)) {
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const weeks = Math.ceil(totalDays / 7);
      const workingWeeks = Math.ceil(workingDays / 5); // Assuming 5 working days per week
      
      return {
        totalDays,
        workingDays,
        totalWeeks: weeks,
        workingWeeks,
        startDay: dayNames[start.getDay()],
        endDay: dayNames[end.getDay()],
        nonWorkingDays: totalDays - workingDays
      };
    } catch {
      return null;
    }
  };

  const editableAttendance = attendance.filter(att => att && isAttendanceEditable(att.date));
  const availableDays = days.filter(day => !nonWorkingDays.some(nwd => nwd.day_of_week === day.value));
  const semesterDetails = calculateSemesterDetails();

  const subMenuItems = [
    { id: 'holidays', label: '🏖️ Holidays' },
    { id: 'semester', label: '📚 Semester Settings' },
    { id: 'attendance', label: '✏️ Edit Attendance' },
    { id: 'past', label: '🔵 Past Attendance' },
    { id: 'nonworking', label: '🚫 Non-Working Days' }
  ];

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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, holidayId: null })}
        onConfirm={() => deleteHoliday(confirmModal.holidayId)}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday? This action cannot be undone."
      />
      {/* Sub-Menu Navigation */}
      <div className="d-flex align-items-center mb-4">
        {/* Mobile Hamburger */}
        <button 
          className="btn btn-outline-primary d-lg-none"
          onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
        >
          ☰ Settings
        </button>
        
        {/* Desktop Horizontal Menu */}
        <div className="d-none d-lg-flex gap-2 flex-wrap">
          {subMenuItems.map(item => (
            <button 
              key={item.id}
              className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Mobile Slide Menu */}
      <div className={`sub-menu ${isSubMenuOpen ? 'open' : ''} d-lg-none`}>
        <div className="sub-menu-content">
          {subMenuItems.map(item => (
            <button 
              key={item.id}
              className={`sub-menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsSubMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {isSubMenuOpen && <div className="sub-menu-overlay d-lg-none" onClick={() => setIsSubMenuOpen(false)}></div>}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>➕ Add Holiday</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Holiday Type</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="short">📅 Short Holiday (1 day)</option>
                      <option value="long">🏖️ Long Holiday (2-10 days)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Holiday Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{formData.type === 'short' ? 'Date' : 'Start Date'}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      required
                    />
                  </div>
                  {formData.type === 'long' && (
                    <div className="mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        required
                      />
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary">
                    ✨ Add Holiday
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>🏖️ Holidays List</h5>
              </div>
              <div className="card-body">
                {holidays.length === 0 ? (
                  <p className="text-muted">No holidays added yet</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Holiday</th>
                          <th>Duration</th>
                          <th>Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.map(holiday => (
                          <tr key={holiday.id}>
                            <td>🎉 {holiday.name}</td>
                            <td>
                              {holiday.type === 'short' 
                                ? formatDate(holiday.start_date)
                                : `${formatDate(holiday.start_date)} - ${formatDate(holiday.end_date)}`
                              }
                            </td>
                            <td>
                              <span className={`badge ${holiday.type === 'short' ? 'bg-info' : 'bg-warning'}`}>
                                {holiday.type === 'short' ? '📅 Short' : '🏖️ Long'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => setConfirmModal({ isOpen: true, holidayId: holiday.id })}
                              >
                                🗑️ Delete
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
      )}

      {/* Semester Settings Tab */}
      {activeTab === 'semester' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>📚 Set Semester Working Days</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSemesterSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Semester Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={semesterData.semester_name}
                      onChange={(e) => setSemesterData({...semesterData, semester_name: e.target.value})}
                      placeholder="e.g., Fall 2024, Spring 2025"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Semester Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={semesterData.start_date}
                      onChange={(e) => setSemesterData({...semesterData, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Semester End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={semesterData.end_date}
                      onChange={(e) => setSemesterData({...semesterData, end_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Current Semester</label>
                    <select
                      className="form-select"
                      value={semesterData.current_semester}
                      onChange={(e) => setSemesterData({...semesterData, current_semester: e.target.value})}
                      required

                    >
                      <option value="">Select Current Semester</option>
                      <option value="Sem 1">Semester 1</option>
                      <option value="Sem 2">Semester 2</option>
                      <option value="Sem 3">Semester 3</option>
                      <option value="Sem 4">Semester 4</option>
                      <option value="Sem 5">Semester 5</option>
                      <option value="Sem 6">Semester 6</option>
                      <option value="Sem 7">Semester 7</option>
                      <option value="Sem 8">Semester 8</option>
                      <option value="Sem 9">Semester 9</option>
                      <option value="Sem 10">Semester 10</option>
                    </select>

                  </div>
                  {semesterDetails && (
                    <div className="alert alert-info">
                      <h6>📅 Semester Overview:</h6>
                      <p className="mb-1"><strong>Total Duration:</strong> {semesterDetails.totalDays} days ({semesterDetails.totalWeeks} weeks)</p>
                      <p className="mb-1"><strong>Working Days:</strong> {semesterDetails.workingDays} days ({semesterDetails.workingWeeks} weeks)</p>
                      <p className="mb-1"><strong>Non-Working Days:</strong> {semesterDetails.nonWorkingDays} days</p>
                      <p className="mb-1"><strong>Starts:</strong> {semesterDetails.startDay}</p>
                      <p className="mb-0"><strong>Ends:</strong> {semesterDetails.endDay}</p>
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary">
                    ✨ Set Semester
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>📅 Current Semester</h5>
              </div>
              <div className="card-body">
                {semester && semester.semester_name ? (
                  <div>
                    <h6 className="text-primary">{semester.semester_name}</h6>
                    <p><strong>Start:</strong> {formatDate(semester.start_date)}</p>
                    <p><strong>End:</strong> {formatDate(semester.end_date)}</p>

                    <span className="badge bg-success">Active</span>
                  </div>
                ) : (
                  <p className="text-muted">No active semester set</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Edit Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>➕ Mark Manual Attendance</h5>
                <small className="text-muted">For missed days or corrections</small>
              </div>
              <div className="card-body">
                <form onSubmit={handleManualAttendance}>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <select
                      className="form-select"
                      value={manualAttendance.subject_id}
                      onChange={(e) => setManualAttendance({...manualAttendance, subject_id: e.target.value})}
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
                      value={manualAttendance.date}
                      onChange={(e) => setManualAttendance({...manualAttendance, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={manualAttendance.status}
                      onChange={(e) => setManualAttendance({...manualAttendance, status: e.target.value})}
                    >
                      <option value="present">✅ Present</option>
                      <option value="absent">❌ Absent</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <input
                      type="text"
                      className="form-control"
                      value={manualAttendance.reason}
                      onChange={(e) => setManualAttendance({...manualAttendance, reason: e.target.value})}
                      placeholder="Reason for manual entry"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    ✨ Mark Attendance
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>✏️ Editable Attendance (Past 2 Days Only)</h5>
              </div>
              <div className="card-body">
                {editableAttendance.length === 0 ? (
                  <p className="text-muted">No editable attendance records</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableAttendance.slice(0, 10).map(att => (
                          <tr key={att.id}>
                            <td>
                              {att.type === 'lab' ? '🔬' : '🎓'} {att.subject_name}
                            </td>
                            <td>
                              {formatDate(att.date)}
                              <br/>
                              <small className="text-muted">
                                {getDaysDifference(att.date)} day(s) ago
                              </small>
                            </td>
                            <td>
                              {editingAttendance === att.id ? (
                                <select 
                                  className="form-select form-select-sm"
                                  defaultValue={att.status}
                                  onChange={(e) => handleAttendanceEdit(att.id, e.target.value)}
                                >
                                  <option value="present">✅ Present</option>
                                  <option value="absent">❌ Absent</option>
                                </select>
                              ) : (
                                <span className={`badge ${att.status === 'present' ? 'bg-success' : 'bg-danger'}`}>
                                  {att.status === 'present' ? '✅ Present' : '❌ Absent'}
                                </span>
                              )}
                            </td>
                            <td>
                              {editingAttendance === att.id ? (
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setEditingAttendance(null)}
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button 
                                  className="btn btn-warning btn-sm"
                                  onClick={() => setEditingAttendance(att.id)}
                                >
                                  ✏️ Edit
                                </button>
                              )}
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
      )}

      {/* Past Attendance Tab */}
      {activeTab === 'past' && <PastAttendanceManager />}

      {/* Non-Working Days Tab */}
      {activeTab === 'nonworking' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>🚫 Manage Non-Working Days</h5>
                <small className="text-muted">Edit which days of the week have classes</small>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">
                  Click on days to toggle as working/non-working
                </p>
                <div className="d-grid gap-2">
                  {days.map(day => {
                    const isNonWorking = nonWorkingDays.some(nwd => nwd.day_of_week === day.value);
                    return (
                      <button
                        key={day.value}
                        className={`btn text-start ${
                          isNonWorking ? 'btn-danger' : 'btn-outline-success'
                        }`}
                        onClick={() => {
                          if (isNonWorking) {
                            const nwd = nonWorkingDays.find(n => n.day_of_week === day.value);
                            removeNonWorkingDay(nwd.id);
                          } else {
                            addNonWorkingDay(day.value);
                          }
                        }}
                      >
                        {isNonWorking ? '🚫' : '✅'} {day.name}
                        {isNonWorking && <span className="badge bg-light text-dark ms-2">Non-Working</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>📅 Current Non-Working Days</h5>
              </div>
              <div className="card-body">
                {nonWorkingDays.length === 0 ? (
                  <p className="text-muted">All days are working days</p>
                ) : (
                  <div className="list-group">
                    {nonWorkingDays.map(day => (
                      <div key={day.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>🚫 {day.day_name}</span>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => removeNonWorkingDay(day.id)}
                        >
                          ✅ Make Working
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  <small className="text-info">
                    ℹ️ Note: Changing working days won't delete existing timetable data. 
                    Classes will still be scheduled but marked as non-working.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HolidayManager;