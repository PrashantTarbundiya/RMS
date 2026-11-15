// Central API Base configuration from environment variables
// Priority:
// 1. Explicit VITE_API_URL environment variable (if provided)
// 2. Auto-detect Vercel preview/production hosting (route cross-origin to official AWS EC2 backend)
// 3. Fallback to '/api' for Docker / Nginx on same-origin EC2 / Localhost
const envUrl = import.meta.env.VITE_API_URL;

function resolveApiBase() {
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // When frontend is accessed from Vercel (*.vercel.app),
  // automatically route API calls to the live AWS EC2 backend.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.vercel.app') || host === 'vercel.app') {
      return 'https://13-60-225-165.sslip.io/api';
    }
  }

  return '/api';
}

export const API_BASE = resolveApiBase();

