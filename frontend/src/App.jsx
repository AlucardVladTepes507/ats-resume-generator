import { useState, useRef, useEffect } from 'react'
import { UploadCloud, AlertCircle, ArrowLeft, FileCheck, FileText, Image as ImageIcon, Eye, Edit3, AlertTriangle, Coffee, Target, Mail, Sparkles, Lightbulb, MessageSquare, HelpCircle, Share2, DollarSign, Award, SpellCheck, Tag, ChevronDown } from 'lucide-react'
import ResumeEditor from './components/ResumeEditor'
import ResumePreview from './components/ResumePreview'
import AtsMatchAnalyzer from './components/AtsMatchAnalyzer'
import CoverLetterGenerator from './components/CoverLetterGenerator'
import OutreachMessageGenerator from './components/OutreachMessageGenerator'
import InterviewPrepGenerator from './components/InterviewPrepGenerator'
import LinkedInBioOptimizer from './components/LinkedInBioOptimizer'
import SalaryEstimator from './components/SalaryEstimator'
import CertificationsRoadmap from './components/CertificationsRoadmap'
import GrammarChecker from './components/GrammarChecker'
import IndustryKeywords from './components/IndustryKeywords'
import FeedbackModal from './components/FeedbackModal'
import ContactModal from './components/ContactModal'
import './index.css'

import { getApiUrl } from './config'

function App() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Initialize from localStorage so refreshing (F5) doesn't lose the active CV
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem('ats_resume_current_data')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  const [isImageUpload, setIsImageUpload] = useState(() => {
    try {
      const saved = localStorage.getItem('ats_resume_is_image')
      return saved ? JSON.parse(saved) : false
    } catch (e) {
      return false
    }
  })

  const [mobileTab, setMobileTab] = useState('editor') // 'editor' | 'preview'
  const [viewMode, setViewMode] = useState('editor') // 'editor' | 'analyzer' | 'cover-letter' | 'linkedin' | 'salary' | 'certs' | 'outreach' | 'interview' | 'grammar' | 'keywords'
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const fileInputRef = useRef(null)

  // Automatically save current resumeData changes to localStorage
  useEffect(() => {
    if (resumeData) {
      localStorage.setItem('ats_resume_current_data', JSON.stringify(resumeData))
      localStorage.setItem('ats_resume_is_image', JSON.stringify(isImageUpload))
    }
  }, [resumeData, isImageUpload])

  const handleResetCV = () => {
    localStorage.removeItem('ats_resume_current_data')
    localStorage.removeItem('ats_resume_is_image')
    setResumeData(null)
    setIsImageUpload(false)
    setFile(null)
  }

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
    const fileName = (selectedFile.name || '').toLowerCase()
    const isPdf = fileName.endsWith('.pdf') || (selectedFile.type || '').includes('pdf')
    const isImage = (selectedFile.type || '').startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].some(ext => fileName.endsWith(ext))

    if (!isPdf && !isImage) {
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

    const API_BASE = getApiUrl()

    try {
      const response = await fetch(`${API_BASE}/upload-file`, {
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
          <button
            className="btn-secondary"
            onClick={() => setIsFeedbackOpen(true)}
            title="Solicitar una plantilla para tu país o mercado"
          >
            <Lightbulb size={18} />
            <span>Sugerir Plantilla</span>
          </button>

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
            <button className="btn-secondary header-reset-btn" onClick={handleResetCV}>
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
          {/* Main Navigation Bar with Dropdown Menu (No Horizontal Scrollbar) */}
          <div className="main-nav-mode-bar clean-nav-bar">
            <button
              className={`nav-mode-btn ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => { setViewMode('editor'); setIsDropdownOpen(false); }}
            >
              <Edit3 size={18} />
              <span>1. Editar & Vista Previa ATS</span>
            </button>

            <button
              className={`nav-mode-btn ${viewMode === 'analyzer' ? 'active' : ''}`}
              onClick={() => { setViewMode('analyzer'); setIsDropdownOpen(false); }}
            >
              <Target size={18} />
              <span>2. Analizar Vacante (ATS)</span>
            </button>

            {/* AI Tools Dropdown Menu */}
            <div className="tools-dropdown-wrapper">
              <button
                className={`nav-mode-btn dropdown-trigger ${['grammar', 'keywords', 'certs', 'linkedin', 'cover-letter', 'salary', 'outreach', 'interview'].includes(viewMode) ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Sparkles size={18} />
                <span>
                  {viewMode === 'grammar' && '✍️ Ortografía IA'}
                  {viewMode === 'keywords' && '🏷️ Palabras Clave'}
                  {viewMode === 'certs' && '🎓 Certificaciones Sugeridas'}
                  {viewMode === 'linkedin' && '💼 Perfil LinkedIn'}
                  {viewMode === 'cover-letter' && '✉️ Carta Presentación'}
                  {viewMode === 'salary' && '💵 Estimador Salarial'}
                  {viewMode === 'outreach' && '💬 Mensajes Contacto'}
                  {viewMode === 'interview' && '❓ Entrevista STAR'}
                  {!['grammar', 'keywords', 'certs', 'linkedin', 'cover-letter', 'salary', 'outreach', 'interview'].includes(viewMode) && '✨ Herramientas IA'}
                </span>
                <ChevronDown size={16} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="tools-dropdown-menu">
                  <button
                    className={`dropdown-item ${viewMode === 'grammar' ? 'active' : ''}`}
                    onClick={() => { setViewMode('grammar'); setIsDropdownOpen(false); }}
                  >
                    <SpellCheck size={16} />
                    <span>✍️ Ortografía & Gramática IA</span>
                  </button>
                  <button
                    className={`dropdown-item ${viewMode === 'keywords' ? 'active' : ''}`}
                    onClick={() => { setViewMode('keywords'); setIsDropdownOpen(false); }}
                  >
                    <Tag size={16} />
                    <span>🏷️ Palabras Clave de Industria</span>
                  </button>
                  <button
                    className={`dropdown-item ${viewMode === 'certs' ? 'active' : ''}`}
                    onClick={() => { setViewMode('certs'); setIsDropdownOpen(false); }}
                  >
                    <Award size={16} />
                    <span>🎓 Certificaciones Sugeridas</span>
                  </button>
                  <button
                    className={`dropdown-item ${viewMode === 'linkedin' ? 'active' : ''}`}
                    onClick={() => { setViewMode('linkedin'); setIsDropdownOpen(false); }}
                  >
                    <Share2 size={16} />
                    <span>💼 Perfil de LinkedIn</span>
                  </button>
                  <button
                    className={`dropdown-item ${viewMode === 'cover-letter' ? 'active' : ''}`}
                    onClick={() => { setViewMode('cover-letter'); setIsDropdownOpen(false); }}
                  >
                    <Mail size={16} />
                    <span>✉️ Carta de Presentación</span>
                  </button>
                  <button
                    className={`dropdown-item ${viewMode === 'salary' ? 'active' : ''}`}
                    onClick={() => { setViewMode('salary'); setIsDropdownOpen(false); }}
                  >
                    <DollarSign size={16} />
                    <span>💵 Estimador Salarial</span>
                  </button>
                  <button
                    className={`dropdown-item ${viewMode === 'outreach' ? 'active' : ''}`}
                    onClick={() => { setViewMode('outreach'); setIsDropdownOpen(false); }}
                  >
                    <MessageSquare size={16} />
                    <span>💬 Mensajes de Contacto</span>
                  </button>
                  <button
                    className={`dropdown-item ${viewMode === 'interview' ? 'active' : ''}`}
                    onClick={() => { setViewMode('interview'); setIsDropdownOpen(false); }}
                  >
                    <HelpCircle size={16} />
                    <span>❓ Entrevista STAR</span>
                  </button>
                </div>
              )}
            </div>
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

          {/* VIEW MODE 3: GRAMMAR CHECKER */}
          {viewMode === 'grammar' && (
            <div className="feature-view-box">
              <GrammarChecker resumeData={resumeData} onUpdateResumeData={setResumeData} />
            </div>
          )}

          {/* VIEW MODE 4: INDUSTRY KEYWORDS */}
          {viewMode === 'keywords' && (
            <div className="feature-view-box">
              <IndustryKeywords resumeData={resumeData} onUpdateResumeData={setResumeData} />
            </div>
          )}

          {/* VIEW MODE 5: COVER LETTER GENERATOR */}
          {viewMode === 'cover-letter' && (
            <div className="feature-view-box">
              <CoverLetterGenerator resumeData={resumeData} />
            </div>
          )}

          {/* VIEW MODE 6: LINKEDIN BIO OPTIMIZER */}
          {viewMode === 'linkedin' && (
            <div className="feature-view-box">
              <LinkedInBioOptimizer resumeData={resumeData} />
            </div>
          )}

          {/* VIEW MODE 7: SALARY ESTIMATOR */}
          {viewMode === 'salary' && (
            <div className="feature-view-box">
              <SalaryEstimator resumeData={resumeData} />
            </div>
          )}

          {/* VIEW MODE 8: CERTIFICATIONS ROADMAP */}
          {viewMode === 'certs' && (
            <div className="feature-view-box">
              <CertificationsRoadmap resumeData={resumeData} />
            </div>
          )}

          {/* VIEW MODE 9: OUTREACH MESSAGES */}
          {viewMode === 'outreach' && (
            <div className="feature-view-box">
              <OutreachMessageGenerator resumeData={resumeData} />
            </div>
          )}

          {/* VIEW MODE 10: INTERVIEW PREP */}
          {viewMode === 'interview' && (
            <div className="feature-view-box">
              <InterviewPrepGenerator resumeData={resumeData} />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

      {/* Footer */}
      <footer className="footer">
        <p>
          Desarrollado con Inteligencia Artificial por{' '}
          <a href="https://smart507.com" target="_blank" rel="noopener noreferrer" className="footer-brand-link">
            smart507.com
          </a>
        </p>

        <div className="footer-links-group">
          <button className="footer-link-btn" onClick={() => setIsFeedbackOpen(true)}>
            <Lightbulb size={16} />
            <span>Sugerir Plantilla / Mercado</span>
          </button>
          
          <button className="footer-link-btn" onClick={() => setIsContactOpen(true)}>
            <Mail size={16} />
            <span>Contacto</span>
          </button>

          <a
            href="https://ko-fi.com/smart507"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-kofi-link"
          >
            <Coffee size={16} />
            <span>¿Te fue útil? Invítame un café</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
