import express from 'express';
import db from '../database.js';

const router = express.Router();

// Add past attendance entry
router.post('/', (req, res) => {
  const { subject_id, date, status, reason } = req.body;
  const student_id = 1; // Default student ID
  
  // Validate date is within semester
  db.get('SELECT * FROM semester_settings WHERE is_active = 1', (err, semester) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!semester) {
      return res.status(400).json({ error: 'No active semester found' });
    }
    
    if (date < semester.start_date || date > semester.end_date) {
      return res.status(400).json({ error: 'Date outside semester range' });
    }
    
    // Check if date is not in future
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return res.status(400).json({ error: 'Cannot add past attendance for future dates' });
    }
    
    // Check for holidays
    db.get('SELECT COUNT(*) as count FROM holidays WHERE ? BETWEEN start_date AND end_date', [date], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (row.count > 0) {
        return res.status(400).json({ error: 'Cannot add attendance on holidays' });
      }
      
      // Create placeholder lecture if needed
      db.run('INSERT OR IGNORE INTO placeholder_lectures (subject_id, date) VALUES (?, ?)', 
        [subject_id, date], (err) => {
        if (err) console.error('Error creating placeholder:', err);
        
        // Add manual attendance
        db.run('INSERT INTO manual_attendance (student_id, subject_id, date, status, reason, entry_type) VALUES (?, ?, ?, ?, ?, ?)', 
          [student_id, subject_id, date, status, reason, 'past'], function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Duplicate entry detected for this date' });
            }
            return res.status(500).json({ error: err.message });
          }
          res.json({ 
            id: this.lastID, 
            message: 'Past attendance added successfully',
            student_id, subject_id, date, status, reason 
          });
        });
      });
    });
  });
});

// Get past attendance entries
router.get('/', (req, res) => {
  const query = `
    SELECT ma.*, s.name as subject_name, s.type
    FROM manual_attendance ma
    JOIN subjects s ON ma.subject_id = s.id
    WHERE ma.entry_type = 'past'
    ORDER BY ma.date DESC
  `;
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching past attendance:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Past attendance fetched:', rows?.length || 0);
    res.json({ data: rows || [] });
  });
});

// Bulk import past attendance
router.post('/bulk', (req, res) => {
  const { entries } = req.body; // Array of attendance entries
  let successCount = 0;
  let failureCount = 0;
  const errors = [];
  
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'No entries provided' });
  }
  
  // Validate all entries first
  db.get('SELECT * FROM semester_settings WHERE is_active = 1', (err, semester) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!semester) {
      return res.status(400).json({ error: 'No active semester found' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Process each entry
    const processEntry = (index) => {
      if (index >= entries.length) {
        return res.json({
          message: 'Bulk import completed',
          successCount,
          failureCount,
          errors: errors.slice(0, 10) // Limit error list
        });
      }
      
      const entry = entries[index];
      const { subject_id, date, status, reason } = entry;
      
      // Validate entry
      if (date < semester.start_date || date > semester.end_date) {
        failureCount++;
        errors.push(`Row ${index + 1}: Date outside semester range`);
        return processEntry(index + 1);
      }
      
      if (date > today) {
        failureCount++;
        errors.push(`Row ${index + 1}: Future date not allowed`);
        return processEntry(index + 1);
      }
      
      // Check for holidays
      db.get('SELECT COUNT(*) as count FROM holidays WHERE ? BETWEEN start_date AND end_date', [date], (err, row) => {
        if (err || row.count > 0) {
          failureCount++;
          errors.push(`Row ${index + 1}: Holiday date`);
          return processEntry(index + 1);
        }
        
        // Create placeholder and add attendance
        db.run('INSERT OR IGNORE INTO placeholder_lectures (subject_id, date) VALUES (?, ?)', 
          [subject_id, date], (err) => {
          
          db.run('INSERT INTO manual_attendance (student_id, subject_id, date, status, reason, entry_type) VALUES (?, ?, ?, ?, ?, ?)', 
            [1, subject_id, date, status, reason, 'past'], function(err) {
            if (err) {
              failureCount++;
              errors.push(`Row ${index + 1}: ${err.message}`);
            } else {
              successCount++;
            }
            processEntry(index + 1);
          });
        });
      });
    };
    
    processEntry(0);
  });
});

// Delete past attendance entry
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM manual_attendance WHERE id = ? AND entry_type = ?', 
    [req.params.id, 'past'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Past attendance entry not found' });
    }
    res.json({ message: 'Past attendance entry deleted' });
  });
});

export default router;