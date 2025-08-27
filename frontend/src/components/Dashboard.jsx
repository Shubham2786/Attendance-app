import { useState, useEffect } from 'react';
import { timetableAPI, attendanceAPI } from '../services/api';

function Dashboard() {
  const [todayClasses, setTodayClasses] = useState([]);
  const [stats, setStats] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState(new Set());

  useEffect(() => {
    loadTodayClasses();
    loadStats();
  }, []);

  const loadTodayClasses = async () => {
    try {
      const response = await timetableAPI.getToday();
      setTodayClasses(response.data);
      
      // Check which subjects already have attendance marked today
      const today = new Date().toISOString().split('T')[0];
      const attendanceResponse = await attendanceAPI.getAll();
      const todayAttendance = attendanceResponse.data.filter(att => att.date === today);
      const markedSubjects = new Set(todayAttendance.map(att => att.subject_id));
      setMarkedAttendance(markedSubjects);
    } catch (error) {
      console.error('Error loading today classes:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await attendanceAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const markAttendance = async (subjectId, status) => {
    try {
      await attendanceAPI.mark({
        subject_id: subjectId,
        date: new Date().toISOString().split('T')[0],
        status
      });
      setMarkedAttendance(prev => new Set([...prev, subjectId]));
      loadStats();
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const getProgressBarClass = (percentage) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div>
      <div className="dashboard-header">
        <h2>📚 Welcome to ClassConnect</h2>
        <p className="mb-0">Track your attendance and stay on top of your academic goals</p>
      </div>
      
      <div className="row">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h5>🕐 Today's Classes</h5>
            </div>
            <div className="card-body">
              {todayClasses.length === 0 ? (
                <div className="text-center py-5">
                  <h3>🎉</h3>
                  <p className="text-muted">No classes today! Enjoy your free time.</p>
                </div>
              ) : (
                todayClasses
                  .filter(cls => !markedAttendance.has(cls.subject_id))
                  .map(cls => (
                    <div key={`${cls.id}-${cls.class_type || 'regular'}`} className="class-card p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            {cls.class_type === 'extra' ? '🌟' : cls.type === 'lab' ? '🔬' : '📖'} 
                            {cls.subject_name}
                            {cls.class_type === 'extra' && <span className="badge bg-success ms-2">Extra</span>}
                          </h6>
                          <span className="badge bg-secondary me-2">{cls.type === 'lab' ? 'Lab' : 'Theory'}</span>
                          <small className="text-muted">
                            ⏰ {cls.start_time} - {cls.end_time}
                            {cls.class_type === 'extra' && cls.venue && (
                              <><br/>📍 {cls.venue}</>
                            )}
                          </small>
                        </div>
                        <div>
                          <button 
                            className="btn btn-success btn-sm me-2"
                            onClick={() => markAttendance(cls.subject_id, 'present')}
                          >
                            ✅ Present
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => markAttendance(cls.subject_id, 'absent')}
                          >
                            ❌ Absent
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
              {todayClasses.length > 0 && todayClasses.every(cls => markedAttendance.has(cls.subject_id)) && (
                <div className="text-center py-4">
                  <h4>✅</h4>
                  <p className="text-muted">All attendance marked for today!</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h5>📊 Attendance Overview</h5>
            </div>
            <div className="card-body">
              {stats.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No attendance data yet. Start marking attendance!</p>
                </div>
              ) : (
                stats.map(stat => (
                  <div key={stat.id} className="stat-card">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">📚 {stat.name}</span>
                      <span className={`badge ${stat.percentage >= 75 ? 'bg-success' : stat.percentage >= 70 ? 'bg-warning' : 'bg-danger'}`}>
                        {stat.percentage}%
                      </span>
                    </div>
                    <div className="progress mb-2">
                      <div 
                        className={`progress-bar ${getProgressBarClass(stat.percentage)}`}
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      📈 {stat.present_count}/{stat.total_classes} classes attended
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;