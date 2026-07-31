import React, { useState, useRef } from 'react'
import { Target, CheckCircle2, AlertTriangle, Sparkles, Lightbulb, Image as ImageIcon, X, Upload, Clipboard } from 'lucide-react'

export default function AtsMatchAnalyzer({ resumeData, setResumeData, setViewMode }) {
  const [jobDescription, setJobDescription] = useState('')
  const [imageBase64, setImageBase64] = useState(null)
  const [imageName, setImageName] = useState('')
  const [isExtractingImage, setIsExtractingImage] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizeSuccess, setOptimizeSuccess] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleAutoOptimize = async () => {
    if (!result) return
    setIsOptimizing(true)
    setError(null)
    setOptimizeSuccess(false)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${API_URL}/auto-optimize-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: resumeData,
          job_description: jobDescription,
          missing_keywords: result.missing_keywords || []
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al auto-optimizar el CV')
      }

      if (data.optimized_resume && setResumeData) {
        setResumeData(data.optimized_resume)
        setOptimizeSuccess(true)
        setTimeout(() => {
          if (setViewMode) setViewMode('editor')
        }, 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsOptimizing(false)
    }
  }

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    setIsExtractingImage(true)
    setImageName(file.name || 'captura_de_pantalla.png')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64Data = e.target.result
      setImageBase64(base64Data)

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      try {
        const response = await fetch(`${API_URL}/extract-job-image-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64Data })
        })

        const data = await response.json()
        if (!response.ok) {
          setImageBase64(null)
          setImageName('')
          if (fileInputRef.current) fileInputRef.current.value = ''
          throw new Error(data.detail || 'La imagen subida no corresponde a una oferta de empleo válida.')
        }
        if (data.extracted_text) {
          setJobDescription((prev) => (prev ? prev + '\n\n' + data.extracted_text : data.extracted_text))
        }
      } catch (err) {
        setError(err.message || 'La imagen subida no corresponde a una oferta de trabajo válida.')
        setImageBase64(null)
        setImageName('')
      } finally {
        setIsExtractingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) processImageFile(file)
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          processImageFile(file)
          break
        }
      }
    }
  }

  const handleRemoveImage = () => {
    setImageBase64(null)
    setImageName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Check if resume has minimal real user content filled in
  const checkResumeCompleteness = () => {
    if (!resumeData) return false
    const info = resumeData.personal_info || {}
    const exp = resumeData.experience || []
    const skills = resumeData.skills || []

    const name = (info.name || '').trim().toLowerCase()
    const isDefaultName = !name || name === 'tu nombre' || name === 'nombre completo' || name === 'juan pérez' || name === 'john doe'

    const hasRealExp = exp.some(item => {
      const comp = (item.company || '').trim().toLowerCase()
      const pos = (item.position || '').trim().toLowerCase()
      return comp && comp !== 'empresa ejemplo' && comp !== 'nombre de la empresa' && pos && pos !== 'cargo / puesto'
    })

    const hasRealSkills = (Array.isArray(skills) ? skills : []).some(s => {
      const skillName = typeof s === 'string' ? s : s.name
      return skillName && skillName.trim().length > 0
    })

    if (isDefaultName && !hasRealExp && !hasRealSkills) {
      return false
    }
    return true
  }

  const isCvReady = checkResumeCompleteness()

  const handleAnalyze = async () => {
    if (!isCvReady) {
      setError('⚠️ Tu CV no contiene información laboral aún. Primero completa tu información personal, experiencia y habilidades en la pestaña "1. Editar & Vista Previa ATS".')
      return
    }

    if (!jobDescription.trim() && !imageBase64) {
      setError('Por favor, pega el texto, enlace (URL) o sube una captura/imagen de la vacante.')
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
          job_description: jobDescription,
          image_base64: imageBase64
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
          <p>Pega el texto, enlace (URL) o sube/pega una captura de pantalla de la vacante para medir la compatibilidad de tu CV.</p>
        </div>
      </div>

      {!isCvReady && (
        <div className="incomplete-cv-warning">
          <AlertTriangle size={24} className="warning-icon" />
          <div>
            <h4>⚠️ Primero ingresa tus datos en el CV</h4>
            <p>
              Para medir la compatibilidad ATS real con una vacante, primero debes completar tu Información Personal, Experiencia Laboral y Habilidades en la pestaña <strong>"1. Editar & Vista Previa ATS"</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="analyzer-input-group" onPaste={handlePaste}>
        {/* Hidden Image File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div className="analyzer-toolbar">
          <button
            type="button"
            className="btn-secondary upload-job-img-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Subir una foto o captura de pantalla de la oferta laboral"
          >
            <ImageIcon size={16} />
            <span>{isExtractingImage ? 'Extrayendo texto con IA...' : '🖼️ Subir o Pegar Captura'}</span>
          </button>
          <span className="paste-hint">💡 O pega una imagen de captura directamente con <code>Ctrl + V</code></span>
        </div>

        {imageName && (
          <div className="attached-image-badge">
            <ImageIcon size={15} />
            <span>Imagen de la oferta: <strong>{imageName}</strong></span>
            <button type="button" className="remove-img-btn" onClick={handleRemoveImage} title="Quitar imagen">
              <X size={14} />
            </button>
          </div>
        )}

        <textarea
          rows={5}
          placeholder="Pega aquí el texto completo, el enlace (URL) o captura de la oferta laboral (requisitos, funciones, competencias)..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <button
          className="btn-primary analyze-btn"
          onClick={handleAnalyze}
          disabled={isAnalyzing || isExtractingImage}
        >
          <Sparkles size={16} />
          <span>{isAnalyzing ? 'Analizando con IA...' : 'Analizar Compatibilidad ATS'}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && (() => {
        const matchScore = result.match_score ?? result.score ?? 0
        return (
          <div className="analyzer-results">
            {/* Score Circle / Gauge */}
            <div className="score-card">
              <div className={`score-badge ${matchScore >= 80 ? 'high' : matchScore >= 60 ? 'medium' : 'low'}`}>
                <span className="score-number">{matchScore}%</span>
              </div>
              <div className="score-summary">
                <h4 className="score-title">Compatibilidad ATS: <strong>{matchScore}%</strong></h4>
                {matchScore >= 80 ? (
                  <p className="status-good">¡Excelente encaje! Tu CV contiene las palabras clave principales requeridas para este puesto.</p>
                ) : matchScore >= 60 ? (
                  <p className="status-medium">Buen nivel, pero incorporar algunas palabras clave faltantes aumentará tus posibilidades de entrevista.</p>
                ) : (
                  <p className="status-low">Bajo porcentaje de encaje ({matchScore}%). Te recomendamos agregar las competencias y palabras clave sugeridas a continuación.</p>
                )}
              </div>
            </div>

            {/* 1-Click Auto-Optimize CTA Banner */}
            <div className="auto-optimize-banner">
              <div className="banner-info">
                <Sparkles className="sparkles-icon" size={24} />
                <div>
                  <h4>✨ ¿Quieres adaptar tu CV a esta vacante en 1-Clic?</h4>
                  <p>La IA inyectará sutilmente las palabras clave faltantes en tus viñetas de experiencia y habilidades para subir tu compatibilidad ATS al máximo.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-auto-optimize"
                onClick={handleAutoOptimize}
                disabled={isOptimizing}
              >
                <Sparkles size={18} />
                <span>{isOptimizing ? 'Optimizando tu CV con IA...' : '✨ Ajustar mi CV a esta Vacante (1-Clic)'}</span>
              </button>
            </div>

            {optimizeSuccess && (
              <div className="optimize-success-card">
                <CheckCircle2 size={20} />
                <span>¡Tu CV ha sido optimizado con éxito con las palabras clave de la vacante! Redireccionando al editor...</span>
              </div>
            )}

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
        )
      })()}
    </div>
  )
}
