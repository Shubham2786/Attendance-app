import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all exams
router.get('/', (req, res) => {
  const query = `
    SELECT et.*, s.name as subject_name, s.code as subject_code, s.type
    FROM exam_timetable et
    JOIN subjects s ON et.subject_id = s.id
    ORDER BY et.exam_date, et.start_time
  `;
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching exam timetable:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Exam timetable fetched:', rows?.length || 0);
    res.json({ data: rows || [] });
  });
});

// Add exam
router.post('/', (req, res) => {
  const { subject_id, exam_type, exam_date, start_time, end_time, venue } = req.body;
  
  // Validate exam date is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(exam_date) < today) {
    return res.status(400).json({ error: 'Cannot schedule exam for past dates' });
  }
  
  // Check for venue conflicts
  const venueConflictQuery = `
    SELECT COUNT(*) as count FROM exam_timetable 
    WHERE exam_date = ? AND venue = ? 
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  `;
  
  db.get(venueConflictQuery, [exam_date, venue, start_time, start_time, end_time, end_time], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row.count > 0) {
      return res.status(400).json({ error: 'Venue is already booked for this time slot' });
    }
    
    // Check for holiday conflicts
    db.get('SELECT COUNT(*) as count FROM holidays WHERE ? BETWEEN start_date AND end_date', [exam_date], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (row.count > 0) {
        return res.status(400).json({ error: 'Cannot schedule exam on holiday' });
      }
      
      db.run('INSERT INTO exam_timetable (subject_id, exam_type, exam_date, start_time, end_time, venue) VALUES (?, ?, ?, ?, ?, ?)', 
        [subject_id, exam_type, exam_date, start_time, end_time, venue], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Exam already scheduled for this subject and type' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, subject_id, exam_type, exam_date, start_time, end_time, venue });
      });
    });
  });
});

// Delete exam
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM exam_timetable WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Exam deleted' });
  });
});

export default router;