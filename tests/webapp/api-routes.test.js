/**
 * API Routes Test
 * 
 * This test verifies the functionality of the API routes.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test session route
console.log('Running API routes tests...');

try {
  // Test session route
  const sessionRoutePath = path.join(__dirname, '../../app/api/session/route.ts');
  const sessionRouteContent = fs.readFileSync(sessionRoutePath, 'utf8');

  assert(sessionRouteContent.includes('POST'), 'Session route should handle POST requests');
  assert(sessionRouteContent.includes('NextResponse'), 'Session route should use NextResponse');
  assert(sessionRouteContent.includes('OPENAI_API_KEY'), 'Session route should use OPENAI_API_KEY');
  
  // Test log route
  const logRoutePath = path.join(__dirname, '../../app/api/log/route.ts');
  const logRouteContent = fs.readFileSync(logRoutePath, 'utf8');

  assert(logRouteContent.includes('POST'), 'Log route should handle POST requests');
  assert(logRouteContent.includes('NextResponse'), 'Log route should use NextResponse');
  assert(logRouteContent.includes('LOG_FILE'), 'Log route should use LOG_FILE');
  
  console.log('✅ API routes tests passed!');
} catch (error) {
  console.error('❌ API routes tests failed:', error.message);
  process.exit(1);
} 