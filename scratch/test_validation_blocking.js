// Test validation blocking logic of handleInitiateCall

const assert = require('assert');

// Imported validation functions
const validateName = (name) => {
  const trimmed = name.trim();
  if (!trimmed) return "Name cannot be empty.";
  if (trimmed.length < 2) return "Name must be at least 2 characters long.";
  if (trimmed.length >= 150) return "Name must be less than 150 characters.";
  if (/\d/.test(trimmed)) return "Name cannot contain numbers.";
  const nameRegex = /^[A-Za-z\s\u0900-\u097F\.\-]+$/;
  if (!nameRegex.test(trimmed)) return "Name cannot contain special characters.";
  return null;
};

const validateAmount = (amountStr) => {
  const trimmed = amountStr ? String(amountStr).trim() : "";
  if (!trimmed) return "Loan amount cannot be empty.";
  const num = Number(trimmed);
  if (isNaN(num)) return "Loan amount must be a valid number.";
  if (num < 0) return "Loan amount cannot be negative.";
  if (num === 0) return "Loan amount must be greater than 0.";
  if (!Number.isInteger(num)) return "Loan amount must be a whole number (decimals are not supported).";
  if (num > 50000000) return "Loan amount cannot exceed ₹50,000,000.";
  return null;
};

const validateBank = (bank) => {
  const trimmed = bank ? String(bank).trim() : "";
  if (!trimmed) return "Bank name cannot be empty.";
  if (/\d/.test(trimmed)) return "Bank name cannot contain numbers.";
  const bankRegex = /^[A-Za-z\s\u0900-\u097F\.\-&]+$/;
  if (!bankRegex.test(trimmed)) return "Bank name cannot contain special characters.";
  return null;
};

const validatePhone = (phoneStr) => {
  const cleaned = phoneStr ? String(phoneStr).replace(/\s+/g, '') : "";
  if (!cleaned) return "Phone number cannot be empty.";
  if (/[A-Za-z]/.test(cleaned)) return "Phone number cannot contain letters.";
  const isSpecialChar = /[^\d]/.test(cleaned.startsWith('+') ? cleaned.slice(1) : cleaned);
  if (isSpecialChar) return "Phone number cannot contain special characters.";
  if (cleaned.startsWith('+')) {
    if (!cleaned.startsWith('+91')) return "Invalid country code. Only +91 is supported.";
    const digitsPart = cleaned.slice(3);
    if (digitsPart.length < 10) return "Phone number must be at least 10 digits.";
    if (digitsPart.length > 10) return "Phone number cannot exceed 10 digits.";
  } else {
    if (cleaned.length < 10) return "Phone number must be at least 10 digits.";
    if (cleaned.length > 10) return "Phone number cannot exceed 10 digits.";
  }
  return null;
};

const validateDate = (dateStr) => {
  const trimmed = dateStr ? String(dateStr).trim() : "";
  if (!trimmed) return { error: "Due date cannot be empty.", warning: null };
  const parsedDate = new Date(trimmed);
  if (isNaN(parsedDate.getTime())) return { error: "Invalid date format. Please enter a valid date.", warning: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(parsedDate);
  compareDate.setHours(0, 0, 0, 0);
  if (compareDate.getTime() < today.getTime()) {
    return { error: null, warning: "Warning: Due date is in the past." };
  }
  return { error: null, warning: null };
};

// Simulated component state holder
class FormSubmissionSimulator {
  constructor(name, amount, bank, phone, date) {
    this.customerName = name;
    this.amount = amount;
    this.bankName = bank;
    this.phone = phone;
    this.dueDate = date;

    this.nameError = null;
    this.amountError = null;
    this.bankError = null;
    this.phoneError = null;
    this.dateError = null;
    this.dateWarning = null;

    this.isCallActive = false;
  }

  // Mimics the handleInitiateCall behavior
  handleInitiateCall() {
    const trimmedName = this.customerName.trim();
    const trimmedBank = this.bankName.trim();
    const formattedPhone = this.phone ? String(this.phone).replace(/\s+/g, '') : "";

    const nameErr = validateName(trimmedName);
    const amtErr = validateAmount(this.amount);
    const bankErr = validateBank(trimmedBank);
    const phoneErr = validatePhone(formattedPhone);
    const dateVal = validateDate(this.dueDate);

    this.nameError = nameErr;
    this.amountError = amtErr;
    this.bankError = bankErr;
    this.phoneError = phoneErr;
    this.dateError = dateVal.error;
    this.dateWarning = dateVal.warning;

    if (nameErr || amtErr || bankErr || phoneErr || dateVal.error) {
      return; // Validation fails: Call is blocked!
    }

    this.isCallActive = true; // Validation passes: Call is started!
  }
}

// Tests
console.log("Running Validation Blocking logic tests...\n");

// 1. All valid inputs -> Call should trigger
const s1 = new FormSubmissionSimulator("Mahima Dangi", "5000", "ICICI", "+919876543210", "June 30, 2026");
s1.handleInitiateCall();
assert.strictEqual(s1.isCallActive, true, "Call should have started successfully");
assert.strictEqual(s1.nameError, null);
assert.strictEqual(s1.amountError, null);
assert.strictEqual(s1.bankError, null);
assert.strictEqual(s1.phoneError, null);
assert.strictEqual(s1.dateError, null);
console.log("✔ Test Case 1: Valid inputs starts call successfully.");

// 2. Name is invalid, others valid -> Call blocked
const s2 = new FormSubmissionSimulator("Mahima123", "5000", "ICICI", "+919876543210", "June 30, 2026");
s2.handleInitiateCall();
assert.strictEqual(s2.isCallActive, false, "Call must be blocked");
assert.strictEqual(s2.nameError, "Name cannot contain numbers.");
console.log("✔ Test Case 2: Invalid Name blocks call and sets nameError.");

// 3. Date format is invalid -> Call blocked
const s3 = new FormSubmissionSimulator("Mahima Dangi", "5000", "ICICI", "+919876543210", "not-a-date");
s3.handleInitiateCall();
assert.strictEqual(s3.isCallActive, false, "Call must be blocked");
assert.strictEqual(s3.dateError, "Invalid date format. Please enter a valid date.");
console.log("✔ Test Case 3: Invalid Date blocks call and sets dateError.");

// 4. Multiple fields invalid -> Call blocked, all errors set simultaneously
const s4 = new FormSubmissionSimulator("Mahima123", "abc", "ICICI 45", "9876", "not-a-date");
s4.handleInitiateCall();
assert.strictEqual(s4.isCallActive, false, "Call must be blocked");
assert.ok(s4.nameError !== null, "Name error should be set");
assert.ok(s4.amountError !== null, "Amount error should be set");
assert.ok(s4.bankError !== null, "Bank error should be set");
assert.ok(s4.phoneError !== null, "Phone error should be set");
assert.ok(s4.dateError !== null, "Date error should be set");
console.log("✔ Test Case 4: Multiple invalid fields sets all errors and blocks call.");

console.log("\nALL VALIDATION BLOCKING TESTS PASSED SUCCESSFULLY!");
