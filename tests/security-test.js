/**
 * Security Library Test Script
 * 
 * This script tests the functionality of the security library.
 * Run with Node.js: node tests/security-test.js
 */

// Mock environment variables
process.env.ALLOWED_CLIENTS = 'client1,client2,client3';
process.env.CLIENT_client1_DOMAINS = 'domain1.com,www.domain1.com';
process.env.CLIENT_client2_DOMAINS = 'domain2.com,www.domain2.com';
process.env.CLIENT_client3_DOMAINS = 'domain3.com,www.domain3.com';

// Import the security module
const fs = require('fs');
const path = require('path');
const securityFilePath = path.join(__dirname, '../lib/security.ts');

// Read the security file content
const securityFileContent = fs.readFileSync(securityFilePath, 'utf8');

// Extract functions for testing
const extractDomainFn = extractFunction(securityFileContent, 'extractDomain');
const validateClientFn = extractFunctionWithDependency(
  securityFileContent, 
  'validateClient', 
  'extractDomain', 
  extractDomainFn
);
const generateSessionIdFn = extractFunction(securityFileContent, 'generateSessionId');

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
 * Extract function from TypeScript file content
 */
function extractFunction(content, functionName) {
  const functionRegex = new RegExp(`export function ${functionName}\\s*\\([^)]*\\)\\s*[^{]*{([\\s\\S]*?)\\n}`);
  const match = content.match(functionRegex);
  
  if (!match) {
    throw new Error(`Function ${functionName} not found in the file content`);
  }
  
  // Create a function from the extracted code
  // This is a simplified approach and may not work for all functions
  let functionBody = match[1];
  
  // Replace TypeScript-specific code with JavaScript equivalents
  functionBody = functionBody.replace(/const allowedClients = process\.env\.ALLOWED_CLIENTS\?\.split\(','\) \|\| \[\];/g, 
    'const _allowedClients = process.env.ALLOWED_CLIENTS ? process.env.ALLOWED_CLIENTS.split(",") : [];');
  
  functionBody = functionBody.replace(/allowedClients\.includes\(clientId\)/g, '_allowedClients.includes(clientId)');
  
  functionBody = functionBody.replace(/const allowedDomains = process\.env\[`CLIENT_\${clientId}_DOMAINS`\]\?\.split\(','\) \|\| \[\];/g,
    'const _allowedDomains = process.env[`CLIENT_${clientId}_DOMAINS`] ? process.env[`CLIENT_${clientId}_DOMAINS`].split(",") : [];');
  
  functionBody = functionBody.replace(/allowedDomains\.includes\(refererDomain\)/g, '_allowedDomains.includes(refererDomain)');
  
  return new Function('referer', 'clientId', 'allowedClients', `
    // Mock TypeScript environment
    const process = { env: {
      ALLOWED_CLIENTS: 'client1,client2,client3',
      CLIENT_client1_DOMAINS: 'domain1.com,www.domain1.com',
      CLIENT_client2_DOMAINS: 'domain2.com,www.domain2.com',
      CLIENT_client3_DOMAINS: 'domain3.com,www.domain3.com'
    }};
    
    // Function body
    ${functionBody}
    
    // Return the result
    return ${functionName === 'extractDomain' ? 'domain' : 
            functionName === 'validateClient' ? 'isValid' : 
            functionName === 'generateSessionId' ? 'sessionId' : 'null'};
  `);
}

/**
 * Extract function with dependency from TypeScript file content
 */
