/**
 * API Endpoints Test
 * 
 * This test verifies the functionality of the API endpoints used by both the SDK and WebApp.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Test utility functions
 */
function assertTest(condition, message) {
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

// Test instructions endpoint
const instructionsRoutePath = path.join(__dirname, '../app/api/v1/instructions/route.ts');
const instructionsRouteContent = fs.readFileSync(instructionsRoutePath, 'utf8');

// Test agent instructions file
const agentInstructionsPath = path.join(__dirname, '../prompts/agent-instructions.ts');
const agentInstructionsContent = fs.readFileSync(agentInstructionsPath, 'utf8');

// Run tests
console.log('Running API Endpoints tests...');

testGroup('Instructions API Endpoint Tests', () => {
  assertTest(instructionsRouteContent.includes('GET'), 'Instructions endpoint handles GET requests');
  assertTest(instructionsRouteContent.includes('NextResponse'), 'Instructions endpoint uses NextResponse');
  assertTest(instructionsRouteContent.includes('validateClient'), 'Instructions endpoint validates client');
  assertTest(instructionsRouteContent.includes('agentInstructions'), 'Instructions endpoint returns agent instructions');
  assertTest(instructionsRouteContent.includes('clientId'), 'Instructions endpoint requires client ID');
  assertTest(instructionsRouteContent.includes('referer'), 'Instructions endpoint checks referer');
});

testGroup('Agent Instructions Tests', () => {
  assertTest(agentInstructionsContent.includes('export const agentInstructions'), 'Agent instructions exports agentInstructions constant');
  assertTest(agentInstructionsContent.includes('You are AI Agent Improvado'), 'Agent instructions contains proper introduction');
  assertTest(agentInstructionsContent.length > 1000, 'Agent instructions has sufficient content');
});

// Print test summary
console.log(`\n📊 TEST SUMMARY`);
console.log('='.repeat(50));
console.log(`Total tests: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Success rate: ${Math.round((results.passed / results.total) * 100)}%`);
console.log('='.repeat(50));

// Exit with appropriate code
if (results.failed > 0) {
  console.log('❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('✅ All API endpoint tests passed!');
} 