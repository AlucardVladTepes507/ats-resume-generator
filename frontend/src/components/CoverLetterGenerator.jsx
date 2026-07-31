import React, { useState, useRef } from 'react'
import { Mail, Sparkles, Copy, Check, Download, Edit3 } from 'lucide-react'
import html2pdf from 'html2pdf.js'

export default function CoverLetterGenerator({ resumeData }) {
  const [companyName, setCompanyName] = useState('')
  const [positionName, setPositionName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetterData, setCoverLetterData] = useState(null)
  const [editedLetter, setEditedLetter] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const letterRef = useRef(null)

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
        throw new Error(data.detail || 'Error al generar la carta de presentación')
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

  const handleDownloadPDF = async () => {
    if (!letterRef.current) return

    const element = letterRef.current
    const originalTransform = element.style.transform

    try {
      element.style.transform = 'none'
      element.style.position = 'relative'
      await new Promise((resolve) => setTimeout(resolve, 120))

      const opt = {
        margin: 0,
        filename: `Carta_Presentacion_${(resumeData?.personal_info?.name || 'Candidato').trim().replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 816
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      element.style.transform = originalTransform
    }
  }

  return (
    <div className="cover-letter-container">
      <div className="analyzer-header">
        <Mail size={22} className="analyzer-icon" />
        <div>
          <h3>Generador de Carta de Presentación con IA</h3>
          <p>Redacta una carta formal, personalizada y persuasiva adaptada al puesto y empresa a la que aplicas.</p>
        </div>
      </div>

      <div className="cover-inputs-grid">
        <div className="form-group">
          <label>Nombre de la Empresa</label>
          <input
            type="text"
            placeholder="Ej. Softvici, Banco General, Amazon..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Nombre del Puesto / Cargo</label>
          <input
            type="text"
            placeholder="Ej. Técnico de Soporte IT, Analista de Datos..."
            value={positionName}
            onChange={(e) => setPositionName(e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label>Descripción / Requisitos del Puesto (Opcional)</label>
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
        <span>{isGenerating ? 'Redactando Carta de Presentación...' : 'Generar Carta con IA'}</span>
      </button>

      {error && <div className="error-banner">{error}</div>}

      {coverLetterData && (
        <div className="cover-result-wrapper">
          <div className="cover-actions-bar">
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button className="btn-primary" onClick={handleDownloadPDF}>
              <Download size={16} />
              <span>Descargar PDF</span>
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

          {/* Hidden/Formatted Printable Sheet for PDF Export */}
          <div className="preview-sheet-wrapper cover-pdf-wrapper">
            <div className="preview-sheet cover-sheet" ref={letterRef}>
              <div className="harvard-header">
                <h1 className="harvard-name">{resumeData?.personal_info?.name || 'NOMBRE COMPLETO'}</h1>
                <div className="harvard-contact">
                  {resumeData?.personal_info?.email} | {resumeData?.personal_info?.phone} | {resumeData?.personal_info?.location}
                </div>
              </div>
              <div className="harvard-section-divider"></div>
              {coverLetterData.subject && (
                <p className="cover-subject"><strong>Asunto:</strong> {coverLetterData.subject}</p>
              )}
              <div className="cover-body-text">
                {editedLetter.split('\n').map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
