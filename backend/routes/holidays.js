import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all holidays
router.get('/', (req, res) => {
  db.all('SELECT * FROM holidays ORDER BY start_date', (err, rows) => {
    if (err) {
      console.error('Error fetching holidays:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Holidays fetched:', rows?.length || 0);
    res.json({ data: rows || [] });
  });
});

// Add holiday
router.post('/', (req, res) => {
  const { name, start_date, end_date, type } = req.body;
  const finalEndDate = type === 'short' ? start_date : end_date;
  
  // Validate dates
  if (new Date(start_date) > new Date(finalEndDate)) {
    return res.status(400).json({ error: 'Start date must be before end date' });
  }
  
  // Check for overlapping holidays
  const overlapQuery = `
    SELECT COUNT(*) as count FROM holidays 
    WHERE (start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?)
  `;
  
  db.get(overlapQuery, [finalEndDate, start_date, start_date, finalEndDate], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row.count > 0) {
      return res.status(400).json({ error: 'Holiday dates overlap with existing holiday' });
    }
    
    db.run('INSERT INTO holidays (name, start_date, end_date, type) VALUES (?, ?, ?, ?)', 
      [name, start_date, finalEndDate, type], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, start_date, end_date: finalEndDate, type });
    });
  });
});

// Delete holiday
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM holidays WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Holiday deleted' });
  });
});

// Get semester settings
router.get('/semester', (req, res) => {
  db.get('SELECT * FROM semester_settings WHERE is_active = 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// Add/Update semester settings
router.post('/semester', (req, res) => {
  const { semester_name, start_date, end_date } = req.body;
  
  // Validate semester dates
  if (new Date(start_date) >= new Date(end_date)) {
    return res.status(400).json({ error: 'Semester start date must be before end date' });
  }
  
  // Deactivate all existing semesters
  db.run('UPDATE semester_settings SET is_active = 0', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Add new active semester
    db.run('INSERT INTO semester_settings (semester_name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)', 
      [semester_name, start_date, end_date], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, semester_name, start_date, end_date, is_active: 1 });
    });
  });
});

export default router;