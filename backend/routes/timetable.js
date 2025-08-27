import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get timetable
router.get('/', (req, res) => {
  const query = `
    SELECT t.*, s.name as subject_name, s.code, s.type 
    FROM timetable t 
    JOIN subjects s ON t.subject_id = s.id 
    ORDER BY t.day_of_week, t.start_time
  `;
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching timetable:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Timetable fetched:', rows?.length || 0);
    res.json({ data: rows || [] });
  });
});

// Add timetable entry
router.post('/', (req, res) => {
  const { subject_id, day_of_week, start_time, end_time } = req.body;
  
  // Check for overlapping classes on the same day
  const checkOverlapQuery = `
    SELECT COUNT(*) as count FROM timetable 
    WHERE day_of_week = ? 
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))
  `;
  
  db.get(checkOverlapQuery, [day_of_week, start_time, start_time, end_time, end_time, start_time, end_time], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row.count > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing class' });
    }
    
    // Check if it's a non-working day
    db.get('SELECT COUNT(*) as count FROM non_working_days WHERE day_of_week = ?', [day_of_week], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (row.count > 0) {
        return res.status(400).json({ error: 'Cannot schedule classes on non-working days' });
      }
      
      db.run('INSERT INTO timetable (subject_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)', 
        [subject_id, day_of_week, start_time, end_time], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      });
    });
  });
});

// Get today's classes
router.get('/today', (req, res) => {
  const today = new Date().getDay();
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Get regular classes not cancelled
  const regularQuery = `
    SELECT t.*, s.name as subject_name, s.code, s.type, 'regular' as class_type
    FROM timetable t 
    JOIN subjects s ON t.subject_id = s.id 
    WHERE t.day_of_week = ? 
    AND NOT EXISTS (
      SELECT 1 FROM cancelled_lectures cl 
      WHERE cl.timetable_id = t.id AND cl.date = ?
    )
    ORDER BY t.start_time
  `;
  
  // Get extra lectures for today
  const extraQuery = `
    SELECT el.id, el.subject_id, el.start_time, el.end_time, 
           s.name as subject_name, s.code, s.type, 'extra' as class_type,
           el.venue, el.reason
    FROM extra_lectures el
    JOIN subjects s ON el.subject_id = s.id
    WHERE el.date = ?
    ORDER BY el.start_time
  `;
  
  db.all(regularQuery, [today, todayDate], (err, regularClasses) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(extraQuery, [todayDate], (err, extraClasses) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Combine and sort by start time
      const allClasses = [...regularClasses, ...extraClasses]
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      res.json(allClasses);
    });
  });
});

export default router;