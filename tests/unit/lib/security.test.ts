/**
 * Tests for security utilities
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { 
  extractDomain, 
  validateClient, 
  validateSessionId, 
  generateSessionId 
} from '@/lib/security';

describe('Security Utilities', () => {
  
  describe('extractDomain', () => {
    test('extracts domain from a valid URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
      expect(extractDomain('http://test.org:8080/path?query=1')).toBe('test.org');
      expect(extractDomain('https://subdomain.example.com')).toBe('subdomain.example.com');
    });

    test('returns empty string for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('');
      expect(extractDomain('')).toBe('');
      // @ts-ignore - Testing with null/undefined for robustness
      expect(extractDomain(null)).toBe('');
      // @ts-ignore - Testing with null/undefined for robustness
      expect(extractDomain(undefined)).toBe('');
    });
  });

  describe('validateClient', () => {
    test('validates client with correct ID and domain', () => {
      expect(validateClient('test_client_1', 'https://example.com')).toBe(true);
      expect(validateClient('test_client_1', 'https://test.com/path')).toBe(true);
      expect(validateClient('test_client_2', 'https://example.org')).toBe(true);
      expect(validateClient('test_client_2', 'https://test.org/path')).toBe(true);
    });

    test('rejects client with invalid ID', () => {
      expect(validateClient('invalid-client', 'https://example.com')).toBe(false);
      expect(validateClient('', 'https://example.com')).toBe(false);
      // @ts-ignore - Testing with null/undefined for robustness
      expect(validateClient(null, 'https://example.com')).toBe(false);
      // @ts-ignore - Testing with null/undefined for robustness
      expect(validateClient(undefined, 'https://example.com')).toBe(false);
    });

    test('rejects client with invalid domain', () => {
      expect(validateClient('test_client_1', 'https://invalid-domain.com')).toBe(false);
      expect(validateClient('test_client_1', 'not-a-url')).toBe(false);
      expect(validateClient('test_client_1', '')).toBe(false);
      // @ts-ignore - Testing with null/undefined for robustness
      expect(validateClient('test_client_1', null)).toBe(false);
      // @ts-ignore - Testing with null/undefined for robustness
      expect(validateClient('test_client_1', undefined)).toBe(false);
    });

    test('rejects client with mismatched ID and domain', () => {
      expect(validateClient('test_client_1', 'https://example.org')).toBe(false);
      expect(validateClient('test_client_2', 'https://example.com')).toBe(false);
    });
  });

  describe('validateSessionId', () => {
    test('validates non-empty string session IDs', () => {
      expect(validateSessionId('valid-session-id')).toBe(true);
      expect(validateSessionId('12345')).toBe(true);
      expect(validateSessionId('a')).toBe(true);
    });

    test('rejects invalid session IDs', () => {
      expect(validateSessionId('')).toBe(false);
      // @ts-ignore - Testing with null/undefined for robustness
      expect(validateSessionId(null)).toBe(false);
      // @ts-ignore - Testing with null/undefined for robustness
      expect(validateSessionId(undefined)).toBe(false);
      // @ts-ignore - Testing with number for robustness
      expect(validateSessionId(123)).toBe(false); // Number instead of string
      // @ts-ignore - Testing with object for robustness
      expect(validateSessionId({})).toBe(false); // Object instead of string
    });
  });

  describe('generateSessionId', () => {
    test('generates a non-empty string', () => {
      const sessionId = generateSessionId();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    test('generates unique session IDs', () => {
      const sessionIds = new Set();
      for (let i = 0; i < 100; i++) {
        sessionIds.add(generateSessionId());
      }
      // All 100 generated IDs should be unique
      expect(sessionIds.size).toBe(100);
    });

    test('generates session IDs with expected format', () => {
      const sessionId = generateSessionId();
      // Session ID should be alphanumeric
      expect(sessionId).toMatch(/^[a-z0-9]+$/);
      // Session ID should be reasonably long (at least 20 chars)
      expect(sessionId.length).toBeGreaterThanOrEqual(20);
    });
  });
}); 