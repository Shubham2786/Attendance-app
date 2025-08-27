import { useState, useEffect } from 'react';
import { attendanceAPI, holidaysAPI, examTimetableAPI, timetableAPI, pastAttendanceAPI } from '../services/api';

function AttendanceCalendar({ refreshTrigger }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [exams, setExams] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [pastAttendance, setPastAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetails, setDateDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    // Initial load
    loadData();
    
    // Reload data when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };
    
    // Also reload when window gains focus
    const handleFocus = () => {
      loadData();
    };
    
    // Reload when component mounts or tab changes
    const handleTabChange = () => {
      setTimeout(() => loadData(), 100);
    };
    
    // Listen for holiday updates from other components
    const handleHolidayUpdate = () => {
      console.log('Holiday updated, refreshing calendar...');
      loadData();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('hashchange', handleTabChange);
    window.addEventListener('holidayUpdated', handleHolidayUpdate);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('hashchange', handleTabChange);
      window.removeEventListener('holidayUpdated', handleHolidayUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading calendar data...');
      const [attendanceRes, holidaysRes, examsRes, timetableRes, pastRes] = await Promise.all([
        attendanceAPI.getAll(),
        holidaysAPI.getAll(),
        examTimetableAPI.getAll(),
        timetableAPI.getAll(),
        pastAttendanceAPI.getAll()
      ]);
      
      // Handle different response structures
      const attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : (Array.isArray(attendanceRes) ? attendanceRes : []);
      const holidaysData = Array.isArray(holidaysRes.data) ? holidaysRes.data : (Array.isArray(holidaysRes) ? holidaysRes : []);
      const examsData = Array.isArray(examsRes.data) ? examsRes.data : (Array.isArray(examsRes) ? examsRes : []);
      const timetableData = Array.isArray(timetableRes.data) ? timetableRes.data : (Array.isArray(timetableRes) ? timetableRes : []);
      const pastData = Array.isArray(pastRes.data) ? pastRes.data : (Array.isArray(pastRes) ? pastRes : []);
      
      setAttendance(attendanceData);
      setHolidays(holidaysData);
      setExams(examsData);
      setTimetable(timetableData);
      setPastAttendance(pastData);
      
      console.log('Calendar data loaded:', {
        attendance: attendanceData.length,
        holidays: holidaysData.length,
        exams: examsData.length,
        timetable: timetableData.length,
        pastAttendance: pastData.length
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      // Set empty arrays on error
      setAttendance([]);
      setHolidays([]);
      setExams([]);
      setTimetable([]);
      setPastAttendance([]);
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getDateInfo = (date) => {
    if (!date) return { type: 'empty' };
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if it's an exam day
    const examOnDate = exams.find(exam => exam.exam_date === dateStr);
    if (examOnDate) {
      return { type: 'exam', data: examOnDate };
    }
    
    // Check if it's a holiday
    const holidayOnDate = holidays.find(holiday => {
      const startDate = holiday.start_date;
      const endDate = holiday.end_date || holiday.start_date;
      return dateStr >= startDate && dateStr <= endDate;
    });
    if (holidayOnDate) {
      return { type: 'holiday', data: holidayOnDate };
    }
    
    // Check for past attendance first (priority)
    const pastAttendanceOnDate = pastAttendance.filter(att => att.date === dateStr);
    if (pastAttendanceOnDate.length > 0) {
      const absentPast = pastAttendanceOnDate.filter(att => att.status === 'absent');
      return { 
        type: absentPast.length > 0 ? 'past_absent' : 'past_present', 
        data: pastAttendanceOnDate 
      };
    }
    
    // Check regular attendance for this date
    const attendanceOnDate = attendance.filter(att => att.date === dateStr);
    const absentClasses = attendanceOnDate.filter(att => att.status === 'absent');
    
    if (absentClasses.length > 0) {
      return { type: 'absent', data: absentClasses };
    }
    
    if (attendanceOnDate.length > 0) {
      return { type: 'present', data: attendanceOnDate };
    }
    
    // Check if there are scheduled classes on this day
    const dayOfWeek = date.getDay();
    const scheduledClasses = timetable.filter(tt => tt.day_of_week === dayOfWeek);
    
    if (scheduledClasses.length > 0) {
      return { type: 'scheduled', data: scheduledClasses };
    }
    
    return { type: 'normal' };
  };

  const getDateClass = (dateInfo) => {
    switch (dateInfo.type) {
      case 'exam': return 'bg-danger text-white';
      case 'holiday': return 'bg-warning text-dark';
      case 'past_absent': return 'bg-primary text-white';
      case 'past_present': return 'bg-info text-white';
      case 'absent': return 'bg-danger text-white';
      case 'present': return 'bg-success text-white';
      case 'scheduled': return 'bg-light';
      default: return '';
    }
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const info = getDateInfo(date);
    setDateDetails(info);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div>
      {/* Academic Calendar Card */}
      <div className="academic-calendar-card card mb-3">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="mb-1">📅 Academic Calendar</h6>
              <p className="text-muted mb-0">View attendance patterns and important dates</p>
              <small className="text-info">📊 Holidays: {holidays.length} | 📚 Exams: {exams.length}</small>
            </div>
            <div className="col-md-4 text-end">
              <button 
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() => loadData()}
                title="Refresh calendar data"
              >
                🔄 Refresh
              </button>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => window.open('/assets/documents/academic-calendar.pdf', '_blank')}
              >
                📝 View PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <button className="btn btn-outline-primary btn-sm" onClick={() => navigateMonth(-1)}>
                  ← Prev
                </button>
                <h5 className="mb-0 mx-2">
                  📅 {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h5>
                <button className="btn btn-outline-primary btn-sm" onClick={() => navigateMonth(1)}>
                  Next →
                </button>
              </div>
            </div>
          <div className="card-body">
            {loading ? (
              <div className="calendar-loading">
                <span>Loading calendar data...</span>
              </div>
            ) : (
            <div className="calendar-container" style={{ overflowX: 'auto' }}>
              <div className="calendar-grid" style={{ minWidth: '500px' }}>
                <div className="d-flex text-center fw-bold mb-2">
                  <div className="flex-fill p-1">Sun</div>
                  <div className="flex-fill p-1">Mon</div>
                  <div className="flex-fill p-1">Tue</div>
                  <div className="flex-fill p-1">Wed</div>
                  <div className="flex-fill p-1">Thu</div>
                  <div className="flex-fill p-1">Fri</div>
                  <div className="flex-fill p-1">Sat</div>
                </div>
                
                {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                  <div key={weekIndex} className="d-flex mb-1">
                    {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                      const dateInfo = getDateInfo(date);
                      return (
                        <div key={dayIndex} className="flex-fill p-1">
                          <div
                            className={`calendar-day p-2 text-center rounded cursor-pointer ${getDateClass(dateInfo)} ${
                              selectedDate && date && selectedDate.toDateString() === date.toDateString() ? 'border border-primary' : ''
                            }`}
                            onClick={() => handleDateClick(date)}
                            style={{ minHeight: '40px', cursor: date ? 'pointer' : 'default', fontSize: '0.9rem' }}
                          >
                            {date ? date.getDate() : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            )}
            </div>
            
            {/* Legend */}
            <div className="mt-3">
              <h6>📋 Legend:</h6>
              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{background: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)'}}></span>
                  <span>Exam/Absent</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)'}}></span>
                  <span>Present</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}></span>
                  <span>Past Absent</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'}}></span>
                  <span>Past Present</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{background: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)'}}></span>
                  <span>Holiday</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)'}}></span>
                  <span>Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="date-details-card card">
            <div className="card-header">
              <h5>📋 Date Details</h5>
            </div>
            <div className="card-body">
              {selectedDate ? (
                <div>
                  <h6>{selectedDate.toLocaleDateString()}</h6>
                  {dateDetails && (
                    <div>
                      {dateDetails.type === 'exam' && (
                        <div className="date-details-alert alert alert-danger">
                          <strong>🎓 Exam Day</strong><br/>
                          <small>
                            Subject: {dateDetails.data.subject_name}<br/>
                            Type: {dateDetails.data.exam_type}<br/>
                            Time: {dateDetails.data.start_time} - {dateDetails.data.end_time}<br/>
                            Venue: {dateDetails.data.venue}
                          </small>
                        </div>
                      )}
                      
                      {dateDetails.type === 'holiday' && (
                        <div className="date-details-alert alert alert-warning">
                          <strong>🏖️ Holiday</strong><br/>
                          <small>
                            {dateDetails.data.name}<br/>
                            Type: {dateDetails.data.type === 'short' ? '📅 Short Holiday' : '🏖️ Long Holiday'}
                          </small>
                        </div>
                      )}
                      
                      {dateDetails.type === 'absent' && (
                        <div className="date-details-alert alert alert-danger">
                          <strong>❌ Missed Classes</strong><br/>
                          <small>
                            {dateDetails.data.map(att => (
                              <div key={att.id}>• {att.subject_name}</div>
                            ))}
                          </small>
                        </div>
                      )}
                      
                      {dateDetails.type === 'past_absent' && (
                        <div className="date-details-alert alert alert-primary">
                          <strong>🔵 Past Attendance - Absent</strong><br/>
                          <small>
                            {dateDetails.data.map(att => (
                              <div key={att.id}>• {att.subject_name}<br/>
                                <em>Reason: {att.reason}</em>
                              </div>
                            ))}
                          </small>
                        </div>
                      )}
                      
                      {dateDetails.type === 'past_present' && (
                        <div className="date-details-alert alert alert-info">
                          <strong>🔵 Past Attendance - Present</strong><br/>
                          <small>
                            {dateDetails.data.map(att => (
                              <div key={att.id}>• {att.subject_name}<br/>
                                <em>Reason: {att.reason}</em>
                              </div>
                            ))}
                          </small>
                        </div>
                      )}
                      
                      {dateDetails.type === 'present' && (
                        <div className="date-details-alert alert alert-success">
                          <strong>✅ Attended Classes</strong><br/>
                          <small>
                            {dateDetails.data.map(att => (
                              <div key={att.id}>• {att.subject_name}</div>
                            ))}
                          </small>
                        </div>
                      )}
                      
                      {dateDetails.type === 'scheduled' && (
                        <div className="date-details-alert alert alert-info">
                          <strong>📚 Scheduled Classes</strong><br/>
                          <small>
                            {dateDetails.data.map(tt => (
                              <div key={tt.id}>• {tt.subject_name} ({tt.start_time} - {tt.end_time})</div>
                            ))}
                          </small>
                        </div>
                      )}
                      
                      {dateDetails.type === 'normal' && (
                        <div className="text-muted">
                          <small>No classes scheduled for this day.</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted"><small>Click on a date to see details</small></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceCalendar;