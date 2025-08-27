import { useState, useEffect } from 'react';
import { nonWorkingDaysAPI } from '../services/api';

function NonWorkingDays() {
  const [nonWorkingDays, setNonWorkingDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');

  const days = [
    { value: 0, name: '🌅 Sunday' },
    { value: 1, name: '💼 Monday' },
    { value: 2, name: '💼 Tuesday' },
    { value: 3, name: '💼 Wednesday' },
    { value: 4, name: '💼 Thursday' },
    { value: 5, name: '💼 Friday' },
    { value: 6, name: '🌆 Saturday' }
  ];

  useEffect(() => {
    loadNonWorkingDays();
  }, []);

  const loadNonWorkingDays = async () => {
    try {
      const response = await nonWorkingDaysAPI.getAll();
      setNonWorkingDays(response.data);
    } catch (error) {
      console.error('Error loading non-working days:', error);
    }
  };

  const addNonWorkingDay = async () => {
    if (!selectedDay) return;
    
    const day = days.find(d => d.value === parseInt(selectedDay));
    try {
      await nonWorkingDaysAPI.create({
        day_of_week: day.value,
        day_name: day.name
      });
      setSelectedDay('');
      loadNonWorkingDays();
    } catch (error) {
      console.error('Error adding non-working day:', error);
    }
  };

  const removeNonWorkingDay = async (id) => {
    try {
      await nonWorkingDaysAPI.delete(id);
      loadNonWorkingDays();
    } catch (error) {
      console.error('Error removing non-working day:', error);
    }
  };

  const availableDays = days.filter(day => 
    !nonWorkingDays.some(nwd => nwd.day_of_week === day.value)
  );

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h5>🚫 Set Non-Working Days</h5>
          </div>
          <div className="card-body">
            <p className="text-muted mb-3">
              Select days when no classes are scheduled (e.g., weekends)
            </p>
            <div className="mb-3">
              <select
                className="form-select"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="">Select a day</option>
                {availableDays.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.name}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-primary"
              onClick={addNonWorkingDay}
              disabled={!selectedDay}
            >
              ➕ Add Non-Working Day
            </button>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h5>📅 Current Non-Working Days</h5>
          </div>
          <div className="card-body">
            {nonWorkingDays.length === 0 ? (
              <p className="text-muted">All days are working days</p>
            ) : (
              <div className="list-group">
                {nonWorkingDays.map(day => (
                  <div key={day.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{day.day_name}</span>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => removeNonWorkingDay(day.id)}
                    >
                      ❌ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NonWorkingDays;