import React, { useState } from 'react'
import { Mail, Sparkles, Copy, Check, Download, Edit3 } from 'lucide-react'
import { generatePureVectorCoverLetter } from '../utils/pureVectorPdf'

export default function CoverLetterGenerator({ resumeData }) {
  const [companyName, setCompanyName] = useState('')
  const [positionName, setPositionName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetterData, setCoverLetterData] = useState(null)
  const [editedLetter, setEditedLetter] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${API_URL}/generate-cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: resumeData,
          company_name: companyName,
          position_name: positionName,
          job_description: jobDescription
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al generar la carta de presentaciÃ³n')
      }

      setCoverLetterData(data)
      setEditedLetter(data.cover_letter || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = () => {
    if (!editedLetter) return
    try {
      generatePureVectorCoverLetter(resumeData, companyName, positionName, editedLetter)
    } catch (err) {
      console.error('Error generating cover letter PDF:', err)
      alert('Error al generar PDF: ' + err.message)
    }
  }

  return (
    <div className="cover-letter-container">
      <div className="analyzer-header">
        <Mail size={22} className="analyzer-icon" />
        <div>
          <h3>Generador de Carta de PresentaciÃ³n con IA</h3>
          <p>Redacta una carta formal, personalizada y persuasiva adaptada al puesto y empresa a la que aplicas.</p>
        </div>
      </div>

      <div className="cover-inputs-grid">
        <div className="form-group">
          <label>Nombre de la Empresa</label>
          <input
            type="text"
            placeholder="Ej. Banco General, Amazon, TechCorp..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Nombre del Puesto / Cargo</label>
          <input
            type="text"
            placeholder="Ej. TÃ©cnico de Soporte IT, Analista de Datos..."
            value={positionName}
            onChange={(e) => setPositionName(e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label>DescripciÃ³n / Requisitos del Puesto (Opcional)</label>
          <textarea
            rows={3}
            placeholder="Pega detalles clave de la vacante para personalizar los argumentos de tu carta..."
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
        <span>{isGenerating ? 'Redactando Carta de PresentaciÃ³n...' : 'Generar Carta con IA'}</span>
      </button>

      {error && <div className="error-banner">{error}</div>}

      {coverLetterData && (
        <div className="cover-result-wrapper">
          <div className="cover-actions-bar">
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? 'Â¡Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button className="btn-primary" onClick={handleDownloadPDF}>
              <Download size={16} />
              <span>Descargar PDF ATS</span>
            </button>
          </div>

          <div className="cover-editor-box">
            <label><Edit3 size={14} /> Puedes editar el texto directamente antes de descargar:</label>
            <textarea
              rows={12}
              value={editedLetter}
              onChange={(e) => setEditedLetter(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
