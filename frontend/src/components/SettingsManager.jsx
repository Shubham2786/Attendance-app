import { useState } from 'react';

function SettingsManager() {
  const [activeTab, setActiveTab] = useState('holidays');

  return (
    <div>
      <div className="alert alert-success mb-3">
        <strong>⚙️ Settings Panel</strong> - Working correctly
      </div>
      
      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'holidays' ? 'active' : ''}`}
            onClick={() => setActiveTab('holidays')}
          >
            🏖️ Holidays
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'semester' ? 'active' : ''}`}
            onClick={() => setActiveTab('semester')}
          >
            📚 Semester Settings
          </button>
        </li>
      </ul>

      {/* Content */}
      {activeTab === 'holidays' && (
        <div className="card">
          <div className="card-body">
            <h5>🏖️ Holiday Management</h5>
            <p>Holiday management features will be implemented here.</p>
          </div>
        </div>
      )}

      {activeTab === 'semester' && (
        <div className="card">
          <div className="card-body">
            <h5>📚 Semester Settings</h5>
            <p>Semester configuration features will be implemented here.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsManager;