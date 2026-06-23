const validateBank = (bank) => {
  const trimmed = bank ? String(bank).trim() : "";
  
  if (!trimmed) {
    return "Bank name cannot be empty.";
  }
  
  // Reject numbers
  if (/\d/.test(trimmed)) {
    return "Bank name cannot contain numbers.";
  }
  
  // Check for allowed characters: English letters, Devanagari letters, spaces, dots, hyphens, and ampersands
  const bankRegex = /^[A-Za-z\s\u0900-\u097F\.\-&]+$/;
  if (!bankRegex.test(trimmed)) {
    return "Bank name cannot contain special characters.";
  }
  
  return null;
};

// Test Cases
const testCases = [
  { id: "BANK-001", input: "ICICI", expectedAccept: true },
  { id: "BANK-002", input: "SBI", expectedAccept: true },
  { id: "BANK-003", input: "", expectedAccept: false, expectedError: "Bank name cannot be empty." },
  { id: "BANK-004", input: "12345", expectedAccept: false, expectedError: "Bank name cannot contain numbers." },
  { id: "BANK-005", input: "SBI@#$", expectedAccept: false, expectedError: "Bank name cannot contain special characters." },
  { id: "BANK-006", input: "आईसीआईसीआई", expectedAccept: true }, // Hindi name
  { id: "BANK-007", input: "  ICICI Bank  ", expectedAccept: true, expectedTrimmed: "ICICI Bank" } // Trim spaces
];

console.log("Running Bank Name Validation test suite...\n");
let passed = true;

testCases.forEach((tc) => {
  const error = validateBank(tc.input);
  const accepted = error === null;
  
  if (tc.expectedAccept) {
    if (!accepted) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" was REJECTED with error: "${error}", expected ACCEPT.`);
      passed = false;
    } else {
      console.log(`PASS: ${tc.id} with input "${tc.input}" was correctly ACCEPTED.`);
    }
  } else {
    if (accepted) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" was ACCEPTED, expected REJECT with error: "${tc.expectedError}".`);
      passed = false;
    } else if (error !== tc.expectedError) {
      console.error(`FAIL: ${tc.id} with input "${tc.input}" returned error: "${error}", expected: "${tc.expectedError}".`);
      passed = false;
    } else {
      console.log(`PASS: ${tc.id} with input "${tc.input}" was correctly REJECTED with error: "${error}".`);
    }
  }
  
  if (tc.expectedTrimmed) {
    const trimmed = tc.input.trim();
    if (trimmed !== tc.expectedTrimmed) {
      console.error(`FAIL: ${tc.id} trim check failed. Result: "${trimmed}", expected: "${tc.expectedTrimmed}"`);
      passed = false;
    } else {
      console.log(`PASS: ${tc.id} leading/trailing spaces successfully trimmed.`);
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
