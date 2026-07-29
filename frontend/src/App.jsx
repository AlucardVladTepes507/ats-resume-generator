import { useState, useRef } from 'react'
import { UploadCloud, AlertCircle, ArrowLeft, FileCheck, FileText, Image as ImageIcon, Eye, Edit3, AlertTriangle, Coffee, Target, Mail, Sparkles } from 'lucide-react'
import ResumeEditor from './components/ResumeEditor'
import ResumePreview from './components/ResumePreview'
import AtsMatchAnalyzer from './components/AtsMatchAnalyzer'
import CoverLetterGenerator from './components/CoverLetterGenerator'
import './index.css'

function App() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [isImageUpload, setIsImageUpload] = useState(false)
  const [mobileTab, setMobileTab] = useState('editor') // 'editor' | 'preview'
  const [viewMode, setViewMode] = useState('editor') // 'editor' | 'analyzer' | 'cover-letter'
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (selectedFile) => {
    const validExtensions = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!validExtensions.includes(selectedFile.type)) {
      setError('Por favor, selecciona un PDF o una imagen (JPG, PNG, WEBP).')
      return
    }
    setError(null)
    setFile(selectedFile)
    await processFile(selectedFile)
  }

  const processFile = async (uploadedFile) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', uploadedFile)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${API_URL}/upload-file`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Error al procesar el archivo')
      }

      setResumeData(data.data)
      setIsImageUpload(data.is_image || false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="header">
        <div className="header-brand">
          <FileText className="brand-icon" size={28} />
          <div>
            <h1>ATS Resume Generator</h1>
            <p>Convierte tu CV en PDF o foto (impreso/manuscrito) en un formato 100% ATS.</p>
          </div>
        </div>

        <div className="header-actions">
          <a
            href="https://ko-fi.com/smart507"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-kofi"
            title="Invítame un café en Ko-fi"
          >
            <Coffee size={18} />
            <span>Invítame un café</span>
          </a>

          {resumeData && (
            <button className="btn-secondary header-reset-btn" onClick={() => setResumeData(null)}>
              <ArrowLeft size={16} />
              <span>Subir otro CV</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {!resumeData ? (
        <div className="upload-section">
          <div
            className={`upload-container ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
            />

            {isLoading ? (
              <div className="upload-loading">
                <div className="loading-spinner"></div>
                <p className="upload-text">Escaneando y analizando con Inteligencia Artificial...</p>
                <p className="upload-hint">Transcribiendo texto, fotos de CVs o escritos a mano con visión IA.</p>
              </div>
            ) : (
              <>
                <div className="upload-icon-group">
                  <UploadCloud className="upload-icon" />
                  <ImageIcon className="upload-icon secondary" />
                </div>
                <p className="upload-text">Arrastra o selecciona tu CV en PDF o Foto</p>
                <p className="upload-hint">
                  Acepta PDFs de LinkedIn, currículums impresos o <strong>fotos de CVs escritos a mano</strong> (JPG, PNG, WEBP).
                </p>
                <div className="upload-actions-mobile">
                  <button type="button" className="btn-primary">
                    <UploadCloud size={16} />
                    <span>Seleccionar o tomar foto</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="workspace-wrapper">
          {/* Main Navigation Mode Bar */}
          <div className="main-nav-mode-bar">
            <button
              className={`nav-mode-btn ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
            >
              <Edit3 size={18} />
              <span>1. Editar & Vista Previa ATS</span>
            </button>
            <button
              className={`nav-mode-btn ${viewMode === 'analyzer' ? 'active' : ''}`}
              onClick={() => setViewMode('analyzer')}
            >
              <Target size={18} />
              <span>2. Analizar Vacante (ATS Score)</span>
            </button>
            <button
              className={`nav-mode-btn ${viewMode === 'cover-letter' ? 'active' : ''}`}
              onClick={() => setViewMode('cover-letter')}
            >
              <Mail size={18} />
              <span>3. Carta de Presentación</span>
            </button>
          </div>

          {/* Handwritten / Image Warning Notice */}
          {isImageUpload && viewMode === 'editor' && (
            <div className="image-warning-banner">
              <div className="warning-content">
                <AlertTriangle size={24} className="warning-icon" />
                <div>
                  <strong>⚠️ Aviso de verificación (CV en Foto / Manuscrito):</strong>
                  <p>
                    Este currículum fue procesado desde una imagen o manuscrito. Te sugerimos <strong>revisar y corregir los datos</strong> en el editor (nombres, fechas, texto) antes de descargar tu PDF final para garantizar precisión total.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: EDITOR & PREVIEW */}
          {viewMode === 'editor' && (
            <>
              {/* Mobile Switcher Bar */}
              <div className="mobile-toggle-bar">
                <button
                  className={`mobile-toggle-btn ${mobileTab === 'editor' ? 'active' : ''}`}
                  onClick={() => setMobileTab('editor')}
                >
                  <Edit3 size={18} />
                  <span>1. Editar Datos</span>
                </button>
                <button
                  className={`mobile-toggle-btn ${mobileTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setMobileTab('preview')}
                >
                  <Eye size={18} />
                  <span>2. Vista Previa ATS</span>
                </button>
              </div>

              <div className="workspace-grid">
                {/* Left Column: Form Editor */}
                <div className={`workspace-editor ${mobileTab === 'editor' ? 'mobile-visible' : 'mobile-hidden'}`}>
                  <div className="workspace-title">
                    <FileCheck size={20} />
                    <h2>Editar Datos del CV</h2>
                  </div>
                  <ResumeEditor data={resumeData} onChange={setResumeData} />
                </div>

                {/* Right Column: Live ATS Preview */}
                <div className={`workspace-preview ${mobileTab === 'preview' ? 'mobile-visible' : 'mobile-hidden'}`}>
                  <ResumePreview data={resumeData} />
                </div>
              </div>
            </>
          )}

          {/* VIEW MODE 2: ATS MATCH ANALYZER */}
          {viewMode === 'analyzer' && (
            <div className="feature-view-box">
              <AtsMatchAnalyzer resumeData={resumeData} />
            </div>
          )}

          {/* VIEW MODE 3: COVER LETTER GENERATOR */}
          {viewMode === 'cover-letter' && (
            <div className="feature-view-box">
              <CoverLetterGenerator resumeData={resumeData} />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>Desarrollado con Inteligencia Artificial para potenciar tu currículum.</p>
        <a
          href="https://ko-fi.com/smart507"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-kofi-link"
        >
          <Coffee size={16} />
          <span>¿Te fue útil? Invítame un café en Ko-fi</span>
        </a>
      </footer>
    </div>
  )
}

export default App
