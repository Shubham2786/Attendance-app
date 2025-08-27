// Clear all subject and related data
export const clearAllData = () => {
  // Clear subjects
  localStorage.removeItem('subjects');
  
  // Clear timetable
  localStorage.removeItem('timetable');
  
  // Clear attendance
  localStorage.removeItem('attendance');
  
  // Clear marks for all semesters
  for (let i = 1; i <= 10; i++) {
    localStorage.removeItem(`semester_${i}_marks`);
  }
  
  // Clear holidays
  localStorage.removeItem('holidays');
  localStorage.removeItem('eventsHolidays');
  
  // Clear non-working days
  localStorage.removeItem('nonWorkingDays');
  
  // Clear semester data
  localStorage.removeItem('semester');
  localStorage.removeItem('currentSemester');
  localStorage.removeItem('pastSGPA');
  
  console.log('All data cleared successfully!');
  alert('All subject data has been cleared. Please refresh the page.');
};

// Call this function to clear data
// clearAllData();