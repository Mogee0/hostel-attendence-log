// Define your Google Apps Script Web App URL (replace with your actual deployed URL)
const googleAppsScriptUrl = "https://script.google.com/macros/s/AKfycbxExampleURL/exec";

// Sample student data for testing (ensure your QR code text matches one of these keys)
const sampleStudentData = {
  "112": {
    name: "Mogeshwaran",
    room: "112",
    course: "MBA",
    contact: "9988776655"
  }
  // Add additional sample entries as needed.
};

// Variable to store currently scanned student data
let currentStudentData = null;

// Callback function when a QR code is successfully scanned
function onScanSuccess(decodedText, decodedResult) {
  console.log("Scanned text:", decodedText);
  document.getElementById("student-info").innerText = "Fetching details for room no: " + decodedText;
  
  // Simulate a delay to fetch details (using sample data here)
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
      // Show the Confirm Attendance button if valid data is available
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
    date: new Date().toLocaleDateString(), // Format can be adjusted if needed
    name: currentStudentData.name,
    room: currentStudentData.room,
    course: currentStudentData.course,
    contact: currentStudentData.contact
  };

  // Send attendance data to the Google Apps Script Web App
  fetch(googleAppsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(attendanceData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.result === "success") {
      alert("Attendance confirmed and logged successfully!");
      // Optionally hide the button after confirmation
      document.getElementById("confirmBtn").style.display = "none";
    } else {
      console.error("Error from server:", data.message);
      alert("There was an error logging the attendance.");
    }
  })
  .catch(error => {
    console.error("Fetch error:", error);
    alert("There was an error logging the attendance.");
  });
});
