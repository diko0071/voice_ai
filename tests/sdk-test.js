/**
 * Voice AI SDK Test Script
 * 
 * This script tests the core functionality of the Voice AI SDK.
 * Run with Node.js: node tests/sdk-test.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Test configuration
const TEST_CONFIG = {
  sdkPath: path.join(__dirname, '../public/sdk/voice-ai-sdk.js'),
  minSdkPath: path.join(__dirname, '../public/sdk/voice-ai-sdk.min.js'),
  cssPath: path.join(__dirname, '../public/sdk/voice-ai-styles.css'),
  demoPath: path.join(__dirname, '../public/sdk/demo.html')
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Test utility functions
 */
function assert(condition, message) {
  results.total++;
  
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    results.passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    results.failed++;
  }
  
  return condition;
}

function testGroup(name, callback) {
  console.log(`\n📋 TEST GROUP: ${name}`);
  console.log('='.repeat(50));
  callback();
  console.log('='.repeat(50));
}

/**
 * File existence tests
 */
testGroup('File Existence Tests', () => {
  assert(fs.existsSync(TEST_CONFIG.sdkPath), 'SDK file exists');
  assert(fs.existsSync(TEST_CONFIG.minSdkPath), 'Minified SDK file exists');
  assert(fs.existsSync(TEST_CONFIG.cssPath), 'CSS file exists');
  assert(fs.existsSync(TEST_CONFIG.demoPath), 'Demo file exists');
});

/**
 * SDK Content Tests
 */
testGroup('SDK Content Tests', () => {
  const sdkContent = fs.readFileSync(TEST_CONFIG.sdkPath, 'utf8');
  const minSdkContent = fs.readFileSync(TEST_CONFIG.minSdkPath, 'utf8');
  
  assert(sdkContent.includes('VoiceAI'), 'SDK contains VoiceAI namespace');
  assert(sdkContent.includes('init'), 'SDK contains init function');
  assert(sdkContent.includes('startSession'), 'SDK contains startSession function');
  assert(sdkContent.includes('stopSession'), 'SDK contains stopSession function');
  assert(sdkContent.includes('toggleSession'), 'SDK contains toggleSession function');
  
  assert(minSdkContent.length < sdkContent.length, 'Minified SDK is smaller than full SDK');
  assert(minSdkContent.includes('VoiceAI'), 'Minified SDK contains VoiceAI namespace');
});

/**
 * CSS Content Tests
 */
testGroup('CSS Content Tests', () => {
  const cssContent = fs.readFileSync(TEST_CONFIG.cssPath, 'utf8');
  
  assert(cssContent.includes('.voice-ai-container'), 'CSS contains container styles');
  assert(cssContent.includes('.voice-ai-button'), 'CSS contains button styles');
  assert(cssContent.includes('animation'), 'CSS contains animations');
  assert(cssContent.includes('@media'), 'CSS contains responsive styles');
});

/**
 * DOM Integration Tests
 */
testGroup('DOM Integration Tests', () => {
  // Create a virtual DOM environment
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    url: 'http://localhost:3000',
    runScripts: 'dangerously'
  });
  
  const { window } = dom;
  const { document } = window;
  
  // Inject the SDK script
  const script = document.createElement('script');
  script.textContent = fs.readFileSync(TEST_CONFIG.sdkPath, 'utf8');
  document.body.appendChild(script);
  
  // Test SDK initialization
  try {
    // Mock WebRTC and other browser APIs
    window.navigator.mediaDevices = {
      getUserMedia: () => Promise.resolve({})
    };
    
    // Initialize the SDK
    const voiceAI = window.VoiceAI.init({
      clientId: 'test_client',
      serverUrl: 'http://localhost:3000',
      position: 'bottom-right',
      theme: 'light'
    });
    
    assert(typeof voiceAI === 'object', 'SDK initialization returns an object');
    assert(typeof voiceAI.startSession === 'function', 'SDK object has startSession method');
    assert(typeof voiceAI.stopSession === 'function', 'SDK object has stopSession method');
    assert(typeof voiceAI.toggleSession === 'function', 'SDK object has toggleSession method');
    
    // Check if UI elements were created
    const container = document.querySelector('.voice-ai-container');
    assert(container !== null, 'SDK creates container element');
    
    const button = document.querySelector('.voice-ai-button');
    assert(button !== null, 'SDK creates button element');
    
  } catch (error) {
    assert(false, `SDK initialization failed: ${error.message}`);
  }
});

/**
 * Print test summary
 */
console.log('\n📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total tests: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Success rate: ${Math.round((results.passed / results.total) * 100)}%`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0); 