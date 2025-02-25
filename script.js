// Define the Google Apps Script Web App URL (replace with your actual URL)
const googleAppsScriptUrl = "https://script.google.com/macros/s/AKfycbxExampleURL/exec";

// Sample student data for testing
const sampleStudentData = {
  "112": {
    name: "Mogeshwaran",
    room: "112",
    course: "MBA",
    contact: "9988776655"
  }
  // You can add more sample data entries if needed.
};

// This variable will store the currently scanned student's data
let currentStudentData = null;

// Callback function when a QR code is successfully scanned
function onScanSuccess(decodedText, decodedResult) {
  console.log("Scanned text:", decodedText);
  document.getElementById("student-info").innerText = "Fetching details for room no: " + decodedText;
  
  // Simulate a delay for fetching details (using sample data here)
  setTimeout(() => {
    if (sampleStudentData[decodedText]) {
      const data = sampleStudentData[decodedText];
      currentStudentData = data;
      document.getElementById("student-info").innerHTML = `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Room Number:</strong> ${data.room}</p>
        <p><strong>Course:</strong> ${data.course}</p>
        <p><strong>Contact Detail:</strong> ${data.contact}</p>
      `;
      // Show the Confirm Attendance button when valid data is available
      document.getElementById("confirmBtn").style.display = "inline-block";
    } else {
      currentStudentData = null;
      document.getElementById("student-info").innerText = "Student details not found for room no: " + decodedText;
      document.getElementById("confirmBtn").style.display = "none";
    }
  }, 1000);
}

// Initialize the QR Code Scanner
let html5QrcodeScanner = new Html5QrcodeScanner(
  "reader",
  { fps: 10, qrbox: 250 },
  false
);
html5QrcodeScanner.render(onScanSuccess);

// Event listener for the Confirm Attendance button
document.getElementById("confirmBtn").addEventListener("click", function() {
  if (!currentStudentData) return;

  // Prepare attendance data with the current date
  const attendanceData = {
    date: new Date().toLocaleDateString(),
    name: currentStudentData.name,
    room: currentStudentData.room,
    course: currentStudentData.course,
    contact: currentStudentData.contact
  };

  // Send the attendance data to your Google Apps Script Web App
  fetch(googleAppsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(attendanceData)
  })
  .then(response => response.json())
  .then(data => {
    alert("Attendance confirmed and logged successfully!");
    // Optionally, hide the button after confirmation
    document.getElementById("confirmBtn").style.display = "none";
  })
  .catch(error => {
    console.error("Error:", error);
    alert("There was an error logging the attendance.");
  });
});
