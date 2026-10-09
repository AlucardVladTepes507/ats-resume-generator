import React, { useState, useRef, useEffect } from 'react'
import { Mail, Sparkles, Copy, Check, Download, Edit3, Link2, Image as ImageIcon, FileText, AlertCircle, X, Loader } from 'lucide-react'
import { generatePureVectorCoverLetter } from '../utils/pureVectorPdf'
import { getApiUrl } from '../config'

const JOB_INPUT_MODES = [
  { id: 'text',  label: 'Pegar texto',   icon: FileText },
  { id: 'url',   label: 'Enlace / URL',  icon: Link2 },
  { id: 'image', label: 'Foto / PDF',    icon: ImageIcon },
]

export default function CoverLetterGenerator({ resumeData }) {
  const API_URL = getApiUrl()

  // Pre-fill from CV data
  const defaultPosition = resumeData?.experience?.[0]?.position || ''

  const [companyName,    setCompanyName]    = useState('')
  const [positionName,   setPositionName]   = useState(defaultPosition)
  const [jobMode,        setJobMode]        = useState('text')  // 'text' | 'url' | 'image'
  const [jobText,        setJobText]        = useState('')
  const [jobUrl,         setJobUrl]         = useState('')
  const [jobImageB64,    setJobImageB64]    = useState(null)
  const [jobImageName,   setJobImageName]   = useState('')
  const [isGenerating,   setIsGenerating]   = useState(false)
  const [coverLetterData,setCoverLetterData]= useState(null)
  const [editedLetter,   setEditedLetter]   = useState('')
  const [copied,         setCopied]         = useState(false)
  const [error,          setError]          = useState(null)

  const fileInputRef = useRef(null)

  // When the CV changes (e.g. user switches CV), update default position
  useEffect(() => {
    const pos = resumeData?.experience?.[0]?.position || ''
    setPositionName(prev => prev || pos)
  }, [resumeData])

  const handleImageSelect = (file) => {
    if (!file) return
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG, WEBP o PDF.')
      return
    }
    setError(null)
    setJobImageName(file.name)
    const reader = new FileReader()
    reader.onloadend = () => setJobImageB64(reader.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.[0]) handleImageSelect(e.dataTransfer.files[0])
  }

  const clearImage = () => {
    setJobImageB64(null)
    setJobImageName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      const body = {
        resume_data:   resumeData,
        company_name:  companyName,
        position_name: positionName,
        job_description: jobMode === 'text' ? jobText : '',
        job_url:         jobMode === 'url'  ? jobUrl  : '',
        image_base64:    jobMode === 'image' && jobImageB64 ? jobImageB64 : null,
      }

      const response = await fetch(`${API_URL}/generate-cover-letter`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Error al generar la carta de presentación')

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

  const canGenerate = !isGenerating && (
    jobMode === 'text'  ||
    (jobMode === 'url'   && jobUrl.startsWith('http')) ||
    (jobMode === 'image' && jobImageB64)
  )

  return (
    <div className="cover-letter-container">
      {/* Header */}
      <div className="analyzer-header">
        <Mail size={22} className="analyzer-icon" />
        <div>
          <h3>Generador de Carta de Presentación con IA</h3>
          <p>Redacta una carta formal, personalizada y persuasiva adaptada al puesto y empresa a la que aplicas.</p>
        </div>
      </div>

      {/* Company / Position fields */}
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
            placeholder="Ej. Técnico de Soporte IT, Analista de Datos..."
            value={positionName}
            onChange={(e) => setPositionName(e.target.value)}
          />
        </div>
      </div>

      {/* Job offer input mode selector */}
      <div className="job-input-section">
        <label className="job-input-section-label">
          Oferta de trabajo (opcional — mejora la personalización de la carta)
        </label>

        {/* Mode tabs */}
        <div className="job-mode-tabs">
          {JOB_INPUT_MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`job-mode-tab ${jobMode === id ? 'active' : ''}`}
              onClick={() => setJobMode(id)}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Text mode */}
        {jobMode === 'text' && (
          <textarea
            className="job-input-textarea"
            rows={4}
            placeholder="Pega aquí los requisitos o descripción del puesto..."
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
          />
        )}

        {/* URL mode */}
        {jobMode === 'url' && (
          <div className="job-url-input-wrapper">
            <Link2 size={16} className="job-url-icon" />
            <input
              type="url"
              className="job-url-input"
              placeholder="https://www.linkedin.com/jobs/view/... o cualquier enlace de vacante"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </div>
        )}

        {/* Image / PDF mode */}
        {jobMode === 'image' && (
          <div
            className={`job-image-dropzone ${jobImageB64 ? 'has-file' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !jobImageB64 && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleImageSelect(e.target.files?.[0])}
            />
            {jobImageB64 ? (
              <div className="job-image-file-info">
                <FileText size={20} />
                <span className="job-image-filename">{jobImageName}</span>
                <button
                  type="button"
                  className="job-image-clear-btn"
                  onClick={(e) => { e.stopPropagation(); clearImage() }}
                  title="Quitar archivo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="job-image-dropzone-placeholder">
                <ImageIcon size={28} />
                <p>Arrastra aquí o haz clic para subir una <strong>captura de pantalla</strong> o <strong>PDF</strong> de la oferta</p>
                <span>JPG, PNG, WEBP, PDF</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        className="btn-primary generate-letter-btn"
        onClick={handleGenerate}
        disabled={!canGenerate}
      >
        {isGenerating
          ? <><Loader size={16} className="spin-icon" /><span>Redactando carta...</span></>
          : <><Sparkles size={16} /><span>Generar Carta con IA</span></>
        }
      </button>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Result */}
      {coverLetterData && (
        <div className="cover-result-wrapper">
          <div className="cover-actions-bar">
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button className="btn-primary" onClick={handleDownloadPDF}>
              <Download size={16} />
              <span>Descargar PDF ATS</span>
            </button>
          </div>

          <div className="cover-editor-box">
            <label><Edit3 size={14} /> Puedes editar el texto directamente antes de descargar:</label>
            <textarea
              rows={14}
              value={editedLetter}
              onChange={(e) => setEditedLetter(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
