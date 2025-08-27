import { useState, useEffect } from 'react';
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const SubjectManager = lazy(() => import('./components/SubjectManager'));
const TimetableManager = lazy(() => import('./components/TimetableManager'));
const AttendanceReport = lazy(() => import('./components/AttendanceReport'));
const HolidayManager = lazy(() => import('./components/HolidayManager'));
const MarksManager = lazy(() => import('./components/MarksManager'));

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    document.body.className = 'dark-theme';
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabs = [
    { id: 'dashboard', label: '■ Dashboard', icon: '■' },
    { id: 'subjects', label: '□ Subjects', icon: '□' },
    { id: 'timetable', label: '△ Timetable', icon: '△' },
    { id: 'marks', label: '◆ Marks', icon: '◆' },
    { id: 'reports', label: '▲ Reports', icon: '▲' },
    { id: 'holidays', label: '● Settings', icon: '●' }
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
            ▣ ClassConnect
            {!isOnline && <span className="badge bg-warning ms-2">📱 Offline</span>}
          </button>
          
          <div className="d-flex align-items-center d-lg-none">

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

          </div>
        </div>
      </nav>
      
      {/* Mobile Side Menu */}
      <div className={`mobile-menu ${isNavOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <span className="mobile-brand">▣ ClassConnect</span>
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
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border" role="status"></div></div>}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'subjects' && <SubjectManager />}
          {activeTab === 'timetable' && <TimetableManager />}
          {activeTab === 'marks' && <MarksManager />}
          {activeTab === 'reports' && <AttendanceReport />}
          {activeTab === 'holidays' && <HolidayManager />}
        </Suspense>
      </div>
    </div>
  );
}

export default App;