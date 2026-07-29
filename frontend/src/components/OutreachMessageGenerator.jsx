import React, { useState } from 'react'
import { MessageSquare, Sparkles, Copy, Check, Mail, Send } from 'lucide-react'

export default function OutreachMessageGenerator({ resumeData }) {
  const [companyName, setCompanyName] = useState('')
  const [positionName, setPositionName] = useState('')
  const [recruiterName, setRecruiterName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${API_URL}/generate-outreach-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: resumeData,
          company_name: companyName,
          position_name: positionName,
          recruiter_name: recruiterName,
          job_description: jobDescription
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al generar mensajes de contacto')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="outreach-container">
      <div className="analyzer-header">
        <MessageSquare size={22} className="analyzer-icon" />
        <div>
          <h3>Generador de Mensajes para Reclutadores & LinkedIn</h3>
          <p>Redacta mensajes de alto impacto para escribirle directamente al reclutador o líder del área.</p>
        </div>
      </div>

      <div className="cover-inputs-grid">
        <div className="form-group">
          <label>Nombre de la Empresa</label>
          <input
            type="text"
            placeholder="Ej. Softvici, Banco General..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Nombre del Puesto</label>
          <input
            type="text"
            placeholder="Ej. Técnico IT, Analista..."
            value={positionName}
            onChange={(e) => setPositionName(e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label>Nombre del Reclutador / Gerente (Opcional)</label>
          <input
            type="text"
            placeholder="Ej. María González / Responsable de Selección"
            value={recruiterName}
            onChange={(e) => setRecruiterName(e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label>Detalles / Requisitos de la Vacante (Opcional)</label>
          <textarea
            rows={2}
            placeholder="Pega algunos requisitos clave para destacar coincidencia..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
      </div>

      <button
        className="btn-primary generate-letter-btn"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        <Sparkles size={16} />
        <span>{isGenerating ? 'Generando Mensajes de Contacto...' : 'Generar Mensajes con IA'}</span>
      </button>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="outreach-results-grid">
          {/* LinkedIn DM Box */}
          <div className="outreach-box linkedin">
            <div className="box-header">
              <h4>
                <MessageSquare size={16} /> Mensaje Corto para LinkedIn DM (&lt; 280 caract.)
              </h4>
              <button className="btn-secondary sm" onClick={() => handleCopy(result.linkedin_dm, 'linkedin')}>
                {copiedField === 'linkedin' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedField === 'linkedin' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="outreach-text-content">{result.linkedin_dm}</div>
          </div>

          {/* Cold Email Box */}
          <div className="outreach-box email">
            <div className="box-header">
              <h4>
                <Mail size={16} /> Correo Formal Directo (Cold Email)
              </h4>
              <button
                className="btn-secondary sm"
                onClick={() => handleCopy(`Asunto: ${result.cold_email_subject}\n\n${result.cold_email_body}`, 'email')}
              >
                {copiedField === 'email' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedField === 'email' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="email-subject-line">
              <strong>Asunto:</strong> {result.cold_email_subject}
            </div>
            <div className="outreach-text-content">{result.cold_email_body}</div>
          </div>
        </div>
      )}
    </div>
  )
}
