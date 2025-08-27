# Academic Calendar PDF

## How to Upload Academic Calendar

1. **File Location**: Place your academic calendar PDF file in this folder
2. **File Name**: Rename your PDF to `academic-calendar.pdf`
3. **File Path**: The complete path should be:
   ```
   ClassConnect/frontend/public/assets/documents/academic-calendar.pdf
   ```

## File Requirements

- **Format**: PDF only
- **File Name**: Must be exactly `academic-calendar.pdf`
- **Size**: Recommended under 10MB for faster loading
- **Content**: Should contain your institution's academic calendar

## Example File Structure
```
frontend/
├── public/
│   ├── assets/
│   │   ├── documents/
│   │   │   ├── academic-calendar.pdf  ← Your PDF goes here
│   │   │   └── README.md
│   │   └── ...
│   └── ...
└── ...
```

## Usage

Once uploaded, students can click the "📝 View Calendar" button in the Timetable section to open the PDF in a new tab.

## Notes

- The PDF will be accessible at: `http://localhost:5173/assets/documents/academic-calendar.pdf`
- Make sure the file is named exactly `academic-calendar.pdf`
- If you change the filename, update the path in `TimetableManager.jsx`