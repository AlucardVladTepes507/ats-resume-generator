import React, { useState } from 'react'
import { Lightbulb, X, Send, CheckCircle2, Globe, MessageSquare } from 'lucide-react'

export default function FeedbackModal({ isOpen, onClose, t }) {
  const [requestType, setRequestType] = useState('template') // 'template' | 'feature'
  const [marketCountry, setMarketCountry] = useState('EE.UU. & Canadá')
  const [details, setDetails] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!details.trim()) return

    // Create a mailto mail link as a quick fallback, or log feedback
    const subject = encodeURIComponent(`[Sugerencia ATS App] ${requestType === 'template' ? 'Nueva Plantilla' : 'Nueva Función'} (${marketCountry})`)
    const body = encodeURIComponent(
      `Tipo: ${requestType === 'template' ? 'Plantilla para Mercado' : 'Sugerencia de Función'}\n` +
      `País / Mercado: ${marketCountry}\n` +
      `Detalles / Formato deseado:\n${details}\n\n` +
      `Contacto: ${contactEmail || 'Anónimo'}`
    )

    // Trigger mailto fallback for administrator email or server log
    window.open(`mailto:smart507ltd@gmail.com?subject=${subject}&body=${body}`, '_blank')

    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setDetails('')
      onClose()
    }, 2500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="modal-header">
              <Lightbulb size={24} className="modal-icon" />
              <div>
                <h3>{t?.feedbackTitle || 'Sugerir Plantilla o Función Internacional'}</h3>
                <p>{t?.feedbackSubtitle || '¿Necesitas una plantilla para un mercado internacional o región específica? ¡Dinos cuál y la agregaremos!'}</p>
              </div>
            </div>

            <div className="form-group">
              <label>¿Qué deseas solicitar?</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
              >
                <option value="template">🖼️ Solicitar nueva plantilla para una región/país</option>
                <option value="feature">✨ Sugerir una nueva función o herramienta IA</option>
              </select>
            </div>

            <div className="form-group">
              <label>Región / Mercado laboral objetivo:</label>
              <input
                type="text"
                placeholder="Ej. EE.UU. & Canadá, América Latina (LATAM), Europa, México, España..."
                value={marketCountry}
                onChange={(e) => setMarketCountry(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Detalles de la plantilla o recomendación:</label>
              <textarea
                rows={4}
                required
                placeholder="Describe qué secciones, colores, fotos o formato requiere el mercado o empresa donde vas a aplicar..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tu correo (opcional, para avisarte cuando la agreguemos):</label>
              <input
                type="email"
                placeholder="tu.correo@ejemplo.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                <Send size={16} />
                <span>Enviar Sugerencia</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-success-box">
            <CheckCircle2 size={48} color="#10b981" />
            <h4>¡Muchas gracias por tu sugerencia!</h4>
            <p>Revisaremos tus requisitos de plantilla para añadirla en la próxima actualización.</p>
          </div>
        )}
      </div>
    </div>
  )
}
