import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SubjectManager from './components/SubjectManager';
import TimetableManager from './components/TimetableManager';
import TimetableTest from './components/TimetableTest';
import AttendanceReport from './components/AttendanceReport';
import HolidayManager from './components/HolidayManager';
import NonWorkingDays from './components/NonWorkingDays';
import MarksManager from './components/MarksManager';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '🏠' },
    { id: 'subjects', label: '📚 Subjects', icon: '📖' },
    { id: 'timetable', label: '📅 Timetable', icon: '⏰' },
    { id: 'marks', label: '📊 Marks', icon: '📊' },
    { id: 'reports', label: '📈 Reports', icon: '📊' },
    { id: 'holidays', label: '⚙️ Settings', icon: '⚙️' }
  ];

  return (
    <div className="container-fluid p-0">
      <nav className="navbar navbar-expand-lg navbar-dark mb-4">
        <div className="container">
          <button 
            className="navbar-brand btn btn-link text-decoration-none p-0 border-0"
            onClick={() => setActiveTab('dashboard')}
            style={{ color: 'inherit' }}
          >
            🎓 ClassConnect
          </button>
          
          <div className="d-flex align-items-center d-lg-none">
            <button 
              className="btn btn-outline-light me-2"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              className="navbar-toggler"
              type="button"
              onClick={() => setIsNavOpen(!isNavOpen)}
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
          
          <div className="navbar-nav ms-auto d-none d-lg-flex align-items-center">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`nav-link btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <button 
              className="btn btn-outline-light ms-3"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Side Menu */}
      <div className={`mobile-menu ${isNavOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <span className="mobile-brand">🎓 ClassConnect</span>
            <button 
              className="btn-close"
              onClick={() => setIsNavOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="mobile-menu-items">
            {tabs.map((tab, index) => (
              <button 
                key={tab.id}
                className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsNavOpen(false);
                }}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isNavOpen && <div className="mobile-menu-overlay" onClick={() => setIsNavOpen(false)}></div>}

      <div className="container">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'subjects' && <SubjectManager />}
        {activeTab === 'timetable' && <TimetableManager />}
        {activeTab === 'marks' && <MarksManager />}
        {activeTab === 'reports' && <AttendanceReport />}
        {activeTab === 'holidays' && <HolidayManager />}
      </div>
    </div>
  );
}

export default App;