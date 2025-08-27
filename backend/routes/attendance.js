import express from 'express';
import db, { validatePastDate } from '../database.js';

const router = express.Router();

// Mark attendance
router.post('/', (req, res) => {
  const { subject_id, date, status } = req.body;
  
  // Validate date - cannot mark future attendance
  if (!validatePastDate(date)) {
    return res.status(400).json({ error: 'Cannot mark attendance for future dates' });
  }
  
  // Check for holidays/cancelled lectures
  db.get('SELECT COUNT(*) as count FROM holidays WHERE ? BETWEEN start_date AND end_date', [date], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row.count > 0) {
      return res.status(400).json({ error: 'Cannot mark attendance on holidays' });
    }
    
    const isEditable = 1;
    db.run('INSERT OR REPLACE INTO attendance (subject_id, date, status, is_editable, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', 
      [subject_id, date, status, isEditable], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Attendance already marked for this date' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Attendance marked successfully' });
    });
  });
});

// Get attendance stats including past attendance
router.get('/stats', (req, res) => {
  const query = `
    SELECT 
      s.id, s.name, s.code, s.type,
      COUNT(DISTINCT COALESCE(a.date, ma.date)) as total_classes,
      COUNT(DISTINCT CASE WHEN COALESCE(a.status, ma.status) = 'present' 
                     THEN COALESCE(a.date, ma.date) END) as present_count,
      ROUND(
        (COUNT(DISTINCT CASE WHEN COALESCE(a.status, ma.status) = 'present' 
                        THEN COALESCE(a.date, ma.date) END) * 100.0 / 
         COUNT(DISTINCT COALESCE(a.date, ma.date))), 2
      ) as percentage
    FROM subjects s
    LEFT JOIN attendance a ON s.id = a.subject_id
    LEFT JOIN manual_attendance ma ON s.id = ma.subject_id
    WHERE a.date IS NOT NULL OR ma.date IS NOT NULL
    GROUP BY s.id, s.name, s.code, s.type
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Get attendance by subject
router.get('/subject/:id', (req, res) => {
  db.all('SELECT * FROM attendance WHERE subject_id = ? ORDER BY date DESC', 
    req.params.id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get all attendance
router.get('/', (req, res) => {
  const query = `
    SELECT a.*, s.name as subject_name, s.type
    FROM attendance a
    JOIN subjects s ON a.subject_id = s.id
    ORDER BY a.date DESC
  `;
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Check if attendance is still editable (within 2 days, past dates only)
    const today = new Date();
    const updatedRows = (rows || []).map(row => {
      const attDate = new Date(row.date);
      const diffTime = today - attDate; // Don't use Math.abs
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...row,
        is_editable: (diffDays >= 0 && diffDays <= 2) ? 1 : 0
      };
    });
    
    console.log('Attendance fetched:', updatedRows.length);
    res.json({ data: updatedRows });
  });
});

// Update attendance
router.put('/:id', (req, res) => {
  const { status, reason } = req.body;
  const attendanceId = req.params.id;
  
  // First check if attendance exists and is editable
  db.get('SELECT * FROM attendance WHERE id = ?', [attendanceId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Attendance record not found' });
    
    // Check if still editable (within 2 days and not future dates)
    const today = new Date();
    const attDate = new Date(row.date);
    const diffTime = today - attDate; // Don't use Math.abs
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 || diffDays > 2) {
      return res.status(400).json({ error: 'Attendance can only be edited for past 2 days' });
    }
    
    // Update attendance
    db.run('UPDATE attendance SET status = ? WHERE id = ?', [status, attendanceId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log manual attendance change if reason provided
      if (reason) {
        db.run('INSERT INTO manual_attendance (subject_id, date, status, reason) VALUES (?, ?, ?, ?)',
          [row.subject_id, row.date, status, reason], (err) => {
          if (err) console.error('Error logging manual attendance:', err);
        });
      }
      
      res.json({ message: 'Attendance updated successfully' });
    });
  });
});

// Mark manual attendance for missed days
router.post('/manual', (req, res) => {
  const { subject_id, date, status, reason } = req.body;
  
  // Insert into both attendance and manual_attendance tables
  db.run('INSERT OR REPLACE INTO attendance (subject_id, date, status, is_editable, created_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)', 
    [subject_id, date, status], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Log in manual attendance
    db.run('INSERT INTO manual_attendance (subject_id, date, status, reason) VALUES (?, ?, ?, ?)',
      [subject_id, date, status, reason], (err) => {
      if (err) console.error('Error logging manual attendance:', err);
    });
    
    res.json({ message: 'Manual attendance marked successfully' });
  });
});

export default router;