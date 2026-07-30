import React, { useState } from 'react'
import { Mail, X, Send, CheckCircle2 } from 'lucide-react'

export default function ContactModal({ isOpen, onClose, t }) {
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim() || !senderEmail.trim()) return

    const mailSubject = encodeURIComponent(subject || 'Consulta desde ATS Resume Generator (smart507.com)')
    const mailBody = encodeURIComponent(
      `Nombre: ${senderName || 'Usuario'}\n` +
      `Correo: ${senderEmail}\n\n` +
      `Mensaje:\n${message}`
    )

    // Trigger mailto link internally without displaying email on UI
    window.open(`mailto:smart507ltd@gmail.com?subject=${mailSubject}&body=${mailBody}`, '_blank')

    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setMessage('')
      setSubject('')
      setSenderName('')
      setSenderEmail('')
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
              <Mail size={24} className="modal-icon" />
              <div>
                <h3>{t?.contactTitle || 'Contacto — smart507.com'}</h3>
                <p>{t?.contactSubtitle || '¿Tienes dudas, proyectos o consultas sobre la plataforma? Escríbenos directamente.'}</p>
              </div>
            </div>

            <div className="form-group">
              <label>Tu Nombre o Empresa:</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tu Correo Electrónico (Para responderte):</label>
              <input
                type="email"
                required
                placeholder="tu.correo@ejemplo.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Asunto (Opcional):</label>
              <input
                type="text"
                placeholder="Ej. Consulta sobre plantillas corporativas"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Mensaje:</label>
              <textarea
                rows={4}
                required
                placeholder="Escribe aquí tu consulta o mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                <Send size={16} />
                <span>Enviar Mensaje</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-success-box">
            <CheckCircle2 size={48} color="#10b981" />
            <h4>¡Mensaje enviado con éxito!</h4>
            <p>Gracias por contactar a smart507.com. Te responderemos a la brevedad.</p>
          </div>
        )}
      </div>
    </div>
  )
}
