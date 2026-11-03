/**
 * Client-side image helpers.
 *
 * The profile photo used to be stored raw in localStorage and embedded verbatim
 * in the PDF: a 9MB phone photo became 12MB of base64 in localStorage (blocking
 * the UI on every keystroke) and could exceed the browser quota entirely.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No pudimos leer el archivo. Inténtalo de nuevo.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Downscales an image to fit `maxSize` px on its longest side and re-encodes it
 * as JPEG. Transparencies are flattened onto white so PNG logos don't go black.
 */
export async function compressImage(file, maxSize = 500, quality = 0.85) {
  const dataUrl = await readFileAsDataUrl(file)

  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
    img.src = dataUrl
  })

  const longest = Math.max(image.width, image.height) || 1
  const scale = Math.min(1, maxSize / longest)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}
