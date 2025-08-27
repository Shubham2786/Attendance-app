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
          
          <button 
            className="navbar-toggler d-lg-none"
            type="button"
            onClick={() => {
              console.log('Hamburger clicked, current state:', isNavOpen);
              setIsNavOpen(!isNavOpen);
            }}
            aria-label="Toggle navigation"
            style={{
              border: '2px solid #E6C200',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#E6C200',
              minWidth: '50px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span 
              style={{
                backgroundImage: "url(\"data:image/svg+xml;charset=utf8,%3csvg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3e%3cpath stroke='%23000000' stroke-width='3' stroke-linecap='round' stroke-miterlimit='10' d='m4 7h22m-22 6h22m-22 6h22'/%3e%3c/svg%3e\")",
                width: '24px',
                height: '24px',
                display: 'block'
              }}
            ></span>
          </button>
          
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
      <div 
        className={`mobile-menu ${isNavOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: isNavOpen ? 0 : '-100%',
          width: '80%',
          maxWidth: '300px',
          height: '100vh',
          background: '#1A1A1A',
          borderLeft: '3px solid #E6C200',
          transition: 'right 0.3s ease',
          zIndex: 1050,
          boxShadow: '-2px 0 20px rgba(0,0,0,0.8)',
          overflowY: 'auto'
        }}
      >
        <div 
          style={{
            padding: '1rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '1rem',
              borderBottom: '2px solid #E6C200',
              marginBottom: '1rem'
            }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#E6C200' }}>▣ ClassConnect</span>
            <button 
              onClick={() => setIsNavOpen(false)}
              style={{
                background: '#E6C200',
                border: '2px solid #E6C200',
                borderRadius: '50%',
                fontSize: '1.2rem',
                color: '#0A0A0A',
                cursor: 'pointer',
                padding: 0,
                width: '35px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
          <div 
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              paddingTop: '1rem'
            }}
          >
            {tabs.map((tab, index) => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsNavOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: activeTab === tab.id ? '#E6C200' : '#0A0A0A',
                  border: '2px solid #E6C200',
                  borderRadius: '0.75rem',
                  color: activeTab === tab.id ? '#0A0A0A' : '#E6C200',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isNavOpen && (
        <div 
          onClick={() => setIsNavOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1040,
            backdropFilter: 'blur(2px)'
          }}
        ></div>
      )}

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