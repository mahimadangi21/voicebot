// Mock formatting functions from VoiceBot.jsx
const formatTimer = (totalSecs) => {
  if (totalSecs < 0 || isNaN(totalSecs)) return "00:00";
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatSummaryDuration = (totalSecs, finalState) => {
  const formatted = formatTimer(totalSecs);
  if (finalState === 'CALL_FAILED') {
    return `${formatted} (Failed Call)`;
  }
  if (totalSecs === 0) {
    if (finalState === 'CALL_ENDED_UNCLEAR' || finalState === 'CALL_ENDED_WRONG_NUMBER') {
      return "00:00 (Not Connected)";
    }
    return "00:00 (Ended immediately)";
  }
  return formatted;
};

// Test cases
const testCases = [
  { id: "DUR-001", secs: 45, state: "CALL_ENDED_SUCCESS", expected: "00:45" },
  { id: "DUR-002", secs: 1800, state: "CALL_ENDED_SUCCESS", expected: "30:00" },
  { id: "DUR-002-1hr", secs: 3900, state: "CALL_ENDED_SUCCESS", expected: "01:05:00" },
  { id: "DUR-003-ended", secs: 0, state: "CALL_ENDED_SUCCESS", expected: "00:00 (Ended immediately)" },
  { id: "DUR-003-not-connected", secs: 0, state: "CALL_ENDED_WRONG_NUMBER", expected: "00:00 (Not Connected)" },
  { id: "DUR-004-midcall", secs: 12, state: "CALL_FAILED", expected: "00:12 (Failed Call)" },
  { id: "DUR-004-failed", secs: 0, state: "CALL_FAILED", expected: "00:00 (Failed Call)" }
];

console.log("Running Call Duration Formatting test suite...\n");
let passed = true;

testCases.forEach((tc) => {
  const result = formatSummaryDuration(tc.secs, tc.state);
  if (result !== tc.expected) {
    console.error(`FAIL: ${tc.id} with ${tc.secs}s and state "${tc.state}". Got: "${result}", Expected: "${tc.expected}".`);
    passed = false;
  } else {
    console.log(`PASS: ${tc.id} correctly formatted as: "${result}".`);
  }
});

if (passed) {
  console.log("\nALL DURATION FORMATTING TEST CASES PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("\nSOME DURATION FORMATTING TEST CASES FAILED!");
  process.exit(1);
}
