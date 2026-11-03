/**
 * Shared fetch helpers.
 *
 * Two problems they fix everywhere at once:
 *  1. Every component used to `await res.json()` BEFORE checking `res.ok`, so a
 *     Render 502/503/524 (HTML body) surfaced as "Unexpected token '<'".
 *  2. No request had a timeout, so a 30s+ cold start left the UI spinning forever.
 */
import { getApiUrl } from '../config'

// Render free tier cold start (~32s) + AI generation latency.
export const DEFAULT_TIMEOUT_MS = 90000

export async function apiFetch(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${getApiUrl()}${path}`, { ...options, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder. Inténtalo de nuevo.')
    }
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Reads a response defensively: never assumes JSON.
 * Throws an Error with the backend `detail` (or a readable fallback) when not ok.
 */
export async function readJson(response, fallbackMessage = 'Error del servidor') {
  const raw = await response.text()

  let data = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const detail = data && typeof data.detail === 'string' ? data.detail : null
    throw new Error(detail || `${fallbackMessage} (HTTP ${response.status})`)
  }

  if (data === null) {
    throw new Error(`${fallbackMessage}: el servidor devolvió una respuesta no válida (HTTP ${response.status})`)
  }

  return data
}

export async function postJson(path, body, fallbackMessage, timeoutMs) {
  const response = await apiFetch(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    timeoutMs
  )
  return readJson(response, fallbackMessage)
}
