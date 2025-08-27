import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get cancelled lectures
router.get('/cancelled', (req, res) => {
  const query = `
    SELECT cl.*, t.day_of_week, t.start_time, t.end_time, s.name as subject_name, s.type
    FROM cancelled_lectures cl
    JOIN timetable t ON cl.timetable_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    ORDER BY cl.date DESC
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Cancel a lecture
router.post('/cancel', (req, res) => {
  const { timetable_id, date, reason } = req.body;
  
  // Check 2-day limit for cancellation
  const today = new Date();
  const lectureDate = new Date(date);
  const diffTime = today - lectureDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0 || diffDays > 2) {
    return res.status(400).json({ error: 'Lectures can only be cancelled within 2 days' });
  }
  
  db.run('INSERT INTO cancelled_lectures (timetable_id, date, reason) VALUES (?, ?, ?)', 
    [timetable_id, date, reason], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, timetable_id, date, reason });
  });
});

// Get extra lectures
router.get('/extra', (req, res) => {
  const query = `
    SELECT el.*, s.name as subject_name, s.type
    FROM extra_lectures el
    JOIN subjects s ON el.subject_id = s.id
    ORDER BY el.date DESC
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add extra lecture
router.post('/extra', (req, res) => {
  const { subject_id, date, start_time, end_time, venue, reason } = req.body;
  db.run('INSERT INTO extra_lectures (subject_id, date, start_time, end_time, venue, reason) VALUES (?, ?, ?, ?, ?, ?)', 
    [subject_id, date, start_time, end_time, venue, reason], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, subject_id, date, start_time, end_time, venue, reason });
  });
});

// Delete cancelled lecture
router.delete('/cancelled/:id', (req, res) => {
  db.run('DELETE FROM cancelled_lectures WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cancelled lecture removed' });
  });
});

// Delete extra lecture
router.delete('/extra/:id', (req, res) => {
  db.run('DELETE FROM extra_lectures WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Extra lecture removed' });
  });
});

export default router;