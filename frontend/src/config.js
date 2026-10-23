// Central API Base configuration from environment variables
// Always use relative /api for production/EC2 deployments to route through Nginx reverse proxy
const envUrl = import.meta.env.VITE_API_URL;
export const API_BASE = (envUrl && !envUrl.includes('onrender.com')) ? envUrl : '/api';
