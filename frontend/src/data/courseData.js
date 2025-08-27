// Empty course data - no predefined subjects
export const courseData = {
  PCC: [],
  PEC: { choices: [] },
  VSEC: { choices: [] },
  MDM: { choices: [] },
  ELC: []
};

// Utility to reset all data
export const resetAndLoadNewSemester = async () => {
  // Clear all localStorage data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('subjects') ||
      key.includes('timetable') ||
      key.includes('attendance') ||
      key.includes('marks') ||
      key.includes('holidays') ||
      key.includes('semester') ||
      key.includes('nonWorkingDays')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('All data cleared');
  return [];
};