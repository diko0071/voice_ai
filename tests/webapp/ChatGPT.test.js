/**
 * ChatGPT Component Test
 * 
 * This test verifies the functionality of the ChatGPT component.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

// Read the component file
const componentPath = path.join(__dirname, '../../components/webapp/ChatGPT.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf8');

// Basic test to verify the component exists and contains expected elements
console.log('Running ChatGPT component test...');
try {
  assert(componentContent.includes('useWebRTCAudioSession'), 'Component should use WebRTC hook');
  assert(componentContent.includes('const ChatGPT: React.FC'), 'Component should define ChatGPT as React.FC');
  assert(componentContent.includes('return'), 'Component should have a return statement');
  console.log('✅ ChatGPT component test passed!');
} catch (error) {
  console.error('❌ ChatGPT component test failed:', error.message);
  process.exit(1);
} 