// Global variables
document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector("form");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form submission

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Dummy authentication (Replace with real backend validation)
        if (email === "admin@hostel.com" && password === "123456") {
            alert("Login Successful!");
            window.location.href = "dashboard.html"; // Redirect to the dashboard
        } else {
            alert("Invalid Email or Password. Try again.");
        }
    });
});

// Constants for Google Sheets API
const API_KEY = 'AIzaSyC652GuH15p4wCy97mND6J5MQizY5LRyTk'; // Replace with your Google API key
const SPREADSHEET_ID = '2PACX-1vSaSdJLkIsar0KcNXjIXrv3PuYfCY_zvcMnr3J8yu-oH3n7CnHeoF-3T2n6VFF9Wvvgn4tPdV4iyxLn'; // Replace with your Google Sheet ID
const SHEET_NAME = 'Attendance';

// Initialize Google API client
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  }).then(() => {
    console.log('Google API client initialized');
    if (isLoggedIn) {
      document.getElementById('confirmBtn').disabled = false;
    }
  }).catch(error => {
    console.error('Error initializing Google API client', error);
  });
}

// Load the Google API client
function loadGapiClient() {
  gapi.load('client', initClient);
}


  // Clear student details
  document.getElementById('studentDetails').innerHTML = '';
  document.getElementById('confirmBtn').style.display = 'none';
}

// Function to handle student scan - improved for multiple scan methods
function handleStudentScan() {
  const studentId = document.getElementById('scannerInput').value.trim();
  
  if (!studentId) {
    alert('Please enter a valid Student ID');
    return;
  }
  
  // Fetch student data from Google Sheet
  fetchStudentDataFromSheet(studentId);
}

// Function to fetch student data from the Google Sheet
function fetchStudentDataFromSheet(studentId) {
  if (!isLoggedIn) {
    alert('Please log in first');
    return;
  }
  
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME
  }).then(response => {
    const values = response.result.values;
    if (!values) {
      alert('No data found in spreadsheet');
      return;
    }
    
    // Find the student row
    let studentRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === studentId) {
        studentRowIndex = i;
        break;
      }
    }
    
    if (studentRowIndex === -1) {
      alert('Student ID not found');
      return;
    }
    
    // Get student details from the first columns
    const studentData = {
      id: values[studentRowIndex][0],
      name: values[studentRowIndex][1] || 'N/A',
      room: values[studentRowIndex][2] || 'N/A',
      course: values[studentRowIndex][3] || 'N/A'
    };
    
    displayStudentData(studentData);
  }).catch(error => {
    console.error('Error fetching student data', error);
    alert('Failed to fetch student data. Please try again.');
  });
}

// Function to display student data on the page
function displayStudentData(student) {
  const detailsContainer = document.getElementById('studentDetails');
  detailsContainer.innerHTML = `
    <div class="student-card">
      <h3>${student.name}</h3>
      <p>ID: ${student.id}</p>
      <p>Room: ${student.room}</p>
      <p>Course: ${student.course}</p>
    </div>
  `;
  
  // Show confirm button after student is displayed
  document.getElementById('confirmBtn').style.display = 'block';
  
  // Store the current student ID for the confirm button
  document.getElementById('confirmBtn').dataset.studentId = student.id;
}

// Function to mark attendance in Google Sheets
function markAttendance() {
  if (!isLoggedIn) {
    alert('Please log in first');
    return;
  }
  
  const studentId = document.getElementById('confirmBtn').dataset.studentId;
  if (!studentId) {
    alert('No student selected');
    return;
  }
  
  const today = new Date();
  const day = today.getDate(); // Get the day of the month (1-31)
  
  // Find the column for today's date and update attendance
  markAttendanceInSheet(studentId, day)
    .then(() => {
      alert('Attendance marked successfully!');
      // Clear the student details
      document.getElementById('studentDetails').innerHTML = '';
      document.getElementById('confirmBtn').style.display = 'none';
      // Clear the scanner input
      document.getElementById('scannerInput').value = '';
      document.getElementById('scannerInput').focus();
    })
    .catch(error => {
      console.error('Error marking attendance', error);
      alert('Failed to mark attendance. Please try again.');
    });
}

