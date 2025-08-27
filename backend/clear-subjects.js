import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'classconnect.db'));

console.log('🗑️ Clearing all subject data...');

db.serialize(() => {
  // Clear all related data in correct order (foreign key constraints)
  db.run('DELETE FROM manual_attendance', (err) => {
    if (!err) console.log('✅ Cleared manual attendance data');
  });
  
  db.run('DELETE FROM attendance', (err) => {
    if (!err) console.log('✅ Cleared attendance data');
  });
  
  db.run('DELETE FROM marks', (err) => {
    if (!err) console.log('✅ Cleared marks data');
  });
  
  db.run('DELETE FROM timetable', (err) => {
    if (!err) console.log('✅ Cleared timetable data');
  });
  
  db.run('DELETE FROM subjects', (err) => {
    if (!err) console.log('✅ Cleared subjects data');
  });
  
  console.log('🎉 All subject-related data cleared successfully!');
  console.log('📝 You can now add fresh subjects and data.');
});

db.close();