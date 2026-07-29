import React, { useState } from 'react'
import { DollarSign, Sparkles, TrendingUp, Lightbulb, ShieldCheck } from 'lucide-react'
import { getApiUrl, sanitizeResumeData } from '../config'

export default function SalaryEstimator({ resumeData }) {
  const [targetCountry, setTargetCountry] = useState('Panamá')
  const [isEstimating, setIsEstimating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleEstimate = async () => {
    setError(null)
    setIsEstimating(true)

    const API_BASE = getApiUrl()

    try {
      const response = await fetch(`${API_BASE}/estimate-salary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: sanitizeResumeData(resumeData),
          target_country: targetCountry
        })
      })

      if (response.status === 404) {
        throw new Error('El servidor backend en la nube se está desplegando con las nuevas funciones. Por favor, espera 30 segundos y vuelve a presionar el botón.')
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al estimar el rango salarial')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsEstimating(false)
    }
  }

  return (
    <div className="salary-estimator-container">
      <div className="analyzer-header">
        <DollarSign size={22} className="analyzer-icon" />
        <div>
          <h3>Estimador de Salario & Poder de Negociación por País</h3>
          <p>Conoce el rango salarial promedio de tu perfil en el mercado laboral objetivo antes de tu entrevista.</p>
        </div>
      </div>

      <div className="analyzer-input-group">
        <label>Selecciona o escribe el país objetivo:</label>
        <div className="salary-input-row">
          <input
            type="text"
            placeholder="Ej. Panamá, Estados Unidos, Canadá, México, Colombia..."
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
          />
          <button
            className="btn-primary analyze-btn"
            onClick={handleEstimate}
            disabled={isEstimating}
          >
            <Sparkles size={16} />
            <span>{isEstimating ? 'Estimando Mercado Salarial...' : 'Calcular Rango Salarial con IA'}</span>
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="salary-results-wrapper">
          {/* Salary Cards Range */}
          <div className="salary-cards-grid">
            <div className="salary-card min">
              <span className="card-lbl">Mínimo Inicial</span>
              <strong className="salary-val">{result.min_salary}</strong>
            </div>

            <div className="salary-card avg">
              <span className="card-lbl">Promedio Estimado</span>
              <strong className="salary-val">{result.avg_salary}</strong>
            </div>

            <div className="salary-card max">
              <span className="card-lbl">Máximo Competitivo</span>
              <strong className="salary-val">{result.max_salary}</strong>
            </div>
          </div>

          {/* Insights & Negotiation Tips */}
          <div className="salary-insights-grid">
            {result.market_insights && (
              <div className="detail-box salary-market">
                <strong><TrendingUp size={16} /> Análisis de Mercado ({targetCountry}):</strong>
                <p>{result.market_insights}</p>
              </div>
            )}

            {result.negotiation_tips?.length > 0 && (
              <div className="detail-box salary-tips">
                <strong><Lightbulb size={16} /> Consejos de Negociación Salarial:</strong>
                <ul>
                  {result.negotiation_tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.salary_boosters?.length > 0 && (
              <div className="detail-box salary-boosters">
                <strong><ShieldCheck size={16} /> Factores que aumentan tu propuesta:</strong>
                <ul>
                  {result.salary_boosters.map((booster, idx) => (
                    <li key={idx}>{booster}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
