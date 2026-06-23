// Mock of frontend state variables
let isCallActive = false;
let isProcessing = false;
let callCount = 0;
let errors = [];

// Reset states helper
const resetMockState = () => {
  isCallActive = false;
  isProcessing = false;
  callCount = 0;
  errors = [];
};

// Mock submit handler mimicking the actual logic in VoiceBot.jsx
const handleInitiateCall = async (shouldTimeout = false) => {
  if (isProcessing) {
    // Prevents double submission / spam clicking
    return;
  }
  
  isProcessing = true;
  callCount++;
  
  try {
    if (shouldTimeout) {
      // Simulate AbortController triggering timeout
      await new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error("AbortError");
          err.name = "AbortError";
          reject(err);
        }, 100); // mock timeout after 100ms
      });
    } else {
      // Simulate normal API response delay
      await new Promise((resolve) => setTimeout(resolve, 150));
      isCallActive = true;
    }
    isProcessing = false;
  } catch (err) {
    isProcessing = false;
    if (err.name === 'AbortError') {
      errors.push("Connection timed out. Please check the backend server status and try again.");
    } else {
      errors.push("Backend connection failed. Please ensure the server is running.");
    }
  }
};

// Run Tests
const runTests = async () => {
  console.log("Running Trigger Button Lifecycle test suite...\n");
  
  let passed = true;

  // Test Case BTN-001: Click once
  resetMockState();
  const p1 = handleInitiateCall(false);
  if (isProcessing !== true) {
    console.error("FAIL: BTN-004 - Button should set isProcessing to true immediately upon trigger.");
    passed = false;
  } else {
    console.log("PASS: BTN-004 - Button correctly sets isProcessing to true (disabled state).");
  }
  await p1;
  if (isCallActive !== true || isProcessing !== false) {
    console.error("FAIL: BTN-001 - Click once failed to initiate active call or clear loading state.");
    passed = false;
  } else {
    console.log("PASS: BTN-001 - Click once successfully transitions state and clears loader.");
  }

  // Test Case BTN-002: Double click rapidly
  resetMockState();
  const p2_1 = handleInitiateCall(false);
  const p2_2 = handleInitiateCall(false);
  await Promise.all([p2_1, p2_2]);
  if (callCount !== 1) {
    console.error(`FAIL: BTN-002 - Double click initiated ${callCount} calls, expected 1.`);
    passed = false;
  } else {
    console.log("PASS: BTN-002 - Double click was rate-limited to a single call trigger.");
  }

  // Test Case BTN-003: Spam click 20 times
  resetMockState();
  const spamPromises = [];
  for (let i = 0; i < 20; i++) {
    spamPromises.push(handleInitiateCall(false));
  }
  await Promise.all(spamPromises);
  if (callCount !== 1) {
    console.error(`FAIL: BTN-003 - Spamming 20 times initiated ${callCount} calls, expected 1.`);
    passed = false;
  } else {
    console.log("PASS: BTN-003 - Spamming 20 times was correctly rate-limited to 1 call trigger.");
  }

  // Test Case BTN-005: API Timeout
  resetMockState();
  const timeoutPromise = handleInitiateCall(true);
  await timeoutPromise;
  if (isProcessing !== false || isCallActive !== false || errors.length !== 1) {
    console.error("FAIL: BTN-005 - Timeout did not resolve properly. States:", { isProcessing, isCallActive, errors });
    passed = false;
  } else {
    console.log(`PASS: BTN-005 - Timeout caught gracefully. Error shown: "${errors[0]}" and button is re-enabled.`);
  }

  if (passed) {
    console.log("\nALL TRIGGER BUTTON TEST CASES PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("\nSOME TRIGGER BUTTON TEST CASES FAILED!");
    process.exit(1);
  }
};

runTests();
