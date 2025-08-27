import { useState, useEffect } from 'react';
import { attendanceAPI, subjectsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';


function AttendanceReport() {
  const [stats, setStats] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    loadStats();
    loadSubjects();
  }, []);

  const loadStats = async () => {
    try {
      const response = await attendanceAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const calculateBunkInfo = (stat) => {
    const { present_count, total_classes } = stat;
    const currentPercentage = (present_count / total_classes) * 100;
    
    if (currentPercentage >= 75) {
      // Safe to bunk calculation
      const maxBunks = Math.floor((present_count - 0.75 * total_classes) / 0.75);
      return {
        status: 'safe',
        message: `Safe to bunk ${maxBunks} more classes`,
        color: 'success'
      };
    } else if (currentPercentage >= 70) {
      return {
        status: 'warning',
        message: 'Attendance below 75% - be careful!',
        color: 'warning'
      };
    } else {
      // Recovery calculation
      const requiredClasses = Math.ceil((0.75 * total_classes - present_count) / 0.25);
      return {
        status: 'danger',
        message: `Need to attend ${requiredClasses} more classes to reach 75%`,
        color: 'danger'
      };
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Attendance Report', 20, 20);
    
    let yPosition = 40;
    stats.forEach(stat => {
      doc.setFontSize(12);
      doc.text(`${stat.name} (${stat.code})`, 20, yPosition);
      doc.text(`Attendance: ${stat.percentage}%`, 20, yPosition + 10);
      doc.text(`Classes: ${stat.present_count}/${stat.total_classes}`, 20, yPosition + 20);
      yPosition += 40;
    });
    
    doc.save('attendance-report.pdf');
  };

  return (
    <div>
      <div className="dashboard-header text-center mb-4">
        <h3>📈 Attendance Reports & Analytics</h3>
        <p className="mb-3">Track your progress and download detailed reports</p>
        <button className="btn btn-light btn-lg" onClick={generatePDF}>
          📄 Download PDF Report
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>📊 Attendance Visualization</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#0d6efd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {stats.map(stat => {
          const bunkInfo = calculateBunkInfo(stat);
          return (
            <div key={stat.id} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-header d-flex justify-content-between">
                  <h6>📖 {stat.name}</h6>
                  <span className={`badge bg-${bunkInfo.color} fs-6`}>
                    {stat.percentage}%
                  </span>
                </div>
                <div className="card-body">
                  <div className="progress mb-3" style={{height: '15px'}}>
                    <div 
                      className={`progress-bar bg-${bunkInfo.color}`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <p className="mb-2">
                    <strong>📈 Classes:</strong> {stat.present_count}/{stat.total_classes}
                  </p>
                  <div className={`alert alert-${bunkInfo.color} py-2 mb-0`}>
                    {bunkInfo.status === 'safe' && '✅ '}
                    {bunkInfo.status === 'warning' && '⚠️ '}
                    {bunkInfo.status === 'danger' && '⚠️ '}
                    {bunkInfo.message}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default AttendanceReport;