// Function to mark attendance in the Google Sheet
function markAttendanceInSheet(studentId, day) {
  return gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME
  }).then(response => {
    const values = response.result.values;
    if (!values) {
      throw new Error('No data found in spreadsheet');
    }
    
    // Find the student row
    let studentRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === studentId) {
        studentRowIndex = i;
        break;
      }
    }
    
    if (studentRowIndex === -1) {
      throw new Error('Student ID not found');
    }
    
    // Day column starts after student details (ID, Name, Room, Course)
    // So day 1 would be column 4 (index 4), day 2 would be column 5 (index 5), etc.
    const dayColumnIndex = 3 + day; // 4 student detail columns (starting from 0)
    
    // A1 notation for the cell to update
    const cellRange = `${SHEET_NAME}!${columnToLetter(dayColumnIndex + 1)}${studentRowIndex + 1}`;
    
    // Update the cell with 'Present' value and green background
    return updateCell(cellRange, 'Present', 'green');
  });
}

// Convert column index to letter (1 = A, 2 = B, etc.)
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

// Update a cell with a value and background color
function updateCell(range, value, color) {
  // First update the cell value
  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'RAW',
    resource: {
      values: [[value]]
    }
  }).then(() => {
    // Then update the cell formatting
    return gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          repeatCell: {
            range: {
              sheetName: SHEET_NAME,
              startRowIndex: parseInt(range.split('!')[1].match(/\d+/)[0]) - 1,
              endRowIndex: parseInt(range.split('!')[1].match(/\d+/)[0]),
              startColumnIndex: letterToColumn(range.split('!')[1].match(/[A-Z]+/)[0]) - 1,
              endColumnIndex: letterToColumn(range.split('!')[1].match(/[A-Z]+/)[0])
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: color === 'green' ? 0.0 : 1.0,
                  green: color === 'green' ? 1.0 : 0.0,
                  blue: 0.0
                }
              }
            },
            fields: 'userEnteredFormat.backgroundColor'
          }
        }]
      }
    });
  });
}

// Convert column letter to index (A = 1, B = 2, etc.)
function letterToColumn(letter) {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, letter.length - i - 1);
  }
  return column;
}

// Function to create a new month's attendance sheet (1-31 days)
function createMonthlyAttendanceSheet() {
  if (!isLoggedIn) {
    alert('Please log in first');
    return;
  }
  
  if (!confirm('This will create a new attendance sheet with days 1-31. Continue?')) {
    return;
  }
  
  // Header row with student details and days 1-31
  const headerRow = ['Student ID', 'Name', 'Room', 'Course'];
  for (let day = 1; day <= 31; day++) {
    headerRow.push(day.toString());
  }
  
  gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME + '!A1',
    valueInputOption: 'RAW',
    resource: {
      values: [headerRow]
    }
  }).then(response => {
    console.log('Sheet headers created successfully');
    alert('Monthly attendance sheet created successfully!');
  }).catch(error => {
    console.error('Error creating sheet', error);
    alert('Failed to create attendance sheet. See console for details.');
  });
}

// Add event listeners when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Load the Google API client
  loadGapiClient();
  
  // Start with login form visible, attendance system hidden
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('attendanceSystem').style.display = 'none';
  
  // Add event listener for login form submission
  document.getElementById('loginBtn').addEventListener('click', function(e) {
    e.preventDefault();
    login();
  });
  
  // Add event listener for logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // Add event listener for confirm button
  document.getElementById('confirmBtn').addEventListener('click', markAttendance);
  
  // Add event listener for scanner input
  document.getElementById('scannerInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStudentScan();
    }
  });
  
  // Add event listener for scan button (alternative to using Enter key)
  document.getElementById('scanBtn').addEventListener('click', function() {
    handleStudentScan();
  });
  
  // Add event listener for create sheet button
  document.getElementById('createSheetBtn').addEventListener('click', createMonthlyAttendanceSheet);
});

