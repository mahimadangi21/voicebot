const validateDate = (dateStr, nowTime = new Date().getTime()) => {
  const trimmed = dateStr ? String(dateStr).trim() : "";
  
  if (!trimmed) {
    return { error: "Due date cannot be empty.", warning: null };
  }
  
  const parsedDate = new Date(trimmed);
  if (isNaN(parsedDate.getTime())) {
    return { error: "Invalid date format. Please enter a valid date.", warning: null };
  }
  
  // Get today's date (ignoring time)
  const today = new Date(nowTime);
  today.setHours(0, 0, 0, 0);
  
  // Set parsed date time to midnight for exact date comparison
  const compareDate = new Date(parsedDate);
  compareDate.setHours(0, 0, 0, 0);
  
  if (compareDate.getTime() < today.getTime()) {
    return { error: null, warning: "Warning: Due date is in the past." };
  }
  
  return { error: null, warning: null };
};

// Mock "today" as June 23, 2026
const MOCK_TODAY = new Date("2026-06-23T12:00:00").getTime();

const testCases = [
  { id: "DATE-001", input: "June 30, 2026", expectedAccept: true },
  { id: "DATE-002", input: "June 23, 2026", expectedAccept: true },
  { id: "DATE-003", input: "June 15, 2026", expectedAccept: true, expectedWarning: "Warning: Due date is in the past." },
  { id: "DATE-004", input: "abc", expectedAccept: false, expectedError: "Invalid date format. Please enter a valid date." },
  { id: "DATE-004-empty", input: "", expectedAccept: false, expectedError: "Due date cannot be empty." }
];

console.log("Running Due Date Validation test suite...\n");
let passed = true;

testCases.forEach((tc) => {
  const result = validateDate(tc.input, MOCK_TODAY);
  
  if (tc.expectedAccept) {
    if (result.error !== null) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" was REJECTED with error: "${result.error}", expected ACCEPT.`);
      passed = false;
    } else if (tc.expectedWarning && result.warning !== tc.expectedWarning) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" returned warning: "${result.warning}", expected warning: "${tc.expectedWarning}".`);
      passed = false;
    } else if (!tc.expectedWarning && result.warning !== null) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" returned unexpected warning: "${result.warning}".`);
      passed = false;
    } else {
      const msg = result.warning ? `ACCEPTED with Warning ("${result.warning}")` : "ACCEPTED";
      console.log(`PASS: ${tc.id} with input "${tc.input}" was correctly ${msg}.`);
    }
  } else {
    if (result.error === null) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" was ACCEPTED, expected REJECT with error: "${tc.expectedError}".`);
      passed = false;
    } else if (result.error !== tc.expectedError) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" returned error: "${result.error}", expected: "${tc.expectedError}".`);
      passed = false;
    } else {
      console.log(`PASS: ${tc.id} with input "${tc.input}" was correctly REJECTED with error: "${result.error}".`);
    }
  }
});

if (passed) {
  console.log("\nALL TEST CASES PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("\nSOME TEST CASES FAILED!");
  process.exit(1);
}
