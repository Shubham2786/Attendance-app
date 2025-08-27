import express from 'express';
import db, { validateCredits } from '../database.js';

const router = express.Router();

// Get all subjects
router.get('/', (req, res) => {
  db.all('SELECT * FROM subjects ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add new subject
router.post('/', (req, res) => {
  const { name, code, type, credits } = req.body;
  
  // Validation
  if (!name || !code) {
    return res.status(400).json({ error: 'Name and code are required' });
  }
  
  const finalType = type || 'theory';
  const finalCredits = credits || 1;
  
  if (!validateCredits(finalCredits)) {
    return res.status(400).json({ error: 'Credits must be a positive integer' });
  }
  
  if (!['theory', 'lab'].includes(finalType)) {
    return res.status(400).json({ error: 'Type must be theory or lab' });
  }
  
  db.run('INSERT INTO subjects (name, code, type, credits) VALUES (?, ?, ?, ?)', 
    [name, code, finalType, finalCredits], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Subject code already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, code, type: finalType, credits: finalCredits });
  });
});

// Delete subject
router.delete('/:id', (req, res) => {
  // Check if subject has timetable entries
  db.get('SELECT COUNT(*) as count FROM timetable WHERE subject_id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row.count > 0) {
      return res.status(400).json({ error: 'Cannot delete subject with existing timetable entries' });
    }
    
    // Check if subject has attendance entries
    db.get('SELECT COUNT(*) as count FROM attendance WHERE subject_id = ?', [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (row.count > 0) {
        return res.status(400).json({ error: 'Cannot delete subject with existing attendance records' });
      }
      
      // Safe to delete
      db.run('DELETE FROM subjects WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Subject deleted successfully' });
      });
    });
  });
});

export default router;