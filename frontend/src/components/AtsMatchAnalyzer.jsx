import React, { useState } from 'react'
import { Target, CheckCircle2, AlertTriangle, Sparkles, Lightbulb } from 'lucide-react'

export default function AtsMatchAnalyzer({ resumeData }) {
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Por favor, pega el texto de la oferta de trabajo o vacante.')
      return
    }
    setError(null)
    setIsAnalyzing(true)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${API_URL}/analyze-job-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: resumeData,
          job_description: jobDescription
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al analizar la oferta de empleo')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="ats-analyzer-container">
      <div className="analyzer-header">
        <Target size={22} className="analyzer-icon" />
        <div>
          <h3>Calculador de Compatibilidad ATS</h3>
          <p>Pega la descripción o el enlace (URL) de la vacante para medir la puntuación de tu CV y detectar palabras clave faltantes.</p>
        </div>
      </div>

      <div className="analyzer-input-group">
        <textarea
          rows={5}
          placeholder="Pega aquí el texto completo o el enlace (URL) de la oferta laboral (requisitos, funciones, competencias requeridas)..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <button
          className="btn-primary analyze-btn"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          <Sparkles size={16} />
          <span>{isAnalyzing ? 'Analizando con IA...' : 'Analizar Compatibilidad ATS'}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="analyzer-results">
          {/* Score Circle / Gauge */}
          <div className="score-card">
            <div className={`score-badge ${result.score >= 80 ? 'high' : result.score >= 60 ? 'medium' : 'low'}`}>
              <span className="score-number">{result.score}%</span>
              <span className="score-label">Compatibilidad ATS</span>
            </div>
            <div className="score-summary">
              {result.score >= 80 ? (
                <p className="status-good">¡Excelente encaje! Tu CV contiene las palabras clave principales requeridas.</p>
              ) : result.score >= 60 ? (
                <p className="status-medium">Buen nivel, pero incorporar algunas palabras clave faltantes aumentará tus entrevistas.</p>
              ) : (
                <p className="status-low">Bajo porcentaje. Te recomendamos agregar las competencias y palabras clave sugeridas.</p>
              )}
            </div>
          </div>

          {/* Keywords Breakdown */}
          <div className="keywords-grid">
            <div className="keywords-box match">
              <h4>
                <CheckCircle2 size={16} /> Palabras clave encontradas ({result.matching_keywords?.length || 0})
              </h4>
              <div className="tag-cloud">
                {(result.matching_keywords || []).map((kw, i) => (
                  <span key={i} className="kw-tag match">{kw}</span>
                ))}
              </div>
            </div>

            <div className="keywords-box missing">
              <h4>
                <AlertTriangle size={16} /> Palabras clave faltantes ({result.missing_keywords?.length || 0})
              </h4>
              <div className="tag-cloud">
                {(result.missing_keywords || []).map((kw, i) => (
                  <span key={i} className="kw-tag missing">+{kw}</span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="recommendations-box">
              <h4>
                <Lightbulb size={18} /> Sugerencias de mejora personalizadas
              </h4>
              <ul>
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
