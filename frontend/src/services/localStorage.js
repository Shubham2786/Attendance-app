// Local Storage Service for Offline Functionality
class LocalStorageService {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    const keys = ['subjects', 'timetable', 'attendance', 'holidays', 'nonWorkingDays', 'marks', 'semester'];
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
    
    if (!localStorage.getItem('semester')) {
      localStorage.setItem('semester', JSON.stringify({}));
    }
    
    // Initialize holidays from events if not already done
    this.initializeEventsHolidays();
  }

  initializeEventsHolidays() {
    // Run asynchronously to not block initialization
    setTimeout(() => {
      const existingHolidays = this.getAll('holidays');
      const hasEventsHolidays = existingHolidays.some(h => h.source === 'events');
      
      if (!hasEventsHolidays) {
        import('../data/events.js').then(({ default: events }) => {
          const holidayEvents = events.filter(event => event.type === 'holiday');
          const formattedHolidays = holidayEvents.map(event => ({
            name: event.title,
            start_date: event.date,
            end_date: event.date,
            type: 'short',
            source: 'events',
            id: this.generateId(),
            created_at: new Date().toISOString()
          }));
          
          const updatedHolidays = [...existingHolidays, ...formattedHolidays];
          localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
        });
      }
    }, 100);
  }

  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  // Generic CRUD operations
  getAll(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  getById(key, id) {
    const items = this.getAll(key);
    return items.find(item => item.id === id);
  }

  create(key, data) {
    const items = this.getAll(key);
    const newItem = { ...data, id: this.generateId(), created_at: new Date().toISOString() };
    items.push(newItem);
    localStorage.setItem(key, JSON.stringify(items));
    return newItem;
  }

  update(key, id, data) {
    const items = this.getAll(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(items));
      return items[index];
    }
    return null;
  }

  delete(key, id) {
    const items = this.getAll(key);
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  }

  // Specific methods for app functionality
  getTodayClasses() {
    const today = new Date().getDay();
    const timetable = this.getAll('timetable');
    const subjects = this.getAll('subjects');
    
    return timetable
      .filter(slot => slot.day_of_week === today)
      .map(slot => {
        const subject = subjects.find(s => s.id === slot.subject_id);
        return {
          ...slot,
          subject_name: subject?.name || 'Unknown',
          type: subject?.type || 'theory'
        };
      });
  }

  getAttendanceStats() {
    const attendance = this.getAll('attendance');
    const subjects = this.getAll('subjects');
    
    return subjects.map(subject => {
      const subjectAttendance = attendance.filter(att => att.subject_id === subject.id);
      const presentCount = subjectAttendance.filter(att => att.status === 'present').length;
      const totalClasses = subjectAttendance.length;
      const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
      
      return {
        ...subject,
        present_count: presentCount,
        total_classes: totalClasses,
        percentage
      };
    });
  }

  markAttendance(data) {
    const attendance = this.getAll('attendance');
    const existing = attendance.find(att => 
      att.subject_id === data.subject_id && att.date === data.date
    );
    
    if (existing) {
      throw new Error('Attendance already marked for this date');
    }
    
    return this.create('attendance', data);
  }

  checkDuplicateNonWorkingDay(dayOfWeek) {
    const nonWorkingDays = this.getAll('nonWorkingDays');
    return nonWorkingDays.some(day => day.day_of_week === dayOfWeek);
  }

  // Get holidays including events
  getAllHolidays() {
    const storedHolidays = this.getAll('holidays');
    // Events holidays are already included from initialization
    return storedHolidays;
  }
}

export default new LocalStorageService();