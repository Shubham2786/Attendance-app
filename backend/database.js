import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'classconnect.db'));

export const initDatabase = () => {
  db.serialize(() => {
    // Subjects table with constraints
    db.run(`CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      credits INTEGER CHECK(credits > 0) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Add type column if it doesn't exist
    db.run(`PRAGMA table_info(subjects)`, (err, rows) => {
      if (!err) {
        db.all(`PRAGMA table_info(subjects)`, (err, columns) => {
          if (!err) {
            const hasTypeColumn = columns.some(col => col.name === 'type');
            if (!hasTypeColumn) {
              db.run(`ALTER TABLE subjects ADD COLUMN type TEXT CHECK(type IN ('theory', 'lab')) DEFAULT 'theory'`);
              console.log('Added type column to subjects table');
            }
          }
        });
      }
    });

    // Timetable table
    db.run(`CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER,
      day_of_week INTEGER,
      start_time TEXT,
      end_time TEXT,
      FOREIGN KEY (subject_id) REFERENCES subjects (id)
    )`);

    // Attendance table with unique constraint
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER,
      date TEXT,
      status TEXT CHECK(status IN ('present', 'absent')),
      is_editable INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      UNIQUE(subject_id, date)
    )`);

    // Holidays table with date validation
    db.run(`CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      type TEXT CHECK(type IN ('short', 'long')) DEFAULT 'short',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK(start_date <= end_date)
    )`);

    // Semester settings table with single active constraint
    db.run(`CREATE TABLE IF NOT EXISTS semester_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester_name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK(start_date < end_date)
    )`);

    // Non-working days table
    db.run(`CREATE TABLE IF NOT EXISTS non_working_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER UNIQUE CHECK(day_of_week >= 0 AND day_of_week <= 6),
      day_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Semester marks table with internal/external structure
    db.run(`CREATE TABLE IF NOT EXISTS semester_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER,
      semester INTEGER CHECK(semester >= 1 AND semester <= 8),
      internal_marks REAL CHECK(internal_marks >= 0),
      external_marks REAL CHECK(external_marks >= 0),
      total_marks REAL CHECK(total_marks >= 0),
      max_internal REAL CHECK(max_internal > 0),
      max_external REAL CHECK(max_external > 0),
      max_total REAL CHECK(max_total > 0),
      percentage REAL CHECK(percentage >= 0 AND percentage <= 100),
      grade TEXT CHECK(grade IN ('O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F')),
      grade_points REAL CHECK(grade_points >= 0 AND grade_points <= 10),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      CHECK(internal_marks <= max_internal),
      CHECK(external_marks <= max_external),
      CHECK(total_marks <= max_total),
      CHECK(total_marks = internal_marks + external_marks),
      UNIQUE(subject_id, semester)
    )`);

    // Semester GPA tracking
    db.run(`CREATE TABLE IF NOT EXISTS semester_gpa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester INTEGER UNIQUE CHECK(semester >= 1 AND semester <= 8),
      total_credits INTEGER CHECK(total_credits > 0),
      total_grade_points REAL CHECK(total_grade_points >= 0),
      sgpa REAL CHECK(sgpa >= 0 AND sgpa <= 10),
      is_completed INTEGER DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Legacy marks table (keeping for backward compatibility)
    db.run(`CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER,
      exam_type TEXT CHECK(exam_type IN ('ia', 'mid_sem', 'end_sem', 'final_practical', 'ca')) NOT NULL,
      test_number INTEGER DEFAULT 1 CHECK(test_number > 0),
      marks_obtained REAL CHECK(marks_obtained >= 0),
      max_marks REAL CHECK(max_marks > 0),
      percentage REAL CHECK(percentage >= 0 AND percentage <= 100),
      grade TEXT,
      grade_points REAL,
      exam_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      CHECK(marks_obtained <= max_marks),
      UNIQUE(subject_id, exam_type, test_number, exam_date)
    )`);

    // Manual attendance table with entry type
    db.run(`CREATE TABLE IF NOT EXISTS manual_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER DEFAULT 1,
      subject_id INTEGER,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent')),
      reason TEXT NOT NULL,
      entry_type TEXT CHECK(entry_type IN ('past', 'regular', 'correction')) DEFAULT 'regular',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      UNIQUE(student_id, subject_id, date)
    )`);

    // Placeholder lectures for past attendance
    db.run(`CREATE TABLE IF NOT EXISTS placeholder_lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER,
      date TEXT NOT NULL,
      created_for TEXT DEFAULT 'past_attendance',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      UNIQUE(subject_id, date)
    )`);

    // Exam timetable with conflict prevention
    db.run(`CREATE TABLE IF NOT EXISTS exam_timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER,
      exam_type TEXT CHECK(exam_type IN ('mid_sem', 'end_sem', 'practical')) NOT NULL,
      exam_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      CHECK(start_time < end_time),
      UNIQUE(subject_id, exam_type, exam_date)
    )`);

    // Cancelled lectures table
    db.run(`CREATE TABLE IF NOT EXISTS cancelled_lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      cancelled_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (timetable_id) REFERENCES timetable (id),
      UNIQUE(timetable_id, date)
    )`);

    // Extra lectures table
    db.run(`CREATE TABLE IF NOT EXISTS extra_lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      venue TEXT,
      reason TEXT NOT NULL,
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      CHECK(start_time < end_time)
    )`);
  });
};

// Helper function to check if attendance is editable (within 2 days)
export const isAttendanceEditable = (attendanceDate) => {
  const today = new Date();
  const attDate = new Date(attendanceDate);
  const diffTime = Math.abs(today - attDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 2;
};

// Validation functions
export const validateDate = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

export const validateFutureDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

export const validatePastDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return inputDate <= today;
};

export const checkTimeOverlap = (start1, end1, start2, end2) => {
  return (start1 < end2) && (start2 < end1);
};

export const validateCredits = (credits) => {
  return credits > 0 && Number.isInteger(credits);
};

export const validateMarks = (obtained, maximum) => {
  return obtained >= 0 && obtained <= maximum && maximum > 0;
};

export default db;