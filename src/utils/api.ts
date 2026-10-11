/**
 * Safe fetch wrapper that guarantees NO unhandled SyntaxErrors such as:
 * "Unexpected token '<', "<html><hea"... is not valid JSON"
 * 
 * Always parses responses safely, checks Content-Type, detects HTML fallbacks,
 * automatically manages JWT/session bearer tokens across iframes,
 * and provides clear, human-readable error messages.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  code?: string;
}

const TOKEN_KEY = 'rvcyber_session_token';

export function getStoredToken(): string | null {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
  } catch {
    // Ignore localStorage access errors in locked sandbox environments
  }
  return null;
}

export function setStoredToken(token: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Ignore
  }
}

export function clearStoredToken(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore
  }
}

export async function safeFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    // Prepare request headers with Bearer token for cross-origin/iframe environments
    const headers = new Headers(init?.headers);
    const storedToken = getStoredToken();

    if (storedToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${storedToken}`);
    }

    if (!headers.has('Content-Type') && init?.body && typeof init.body === 'string') {
      try {
        JSON.parse(init.body);
        headers.set('Content-Type', 'application/json');
      } catch {
        // Not JSON
      }
    }

    const modifiedInit: RequestInit = {
      credentials: 'include',
      ...init,
      headers,
    };

    const res = await fetch(input, modifiedInit);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // Safely retrieve response as text first
    const rawText = await res.text();
    const trimmed = rawText.trim();

    // Check if the response is an HTML page (SPA index.html or upstream proxy 403/404/502 error page)
    const isHtml =
      contentType.includes('text/html') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<!--');

    if (isHtml) {
      let friendlyError = 'Server temporarily unavailable. Please try again.';
      let errorCode = 'HTML_ERROR_PAGE';

      if (res.status === 401) {
        friendlyError = 'Your session has expired or requires authentication. Please sign in to continue.';
        errorCode = 'UNAUTHORIZED';
        clearStoredToken();
      } else if (res.status === 403) {
        friendlyError = 'Access restricted: Administrative or owner privileges are required for this action.';
        errorCode = 'FORBIDDEN';
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        friendlyError = 'Server is initializing services. Please try again in a few moments.';
        errorCode = 'SERVER_INITIALIZING';
      } else if (res.status === 404) {
        friendlyError = 'The requested endpoint was not found.';
        errorCode = 'NOT_FOUND';
      } else if (res.ok) {
        friendlyError = 'Server returned a page instead of API data. Please refresh in a moment.';
      }

      return {
        ok: false,
        status: res.status,
        error: friendlyError,
        code: errorCode,
      };
    }

    // Attempt to parse JSON safely without throwing SyntaxError
    let data: any = null;
    if (trimmed.length > 0) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        return {
          ok: false,
          status: res.status,
          error: res.ok
            ? 'Invalid response format from server.'
            : (trimmed.slice(0, 160) || `Request failed with status ${res.status}`),
          code: 'INVALID_JSON',
        };
      }
    }

    // Automatically synchronize received token
    if (data && typeof data === 'object' && typeof data.token === 'string') {
      setStoredToken(data.token);
    }

    if (!res.ok) {
      // If token expired or session invalid, clear stored token
      if (res.status === 401) {
        clearStoredToken();
      }

      const errorMessage =
        data?.error ||
        data?.message ||
        (trimmed.length > 0 && !trimmed.startsWith('{') ? trimmed.slice(0, 160) : '') ||
        (res.status === 403
          ? 'Access restricted: Insufficient administrative privileges.'
          : res.status === 401
          ? 'Authentication required. Please sign in.'
          : `Request failed with status ${res.status}`);

      return {
        ok: false,
        status: res.status,
        data,
        error: errorMessage,
        code: data?.code || (res.status === 403 ? 'FORBIDDEN' : res.status === 401 ? 'UNAUTHORIZED' : undefined),
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data as T,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message && !err.message.includes('JSON')
        ? err.message
        : 'Network connection error. Please verify the server is active.',
      code: 'NETWORK_ERROR',
    };
  }
}
