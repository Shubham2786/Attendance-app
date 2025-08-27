import { useState, useEffect } from 'react';
import { subjectsAPI } from '../services/api';

function GradeCalculator() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marks, setMarks] = useState([]);
  const [calculation, setCalculation] = useState(null);
  const [allSubjectsMarks, setAllSubjectsMarks] = useState([]);
  const [gpaData, setGpaData] = useState(null);
  const [pastSGPAData, setPastSGPAData] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [showSGPAForm, setShowSGPAForm] = useState(false);
  const [sgpaForm, setSgpaForm] = useState({ semester: '', sgpa: '' });
  const [notification, setNotification] = useState(null);

  const gradeSystem = [
    { grade: 'O', min: 90, max: 100, points: 10 },
    { grade: 'A+', min: 80, max: 89, points: 9 },
    { grade: 'A', min: 70, max: 79, points: 8 },
    { grade: 'B+', min: 60, max: 69, points: 7 },
    { grade: 'B', min: 51, max: 59, points: 6 },
    { grade: 'C', min: 46, max: 50, points: 5 },
    { grade: 'P', min: 40, max: 45, points: 4 },
    { grade: 'F', min: 0, max: 39, points: 0 }
  ];

  useEffect(() => {
    loadSubjects();
    loadAllSubjectsMarks();
    loadPastSGPAData();
    loadCurrentSemester();
    
    // Listen for localStorage changes to refresh data
    const handleStorageChange = () => {
      loadAllSubjectsMarks();
      loadPastSGPAData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener('marksUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('marksUpdated', handleStorageChange);
    };
  }, []);

  const loadPastSGPAData = () => {
    const saved = localStorage.getItem('pastSGPA');
    if (saved) {
      setPastSGPAData(JSON.parse(saved));
    }
  };

  const loadCurrentSemester = () => {
    // First try to get from semester settings
    const semesterData = localStorage.getItem('semester');
    if (semesterData) {
      try {
        const parsed = JSON.parse(semesterData);
        if (parsed.current_semester) {
          const semNum = parseInt(parsed.current_semester.replace('Sem ', ''));
          setCurrentSemester(semNum);
          return;
        }
      } catch (e) {
        console.log('Error parsing semester data');
      }
    }
    
    // Fallback to old method
    const saved = localStorage.getItem('currentSemester');
    if (saved) {
      const semNum = parseInt(saved.replace('Sem ', ''));
      setCurrentSemester(semNum);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (selectedSubject) {
      loadMarks();
    }
  }, [selectedSubject, currentSemester]);

  useEffect(() => {
    if (currentSemester > 0) {
      loadAllSubjectsMarks();
    }
  }, [currentSemester]);

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadAllSubjectsMarks = async () => {
    try {
      const subjectsResponse = await subjectsAPI.getAll();
      const subjects = subjectsResponse.data || [];
      
      // Load marks from localStorage
      const semesterMarks = JSON.parse(localStorage.getItem(`semester_${currentSemester}_marks`) || '[]');
      const allMarks = [];
      
      for (const subject of subjects) {
        const subjectMarks = semesterMarks.filter(mark => mark.subject_id === subject.id);
        if (subjectMarks.length > 0) {
          allMarks.push({ subject, marks: subjectMarks });
        }
      }
      
      setAllSubjectsMarks(allMarks);
      calculateGPA(allMarks, pastSGPAData);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadMarks = () => {
    // Load marks from localStorage
    const semesterMarks = JSON.parse(localStorage.getItem(`semester_${currentSemester}_marks`) || '[]');
    const subjectMarks = semesterMarks.filter(mark => mark.subject_id === parseInt(selectedSubject));
    setMarks(subjectMarks);
    calculateGradeRequirement(subjectMarks);
  };

  const calculateIA = (iaMarks, maxIA) => {
    if (iaMarks.length === 0) return { finalScore: 0, breakdown: 'No IA tests conducted' };

    const scores = iaMarks.map(m => ({ obtained: m.marks_obtained, max: m.max_marks }));
    const totalTestMarks = scores.reduce((sum, s) => sum + s.max, 0);
    const studentTotal = scores.reduce((sum, s) => sum + s.obtained, 0);

    // Case 1: Tests add up exactly to maxIA
    if (totalTestMarks === maxIA) {
      return {
        finalScore: studentTotal,
        breakdown: `${scores.length} tests, total ${studentTotal}/${maxIA}`
      };
    }

    // Case 2: Tests add up to more than maxIA (scaling required)
    if (totalTestMarks > maxIA) {
      const scaledScore = Math.round((studentTotal / totalTestMarks) * maxIA * 100) / 100;
      return {
        finalScore: scaledScore,
        breakdown: `${scores.length} tests (${studentTotal}/${totalTestMarks}), scaled to ${scaledScore}/${maxIA}`
      };
    }

    // Case 3: Tests add up to less than maxIA (partial tests)
    const scaledScore = Math.round((studentTotal / totalTestMarks) * maxIA * 100) / 100;
    return {
      finalScore: scaledScore,
      breakdown: `${scores.length} partial tests (${studentTotal}/${totalTestMarks}), scaled to ${scaledScore}/${maxIA}`
    };
  };

  const calculateGradeRequirement = (currentMarks) => {
    if (currentMarks.length === 0) {
      setCalculation(null);
      return;
    }

    const subject = subjects.find(s => s.id === parseInt(selectedSubject));
    if (!subject) return;

    const isLab = subject.type === 'lab';
    const credits = subject.credits;

    // Define total marks based on subject type and credits
    let totalMarks, examStructure;
    
    if (isLab) {
      // Lab subjects: CA + Final Practical
      if (credits === 1) {
        totalMarks = 50; // CA(20) + Final Practical(30)
        examStructure = { CA: 20, 'Final Practical': 30 };
      } else { // 2 credits
        totalMarks = 100; // CA(35) + Final Practical(65)
        examStructure = { CA: 35, 'Final Practical': 65 };
      }
    } else {
      // Theory subjects: IA + Mid Sem + End Sem
      if (credits === 2) {
        totalMarks = 75; // IA(15) + Mid(20) + End(40)
        examStructure = { IA: 15, 'Mid Sem': 20, 'End Sem': 40 };
      } else { // 3+ credits
        totalMarks = 100; // IA(30) + Mid(20) + End(50)
        examStructure = { IA: 30, 'Mid Sem': 20, 'End Sem': 50 };
      }
    }

    // Calculate current marks obtained (excluding final exam)
    let scoredSoFar = 0;
    let hasFinalExam = false;
    let iaBreakdown = '';
    const finalExamType = isLab ? 'Final Practical' : 'End Sem';

    // Process each exam type
    Object.keys(examStructure).forEach(examType => {
      const examMarks = currentMarks.filter(m => m.exam_type === examType);
      
      if (examType === finalExamType) {
        // Check if final exam is already given
        if (examMarks.length > 0) {
          hasFinalExam = true;
          scoredSoFar += examMarks[0].marks_obtained;
        }
      } else if (examType === 'IA' || examType === 'CA') {
        // For IA/CA, just take the marks as entered (no complex calculation needed)
        if (examMarks.length > 0) {
          scoredSoFar += examMarks[0].marks_obtained;
          iaBreakdown = `${examType}: ${examMarks[0].marks_obtained}/${examStructure[examType]}`;
        }
      } else {
        // For Mid Sem, take the marks as is
        if (examMarks.length > 0) {
          scoredSoFar += examMarks[0].marks_obtained;
        }
      }
    });

    // Calculate requirements for each grade (only if final exam not given)
    const requirements = gradeSystem.map(grade => {
      const requiredTotal = (grade.min / 100) * totalMarks;
      const marksNeeded = requiredTotal - scoredSoFar;
      
      let status, minFinalExamRequired;
      
      if (hasFinalExam) {
        // Final exam already given, check if grade achieved
        const currentPercentage = (scoredSoFar / totalMarks) * 100;
        status = currentPercentage >= grade.min ? 'achieved' : 'not_achieved';
        minFinalExamRequired = 'N/A';
      } else {
        // Final exam not given, calculate required marks
        if (marksNeeded > 50) {
          status = 'not_possible';
          minFinalExamRequired = 'Not Possible';
        } else {
          status = 'possible';
          minFinalExamRequired = Math.max(0, Math.ceil(marksNeeded));
        }
      }

      return {
        ...grade,
        requiredTotal: Math.ceil(requiredTotal),
        minFinalExamRequired,
        status
      };
    });

    setCalculation({
      scoredSoFar,
      totalMarks,
      currentPercentage: ((scoredSoFar / totalMarks) * 100).toFixed(1),
      hasFinalExam,
      finalExamType,
      examStructure,
      isLab,
      iaBreakdown,
      requirements
    });
  };

  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return { grade: 'O', points: 10 };
    if (percentage >= 80) return { grade: 'A+', points: 9 };
    if (percentage >= 70) return { grade: 'A', points: 8 };
    if (percentage >= 60) return { grade: 'B+', points: 7 };
    if (percentage >= 51) return { grade: 'B', points: 6 };
    if (percentage >= 46) return { grade: 'C', points: 5 };
    if (percentage >= 40) return { grade: 'P', points: 4 };
    return { grade: 'F', points: 0 };
  };

  const calculateSubjectGrade = (subject, marks) => {
    const isLab = subject.type === 'lab';
    const credits = subject.credits;
    
    let totalMarks, examStructure;
    if (isLab) {
      totalMarks = credits === 1 ? 50 : 100;
      examStructure = credits === 1 ? { CA: 20, 'Final Practical': 30 } : { CA: 35, 'Final Practical': 65 };
    } else {
      totalMarks = credits === 2 ? 75 : 100;
      examStructure = credits === 2 ? { IA: 15, 'Mid Sem': 20, 'End Sem': 40 } : { IA: 30, 'Mid Sem': 20, 'End Sem': 50 };
    }

    let scoredTotal = 0;
    let hasAllExams = true;

    Object.keys(examStructure).forEach(examType => {
      const examMarks = marks.filter(m => m.exam_type === examType);
      
      if (examMarks.length > 0) {
        scoredTotal += examMarks[0].marks_obtained;
      } else {
        hasAllExams = false;
      }
    });

    if (!hasAllExams) return null;

    const percentage = (scoredTotal / totalMarks) * 100;
    return getGradeFromPercentage(percentage);
  };

  const calculateGPA = (allMarks, pastSGPA = []) => {
    const subjectGrades = [];
    let currentGradePoints = 0;
    let currentCredits = 0;

    allMarks.forEach(({ subject, marks }) => {
      const gradeInfo = calculateSubjectGrade(subject, marks);
      if (gradeInfo) {
        const gradePoints = gradeInfo.points * subject.credits;
        currentGradePoints += gradePoints;
        currentCredits += subject.credits;
        
        subjectGrades.push({
          subject: subject.name,
          credits: subject.credits,
          grade: gradeInfo.grade,
          points: gradeInfo.points,
          gradePoints
        });
      }
    });

    const sgpa = currentCredits > 0 ? (currentGradePoints / currentCredits).toFixed(2) : '0.00';
    
    // Calculate CGPA as average of all SGPAs (including current)
    const allSGPAs = [...pastSGPA.map(s => s.sgpa)];
    if (currentCredits > 0) {
      allSGPAs.push(parseFloat(sgpa));
    }
    
    const cgpa = allSGPAs.length > 0 ? (allSGPAs.reduce((sum, s) => sum + s, 0) / allSGPAs.length).toFixed(2) : '0.00';
    
    setGpaData({
      subjectGrades,
      currentGradePoints,
      currentCredits,
      sgpa,
      cgpa,
      pastSemesters: pastSGPA.length,
      allSGPAs: [...pastSGPA.map(s => ({ semester: s.semester, sgpa: s.sgpa })), ...(currentCredits > 0 ? [{ semester: `Sem ${currentSemester}`, sgpa: parseFloat(sgpa) }] : [])]
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'achieved': return <span className="badge bg-success">✅ Achieved</span>;
      case 'possible': return <span className="badge bg-warning">⚡ Possible</span>;
      case 'not_possible': return <span className="badge bg-danger">❌ Not Possible</span>;
      case 'not_achieved': return <span className="badge bg-secondary">❌ Not Achieved</span>;
      default: return null;
    }
  };

  const addPastSGPA = (e) => {
    e.preventDefault();
    
    const semester = sgpaForm.semester.trim();
    const sgpa = parseFloat(sgpaForm.sgpa);
    
    if (!semester || isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
      showNotification('Please enter valid semester name and SGPA (0-10)', 'error');
      return;
    }
    
    // Extract semester number for validation
    const semesterMatch = semester.match(/\d+/);
    const semesterNum = semesterMatch ? parseInt(semesterMatch[0]) : null;
    
    // Validate semester number against current semester
    if (semesterNum && semesterNum >= currentSemester) {
      showNotification(`Cannot add SGPA for Sem ${semesterNum}. Current semester is ${currentSemester}. Only add past semesters (1-${currentSemester-1}).`, 'error');
      return;
    }
    
    // Check if semester already exists
    if (pastSGPAData.some(s => s.semester === semester)) {
      showNotification('SGPA for this semester already exists', 'error');
      return;
    }
    
    const newSGPA = { semester, sgpa };
    const updatedData = [...pastSGPAData, newSGPA];
    
    setPastSGPAData(updatedData);
    localStorage.setItem('pastSGPA', JSON.stringify(updatedData));
    
    setSgpaForm({ semester: '', sgpa: '' });
    setShowSGPAForm(false);
    showNotification('Past SGPA added successfully');
    
    // Recalculate GPA
    calculateGPA(allSubjectsMarks, updatedData);
  };
  
  const deletePastSGPA = (semester) => {
    const updatedData = pastSGPAData.filter(s => s.semester !== semester);
    setPastSGPAData(updatedData);
    localStorage.setItem('pastSGPA', JSON.stringify(updatedData));
    showNotification('Past SGPA deleted successfully');
    
    // Recalculate GPA
    calculateGPA(allSubjectsMarks, updatedData);
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
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5>🎯 Grade Calculator</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Select Subject</label>
                <select
                  className="form-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">Choose Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.type === 'lab' ? '🔬' : '🎓'} {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {calculation && (
                <div className="alert alert-info">
                  <h6>📊 Current Status</h6>
                  <p className="mb-1"><strong>Scored So Far:</strong> {calculation.scoredSoFar}/{calculation.totalMarks}</p>
                  <p className="mb-1"><strong>Current %:</strong> {calculation.currentPercentage}%</p>
                  {calculation.iaBreakdown && (
                    <p className="mb-1"><strong>IA Calculation:</strong> {calculation.iaBreakdown}</p>
                  )}
                  <small className="text-muted">
                    {calculation.hasFinalExam ? 'Final exam completed' : 'Final exam pending'}
                  </small>
                </div>
              )}

              {calculation && !calculation.hasFinalExam && (
                <div className="alert alert-success">
                  <h6>🏆 Maximum Achievable Grade</h6>
                  {(() => {
                    const possibleGrades = calculation.requirements.filter(r => r.status === 'possible');
                    const highest = possibleGrades.sort((a, b) => b.points - a.points)[0];
                    return highest ? (
                      <div>
                        <p className="mb-1"><strong>Grade {highest.grade}:</strong> Need {highest.minFinalExamRequired}/50 in {calculation.finalExamType === 'final_practical' ? 'Final Practical' : 'End Sem'}</p>
                        <small>Target: {highest.requiredTotal}/{calculation.totalMarks} marks ({highest.min}%)</small>
                      </div>
                    ) : (
                      <p className="mb-0">No grades achievable with current marks</p>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5>📈 Grade Requirements</h5>
            </div>
            <div className="card-body">
              {!selectedSubject ? (
                <p className="text-muted">Select a subject to see grade calculations</p>
              ) : !calculation ? (
                <p className="text-muted">Loading calculations...</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Range %</th>
                        <th>Points</th>
                        <th>Final Exam Required</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.requirements.map(req => (
                        <tr key={req.grade} className={req.status === 'possible' ? 'table-warning' : ''}>
                          <td><strong>{req.grade}</strong></td>
                          <td>{req.min}%</td>
                          <td>{req.points}</td>
                          <td>
                            {calculation.hasFinalExam ? 'Completed' : 
                             req.status === 'possible' ? `${req.minFinalExamRequired}/50` : req.minFinalExamRequired}
                          </td>
                          <td>{getStatusBadge(req.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {calculation && marks.length > 0 && (
                <div className="mt-4">
                  <h6>📋 Current Marks</h6>
                  <div className="row">
                    {marks.map(mark => (
                      <div key={mark.id} className="col-md-6 mb-2">
                        <div className="border rounded p-2">
                          <strong>{mark.exam_type}</strong>
                          <br/>
                          <span className="badge bg-primary">
                            {mark.marks_obtained}/{mark.total_marks} 
                            ({mark.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SGPA/CGPA Card */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🎓 SGPA & CGPA Calculator</h5>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => setShowSGPAForm(!showSGPAForm)}
              >
                ➕ Add Past SGPA
              </button>
            </div>
            <div className="card-body">
              {/* Add Past SGPA Form */}
              {showSGPAForm && (
                <div className="alert alert-light border mb-4">
                  <h6>📝 Add Past Semester SGPA</h6>
                  <form onSubmit={addPastSGPA}>
                    <div className="row">
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control"
                          placeholder={currentSemester > 1 ? `Semester (e.g., Sem 1-${currentSemester-1})` : 'Semester (e.g., Sem 1)'}
                          value={sgpaForm.semester}
                          onChange={(e) => setSgpaForm({...sgpaForm, semester: e.target.value})}
                          required
                        />
                        <small className="text-muted">{currentSemester > 1 ? `Only past semesters (1-${currentSemester-1})` : 'Set current semester in Settings first'}</small>
                      </div>
                      <div className="col-md-4">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="SGPA (0-10)"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sgpaForm.sgpa}
                          onChange={(e) => setSgpaForm({...sgpaForm, sgpa: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-success">✅ Add</button>
                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => setShowSGPAForm(false)}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Past SGPA List */}
              {pastSGPAData.length > 0 && (
                <div className="mb-4">
                  <h6>📊 Past Semester SGPAs</h6>
                  <div className="row">
                    {pastSGPAData.map((sgpaItem, index) => (
                      <div key={index} className="col-md-3 mb-2">
                        <div className="card border-primary">
                          <div className="card-body text-center p-2">
                            <h6 className="card-title mb-1">{sgpaItem.semester}</h6>
                            <h5 className="text-primary mb-1">{sgpaItem.sgpa}</h5>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => deletePastSGPA(sgpaItem.semester)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Semester Calculation */}
              {!gpaData || gpaData.subjectGrades.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">Complete all exams for subjects to calculate current SGPA</p>
                  {pastSGPAData.length > 0 && (
                    <div className="mt-3">
                      <div className="alert alert-info">
                        <h5 className="mb-1">Current CGPA (Past Semesters Only)</h5>
                        <h3 className="text-info">
                          {(pastSGPAData.reduce((sum, s) => sum + s.sgpa, 0) / pastSGPAData.length).toFixed(2)}
                        </h3>
                        <small>Based on {pastSGPAData.length} past semester(s)</small>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="row">
                  <div className="col-md-8">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Credits</th>
                            <th>Grade</th>
                            <th>Points</th>
                            <th>Grade Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gpaData.subjectGrades.map((sg, index) => (
                            <tr key={index}>
                              <td>{sg.subject}</td>
                              <td>{sg.credits}</td>
                              <td><span className="badge bg-primary">{sg.grade}</span></td>
                              <td>{sg.points}</td>
                              <td>{sg.gradePoints}</td>
                            </tr>
                          ))}
                          <tr className="table-info">
                            <td><strong>Total</strong></td>
                            <td><strong>{gpaData.currentCredits}</strong></td>
                            <td>-</td>
                            <td>-</td>
                            <td><strong>{gpaData.currentGradePoints}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="alert alert-success">
                        <h4 className="mb-1">Current SGPA</h4>
                        <h2 className="text-success">{gpaData.sgpa}</h2>
                        <small>Sem {currentSemester} Grade Point Average</small>
                      </div>
                      <div className="alert alert-info">
                        <h4 className="mb-1">Overall CGPA</h4>
                        <h2 className="text-info">{gpaData.cgpa}</h2>
                        <small>Cumulative Grade Point Average</small>
                        <div className="mt-2">
                          <small className="text-muted d-block">
                            Average of {gpaData.allSGPAs.length} semester(s)
                          </small>
                          {gpaData.allSGPAs.length > 1 && (
                            <div className="mt-2">
                              <small className="text-muted">
                                {gpaData.allSGPAs.map(s => `${s.semester}: ${s.sgpa}`).join(' | ')}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradeCalculator;