// Central API Base configuration from environment variables
// Defaults to relative /api for production/Docker/Nginx reverse proxy
const envUrl = import.meta.env.VITE_API_URL;
export const API_BASE = envUrl || '/api';
