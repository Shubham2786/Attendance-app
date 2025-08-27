import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'classconnect.db'));

console.log('🔄 Starting database migration...');

db.serialize(() => {
  // Add new columns to existing tables if they don't exist
  
  // Check and add columns to holidays table
  db.all("PRAGMA table_info(holidays)", (err, columns) => {
    if (!err) {
      const hasStartDate = columns.some(col => col.name === 'start_date');
      const hasEndDate = columns.some(col => col.name === 'end_date');
      const hasType = columns.some(col => col.name === 'type');
      
      if (!hasStartDate) {
        db.run("ALTER TABLE holidays ADD COLUMN start_date TEXT");
        console.log('✅ Added start_date column to holidays table');
      }
      
      if (!hasEndDate) {
        db.run("ALTER TABLE holidays ADD COLUMN end_date TEXT");
        console.log('✅ Added end_date column to holidays table');
      }
      
      if (!hasType) {
        db.run("ALTER TABLE holidays ADD COLUMN type TEXT CHECK(type IN ('short', 'long')) DEFAULT 'short'");
        console.log('✅ Added type column to holidays table');
      }
      
      // Migrate existing data if needed
      if (!hasStartDate && !hasEndDate && !hasType) {
        db.run(`UPDATE holidays SET start_date = date, end_date = date, type = 'short' WHERE start_date IS NULL`);
        console.log('✅ Migrated existing holiday data');
      }
    }
  });
  
  // Check and add columns to attendance table
  db.all("PRAGMA table_info(attendance)", (err, columns) => {
    if (!err) {
      const hasIsEditable = columns.some(col => col.name === 'is_editable');
      const hasCreatedAt = columns.some(col => col.name === 'created_at');
      
      if (!hasIsEditable) {
        db.run("ALTER TABLE attendance ADD COLUMN is_editable INTEGER DEFAULT 1");
        console.log('✅ Added is_editable column to attendance table');
      }
      
      if (!hasCreatedAt) {
        db.run("ALTER TABLE attendance ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        console.log('✅ Added created_at column to attendance table');
      }
    }
  });
  
  // Create new tables if they don't exist
  db.run(`CREATE TABLE IF NOT EXISTS semester_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semester_name TEXT,
    start_date TEXT,
    end_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (!err) {
      console.log('✅ Created semester_settings table');
    }
  });
  
  db.run(`CREATE TABLE IF NOT EXISTS manual_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER,
    date TEXT,
    status TEXT CHECK(status IN ('present', 'absent')),
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
  )`, (err) => {
    if (!err) {
      console.log('✅ Created manual_attendance table');
    }
  });
  
  console.log('🎉 Database migration completed!');
  console.log('📝 You can now restart your application to use the new features.');
});

db.close();