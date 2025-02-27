/**
 * Security utilities for client validation
 */

/**
 * Extracts the domain from a URL
 * @param referer The referer URL
 * @returns The domain from the URL
 */
export function extractDomain(referer: string): string {
  try {
    const url = new URL(referer);
    return url.hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Validates a client ID and referer against allowed clients and domains
 * @param clientId The client ID to validate
 * @param referer The referer URL
 * @returns Whether the client ID and referer are valid
 */
export function validateClient(clientId: string, referer: string): boolean {
  // Get the list of allowed clients from environment variables
  const allowedClients = process.env.ALLOWED_CLIENTS?.split(',') || [];
  
  // Check if the client ID is in the list of allowed clients
  if (!allowedClients.includes(clientId)) {
    return false;
  }
  
  // Get the list of allowed domains for this client
  const allowedDomains = process.env[`CLIENT_${clientId}_DOMAINS`]?.split(',') || [];
  
  // Extract the domain from the referer
  const refererDomain = extractDomain(referer);
  
  // Check if the domain is in the list of allowed domains
  return allowedDomains.includes(refererDomain);
}

/**
 * Validates a session ID
 * @param sessionId The session ID to validate
 * @returns Whether the session ID is valid
 */
export function validateSessionId(sessionId: string): boolean {
  // Simple validation for now - check if the session ID is a non-empty string
  return typeof sessionId === 'string' && sessionId.length > 0;
}

/**
 * Generates a random session ID
 * @returns A random session ID
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
} 