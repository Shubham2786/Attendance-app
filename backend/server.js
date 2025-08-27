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

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});