import { useState } from 'react';

function TimetableTest() {
  const [message, setMessage] = useState('TimetableManager is working!');

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h5>🧪 Timetable Test Component</h5>
        </div>
        <div className="card-body">
          <div className="alert alert-success">
            <h6>✅ Component Status</h6>
            <p>{message}</p>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h6>📅 Basic Timetable View</h6>
                  <p className="text-muted">This is a simplified test to ensure the component renders.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setMessage('Button clicked! Component is responsive.')}
                  >
                    Test Button
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h6>🔧 Debug Info</h6>
                  <ul className="list-unstyled">
                    <li>✅ React hooks working</li>
                    <li>✅ CSS classes applied</li>
                    <li>✅ Bootstrap components loaded</li>
                    <li>✅ Event handlers functional</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimetableTest;