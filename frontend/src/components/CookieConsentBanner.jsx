import React, { useState, useEffect } from 'react'
import { Cookie, Shield, X } from 'lucide-react'

const CONSENT_KEY = 'ats_resume_privacy_consent'

export default function CookieConsentBanner({ onOpenPrivacy, onOpenTerms }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(CONSENT_KEY)
      if (!accepted) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted')
    } catch {}
    setVisible(false)
  }

  const handleDecline = () => {
    // Allow use without accepting, just hide the banner
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de privacidad">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-icon">
          <Cookie size={22} />
        </div>

        <div className="cookie-banner-text">
          <p>
            <strong>Tu privacidad importa.</strong>{' '}
            Esta herramienta usa <strong>almacenamiento local</strong> para guardar tu CV en tu dispositivo
            y procesa tus datos con IA (Google Gemini / Groq) para brindarte el servicio.
            No guardamos tus datos en servidores propios ni los vendemos.{' '}
            <button className="cookie-link-btn" onClick={onOpenPrivacy}>
              <Shield size={12} /> Política de Privacidad
            </button>
            {' · '}
            <button className="cookie-link-btn" onClick={onOpenTerms}>
              Términos de Uso
            </button>
          </p>
        </div>

        <div className="cookie-banner-actions">
          <button className="btn-secondary cookie-decline-btn" onClick={handleDecline}>
            Solo navegar
          </button>
          <button className="btn-primary cookie-accept-btn" onClick={handleAccept}>
            Aceptar
          </button>
        </div>

        <button className="cookie-banner-close" onClick={handleDecline} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
