import React, { useState } from 'react'
import { CheckCircle2, Sparkles, AlertCircle, SpellCheck, ArrowRight } from 'lucide-react'
import { getApiUrl } from '../config'

export default function GrammarChecker({ resumeData, onUpdateResumeData }) {
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isApplied, setIsApplied] = useState(false)

  const handleScan = async () => {
    setError(null)
    setIsScanning(true)
    setIsApplied(false)

    const API_BASE = getApiUrl()

    try {
      const response = await fetch(`${API_BASE}/check-grammar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_data: resumeData })
      })

      if (response.status === 404) {
        throw new Error('El servidor backend en la nube se está desplegando con las nuevas funciones. Por favor, espera 30 segundos y vuelve a presionar el botón.')
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al escanear la ortografía')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsScanning(false)
    }
  }

  const handleApplyAll = () => {
    if (result && result.corrected_resume_data && onUpdateResumeData) {
      onUpdateResumeData(result.corrected_resume_data)
      setIsApplied(true)
    }
  }

  return (
    <div className="grammar-checker-container">
      <div className="analyzer-header">
        <SpellCheck size={22} className="analyzer-icon" />
        <div>
          <h3>Escáner Ortográfico & Gramatical con IA</h3>
          <p>Revisa minuciosamente la ortografía, tildes y redacción de tu CV antes de enviarlo a las empresas.</p>
        </div>
      </div>

      <div className="analyzer-input-group">
        <button
          className="btn-primary analyze-btn"
          onClick={handleScan}
          disabled={isScanning}
        >
          <Sparkles size={16} />
          <span>{isScanning ? 'Escaneando Ortografía y Gramática...' : '🔍 Escanear Ortografía de mi CV'}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="grammar-results-box">
          <div className="grammar-results-header">
            <h4>
              {result.total_errors > 0 ? (
                <>⚠️ Se encontraron {result.total_errors} hallazgos de redacción/ortografía</>
              ) : (
                <>✅ ¡Excelente! Tu currículum no tiene errores de ortografía detectados.</>
              )}
            </h4>

            {result.total_errors > 0 && result.corrected_resume_data && (
              <button
                className="btn-primary sm"
                onClick={handleApplyAll}
                disabled={isApplied}
              >
                <CheckCircle2 size={16} />
                <span>{isApplied ? '¡Correcciones Aplicadas!' : '✨ Aplicar todas las correcciones'}</span>
              </button>
            )}
          </div>

          {result.issues && result.issues.length > 0 && (
            <div className="issues-list">
              {result.issues.map((issue, idx) => (
                <div className="issue-card" key={idx}>
                  <div className="issue-section-badge">{issue.section}</div>
                  <div className="issue-diff">
                    <span className="issue-orig">{issue.original}</span>
                    <ArrowRight size={14} className="issue-arrow" />
                    <span className="issue-sug">{issue.suggestion}</span>
                  </div>
                  <p className="issue-explanation">{issue.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
