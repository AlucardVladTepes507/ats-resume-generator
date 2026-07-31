import { useState, useRef, useEffect } from 'react'
import { UploadCloud, AlertCircle, ArrowLeft, FileCheck, FileText, Image as ImageIcon, Eye, Edit3, AlertTriangle, Coffee, Target, Mail, Sparkles, Lightbulb, MessageSquare, HelpCircle, Share2, DollarSign, Award, SpellCheck, Tag, ChevronDown, FilePlus, Sun, Moon, SunMoon, Globe, Settings, X } from 'lucide-react'
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
import { translations, detectBrowserLanguage } from './i18n'
import './index.css'

import { getApiUrl } from './config'

function App() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Language state (auto detected from browser, manually changeable)
  const [currentLang, setCurrentLang] = useState(detectBrowserLanguage)
  const t = translations[currentLang] || translations.es

  const handleLangChange = (lang) => {
    setCurrentLang(lang)
    try {
      localStorage.setItem('ats_resume_ui_lang', lang)
    } catch (e) {}
  }

  // Theme mode: 'auto' | 'dark' | 'light'
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('ats_resume_theme_mode') || 'auto'
    } catch (e) {
      return 'auto'
    }
  })

  // Theme calculation & application effect (auto adjusts depending on local time / system pref)
  useEffect(() => {
    const applyTheme = () => {
      let resolvedTheme = 'dark'

      if (themeMode === 'auto') {
        const hour = new Date().getHours()
        // Dark mode from 7 PM (19:00) to 7 AM (07:00), Light mode from 7 AM to 7 PM
        const isNight = hour >= 19 || hour < 7
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        resolvedTheme = isNight || prefersDark ? 'dark' : 'light'
      } else {
        resolvedTheme = themeMode
      }

      document.documentElement.setAttribute('data-theme', resolvedTheme)
      try {
        localStorage.setItem('ats_resume_theme_mode', themeMode)
      } catch (e) {}
    }

    applyTheme()
    const interval = setInterval(applyTheme, 60000 * 15) // Re-evaluate every 15 mins if auto
    return () => clearInterval(interval)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'auto') return 'dark'
      if (prev === 'dark') return 'light'
      return 'auto'
    })
  }

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

  const handleCreateFromScratch = () => {
    const blankResume = {
      personal_info: {
        name: 'TU NOMBRE COMPLETO',
        email: 'tu.email@ejemplo.com',
        phone: '+507 6000-0000',
        location: 'Ciudad, País',
        linkedin: 'linkedin.com/in/tu-perfil',
        summary: 'Profesional enfocado en la consecución de resultados con experiencia en organización, gestión y trabajo en equipo. Hábil en la resolución de problemas y cumplimiento de metas.'
      },
      experience: [
        {
          company: 'Empresa Ejemplo S.A.',
          position: 'Cargo o Puesto Ocupado',
          start_date: '2022',
          end_date: 'Presente',
          bullets: [
            'Lideré y coordiné actividades operativas clave para la organización.',
            'Implementé mejoras en procesos incrementando la productividad del departamento.'
          ]
        }
      ],
      education: [
        {
          institution: 'Universidad o Centro Educativo',
          degree: 'Título o Licenciatura Obtenida',
          year: '2021'
        }
      ],
      skills: [
        'Trabajo en Equipo',
        'Gestión del Tiempo',
        'Resolución de Problemas',
        'Comunicación Asertiva'
      ]
    }

    setResumeData(blankResume)
    setIsImageUpload(false)
    setViewMode('editor')
    setMobileTab('editor')
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
    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', selectedFile)

    const API_BASE = getApiUrl()

    try {
      localStorage.removeItem('ats_resume_current_data')
      localStorage.removeItem('ats_resume_is_image')

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
      setViewMode('editor')
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
          <div className="brand-icon-wrapper">
            <FileText className="brand-icon" size={26} />
          </div>
          <div>
            <h1>ATS Resume Generator</h1>
            <p>{t.tagline}</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Mobile Settings Trigger Button */}
          <button
            type="button"
            className="mobile-settings-trigger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title={t.settings || 'Ajustes'}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Settings size={20} />}
            <span className="settings-tooltip-label">{t.settings || 'Ajustes'}</span>
          </button>

          {/* Desktop Actions */}
          <div className="desktop-actions-group">
            {/* Language Selector Dropdown */}
            <div className="lang-selector-wrapper">
              <Globe size={16} className="lang-icon" />
              <select
                className="lang-dropdown"
                value={currentLang}
                onChange={(e) => handleLangChange(e.target.value)}
                title="Cambiar idioma / Change language"
              >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇺🇸 English</option>
                <option value="pt">🇵🇹 Português</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
              </select>
            </div>

            {/* Theme Mode Toggle Button */}
            <button
              type="button"
              className="btn-secondary theme-toggle-btn"
              onClick={toggleTheme}
              title={
                themeMode === 'auto'
                  ? 'Modo Automático'
                  : themeMode === 'dark'
                  ? 'Modo Oscuro'
                  : 'Modo Claro'
              }
            >
              {themeMode === 'auto' && <SunMoon size={17} />}
              {themeMode === 'dark' && <Moon size={17} />}
              {themeMode === 'light' && <Sun size={17} />}
              <span>
                {themeMode === 'auto' ? t.themeAuto : themeMode === 'dark' ? t.themeDark : t.themeLight}
              </span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => setIsFeedbackOpen(true)}
              title="Solicitar una plantilla para tu país o mercado"
            >
              <Lightbulb size={18} />
              <span>{t.suggestTemplate}</span>
            </button>

            {resumeData && (
              <button className="btn-secondary header-reset-btn" onClick={handleResetCV}>
                <ArrowLeft size={16} />
                <span>{t.uploadOrCreateOther}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Settings Bottom Sheet Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>⚙️ {t.settings || 'Ajustes'}</h3>
              <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="mobile-menu-body">
              <div className="mobile-menu-item">
                <span className="mobile-item-label">🌐 Idioma / Language:</span>
                <select
                  className="lang-dropdown mobile-select"
                  value={currentLang}
                  onChange={(e) => handleLangChange(e.target.value)}
                >
                  <option value="es">🇪🇸 Español</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="de">🇩🇪 Deutsch</option>
                </select>
              </div>

              <div className="mobile-menu-item">
                <span className="mobile-item-label">🌗 Tema / Theme:</span>
                <button type="button" className="btn-secondary theme-toggle-btn w-full" onClick={toggleTheme}>
                  {themeMode === 'auto' && <SunMoon size={17} />}
                  {themeMode === 'dark' && <Moon size={17} />}
                  {themeMode === 'light' && <Sun size={17} />}
                  <span>{themeMode === 'auto' ? t.themeAuto : themeMode === 'dark' ? t.themeDark : t.themeLight}</span>
                </button>
              </div>

              <button
                className="btn-secondary w-full"
                onClick={() => { setIsFeedbackOpen(true); setIsMobileMenuOpen(false); }}
              >
                <Lightbulb size={18} />
                <span>{t.suggestTemplate}</span>
              </button>

              {resumeData && (
                <button
                  className="btn-secondary header-reset-btn w-full"
                  onClick={() => { handleResetCV(); setIsMobileMenuOpen(false); }}
                >
                  <ArrowLeft size={16} />
                  <span>{t.uploadOrCreateOther}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!resumeData ? (
        <div className="upload-section">
          <div className="landing-header">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>{t.heroBadge}</span>
            </div>
            <h2 className="landing-hero-title">
              {t.heroTitlePrefix}<span className="text-gradient">{t.heroTitleHighlight}</span>
            </h2>
            <p className="landing-hero-subtitle">
              {t.heroSubtitle}
            </p>
          </div>

          <div className="landing-cards-grid">
            {/* Card 1: Upload / Scan existing CV */}
            <div
              className={`upload-container landing-card ${isDragging ? 'drag-active' : ''}`}
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

              <div className="card-top-tag tag-blue">
                <span>{t.card1Tag}</span>
              </div>

              {isLoading ? (
                <div className="upload-loading">
                  <div className="loading-spinner"></div>
                  <p className="upload-text">{t.scanningIa}</p>
                  <p className="upload-hint">{t.transcribingHint}</p>
                </div>
              ) : (
                <>
                  <div className="upload-icon-group icon-group-blue">
                    <UploadCloud className="upload-icon" size={32} />
                  </div>
                  <h3 className="landing-card-title">{t.card1Title}</h3>
                  <p className="upload-text">{t.card1Text}</p>
                  <p className="upload-hint">{t.card1Hint}</p>
                  <div className="upload-actions-mobile">
                    <button type="button" className="btn-primary">
                      <UploadCloud size={18} />
                      <span>{t.card1Btn}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Card 2: Create from Scratch */}
            <div
              className="upload-container landing-card scratch-card"
              onClick={handleCreateFromScratch}
            >
              <div className="card-top-tag tag-emerald">
                <span>{t.card2Tag}</span>
              </div>

              <div className="upload-icon-group icon-group-emerald">
                <FilePlus className="upload-icon scratch-icon" size={32} />
              </div>
              <h3 className="landing-card-title">{t.card2Title}</h3>
              <p className="upload-text">{t.card2Text}</p>
              <p className="upload-hint">{t.card2Hint}</p>
              <div className="upload-actions-mobile">
                <button type="button" className="btn-primary btn-scratch-action">
                  <Sparkles size={18} />
                  <span>{t.card2Btn}</span>
                </button>
              </div>
            </div>
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
              <span>{t.navMode1}</span>
            </button>

            <button
              className={`nav-mode-btn ${viewMode === 'analyzer' ? 'active' : ''}`}
              onClick={() => { setViewMode('analyzer'); setIsDropdownOpen(false); }}
            >
              <Target size={18} />
              <span>{t.navMode2}</span>
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
                  <strong>{t.imageWarningTitle}</strong>
                  <p>{t.imageWarningText}</p>
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
                    <h2>{t.editDataTitle}</h2>
                  </div>
                  <ResumeEditor data={resumeData} onChange={setResumeData} t={t} />
                </div>

                {/* Right Column: Live ATS Preview */}
                <div className={`workspace-preview ${mobileTab === 'preview' ? 'mobile-visible' : 'mobile-hidden'}`}>
                  <ResumePreview data={resumeData} t={t} />
                </div>
              </div>
            </>
          )}

          {/* VIEW MODE 2: ATS MATCH ANALYZER */}
          {viewMode === 'analyzer' && (
            <div className="feature-view-box">
              <AtsMatchAnalyzer resumeData={resumeData} setResumeData={setResumeData} setViewMode={setViewMode} />
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
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} t={t} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} t={t} />

      {/* Floating Ko-Fi Coffee FAB Button (Bottom Right) */}
      <a
        href="https://ko-fi.com/smart507"
        target="_blank"
        rel="noopener noreferrer"
        className="kofi-fab-button"
        title={t.buyCoffee}
      >
        <Coffee size={22} className="kofi-fab-icon" />
        <span className="kofi-fab-label">{t.buyCoffee}</span>
      </a>

      {/* Footer */}
      <footer className="footer">
        <p>
          {t.footerPoweredBy}{' '}
          <a href="https://smart507.com" target="_blank" rel="noopener noreferrer" className="footer-brand-link">
            smart507.com
          </a>
        </p>

        <div className="footer-links-group">
          <button className="footer-link-btn" onClick={() => setIsFeedbackOpen(true)}>
            <Lightbulb size={16} />
            <span>{t.footerSuggest}</span>
          </button>
          
          <button className="footer-link-btn" onClick={() => setIsContactOpen(true)}>
            <Mail size={16} />
            <span>{t.footerContact}</span>
          </button>

          <a
            href="https://ko-fi.com/smart507"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-kofi-link"
          >
            <Coffee size={16} />
            <span>{t.footerKofi}</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
