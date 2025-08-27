import { useState, useEffect } from 'react';
import { subjectsAPI } from '../services/api';
import ExpandableSection from './ExpandableSection';
import GradeCalculator from './GradeCalculator';

function MarksManager() {
  const [subjects, setSubjects] = useState([]);
  const [semesterMarks, setSemesterMarks] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [activeTab, setActiveTab] = useState('marks');
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    exam_type: '',
    marks_obtained: '',
    total_marks: '',
    remarks: ''
  });

  const gradeSystem = [
    { grade: 'O', min: 90, points: 10 },
    { grade: 'A+', min: 80, points: 9 },
    { grade: 'A', min: 70, points: 8 },
    { grade: 'B+', min: 60, points: 7 },
    { grade: 'B', min: 51, points: 6 },
    { grade: 'C', min: 46, points: 5 },
    { grade: 'P', min: 40, points: 4 },
    { grade: 'F', min: 0, points: 0 }
  ];

  useEffect(() => {
    loadSubjects();
    loadCurrentSemester();
  }, []);

  useEffect(() => {
    loadSemesterMarks();
  }, [currentSemester]);

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadSemesterMarks = () => {
    const saved = localStorage.getItem(`semester_${currentSemester}_marks`);
    if (saved) {
      setSemesterMarks(JSON.parse(saved));
    } else {
      setSemesterMarks([]);
    }
  };

  const loadCurrentSemester = () => {
    const saved = localStorage.getItem('currentSemester');
    if (saved) {
      const semNum = parseInt(saved.replace('Sem ', ''));
      setCurrentSemester(semNum);
    }
  };

  const getMaxMarks = (subject) => {
    if (subject.type === 'lab') {
      return subject.credits === 1 
        ? { ca: 20, final_practical: 30, total: 50 }
        : { ca: 35, final_practical: 65, total: 100 };
    } else {
      return subject.credits === 2
        ? { ia: 15, mid_sem: 20, end_sem: 40, total: 75 }
        : { ia: 30, mid_sem: 20, end_sem: 50, total: 100 };
    }
  };

  const getExamMaxMarks = (subject, examType) => {
    const maxMarks = getMaxMarks(subject);
    return maxMarks[examType.toLowerCase().replace(' ', '_')] || 0;
  };

  const calculateGrade = (percentage) => {
    for (const grade of gradeSystem) {
      if (percentage >= grade.min) {
        return { grade: grade.grade, points: grade.points };
    }
    }
    return { grade: 'F', points: 0 };
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const validateMarks = (subject, internal, external) => {
    const maxMarks = getMaxMarks(subject);
    
    if (internal < 0 || internal > maxMarks.internal) {
      return `Internal marks must be between 0 and ${maxMarks.internal}`;
    }
    
    if (external < 0 || external > maxMarks.external) {
      return `External marks must be between 0 and ${maxMarks.external}`;
    }
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const subject = subjects.find(s => s.id === parseInt(formData.subject_id));
    if (!subject) {
      showNotification('Subject not found', 'error');
      return;
    }

    const marksObtained = parseFloat(formData.marks_obtained);
    const totalMarks = parseFloat(formData.total_marks);
    
    if (marksObtained < 0 || marksObtained > totalMarks) {
      showNotification(`Marks obtained must be between 0 and ${totalMarks}`, 'error');
      return;
    }

    const percentage = (marksObtained / totalMarks) * 100;
    const gradeInfo = calculateGrade(percentage);

    const newMark = {
      id: Date.now(),
      subject_id: subject.id,
      subject_name: subject.name,
      subject_type: subject.type,
      credits: subject.credits,
      exam_type: formData.exam_type,
      marks_obtained: marksObtained,
      total_marks: totalMarks,
      max_marks: totalMarks,
      percentage: percentage.toFixed(2),
      grade: gradeInfo.grade,
      grade_points: gradeInfo.points,
      remarks: formData.remarks || '',
      semester: currentSemester,
      date_added: new Date().toISOString()
    };

    // Add to existing marks (allow multiple entries per subject for different exam types)
    const updatedMarks = [...semesterMarks, newMark];
    setSemesterMarks(updatedMarks);
    try {
      localStorage.setItem(`semester_${currentSemester}_marks`, JSON.stringify(updatedMarks));
    } catch (error) {
      console.error('Error saving marks to localStorage:', error);
      showNotification('Warning: Marks saved but may not persist due to storage limitations', 'error');
    }
    
    // Trigger custom event to update Grade Calculator
    window.dispatchEvent(new Event('marksUpdated'));
    
    showNotification(`${formData.exam_type} marks added successfully`, 'success');
    
    // Reset form and close
    setFormData({ subject_id: '', exam_type: '', marks_obtained: '', total_marks: '', remarks: '' });
    // Form will auto-close via closeForm callback
  };

  const deleteMarks = (markId) => {
    const updatedMarks = semesterMarks.filter(m => m.id !== markId);
    setSemesterMarks(updatedMarks);
    try {
      localStorage.setItem(`semester_${currentSemester}_marks`, JSON.stringify(updatedMarks));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      showNotification('Warning: Changes may not persist due to storage limitations', 'error');
      return;
    }
    
    // Trigger custom event to update Grade Calculator
    window.dispatchEvent(new Event('marksUpdated'));
    
    showNotification('Marks deleted successfully', 'success');
  };

  const calculateSGPA = () => {
    if (semesterMarks.length === 0) return 0;
    
    const totalGradePoints = semesterMarks.reduce((sum, mark) => sum + (mark.grade_points * mark.credits), 0);
    const totalCredits = semesterMarks.reduce((sum, mark) => sum + mark.credits, 0);
    
    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
  };

  const calculateCGPA = () => {
    // Get past SGPA data
    const pastSGPAData = JSON.parse(localStorage.getItem('pastSGPA') || '[]');
    const currentSGPA = parseFloat(calculateSGPA());
    
    // Calculate CGPA as average of all SGPAs
    const allSGPAs = [...pastSGPAData.map(s => s.sgpa)];
    if (currentSGPA > 0) {
      allSGPAs.push(currentSGPA);
    }
    
    return allSGPAs.length > 0 ? (allSGPAs.reduce((sum, s) => sum + s, 0) / allSGPAs.length).toFixed(2) : '0.00';
  };

  const getGradeColor = (grade) => {
    const colors = {
      'O': 'bg-success', 'A+': 'bg-primary', 'A': 'bg-info',
      'B+': 'bg-warning', 'B': 'bg-secondary', 'C': 'bg-dark',
      'P': 'bg-light text-dark', 'F': 'bg-danger'
    };
    return colors[grade] || 'bg-secondary';
  };

  const subMenuItems = [
    { id: 'marks', label: '📊 Marks Overview' },
    { id: 'calculator', label: '🧮 Grade Calculator' }
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

      {/* Sub-Menu Navigation */}
      <div className="d-flex align-items-center mb-4">
        {/* Mobile Hamburger */}
        <button 
          className="btn btn-outline-primary d-lg-none"
          onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
        >
          ☰ Marks
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

      {/* Marks Overview Tab */}
      {activeTab === 'marks' && (
        <>
          {/* Marks Overview Panel */}
          <div className="row">
            <div className="col-12">
              <div className="card marks-card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📊 Marks Overview</h5>
                    <div className="d-flex gap-3">
                      <div className="text-center">
                        <small className="text-muted">Current SGPA</small>
                        <div className="h6 text-primary mb-0">{calculateSGPA()}</div>
                      </div>
                      <div className="text-center">
                        <small className="text-muted">Overall CGPA</small>
                        <div className="h6 text-success mb-0">{calculateCGPA()}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {semesterMarks.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No marks added yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Exam Type</th>
                            <th>Marks</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                            <th>Credits</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semesterMarks.map(mark => (
                            <tr key={mark.id}>
                              <td>
                                {mark.subject_type === 'lab' ? '🔬' : '🎓'} {mark.subject_name}
                              </td>
                              <td>
                                <span className="badge bg-info">{mark.exam_type}</span>
                              </td>
                              <td><strong>{mark.marks_obtained}/{mark.total_marks}</strong></td>
                              <td>{mark.percentage}%</td>
                              <td>
                                <span className={`badge grade-badge ${getGradeColor(mark.grade)}`}>
                                  {mark.grade} ({mark.grade_points})
                                </span>
                              </td>
                              <td>{mark.credits}</td>
                              <td>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => deleteMarks(mark.id)}
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

          {/* Expandable Add Marks Section */}
          <div className="row mt-3">
            <div className="col-12">
              <ExpandableSection 
                title="➕ Add Subject Marks"
                onToggle={(isOpen) => showNotification(`Add Marks form ${isOpen ? 'opened' : 'closed'}`)}
              >
                {(closeForm) => (
                  <form onSubmit={(e) => {
                    handleSubmit(e);
                    closeForm();
                  }}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Subject</label>
                          <select
                            className="form-select"
                            value={formData.subject_id}
                            onChange={(e) => {
                              setFormData({...formData, subject_id: e.target.value, exam_type: '', total_marks: ''});
                            }}
                            required
                          >
                            <option value="">Select Subject</option>
                            {subjects.map(subject => (
                              <option key={subject.id} value={subject.id}>
                                {subject.type === 'lab' ? '🔬' : '🎓'} {subject.name} ({subject.credits} credits)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Exam Type</label>
                          <select
                            className="form-select"
                            value={formData.exam_type}
                            onChange={(e) => {
                              const examType = e.target.value;
                              const subject = subjects.find(s => s.id === parseInt(formData.subject_id));
                              const maxMarks = subject ? getExamMaxMarks(subject, examType) : '';
                              setFormData({...formData, exam_type: examType, total_marks: maxMarks});
                            }}
                            required
                          >
                            <option value="">Select Exam Type</option>
                            {formData.subject_id && (() => {
                              const subject = subjects.find(s => s.id === parseInt(formData.subject_id));
                              if (subject?.type === 'lab') {
                                return [
                                  <option key="ca" value="CA">🧪 Continuous Assessment (CA)</option>,
                                  <option key="fp" value="Final Practical">🔬 Final Practical</option>
                                ];
                              } else {
                                return [
                                  <option key="ia" value="IA">📝 Internal Assessment (IA)</option>,
                                  <option key="mid" value="Mid Sem">📋 Mid Semester</option>,
                                  <option key="end" value="End Sem">📊 End Semester</option>
                                ];
                              }
                            })()}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Marks Obtained</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.marks_obtained}
                            onChange={(e) => setFormData({...formData, marks_obtained: e.target.value})}
                            step="0.5"
                            min="0"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Total Marks</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.total_marks}
                            onChange={(e) => setFormData({...formData, total_marks: e.target.value})}
                            min="1"
                            readOnly={formData.exam_type !== ''}
                            required
                          />
                          {formData.exam_type && (
                            <small className="text-muted">Auto-filled based on exam type</small>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Remarks (Optional)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.remarks}
                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                            placeholder="Any additional comments..."
                          />
                        </div>
                      </div>
                      <div className="col-md-3 d-flex align-items-end">
                        <div className="d-flex gap-2 w-100">
                          <button type="submit" className="btn btn-success flex-fill">
                            ✨ Save Marks
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-danger"
                            onClick={closeForm}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </ExpandableSection>
            </div>
          </div>
        </>
      )}

      {/* Grade Calculator Tab */}
      {activeTab === 'calculator' && <GradeCalculator key={semesterMarks.length} />}
    </div>
  );
}

export default MarksManager;