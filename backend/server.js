import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import subjectRoutes from './routes/subjects.js';
import timetableRoutes from './routes/timetable.js';
import attendanceRoutes from './routes/attendance.js';
import holidayRoutes from './routes/holidays.js';
import nonWorkingDaysRoutes from './routes/nonWorkingDays.js';
import marksRoutes from './routes/marks.js';
import examTimetableRoutes from './routes/examTimetable.js';
import lectureManagementRoutes from './routes/lectureManagement.js';
import pastAttendanceRoutes from './routes/pastAttendance.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://attendance-app-shubham2786.vercel.app', 'https://classconnect.vercel.app']
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// CSP headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "script-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://cdn.jsdelivr.net;"
  );
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database
initDatabase();

// Routes
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/non-working-days', nonWorkingDaysRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/exam-timetable', examTimetableRoutes);
app.use('/api/lectures', lectureManagementRoutes);
app.use('/api/past-attendance', pastAttendanceRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});