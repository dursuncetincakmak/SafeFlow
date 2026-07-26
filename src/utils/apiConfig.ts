/**
 * Dynamically resolves the API root endpoint depending on whether the app
 * is running locally on localhost:5173 or deployed on AWS / production server.
 */
export function getApiRoot(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return 'http://localhost:5000/api';
    }
    return `${window.location.origin}/api`;
  }
  return '/api';
}
