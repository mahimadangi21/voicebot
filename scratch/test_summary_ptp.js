// Mock configuration variables
const customerName = "Mahima Dangi";
const amount = "5000";
const bankName = "ICICI";

// Mock generateCallSummary logic
const generateCallSummary = (finalState, messages) => {
  let outcome = 'Customer Unreachable';
  let promiseToPay = 'No';
  let sentiment = 'Neutral';
  let summaryText = '';

  const userMsgCount = messages.filter(m => m.sender === 'user').length;
  const isEmptyCall = userMsgCount === 0;

  if (finalState === 'PAYMENT_CONFIRM') {
    outcome = 'Payment Link Dispatched';
    promiseToPay = 'Yes';
    sentiment = 'Positive / Cooperative';
    summaryText = `${customerName} agreed to pay the outstanding loan balance of ₹${parseFloat(amount).toLocaleString()} for ${bankName} immediately. A secure payment link has been dispatched to their registered mobile number.`;
  } else if (finalState === 'CALL_ENDED_SUCCESS') {
    outcome = 'Promise to Pay (PTP) Secured';
    promiseToPay = 'Yes';
    sentiment = 'Positive / Cooperative';
    summaryText = `${customerName} promised to pay the outstanding loan balance of ₹${parseFloat(amount).toLocaleString()} for ${bankName} at a later date. This promise has been recorded in the collection ledger.`;
  } else if (finalState === 'CALL_ENDED_REFUSED') {
    outcome = 'Payment Refused';
    promiseToPay = 'No';
    sentiment = 'Defensive';
    summaryText = `${customerName} acknowledged the outstanding loan of ₹${parseFloat(amount).toLocaleString()} for ${bankName} but refused to make a payment commitment during this interaction. Requires immediate escalation.`;
  } else if (finalState === 'CALL_ENDED_WRONG_NUMBER') {
    outcome = 'Wrong Contact Information';
    promiseToPay = 'No';
    sentiment = 'Neutral';
    summaryText = `The recipient indicated that the contact details for the ${bankName} account with loan amount ₹${parseFloat(amount).toLocaleString()} are incorrect, and they are not ${customerName}.`;
  } else if (finalState === 'CALL_ENDED_UNCLEAR') {
    outcome = 'Customer Unreachable';
    promiseToPay = 'Pending';
    sentiment = 'Neutral';
    summaryText = `The call with ${customerName} regarding the outstanding loan of ₹${parseFloat(amount).toLocaleString()} for ${bankName} was terminated as the customer's responses were unclear or they asked to be contacted later.`;
  } else if (finalState === 'CALL_FAILED') {
    outcome = 'Call Failed / Connection Lost';
    promiseToPay = 'Unknown';
    sentiment = 'N/A';
    summaryText = `The call attempt regarding the ${bankName} loan of ₹${parseFloat(amount).toLocaleString()} for ${customerName} failed due to a network connection loss.`;
  } else {
    outcome = 'Customer Unreachable';
    promiseToPay = 'Unknown';
    sentiment = 'Neutral';
    summaryText = `The call with ${customerName} regarding the outstanding loan of ₹${parseFloat(amount).toLocaleString()} for ${bankName} ended abruptly.`;
  }

  if (isEmptyCall) {
    summaryText = `The call attempt to ${customerName} regarding the outstanding loan of ₹${parseFloat(amount).toLocaleString()} for ${bankName} was initiated but ended immediately without customer engagement.`;
  }

  return { outcome, promiseToPay, sentiment, summaryText };
};

// Test Suite
console.log("Running PTP Status & Call Summary Log test suite...\n");
let passed = true;

const mockNormalMessages = [{ sender: "bot", text: "Hello" }, { sender: "user", text: "yes" }];
const mockEmptyMessages = [{ sender: "bot", text: "Hello" }];

const testCases = [
  // PTP Mapping Tests
  { id: "PTP-001-confirm", state: "PAYMENT_CONFIRM", msg: mockNormalMessages, ptp: "Yes" },
  { id: "PTP-001-success", state: "CALL_ENDED_SUCCESS", msg: mockNormalMessages, ptp: "Yes" },
  { id: "PTP-002-refused", state: "CALL_ENDED_REFUSED", msg: mockNormalMessages, ptp: "No" },
  { id: "PTP-002-wrong", state: "CALL_ENDED_WRONG_NUMBER", msg: mockNormalMessages, ptp: "No" },
  { id: "PTP-003-unclear", state: "CALL_ENDED_UNCLEAR", msg: mockNormalMessages, ptp: "Pending" },
  { id: "PTP-004-failed", state: "CALL_FAILED", msg: mockNormalMessages, ptp: "Unknown" },
  
  // Log Text Verifications
  { id: "LOG-001", state: "PAYMENT_CONFIRM", msg: mockNormalMessages, check: (res) => res.summaryText !== "" },
  { id: "LOG-002", state: "PAYMENT_CONFIRM", msg: mockNormalMessages, check: (res) => res.summaryText.includes(customerName) },
  { id: "LOG-003", state: "PAYMENT_CONFIRM", msg: mockNormalMessages, check: (res) => res.summaryText.includes("5,000") },
  { id: "LOG-004", state: "PAYMENT_CONFIRM", msg: mockNormalMessages, check: (res) => res.summaryText.includes(bankName) },
  { id: "LOG-008", state: "PAYMENT_CONFIRM", msg: mockEmptyMessages, check: (res) => res.summaryText.includes("ended immediately without customer engagement") }
];

testCases.forEach((tc) => {
  const result = generateCallSummary(tc.state, tc.msg);
  
  if (tc.ptp) {
    if (result.promiseToPay !== tc.ptp) {
      console.error(`FAIL: ${tc.id} state "${tc.state}". Got PTP: "${result.promiseToPay}", Expected: "${tc.ptp}".`);
      passed = false;
    } else {
      console.log(`PASS: ${tc.id} mapped correctly to PTP: "${result.promiseToPay}".`);
    }
  }
  
  if (tc.check) {
    const ok = tc.check(result);
    if (!ok) {
      console.error(`FAIL: ${tc.id} verification failed. Summary text: "${result.summaryText}".`);
      passed = false;
    } else {
      console.log(`PASS: ${tc.id} verification criteria met.`);
    }
  }
});

if (passed) {
  console.log("\nALL PTP AND LOG SUMMARY TEST CASES PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("\nSOME TEST CASES FAILED!");
  process.exit(1);
}
