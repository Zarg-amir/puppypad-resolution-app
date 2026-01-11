/**
 * Router Utility
 * Simple route matching and handler registration for Cloudflare Workers
 */

/**
 * Create a new router instance
 */
export function createRouter() {
  const routes = [];

  return {
    /**
     * Register a route handler
     */
    add(method, pattern, handler) {
      routes.push({ method, pattern, handler });
    },

    /**
     * Convenience methods for common HTTP methods
     */
    get(pattern, handler) { this.add('GET', pattern, handler); },
    post(pattern, handler) { this.add('POST', pattern, handler); },
    put(pattern, handler) { this.add('PUT', pattern, handler); },
    delete(pattern, handler) { this.add('DELETE', pattern, handler); },

    /**
     * Match a request against registered routes
     * Returns { handler, params } if matched, null otherwise
     */
    match(method, pathname) {
      for (const route of routes) {
        if (route.method !== method && route.method !== '*') continue;

        // Exact match
        if (route.pattern === pathname) {
          return { handler: route.handler, params: {} };
        }

        // Pattern with :params
        if (route.pattern.includes(':')) {
          const params = matchPattern(route.pattern, pathname);
          if (params) {
            return { handler: route.handler, params };
          }
        }

        // Wildcard pattern (ends with *)
        if (route.pattern.endsWith('*')) {
          const prefix = route.pattern.slice(0, -1);
          if (pathname.startsWith(prefix)) {
            return {
              handler: route.handler,
              params: { wildcard: pathname.slice(prefix.length) }
            };
          }
        }

        // Regex pattern (wrapped in RegExp)
        if (route.pattern instanceof RegExp) {
          const match = pathname.match(route.pattern);
          if (match) {
            return { handler: route.handler, params: { match } };
          }
        }
      }

      return null;
    }
  };
}

/**
 * Match a pattern like /api/case/:caseId/comments against a pathname
 * Returns params object if matched, null otherwise
 */
function matchPattern(pattern, pathname) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // This is a parameter
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      // Not a match
      return null;
    }
  }

  return params;
}

/**
 * Handle CORS preflight requests
 */
export function handleOptions(corsHeaders) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Create standard CORS headers
 */
export function createCorsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create an error response
 */
export function errorResponse(message, corsHeaders, status = 400) {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}
