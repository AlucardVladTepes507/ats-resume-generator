import React, { useState } from 'react'
import { HelpCircle, Sparkles, Target, CheckCircle2, Lightbulb } from 'lucide-react'

export default function InterviewPrepGenerator({ resumeData }) {
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Por favor, pega el texto de la oferta laboral para preparar tus preguntas.')
      return
    }
    setError(null)
    setIsGenerating(true)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${API_URL}/generate-interview-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: resumeData,
          job_description: jobDescription
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al generar preguntas de entrevista')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="interview-prep-container">
      <div className="analyzer-header">
        <HelpCircle size={22} className="analyzer-icon" />
        <div>
          <h3>Simulador & Preparador de Entrevistas de Trabajo con IA</h3>
          <p>Genera las 5 preguntas más probables y difíciles de la entrevista con respuestas en formato STAR.</p>
        </div>
      </div>

      <div className="analyzer-input-group">
        <textarea
          rows={4}
          placeholder="Pega aquí la descripción o requisitos del puesto para personalizar tu entrevista..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <button
          className="btn-primary analyze-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <Sparkles size={16} />
          <span>{isGenerating ? 'Analizando Vacante y Generando Preguntas STAR...' : 'Generar Preguntas de Entrevista con IA'}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && result.questions && (
        <div className="interview-questions-list">
          {result.questions.map((item, idx) => (
            <div className="question-card" key={idx}>
              <div className="question-number-badge">Pregunta {idx + 1}</div>
              <h4 className="question-text">"{item.question}"</h4>
              
              <div className="question-details-grid">
                <div className="detail-box why-ask">
                  <strong><Target size={14} /> ¿Qué evalúa el reclutador?</strong>
                  <p>{item.why_they_ask}</p>
                </div>

                <div className="detail-box star-strategy">
                  <strong><Lightbulb size={14} /> Estrategia de Respuesta STAR (Situación, Tarea, Acción, Resultado):</strong>
                  <p>{item.star_strategy}</p>
                </div>

                {item.key_points?.length > 0 && (
                  <div className="detail-box key-points">
                    <strong><CheckCircle2 size={14} /> Puntos clave a mencionar:</strong>
                    <ul>
                      {item.key_points.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
