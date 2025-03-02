// Jest setup file
import { TextEncoder, TextDecoder } from 'util';
import { jest, afterEach } from '@jest/globals';
import dotenv from 'dotenv';

// Mock global objects that might not be available in the test environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock fetch if needed
global.fetch = jest.fn() as any;

// Mock environment variables
process.env.ALLOWED_CLIENTS = 'test_client_1,test_client_2';
process.env.CLIENT_test_client_1_DOMAINS = 'example.com,test.com';
process.env.CLIENT_test_client_2_DOMAINS = 'example.org,test.org';

// Silence console logs during tests
console.log = jest.fn() as any;
console.error = jest.fn() as any;
console.warn = jest.fn() as any;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 