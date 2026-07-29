import React, { useState } from 'react'
import { Share2, Sparkles, Copy, Check } from 'lucide-react'
import { getApiUrl } from '../config'

export default function LinkedInBioOptimizer({ resumeData }) {
  const [targetPosition, setTargetPosition] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    const API_BASE = getApiUrl()

    try {
      const response = await fetch(`${API_BASE}/generate-linkedin-profile`, {
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
        throw new Error(data.detail || 'Error al generar perfil de LinkedIn')
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
        <Share2 size={22} className="analyzer-icon" />
        <div>
          <h3>Optimizador de Perfil de LinkedIn (Titular & Bio)</h3>
          <p>Genera un Titular y una sección "Acerca de" optimizados con palabras clave para que los reclutadores te encuentren primero.</p>
        </div>
      </div>

      <div className="analyzer-input-group">
        <input
          type="text"
          placeholder="Puesto u objetivo laboral (ej. Soporte IT Senior, Analista de Datos)..."
          value={targetPosition}
          onChange={(e) => setTargetPosition(e.target.value)}
        />
        <button
          className="btn-primary analyze-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <Sparkles size={16} />
          <span>{isGenerating ? 'Optimizando Perfil de LinkedIn...' : 'Generar Perfil de LinkedIn con IA'}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="outreach-results-grid">
          {/* Headline Box */}
          <div className="outreach-box linkedin">
            <div className="box-header">
              <h4>
                <Share2 size={16} /> Titular de LinkedIn (*Headline*)
              </h4>
              <button className="btn-secondary sm" onClick={() => handleCopy(result.headline, 'headline')}>
                {copiedField === 'headline' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedField === 'headline' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="outreach-text-content">{result.headline}</div>
          </div>

          {/* About Section Box */}
          <div className="outreach-box email">
            <div className="box-header">
              <h4>
                <Sparkles size={16} /> Sección "Acerca de" (*About Bio*)
              </h4>
              <button className="btn-secondary sm" onClick={() => handleCopy(result.about_summary, 'about')}>
                {copiedField === 'about' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedField === 'about' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="outreach-text-content">{result.about_summary}</div>

            {result.featured_skills?.length > 0 && (
              <div className="linkedin-skills-tags">
                <strong>Habilidades destacadas para tu perfil:</strong>
                <div className="tag-cloud">
                  {result.featured_skills.map((sk, sIdx) => (
                    <span className="kw-tag match" key={sIdx}>#{sk}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
