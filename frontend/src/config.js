// Centralized API URL resolution with automatic trailing slash cleanup to prevent 404 double-slash errors
export const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return url.replace(/\/+$/, '')
}
