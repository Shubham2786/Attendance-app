import { useState, useEffect } from 'react';
import { timetableAPI, subjectsAPI, nonWorkingDaysAPI, examTimetableAPI, lectureManagementAPI } from '../services/api';
import AttendanceCalendar from './AttendanceCalendar';
import ExpandableSection from './ExpandableSection';

function TimetableManager() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Error boundary
  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>⚠️ Component Error</h5>
          <p>There was an error loading the timetable: {error.message}</p>
          <button 
            className="btn btn-outline-danger"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }
  const [activeView, setActiveView] = useState('timetable');
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [nonWorkingDays, setNonWorkingDays] = useState([]);
  const [exams, setExams] = useState([]);
  const [cancelledLectures, setCancelledLectures] = useState([]);
  const [extraLectures, setExtraLectures] = useState([]);
  const [formData, setFormData] = useState({
    subject_id: '',
    day_of_week: 1,
    time_slot: ''
  });
  const [examFormData, setExamFormData] = useState({
    subject_id: '',
    exam_type: 'mid_sem',
    exam_date: '',
    start_time: '',
    end_time: '',
    venue: ''
  });

  const timeSlots = {
    theory: [
      { value: '08:30-09:25', label: '08:30 - 09:25 (Period 1)' },
      { value: '09:25-10:20', label: '09:25 - 10:20 (Period 2)' },
      { value: '10:30-11:25', label: '10:30 - 11:25 (Period 3)' },
      { value: '11:25-12:20', label: '11:25 - 12:20 (Period 4)' },
      { value: '12:20-13:15', label: '12:20 - 13:15 (Period 5)' },
      { value: '13:15-14:10', label: '13:15 - 14:10 (Period 6)' },
      { value: '14:10-15:05', label: '14:10 - 15:05 (Period 7)' },
      { value: '15:10-16:00', label: '15:10 - 16:00 (Period 8)' },
      { value: '16:00-16:50', label: '16:00 - 16:50 (Period 9)' }
    ],
    lab: [
      { value: '08:30-10:20', label: '08:30 - 10:20 (Lab Slot 1)' },
      { value: '10:30-12:20', label: '10:30 - 12:20 (Lab Slot 2)' },
      { value: '13:15-15:05', label: '13:15 - 15:05 (Lab Slot 3)' },
      { value: '14:10-16:00', label: '14:10 - 16:00 (Lab Slot 4)' },
      { value: '12:20-14:10', label: '12:20 - 14:10 (Lab Slot 5)' },
      { value: '15:10-16:50', label: '15:10 - 16:50 (Lab Slot 6)' }
    ]
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadTimetable(),
          loadSubjects(),
          loadNonWorkingDays()
        ]);
        
        if (activeView === 'exams') {
          await loadExams();
        } else if (activeView === 'lectures') {
          await Promise.all([
            loadCancelledLectures(),
            loadExtraLectures()
          ]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err);
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [activeView]);

  const loadTimetable = async () => {
    try {
      const response = await timetableAPI.getAll();
      setTimetable(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading timetable:', error);
      setTimetable([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const loadNonWorkingDays = async () => {
    try {
      const response = await nonWorkingDaysAPI.getAll();
      setNonWorkingDays(response.data);
    } catch (error) {
      console.error('Error loading non-working days:', error);
    }
  };

  const loadExams = async () => {
    try {
      const response = await examTimetableAPI.getAll();
      setExams(response.data);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const loadCancelledLectures = async () => {
    try {
      const response = await lectureManagementAPI.getCancelled();
      setCancelledLectures(response.data);
    } catch (error) {
      console.error('Error loading cancelled lectures:', error);
    }
  };

  const loadExtraLectures = async () => {
    try {
      const response = await lectureManagementAPI.getExtra();
      setExtraLectures(response.data);
    } catch (error) {
      console.error('Error loading extra lectures:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [start_time, end_time] = formData.time_slot.split('-');
    try {
      await timetableAPI.create({
        subject_id: formData.subject_id,
        day_of_week: formData.day_of_week,
        start_time,
        end_time
      });
      setFormData({ subject_id: '', day_of_week: 1, time_slot: '' });
      loadTimetable();
    } catch (error) {
      console.error('Error creating timetable entry:', error);
    }
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await examTimetableAPI.create(examFormData);
      setExamFormData({
        subject_id: '',
        exam_type: 'mid_sem',
        exam_date: '',
        start_time: '',
        end_time: '',
        venue: ''
      });
      loadExams();
    } catch (error) {
      console.error('Error creating exam entry:', error);
    }
  };

  const deleteExam = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await examTimetableAPI.delete(id);
        loadExams();
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  const groupedTimetable = timetable.reduce((acc, entry) => {
    const day = entry.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  const renderDayClasses = (dayIndex) => {
    const dayClasses = groupedTimetable[dayIndex] ? 
      [...groupedTimetable[dayIndex]].sort((a, b) => a.start_time.localeCompare(b.start_time)) : [];
    
    if (dayClasses.length === 0) {
      return <p className="text-muted text-center py-3">🌴 No classes scheduled</p>;
    }

    const result = [];
    
    dayClasses.forEach((entry, index) => {
      // Add the class
      result.push(
        <div key={entry.id} style={{ 
          minWidth: entry.type === 'lab' ? '300px' : '150px',
          flex: entry.type === 'lab' ? '2' : '1'
        }}>
          <div className={`class-card p-3 ${entry.type === 'lab' ? 'lab-card' : 'theory-card'}`}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="class-icon">
                {entry.type === 'lab' ? '🔬' : '🎓'}
              </div>
              <span className={`badge ${entry.type === 'lab' ? 'bg-warning' : 'bg-info'}`}>
                {entry.type === 'lab' ? 'Lab' : 'Theory'}
              </span>
            </div>
            <strong className="subject-name">{entry.subject_name}</strong><br/>
            <small className="text-muted">⏰ {entry.start_time} - {entry.end_time}</small>
          </div>
        </div>
      );
      
      // Check if there's a gap before the next class
      if (index < dayClasses.length - 1) {
        const currentEnd = entry.end_time;
        const nextStart = dayClasses[index + 1].start_time;
        
        if (currentEnd !== nextStart) {
          // Check if this is lunch time
          const isLunchTime = (currentEnd === '12:20' && nextStart === '13:15') || 
                             (currentEnd === '11:25' && nextStart === '13:15') ||
                             (currentEnd === '12:20' && nextStart === '14:10');
          
          if (isLunchTime) {
            result.push(
              <div key={`lunch-${dayIndex}-${index}`} style={{ minWidth: '200px', flex: '1.5' }}>
                <div className="lunch-break-card p-3">
                  <div className="text-center">
                    <div className="class-icon">🍽️</div>
                    <strong className="subject-name">Lunch Break</strong><br/>
                    <small className="text-muted">⏰ {currentEnd} - {nextStart}</small>
                  </div>
                </div>
              </div>
            );
          } else {
            result.push(
              <div key={`free-${dayIndex}-${index}`} style={{ minWidth: '150px', flex: '1' }}>
                <div className="free-period-card p-3">
                  <div className="text-center">
                    <div className="class-icon">🌴</div>
                    <strong className="subject-name text-muted">Free Period</strong><br/>
                    <small className="text-muted">⏰ {currentEnd} - {nextStart}</small>
                  </div>
                </div>
              </div>
            );
          }
        }
      }
    });
    
    return <div className="d-flex flex-wrap gap-2">{result}</div>;
  };

  const subMenuItems = [
    { id: 'timetable', label: '📅 Class Timetable' },
    { id: 'exams', label: '🎓 Exam Timetable' },
    { id: 'lectures', label: '❌ Lecture Management' },
    { id: 'calendar', label: '📊 Attendance Calendar' }
  ];

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading timetable data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-Menu Navigation */}
      <div className="d-flex align-items-center mb-4">
        {/* Mobile Hamburger */}
        <button 
          className="btn btn-outline-primary d-lg-none"
          onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
        >
          ☰ Menu
        </button>
        
        {/* Desktop Horizontal Menu */}
        <div className="d-none d-lg-flex gap-2 flex-wrap">
          {subMenuItems.map(item => (
            <button 
              key={item.id}
              className={`btn ${activeView === item.id ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveView(item.id)}
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
              className={`sub-menu-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveView(item.id);
                setIsSubMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {isSubMenuOpen && <div className="sub-menu-overlay d-lg-none" onClick={() => setIsSubMenuOpen(false)}></div>}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <AttendanceCalendar 
          key={`calendar-${Date.now()}-${activeView}`} 
          refreshTrigger={activeView === 'calendar' ? Date.now() : 0}
        />
      )}

      {/* Lecture Management View */}
      {activeView === 'lectures' && (
        <div className="row">
          <div className="col-md-6">
            <div className="mb-4">
              <ExpandableSection title="❌ Cancel Lecture">
                {(closeForm) => (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    try {
                      await lectureManagementAPI.cancelLecture({
                        timetable_id: formData.get('timetable_id'),
                        date: formData.get('date'),
                        reason: formData.get('reason')
                      });
                      e.target.reset();
                      loadCancelledLectures();
                      closeForm();
                    } catch (error) {
                      alert('Error cancelling lecture');
                    }
                  }}>
                  <div className="mb-3">
                    <label className="form-label">Select Class</label>
                    <select name="timetable_id" className="form-select" required>
                      <option value="">Choose class to cancel</option>
                      {timetable.map(tt => (
                        <option key={tt.id} value={tt.id}>
                          {tt.type === 'lab' ? '🔬' : '🎓'} {tt.subject_name} - {days[tt.day_of_week]} ({tt.start_time}-{tt.end_time})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input type="date" name="date" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <input type="text" name="reason" className="form-control" placeholder="Faculty unavailable, holiday, etc." required />
                  </div>
                  <button type="submit" className="btn btn-danger">❌ Cancel Lecture</button>
                </form>
                )}
              </ExpandableSection>
            </div>
            
            <ExpandableSection title="🌟 Add Extra Lecture">
              {(closeForm) => (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  try {
                    await lectureManagementAPI.addExtra({
                      subject_id: formData.get('subject_id'),
                      date: formData.get('date'),
                      start_time: formData.get('start_time'),
                      end_time: formData.get('end_time'),
                      venue: formData.get('venue'),
                      reason: formData.get('reason')
                    });
                    e.target.reset();
                    loadExtraLectures();
                    closeForm();
                  } catch (error) {
                    alert('Error adding extra lecture');
                  }
                }}>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <select name="subject_id" className="form-select" required>
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
                    <input type="date" name="date" className="form-control" required />
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label">Start Time</label>
                      <input type="time" name="start_time" className="form-control" required />
                    </div>
                    <div className="col-6">
                      <label className="form-label">End Time</label>
                      <input type="time" name="end_time" className="form-control" required />
                    </div>
                  </div>
                  <div className="mb-3 mt-3">
                    <label className="form-label">Venue</label>
                    <input type="text" name="venue" className="form-control" placeholder="Room/Hall" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <input type="text" name="reason" className="form-control" placeholder="Makeup class, extra session, etc." required />
                  </div>
                  <button type="submit" className="btn btn-success">🌟 Add Extra Lecture</button>
                </form>
              )}
            </ExpandableSection>
          </div>
          
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5>❌ Cancelled Lectures</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {cancelledLectures.length === 0 ? (
                  <p className="text-muted">No cancelled lectures</p>
                ) : (
                  cancelledLectures.map(cl => (
                    <div key={cl.id} className="border rounded p-2 mb-2">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{cl.type === 'lab' ? '🔬' : '🎓'} {cl.subject_name}</strong><br/>
                          <small>{new Date(cl.date).toLocaleDateString()} - {cl.start_time} to {cl.end_time}</small><br/>
                          <small className="text-muted">Reason: {cl.reason}</small>
                        </div>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            if (confirm('Remove cancellation?')) {
                              await lectureManagementAPI.deleteCancelled(cl.id);
                              loadCancelledLectures();
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h5>🌟 Extra Lectures</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {extraLectures.length === 0 ? (
                  <p className="text-muted">No extra lectures scheduled</p>
                ) : (
                  extraLectures.map(el => (
                    <div key={el.id} className="border rounded p-2 mb-2">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{el.type === 'lab' ? '🔬' : '🎓'} {el.subject_name}</strong><br/>
                          <small>{new Date(el.date).toLocaleDateString()} - {el.start_time} to {el.end_time}</small><br/>
                          <small className="text-muted">Venue: {el.venue} | Reason: {el.reason}</small>
                        </div>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            if (confirm('Delete extra lecture?')) {
                              await lectureManagementAPI.deleteExtra(el.id);
                              loadExtraLectures();
                            }
                          }}
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
      )}

      {/* Exam Timetable View */}
      {activeView === 'exams' && (
        <div>
          <div className="row">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <h5>🎓 Exam Schedule</h5>
                </div>
                <div className="card-body">
                  {exams.length === 0 ? (
                    <p className="text-muted">No exams scheduled yet</p>
                  ) : (
                    <div className="table-responsive" style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ minWidth: '600px' }}>
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exams.map(exam => (
                            <tr key={exam.id}>
                              <td>{exam.type === 'lab' ? '🔬' : '🎓'} {exam.subject_name}</td>
                              <td>
                                <span className="badge bg-info">
                                  {exam.exam_type === 'mid_sem' ? '📚 Mid Sem' : 
                                   exam.exam_type === 'end_sem' ? '📖 End Sem' : '🔬 Practical'}
                                </span>
                              </td>
                              <td>{new Date(exam.exam_date).toLocaleDateString()}</td>
                              <td>{exam.start_time} - {exam.end_time}</td>
                              <td>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => deleteExam(exam.id)}
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
          <div className="row justify-content-center">
            <div className="col-md-6">
              <ExpandableSection title="➕ Add Exam">
                {(closeForm) => (
                  <form onSubmit={(e) => {
                    handleExamSubmit(e);
                    closeForm();
                  }}>
                    <div className="mb-3">
                      <label className="form-label">Subject</label>
                      <select
                        className="form-select"
                        value={examFormData.subject_id}
                        onChange={(e) => setExamFormData({...examFormData, subject_id: e.target.value})}
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
                      <label className="form-label">Exam Type</label>
                      <select
                        className="form-select"
                        value={examFormData.exam_type}
                        onChange={(e) => setExamFormData({...examFormData, exam_type: e.target.value})}
                      >
                        <option value="mid_sem">📚 Mid Semester</option>
                        <option value="end_sem">📖 End Semester</option>
                        <option value="practical">🔬 Practical</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Exam Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={examFormData.exam_date}
                        onChange={(e) => setExamFormData({...examFormData, exam_date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={examFormData.start_time}
                        onChange={(e) => setExamFormData({...examFormData, start_time: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={examFormData.end_time}
                        onChange={(e) => setExamFormData({...examFormData, end_time: e.target.value})}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary">
                      ✨ Add Exam
                    </button>
                  </form>
                )}
              </ExpandableSection>
            </div>
          </div>
        </div>
      )}

      {/* Class Timetable View */}
      {activeView === 'timetable' && (
        <div>
          <div className="row">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <h5>📅 Weekly Timetable</h5>
                </div>
                <div className="card-body" style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: '600px' }}>
                  {days.map((day, dayIndex) => {
                    const isNonWorkingDay = nonWorkingDays.some(nwd => nwd.day_of_week === dayIndex);
                    return (
                      <div key={dayIndex} className="mb-4">
                        <h6 className="text-primary">
                          {isNonWorkingDay ? '🚫' : '📅'} {day}
                          {isNonWorkingDay && <span className="badge bg-secondary ms-2">Non-Working Day</span>}
                        </h6>
                        {isNonWorkingDay ? (
                          <p className="text-muted text-center py-3">🚫 This is a non-working day. No classes scheduled.</p>
                        ) : (
                          renderDayClasses(dayIndex)
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-6">
              <ExpandableSection title="➕ Add Class to Timetable">
                {(closeForm) => (
                  <form onSubmit={(e) => {
                    handleSubmit(e);
                    closeForm();
                  }}>
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
                        {subject.type === 'lab' ? '🔬' : '🎓'} {subject.name} ({subject.type === 'lab' ? 'Lab' : 'Theory'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Day</label>
                  <select
                    className="form-select"
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({...formData, day_of_week: parseInt(e.target.value)})}
                  >
                    {days.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Time Slot</label>
                  <select
                    className="form-select"
                    value={formData.time_slot}
                    onChange={(e) => setFormData({...formData, time_slot: e.target.value})}
                    required
                  >
                    <option value="">Select Time Slot</option>
                    {formData.subject_id && (() => {
                      const subject = subjects.find(s => s.id === parseInt(formData.subject_id));
                      const slots = subject?.type === 'lab' ? timeSlots.lab : timeSlots.theory;
                      return slots.map(slot => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ));
                    })()}
                  </select>
                  {!formData.subject_id && (
                    <small className="text-muted">Please select a subject first</small>
                  )}
                </div>
                <button type="submit" className="btn btn-primary">
                  ✨ Add Class
                </button>
              </form>
                )}
              </ExpandableSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimetableManager;