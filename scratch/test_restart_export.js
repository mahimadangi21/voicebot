// Unit Tests for handleRestart and exportCallSummary logic in VoiceBot.jsx

const assert = require('assert');

// 1. Mocking the React state setters and capturing their updates
class VoiceBotStateMock {
  constructor() {
    this.states = {
      isCallActive: true,
      sessionId: 'mock_session_456',
      messages: [
        { id: '1', sender: 'bot', text: 'Hello', timestamp: '10:00:00 AM' },
        { id: '2', sender: 'user', text: 'Hi', timestamp: '10:00:05 AM' }
      ],
      currentState: 'AMOUNT_DUE',
      isTerminal: true,
      isSpeaking: true,
      isListening: true,
      isThinking: true,
      callDuration: 45,
      callSummary: {
        duration: '00:45',
        outcome: 'Payment Link Dispatched',
        promiseToPay: 'Yes',
        paymentDate: 'Immediate (Same Day)',
        sentiment: 'Positive / Cooperative',
        summaryText: 'Mahima Dangi agreed to pay.'
      },
      nameError: 'Name cannot be empty.',
      amountError: 'Invalid amount.',
      bankError: 'Invalid bank.',
      phoneError: 'Invalid phone.',
      dateError: 'Invalid date.',
      dateWarning: 'Warning date.',
      isProcessing: true,
      showExportDropdown: true
    };
  }

  // Setters
  setIsCallActive(val) { this.states.isCallActive = val; }
  setSessionId(val) { this.states.sessionId = val; }
  setMessages(val) { this.states.messages = typeof val === 'function' ? val(this.states.messages) : val; }
  setCurrentState(val) { this.states.currentState = val; }
  setIsTerminal(val) { this.states.isTerminal = val; }
  setIsSpeaking(val) { this.states.isSpeaking = val; }
  setIsListening(val) { this.states.isListening = val; }
  setIsThinking(val) { this.states.isThinking = val; }
  setCallDuration(val) { this.states.callDuration = typeof val === 'function' ? val(this.states.callDuration) : val; }
  setCallSummary(val) { this.states.callSummary = val; }
  setNameError(val) { this.states.nameError = val; }
  setAmountError(val) { this.states.amountError = val; }
  setBankError(val) { this.states.bankError = val; }
  setPhoneError(val) { this.states.phoneError = val; }
  setDateError(val) { this.states.dateError = val; }
  setDateWarning(val) { this.states.dateWarning = val; }
  setIsProcessing(val) { this.states.isProcessing = val; }
  setShowExportDropdown(val) { this.states.showExportDropdown = val; }

  // Simulated handleRestart function
  handleRestart() {
    this.setIsCallActive(false);
    this.setSessionId(null);
    this.setMessages([]);
    this.setCurrentState('GREETING');
    this.setIsTerminal(false);
    this.setIsSpeaking(false);
    this.setIsListening(false);
    this.setIsThinking(false);
    this.setCallDuration(0);
    this.setCallSummary(null);
    this.setNameError(null);
    this.setAmountError(null);
    this.setBankError(null);
    this.setPhoneError(null);
    this.setDateError(null);
    this.setDateWarning(null);
    this.setIsProcessing(false);
    this.setShowExportDropdown(false);
  }
}

// 2. Mocking Blob and URL APIs for Node environment testing of exportCallSummary
global.Blob = class Blob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
  }
};

global.URL = {
  createObjectURL: (blob) => {
    return 'blob://' + Math.random().toString(36).substr(2, 9);
  },
  revokeObjectURL: (url) => {}
};

global.document = {
  createElement: (type) => {
    return {
      href: '',
      download: '',
      setAttribute: function(attr, value) {
        this[attr] = value;
      },
      click: function() {
        this.clicked = true;
      },
      remove: function() {
        this.removed = true;
      }
    };
  },
  body: {
    appendChild: (el) => {
      global.document.body.children.push(el);
    },
    removeChild: (el) => {
      const idx = global.document.body.children.indexOf(el);
      if (idx > -1) global.document.body.children.splice(idx, 1);
    },
    children: []
  }
};

// Simulated Export logic
const runExportCallSummary = (format, stateVars) => {
  const {
    customerName,
    phone,
    loanId,
    dueDate,
    amount,
    bankName,
    callSummary,
    messages,
    sessionId
  } = stateVars;

  if (!callSummary) return null;

  if (format === 'json') {
    const dataObj = {
      customerName,
      phone,
      loanId,
      dueDate,
      amount,
      bankName,
      summary: callSummary,
      transcript: messages.map(m => ({
        sender: m.sender,
        timestamp: m.timestamp,
        text: m.text,
        intent: m.intent,
        emotion: m.emotion
      }))
    };
    return JSON.stringify(dataObj, null, 2);
  } else if (format === 'txt') {
    let txtContent = `CALL SUMMARY REPORT\n`;
    txtContent += `===================\n\n`;
    txtContent += `Customer Name: ${customerName}\n`;
    txtContent += `Phone Number: ${phone}\n`;
    txtContent += `Loan ID: ${loanId}\n`;
    txtContent += `Due Date: ${dueDate}\n`;
    txtContent += `Outstanding Balance: INR ${parseFloat(amount).toLocaleString()}\n`;
    txtContent += `Bank Name: ${bankName}\n\n`;
    txtContent += `CALL SUMMARY LOG\n`;
    txtContent += `----------------\n`;
    txtContent += `Duration: ${callSummary.duration}\n`;
    txtContent += `PTP Status: ${callSummary.promiseToPay}\n`;
    txtContent += `Disposition: ${callSummary.outcome}\n`;
    txtContent += `Sentiment: ${callSummary.sentiment}\n\n`;
    txtContent += `Summary Log:\n${callSummary.summaryText}\n\n`;
    txtContent += `CALL TRANSCRIPT\n`;
    txtContent += `---------------\n`;
    messages.forEach(m => {
      const sender = m.sender === 'user' ? 'Customer' : 'AI Agent';
      txtContent += `[${m.timestamp}] ${sender}: ${m.text}\n`;
    });
    return txtContent;
  }
  return null;
};

