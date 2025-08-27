import express from 'express';
import db from '../database.js';

const router = express.Router();

// Grade calculation function
const calculateGrade = (percentage) => {
  if (percentage >= 91) return { grade: 'O', points: 10 };
  if (percentage >= 81) return { grade: 'A+', points: 9 };
  if (percentage >= 71) return { grade: 'A', points: 8 };
  if (percentage >= 61) return { grade: 'B+', points: 7 };
  if (percentage >= 51) return { grade: 'B', points: 6 };
  if (percentage >= 40) return { grade: 'C', points: 5 };
  return { grade: 'F', points: 0 };
};

// Get marks by subject
router.get('/subject/:id', (req, res) => {
  const query = `
    SELECT m.*, s.name as subject_name, s.type, s.credits
    FROM marks m
    JOIN subjects s ON m.subject_id = s.id
    WHERE m.subject_id = ?
    ORDER BY m.exam_type, m.test_number
  `;
  db.all(query, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add marks
router.post('/', (req, res) => {
  const { subject_id, exam_type, test_number, marks_obtained, max_marks, exam_date } = req.body;
  
  const percentage = (marks_obtained / max_marks) * 100;
  const gradeInfo = calculateGrade(percentage);
  
  db.run(`INSERT INTO marks (subject_id, exam_type, test_number, marks_obtained, max_marks, 
           percentage, grade, grade_points, exam_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [subject_id, exam_type, test_number || 1, marks_obtained, max_marks, 
     percentage, gradeInfo.grade, gradeInfo.points, exam_date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      id: this.lastID, 
      percentage: percentage.toFixed(2), 
      grade: gradeInfo.grade, 
      grade_points: gradeInfo.points 
    });
  });
});

// Get all marks with subject info
router.get('/', (req, res) => {
  const query = `
    SELECT m.*, s.name as subject_name, s.type, s.credits, s.code
    FROM marks m
    JOIN subjects s ON m.subject_id = s.id
    ORDER BY s.name, m.exam_type, m.test_number
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete marks
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM marks WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Marks deleted' });
  });
});

export default router;