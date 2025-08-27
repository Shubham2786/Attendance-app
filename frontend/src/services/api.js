import axios from 'axios';
import localStorageService from './localStorage.js';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1000
});

// Check if online
const isOnline = () => navigator.onLine;

// Offline fallback wrapper
const withOfflineFallback = (onlineFunc, offlineFunc) => {
  return async (...args) => {
    if (!isOnline()) {
      return offlineFunc(...args);
    }
    try {
      return await onlineFunc(...args);
    } catch (error) {
      console.warn('Network error, falling back to offline mode:', error.message);
      return offlineFunc(...args);
    }
  };
};

export const subjectsAPI = {
  getAll: withOfflineFallback(
    () => api.get('/subjects'),
    () => Promise.resolve({ data: localStorageService.getAll('subjects') })
  ),
  create: withOfflineFallback(
    (data) => api.post('/subjects', data),
    (data) => Promise.resolve({ data: localStorageService.create('subjects', data) })
  ),
  delete: withOfflineFallback(
    (id) => api.delete(`/subjects/${id}`),
    (id) => {
      localStorageService.delete('subjects', id);
      return Promise.resolve({ data: { message: 'Subject deleted' } });
    }
  ),
};

export const timetableAPI = {
  getAll: withOfflineFallback(
    () => api.get('/timetable'),
    () => Promise.resolve({ data: localStorageService.getAll('timetable') })
  ),
  create: withOfflineFallback(
    (data) => api.post('/timetable', data),
    (data) => Promise.resolve({ data: localStorageService.create('timetable', data) })
  ),
  getToday: withOfflineFallback(
    () => api.get('/timetable/today'),
    () => Promise.resolve({ data: localStorageService.getTodayClasses() })
  ),
};

export const attendanceAPI = {
  mark: withOfflineFallback(
    (data) => api.post('/attendance', data),
    (data) => {
      try {
        return Promise.resolve({ data: localStorageService.markAttendance(data) });
      } catch (error) {
        return Promise.reject({ response: { data: { error: error.message } } });
      }
    }
  ),
  getStats: withOfflineFallback(
    () => api.get('/attendance/stats'),
    () => Promise.resolve({ data: localStorageService.getAttendanceStats() })
  ),
  getBySubject: withOfflineFallback(
    (id) => api.get(`/attendance/subject/${id}`),
    (id) => {
      const attendance = localStorageService.getAll('attendance').filter(att => att.subject_id === id);
      return Promise.resolve({ data: attendance });
    }
  ),
  getAll: withOfflineFallback(
    () => api.get('/attendance'),
    () => {
      const attendance = localStorageService.getAll('attendance');
      const subjects = localStorageService.getAll('subjects');
      const enriched = attendance.map(att => {
        const subject = subjects.find(s => s.id === att.subject_id);
        return { ...att, subject_name: subject?.name, type: subject?.type };
      });
      return Promise.resolve({ data: { data: enriched } });
    }
  ),
  update: withOfflineFallback(
    (id, data) => api.put(`/attendance/${id}`, data),
    (id, data) => {
      const updated = localStorageService.update('attendance', id, data);
      return Promise.resolve({ data: updated });
    }
  ),
  markManual: withOfflineFallback(
    (data) => api.post('/attendance/manual', data),
    (data) => Promise.resolve({ data: localStorageService.create('attendance', data) })
  ),
};

export const holidaysAPI = {
  getAll: withOfflineFallback(
    () => api.get('/holidays'),
    () => Promise.resolve({ data: localStorageService.getAllHolidays() })
  ),
  create: withOfflineFallback(
    (data) => api.post('/holidays', data),
    (data) => Promise.resolve({ data: localStorageService.create('holidays', data) })
  ),
  delete: withOfflineFallback(
    (id) => api.delete(`/holidays/${id}`),
    (id) => {
      localStorageService.delete('holidays', id);
      return Promise.resolve({ data: { message: 'Holiday deleted' } });
    }
  ),
  createSemester: withOfflineFallback(
    (data) => api.post('/holidays/semester', data),
    (data) => {
      localStorage.setItem('semester', JSON.stringify(data));
      return Promise.resolve({ data });
    }
  ),
  getSemester: withOfflineFallback(
    () => api.get('/holidays/semester'),
    () => {
      const semester = JSON.parse(localStorage.getItem('semester') || '{}');
      return Promise.resolve({ data: semester });
    }
  ),
};

export const nonWorkingDaysAPI = {
  getAll: withOfflineFallback(
    () => api.get('/non-working-days'),
    () => Promise.resolve({ data: localStorageService.getAll('nonWorkingDays') })
  ),
  create: withOfflineFallback(
    (data) => api.post('/non-working-days', data),
    (data) => {
      if (localStorageService.checkDuplicateNonWorkingDay(data.day_of_week)) {
        return Promise.reject({ response: { data: { error: 'This day is already marked as non-working' } } });
      }
      return Promise.resolve({ data: localStorageService.create('nonWorkingDays', data) });
    }
  ),
  delete: withOfflineFallback(
    (id) => api.delete(`/non-working-days/${id}`),
    (id) => {
      localStorageService.delete('nonWorkingDays', id);
      return Promise.resolve({ data: { message: 'Non-working day removed' } });
    }
  ),
  update: withOfflineFallback(
    (data) => api.put('/non-working-days', data),
    (data) => Promise.resolve({ data: { message: 'Use individual add/remove endpoints' } })
  ),
};

export const marksAPI = {
  getAll: () => api.get('/marks'),
  getBySubject: (id) => api.get(`/marks/subject/${id}`),
  create: (data) => api.post('/marks', data),
  delete: (id) => api.delete(`/marks/${id}`),
};

export const examTimetableAPI = {
  getAll: () => api.get('/exam-timetable'),
  create: (data) => api.post('/exam-timetable', data),
  delete: (id) => api.delete(`/exam-timetable/${id}`),
};

export const lectureManagementAPI = {
  getCancelled: () => api.get('/lectures/cancelled'),
  cancelLecture: (data) => api.post('/lectures/cancel', data),
  getExtra: () => api.get('/lectures/extra'),
  addExtra: (data) => api.post('/lectures/extra', data),
  deleteCancelled: (id) => api.delete(`/lectures/cancelled/${id}`),
  deleteExtra: (id) => api.delete(`/lectures/extra/${id}`),
};

export const pastAttendanceAPI = {
  getAll: () => api.get('/past-attendance'),
  add: (data) => api.post('/past-attendance', data),
  bulkAdd: (data) => api.post('/past-attendance/bulk', data),
  delete: (id) => api.delete(`/past-attendance/${id}`),
};

export default api;