import React, { useState } from 'react'
import { Award, Sparkles, Clock, TrendingUp, CheckCircle2 } from 'lucide-react'
import { getApiUrl } from '../config'

export default function CertificationsRoadmap({ resumeData }) {
  const [targetPosition, setTargetPosition] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    const API_BASE = getApiUrl()

    try {
      const response = await fetch(`${API_BASE}/recommend-certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: resumeData,
          target_position: targetPosition
        })
      })

      if (response.status === 404) {
        throw new Error('El servidor backend en la nube se está desplegando con las nuevas funciones. Por favor, espera 30 segundos y vuelve a presionar el botón.')
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al recomendar certificaciones')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="cert-roadmap-container">
      <div className="analyzer-header">
        <Award size={22} className="analyzer-icon" />
        <div>
          <h3>Roadmap de Certificaciones de Alto ROI (Mayor Salario)</h3>
          <p>Descubre las 3 certificaciones internacionales de mayor valor en tu industria para impulsar tu carrera.</p>
        </div>
      </div>

      <div className="analyzer-input-group">
        <input
          type="text"
          placeholder="Área o meta profesional (ej. Cloud DevOps, Ciberseguridad, Gestión de Proyectos, Finanzas)..."
          value={targetPosition}
          onChange={(e) => setTargetPosition(e.target.value)}
        />
        <button
          className="btn-primary analyze-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <Sparkles size={16} />
          <span>{isGenerating ? 'Analizando Certificaciones...' : 'Generar Certificaciones Sugeridas con IA'}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && result.certifications && (
        <div className="cert-cards-grid">
          {result.certifications.map((cert, idx) => (
            <div className="cert-card" key={idx}>
              <div className="cert-badge-header">
                <Award size={20} className="cert-icon" />
                <span className="cert-rank">Certificación #{idx + 1}</span>
              </div>
              <h4 className="cert-title">{cert.name}</h4>
              <p className="cert-provider">Emitida por: <strong>{cert.provider}</strong></p>

              <div className="cert-metrics-row">
                <span className="cert-metric prep">
                  <Clock size={14} /> Prep: {cert.prep_time}
                </span>
                <span className="cert-metric boost">
                  <TrendingUp size={14} /> Salario: {cert.salary_impact}
                </span>
              </div>

              <div className="cert-reason-box">
                <strong><CheckCircle2 size={14} /> ¿Por qué aumentará tus entrevistas?</strong>
                <p>{cert.why_recommended}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
