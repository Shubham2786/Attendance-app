import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const timetableAPI = {
  getAll: () => api.get('/timetable'),
  create: (data) => api.post('/timetable', data),
  getToday: () => api.get('/timetable/today'),
};

export const attendanceAPI = {
  mark: (data) => api.post('/attendance', data),
  getStats: () => api.get('/attendance/stats'),
  getBySubject: (id) => api.get(`/attendance/subject/${id}`),
  getAll: () => api.get('/attendance'),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  markManual: (data) => api.post('/attendance/manual', data),
};

export const holidaysAPI = {
  getAll: () => api.get('/holidays'),
  create: (data) => api.post('/holidays', data),
  delete: (id) => api.delete(`/holidays/${id}`),
  createSemester: (data) => api.post('/holidays/semester', data),
  getSemester: () => api.get('/holidays/semester'),
};

export const nonWorkingDaysAPI = {
  getAll: () => api.get('/non-working-days'),
  create: (data) => api.post('/non-working-days', data),
  delete: (id) => api.delete(`/non-working-days/${id}`),
  update: (data) => api.put('/non-working-days', data),
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