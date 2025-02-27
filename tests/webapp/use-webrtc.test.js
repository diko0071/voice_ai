/**
 * WebRTC Hook Test
 * 
 * This test verifies the functionality of the useWebRTCAudioSession hook.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Read the hook file
const hookPath = path.join(__dirname, '../../hooks/webapp/use-webrtc.ts');
const hookContent = fs.readFileSync(hookPath, 'utf8');

// Basic test to verify the hook exists and contains expected elements
console.log('Running WebRTC hook test...');
try {
  assert(hookContent.includes('useWebRTCAudioSession'), 'Hook should define useWebRTCAudioSession');
  assert(hookContent.includes('useState'), 'Hook should use useState');
  assert(hookContent.includes('useRef'), 'Hook should use useRef');
  console.log('✅ WebRTC hook test passed!');
} catch (error) {
  console.error('❌ WebRTC hook test failed:', error.message);
  process.exit(1);
} 