function extractFunctionWithDependency(content, functionName, dependencyName, dependencyFn) {
  const functionRegex = new RegExp(`export function ${functionName}\\s*\\([^)]*\\)\\s*[^{]*{([\\s\\S]*?)\\n}`);
  const match = content.match(functionRegex);
  
  if (!match) {
    throw new Error(`Function ${functionName} not found in the file content`);
  }
  
  // Create a function from the extracted code
  // This is a simplified approach and may not work for all functions
  let functionBody = match[1];
  
  // Replace TypeScript-specific code with JavaScript equivalents
  functionBody = functionBody.replace(/const allowedClients = process\.env\.ALLOWED_CLIENTS\?\.split\(','\) \|\| \[\];/g, 
    'const _allowedClients = process.env.ALLOWED_CLIENTS ? process.env.ALLOWED_CLIENTS.split(",") : [];');
  
  functionBody = functionBody.replace(/allowedClients\.includes\(clientId\)/g, '_allowedClients.includes(clientId)');
  
  functionBody = functionBody.replace(/const allowedDomains = process\.env\[`CLIENT_\${clientId}_DOMAINS`\]\?\.split\(','\) \|\| \[\];/g,
    'const _allowedDomains = process.env[`CLIENT_${clientId}_DOMAINS`] ? process.env[`CLIENT_${clientId}_DOMAINS`].split(",") : [];');
  
  functionBody = functionBody.replace(/allowedDomains\.includes\(refererDomain\)/g, '_allowedDomains.includes(refererDomain)');
  
  return new Function('referer', 'clientId', 'allowedClients', `
    // Mock TypeScript environment
    const process = { env: {
      ALLOWED_CLIENTS: 'client1,client2,client3',
      CLIENT_client1_DOMAINS: 'domain1.com,www.domain1.com',
      CLIENT_client2_DOMAINS: 'domain2.com,www.domain2.com',
      CLIENT_client3_DOMAINS: 'domain3.com,www.domain3.com'
    }};
    
    // Mock dependency function
    const extractDomain = function(url) {
      return ${dependencyName === 'extractDomain' ? 
        `(${dependencyFn.toString()})(url)` : 
        'null'};
    };
    
    // Function body
    ${functionBody}
    
    // Return the result
    return ${functionName === 'extractDomain' ? 'domain' : 
            functionName === 'validateClient' ? 'isValid' : 
            functionName === 'generateSessionId' ? 'sessionId' : 'null'};
  `);
}

/**
 * extractDomain tests
 */
testGroup('extractDomain Tests', () => {
  try {
    assert(extractDomainFn('https://domain1.com/path') === 'domain1.com', 'Extracts domain from URL with path');
    assert(extractDomainFn('http://www.domain2.com') === 'www.domain2.com', 'Extracts domain from URL with www');
    assert(extractDomainFn('https://sub.domain3.com/path?query=1') === 'sub.domain3.com', 'Extracts domain from URL with subdomain and query');
    assert(extractDomainFn('invalid-url') === '', 'Returns empty string for invalid URL');
    assert(extractDomainFn() === '', 'Returns empty string for undefined referer');
  } catch (error) {
    console.error('Error in extractDomain tests:', error);
  }
});

/**
 * validateClient tests
 */
testGroup('validateClient Tests', () => {
  try {
    // Valid cases
    assert(validateClientFn('https://domain1.com/path', 'client1', 'client1,client2,client3'), 'Validates client1 with domain1.com');
    assert(validateClientFn('https://www.domain1.com', 'client1', 'client1,client2,client3'), 'Validates client1 with www.domain1.com');
    assert(validateClientFn('https://domain2.com', 'client2', 'client1,client2,client3'), 'Validates client2 with domain2.com');
    
    // Invalid cases
    assert(!validateClientFn('https://domain1.com', 'client2', 'client1,client2,client3'), 'Rejects client2 with domain1.com');
    assert(!validateClientFn('https://invalid.com', 'client1', 'client1,client2,client3'), 'Rejects client1 with invalid.com');
    assert(!validateClientFn('https://domain1.com', 'invalid', 'client1,client2,client3'), 'Rejects invalid client');
    assert(!validateClientFn('invalid-url', 'client1', 'client1,client2,client3'), 'Rejects invalid URL');
    assert(!validateClientFn(undefined, 'client1', 'client1,client2,client3'), 'Rejects undefined referer');
  } catch (error) {
    console.error('Error in validateClient tests:', error);
  }
});

/**
 * generateSessionId tests
 */
testGroup('generateSessionId Tests', () => {
  try {
    const sessionId1 = generateSessionIdFn();
    const sessionId2 = generateSessionIdFn();
    
    assert(typeof sessionId1 === 'string', 'Returns a string');
    assert(sessionId1.length > 10, 'Session ID has sufficient length');
    assert(sessionId1 !== sessionId2, 'Generates unique session IDs');
  } catch (error) {
    console.error('Error in generateSessionId tests:', error);
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