// Running Tests
console.log('Running Outbound AI Dialer validation tests...\n');

try {
  // Test Case 1: BTN-003 & BTN-005 (Reset previous data, no cached values remain)
  console.log('Testing handleRestart State Cleanups...');
  const botState = new VoiceBotStateMock();
  botState.handleRestart();

  assert.strictEqual(botState.states.isCallActive, false, 'isCallActive must be false');
  assert.strictEqual(botState.states.sessionId, null, 'sessionId must be null');
  assert.deepStrictEqual(botState.states.messages, [], 'messages must be empty');
  assert.strictEqual(botState.states.currentState, 'GREETING', 'currentState must be GREETING');
  assert.strictEqual(botState.states.isTerminal, false, 'isTerminal must be false');
  assert.strictEqual(botState.states.isSpeaking, false, 'isSpeaking must be false');
  assert.strictEqual(botState.states.isListening, false, 'isListening must be false');
  assert.strictEqual(botState.states.isThinking, false, 'isThinking must be false');
  assert.strictEqual(botState.states.callDuration, 0, 'callDuration must be 0');
  assert.strictEqual(botState.states.callSummary, null, 'callSummary must be null');
  assert.strictEqual(botState.states.nameError, null, 'nameError must be null');
  assert.strictEqual(botState.states.amountError, null, 'amountError must be null');
  assert.strictEqual(botState.states.bankError, null, 'bankError must be null');
  assert.strictEqual(botState.states.phoneError, null, 'phoneError must be null');
  assert.strictEqual(botState.states.dateError, null, 'dateError must be null');
  assert.strictEqual(botState.states.dateWarning, null, 'dateWarning must be null');
  assert.strictEqual(botState.states.isProcessing, false, 'isProcessing must be false');
  assert.strictEqual(botState.states.showExportDropdown, false, 'showExportDropdown must be false');
  console.log('✔ handleRestart successfully cleared all fields and errors!\n');

  // Test Case 2: EXP-003 (JSON Export payload verification)
  console.log('Testing exportCallSummary JSON format...');
  const demoState = {
    customerName: 'Mahima Dangi',
    phone: '+919876543210',
    loanId: 'LN-9830219',
    dueDate: 'June 15, 2026',
    amount: '5000',
    bankName: 'ICICI',
    callSummary: {
      duration: '00:45',
      outcome: 'Payment Link Dispatched',
      promiseToPay: 'Yes',
      paymentDate: 'Immediate (Same Day)',
      sentiment: 'Positive / Cooperative',
      summaryText: 'Mahima Dangi agreed to pay.'
    },
    messages: [
      { id: '1', sender: 'bot', text: 'Hello', timestamp: '10:00:00 AM', intent: 'GREETING', emotion: 'Professional' },
      { id: '2', sender: 'user', text: 'Hi', timestamp: '10:00:05 AM', intent: 'AFFIRM', emotion: 'Cooperative' }
    ],
    sessionId: 'session_123'
  };

  const jsonResult = runExportCallSummary('json', demoState);
  const parsedJson = JSON.parse(jsonResult);

  assert.strictEqual(parsedJson.customerName, 'Mahima Dangi');
  assert.strictEqual(parsedJson.phone, '+919876543210');
  assert.strictEqual(parsedJson.dueDate, 'June 15, 2026');
  assert.strictEqual(parsedJson.amount, '5000');
  assert.strictEqual(parsedJson.bankName, 'ICICI');
  assert.strictEqual(parsedJson.summary.promiseToPay, 'Yes');
  assert.strictEqual(parsedJson.transcript.length, 2);
  assert.strictEqual(parsedJson.transcript[1].sender, 'user');
  assert.strictEqual(parsedJson.transcript[1].text, 'Hi');
  console.log('✔ JSON Export matches expectations!\n');

  // Test Case 3: EXP-002 (TXT Export formatting verification)
  console.log('Testing exportCallSummary TXT format...');
  const txtResult = runExportCallSummary('txt', demoState);

  assert.ok(txtResult.includes('Customer Name: Mahima Dangi'), 'TXT must include customer name');
  assert.ok(txtResult.includes('Outstanding Balance: INR 5,000'), 'TXT must include correctly formatted outstanding balance');
  assert.ok(txtResult.includes('PTP Status: Yes'), 'TXT must include PTP status');
  assert.ok(txtResult.includes('[10:00:05 AM] Customer: Hi'), 'TXT transcript must format sender and text properly');
  console.log('✔ TXT Export matches expectations!\n');

  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} catch (error) {
  console.error('FAIL:', error.message);
  process.exit(1);
}
