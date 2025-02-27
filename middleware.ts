import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Extracts the domain from a URL
 * @param url The URL
 * @returns The domain from the URL
 */
function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Checks if a domain is allowed for any client
 * @param domain The domain to check
 * @returns Whether the domain is allowed
 */
function isDomainAllowed(domain: string): boolean {
  // Get the list of allowed clients
  const allowedClients = process.env.ALLOWED_CLIENTS?.split(',') || [];
  
  // Check each client's allowed domains
  for (const clientId of allowedClients) {
    const allowedDomains = process.env[`CLIENT_${clientId}_DOMAINS`]?.split(',') || [];
    if (allowedDomains.includes(domain)) {
      console.log(`Domain ${domain} is allowed for client ${clientId}`);
      return true;
    }
  }
  
  console.log(`Domain ${domain} is not allowed for any client`);
  return false;
}

export function middleware(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '';
  const domain = extractDomain(origin);
  
  // Check if the request is for the API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Check if the domain is allowed
    const isAllowed = isDomainAllowed(domain);
    
    // For preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      // Add CORS headers for preflight
      if (isAllowed) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
        
        console.log(`CORS middleware: Allowed preflight request from ${origin} to ${request.nextUrl.pathname}`);
      } else {
        console.log(`CORS middleware: Blocked preflight request from ${origin} to ${request.nextUrl.pathname}`);
      }
      
      return response;
    }
    
    // For regular requests
    const response = NextResponse.next();
    
    // Add CORS headers only if the domain is allowed
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      
      console.log(`CORS middleware: Allowed request from ${origin} to ${request.nextUrl.pathname}`);
    } else {
      console.log(`CORS middleware: Request from ${origin} to ${request.nextUrl.pathname} proceeded without CORS headers`);
    }
    
    return response;
  }
  
  // For non-API routes, just continue
  return NextResponse.next();
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
}; 