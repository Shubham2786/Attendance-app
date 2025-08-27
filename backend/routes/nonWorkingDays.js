import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all non-working days
router.get('/', (req, res) => {
  db.all('SELECT * FROM non_working_days ORDER BY day_of_week', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add non-working day
router.post('/', (req, res) => {
  const { day_of_week, day_name } = req.body;
  db.run('INSERT INTO non_working_days (day_of_week, day_name) VALUES (?, ?)', 
    [day_of_week, day_name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, day_of_week, day_name });
  });
});

// Remove non-working day
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM non_working_days WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Non-working day removed' });
  });
});

// Update non-working days (bulk update)
router.put('/', (req, res) => {
  const { working_days } = req.body; // Array of day numbers that should be working
  
  // This endpoint allows updating which days are working vs non-working
  // For now, we'll keep the existing individual add/remove approach
  // This can be extended later if needed for bulk operations
  
  res.json({ message: 'Use individual add/remove endpoints for now' });
});

export default router;