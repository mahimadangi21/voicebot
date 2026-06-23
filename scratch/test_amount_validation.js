const validateAmount = (amountStr) => {
  const trimmed = amountStr ? String(amountStr).trim() : "";
  
  if (!trimmed) {
    return "Loan amount cannot be empty.";
  }
  
  const num = Number(trimmed);
  if (isNaN(num)) {
    return "Loan amount must be a valid number.";
  }
  
  if (num < 0) {
    return "Loan amount cannot be negative.";
  }
  
  if (num === 0) {
    return "Loan amount must be greater than 0.";
  }
  
  if (!Number.isInteger(num)) {
    return "Loan amount must be a whole number (decimals are not supported).";
  }
  
  if (num > 50000000) {
    return "Loan amount cannot exceed ₹50,000,000.";
  }
  
  return null;
};

// Test Cases
const testCases = [
  { id: "LOAN-001", input: "5000", expectedAccept: true },
  { id: "LOAN-002", input: "", expectedAccept: false, expectedError: "Loan amount cannot be empty." },
  { id: "LOAN-003", input: "-50", expectedAccept: false, expectedError: "Loan amount cannot be negative." },
  { id: "LOAN-004", input: "5000.50", expectedAccept: false, expectedError: "Loan amount must be a whole number (decimals are not supported)." },
  { id: "LOAN-005", input: "abc", expectedAccept: false, expectedError: "Loan amount must be a valid number." },
  { id: "LOAN-006", input: "999999999", expectedAccept: false, expectedError: "Loan amount cannot exceed ₹50,000,000." }
];

console.log("Running Loan Amount Validation test suite...\n");
let passed = true;

testCases.forEach((tc) => {
  const error = validateAmount(tc.input);
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
});

if (passed) {
  console.log("\nALL TEST CASES PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("\nSOME TEST CASES FAILED!");
  process.exit(1);
}
