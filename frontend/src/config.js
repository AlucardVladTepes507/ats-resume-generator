// Centralized API URL resolution with automatic trailing slash cleanup to prevent 404 double-slash errors
export const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return url.replace(/\/+$/, '')
}

// Sanitizes resumeData by removing huge base64 photo strings for 20x faster AI processing speed
export const sanitizeResumeData = (resumeData) => {
  if (!resumeData) return resumeData
  try {
    const copy = JSON.parse(JSON.stringify(resumeData))
    if (copy.personal_info && copy.personal_info.photo) {
      delete copy.personal_info.photo
    }
    return copy
  } catch (e) {
    return resumeData
  }
}

