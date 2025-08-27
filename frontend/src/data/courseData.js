// Course structure for the new semester
export const courseData = {
  "PCC": [
    { "code": "2304311T", "name": "Operating Systems", "credits": 3, "totalMarks": 100, "type": "theory" },
    { "code": "2304311L", "name": "Operating Systems Lab", "credits": 1, "totalMarks": 50, "type": "lab" },
    { "code": "2304312T", "name": "Computer Networks", "credits": 3, "totalMarks": 100, "type": "theory" },
    { "code": "2304312L", "name": "Computer Networks Lab", "credits": 1, "totalMarks": 50, "type": "lab" }
  ],
  "PEC": {
    "choices": [
      {
        "theory": { "code": "2304321T", "name": "Exploratory Data Analytics", "credits": 3, "totalMarks": 100, "type": "theory" },
        "lab": { "code": "2304321L", "name": "Exploratory Data Analytics Lab", "credits": 1, "totalMarks": 50, "type": "lab" }
      },
      {
        "theory": { "code": "2304322T", "name": "Artificial Intelligence Machine Learning", "credits": 3, "totalMarks": 100, "type": "theory" },
        "lab": { "code": "2304322L", "name": "Artificial Intelligence Machine Learning Lab", "credits": 1, "totalMarks": 50, "type": "lab" }
      },
      {
        "theory": { "code": "2304323T", "name": "Cloud Computing Foundation", "credits": 3, "totalMarks": 100, "type": "theory" },
        "lab": { "code": "2304323L", "name": "Cloud Computing Foundation Lab", "credits": 1, "totalMarks": 50, "type": "lab" }
      },
      {
        "theory": { "code": "2304324T", "name": "Cryptography and Information Security", "credits": 3, "totalMarks": 100, "type": "theory" },
        "lab": { "code": "2304324L", "name": "Cryptography and Information Security Lab", "credits": 1, "totalMarks": 50, "type": "lab" }
      }
    ]
  },
  "VSEC": {
    "choices": [
      { "code": "2304361L", "name": "Linux Administration-I", "credits": 2, "totalMarks": 75, "type": "lab" },
      { "code": "2304362L", "name": "Web Technology", "credits": 2, "totalMarks": 75, "type": "lab" },
      { "code": "2304363L", "name": "Mobile Application Development", "credits": 2, "totalMarks": 75, "type": "lab" },
      { "code": "2304364L", "name": "UI/UX Design", "credits": 2, "totalMarks": 75, "type": "lab" }
    ]
  },
  "MDM": {
    "choices": [
      {
        "theory": { "code": "MDM-101T", "name": "Multi Disciplinary Minor Course-II (AI in Healthcare)", "credits": 2, "totalMarks": 75, "type": "theory" },
        "lab": { "code": "MDM-101L", "name": "Multi Disciplinary Minor Course-II Lab (AI in Healthcare Lab)", "credits": 1, "totalMarks": 50, "type": "lab" }
      },
      {
        "theory": { "code": "MDM-102T", "name": "Multi Disciplinary Minor Course-II (Data Science for Business)", "credits": 2, "totalMarks": 75, "type": "theory" },
        "lab": { "code": "MDM-102L", "name": "Multi Disciplinary Minor Course-II Lab (Data Science for Business Lab)", "credits": 1, "totalMarks": 50, "type": "lab" }
      },
      {
        "theory": { "code": "MDM-103T", "name": "Multi Disciplinary Minor Course-II (Green Energy Systems)", "credits": 2, "totalMarks": 75, "type": "theory" },
        "lab": { "code": "MDM-103L", "name": "Multi Disciplinary Minor Course-II Lab (Green Energy Systems Lab)", "credits": 1, "totalMarks": 50, "type": "lab" }
      }
    ]
  },
  "ELC": [
    { "code": "2304391L", "name": "Major Project - I", "credits": 2, "totalMarks": 75, "type": "lab" },
    { "code": "2304396L", "name": "Summer Internship (Technical)", "credits": 2, "totalMarks": 75, "type": "lab" }
  ]
};

// Utility to reset all data and load new semester
export const resetAndLoadNewSemester = async () => {
  // Clear all localStorage data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('semester_') || key.includes('subjects') || key.includes('timetable') || key.includes('attendance'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Load PCC subjects (mandatory)
  const subjectsToLoad = [...courseData.PCC];
  
  // Add ELC subjects (mandatory)
  subjectsToLoad.push(...courseData.ELC);
  
  return subjectsToLoad;
};