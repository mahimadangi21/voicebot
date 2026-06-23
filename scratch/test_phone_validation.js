const validatePhone = (phoneStr) => {
  const cleaned = phoneStr ? String(phoneStr).replace(/\s+/g, '') : "";
  
  if (!cleaned) {
    return "Phone number cannot be empty.";
  }
  
  // Reject letters
  if (/[A-Za-z]/.test(cleaned)) {
    return "Phone number cannot contain letters.";
  }
  
  // Reject any special character other than leading '+'
  const isSpecialChar = /[^\d]/.test(cleaned.startsWith('+') ? cleaned.slice(1) : cleaned);
  if (isSpecialChar) {
    return "Phone number cannot contain special characters.";
  }
  
  // Validate country code and digit count
  if (cleaned.startsWith('+')) {
    if (!cleaned.startsWith('+91')) {
      return "Invalid country code. Only +91 is supported.";
    }
    const digitsPart = cleaned.slice(3);
    if (digitsPart.length < 10) {
      return "Phone number must be at least 10 digits.";
    }
    if (digitsPart.length > 10) {
      return "Phone number cannot exceed 10 digits.";
    }
  } else {
    if (cleaned.length < 10) {
      return "Phone number must be at least 10 digits.";
    }
    if (cleaned.length > 10) {
      return "Phone number cannot exceed 10 digits.";
    }
  }
  
  return null;
};

// Test Cases
const testCases = [
  { id: "PHONE-001", input: "+919876543210", expectedAccept: true },
  { id: "PHONE-002", input: "9876543210", expectedAccept: true },
  { id: "PHONE-003", input: "987654321", expectedAccept: false, expectedError: "Phone number must be at least 10 digits." },
  { id: "PHONE-004", input: "98765432101", expectedAccept: false, expectedError: "Phone number cannot exceed 10 digits." },
  { id: "PHONE-005", input: "98765abc10", expectedAccept: false, expectedError: "Phone number cannot contain letters." },
  { id: "PHONE-006", input: "", expectedAccept: false, expectedError: "Phone number cannot be empty." },
  { id: "PHONE-007", input: "+19876543210", expectedAccept: false, expectedError: "Invalid country code. Only +91 is supported." },
  { id: "PHONE-008", input: "+91 98765 43210", expectedAccept: true, expectedFormatted: "+919876543210" },
  { id: "PHONE-008-2", input: "98765 43210", expectedAccept: true, expectedFormatted: "9876543210" }
];

console.log("Running Phone Number Validation test suite...\n");
let passed = true;

testCases.forEach((tc) => {
  const error = validatePhone(tc.input);
  const accepted = error === null;
  const cleaned = tc.input ? String(tc.input).replace(/\s+/g, '') : "";
  
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
  
  if (tc.expectedFormatted) {
    if (cleaned !== tc.expectedFormatted) {
      console.error(`FAIL: ${tc.id} format check failed. Result: "${cleaned}", expected: "${tc.expectedFormatted}"`);
      passed = false;
    } else {
      console.log(`PASS: ${tc.id} leading/trailing/interspersed spaces successfully stripped to "${cleaned}".`);
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
