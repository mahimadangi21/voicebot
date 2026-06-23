const validateName = (name) => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return "Name cannot be empty.";
  }
  if (trimmed.length < 2) {
    return "Name must be at least 2 characters long.";
  }
  if (trimmed.length >= 150) {
    return "Name must be less than 150 characters.";
  }
  
  if (/\d/.test(trimmed)) {
    return "Name cannot contain numbers.";
  }
  
  const nameRegex = /^[A-Za-z\s\u0900-\u097F\.\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return "Name cannot contain special characters.";
  }
  
  return null;
};

// Test Cases
const testCases = [
  { id: "NAME-001", input: "Mahima Dangi", expectedAccept: true },
  { id: "NAME-002", input: "", expectedAccept: false, expectedError: "Name cannot be empty." },
  { id: "NAME-003", input: "A", expectedAccept: false, expectedError: "Name must be at least 2 characters long." },
  { id: "NAME-004", input: "a".repeat(150), expectedAccept: false, expectedError: "Name must be less than 150 characters." },
  { id: "NAME-005", input: "123456", expectedAccept: false, expectedError: "Name cannot contain numbers." },
  { id: "NAME-006", input: "Mahima@#$", expectedAccept: false, expectedError: "Name cannot contain special characters." },
  { id: "NAME-007", input: "महिमा", expectedAccept: true },
  { id: "NAME-008", input: "  Mahima Dangi  ", expectedAccept: true, expectedTrimmed: "Mahima Dangi" }
];

console.log("Running Customer Name Validation test suite...\n");
let passed = true;

testCases.forEach((tc) => {
  const error = validateName(tc.input);
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
