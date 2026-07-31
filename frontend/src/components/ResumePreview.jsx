import React, { useRef, useState, useEffect } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutivePhotoTemplate from './templates/ExecutivePhotoTemplate'
import ModernPhotoTemplate from './templates/ModernPhotoTemplate'
import EuropassTemplate from './templates/EuropassTemplate'
import { Download, Layout, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import html2pdf from 'html2pdf.js'

export default function ResumePreview({ data, t }) {
  const [template, setTemplate] = useState('harvard') // 'harvard' | 'modern' | 'europass' | 'executive-photo'
  const [isExporting, setIsExporting] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [autoFit, setAutoFit] = useState(true)
  const [sheetHeight, setSheetHeight] = useState(1056)
  const resumeRef = useRef(null)

  // Automatically fit the exact 816px Letter paper sheet to the mobile screen width
  useEffect(() => {
    const handleResize = () => {
      if (autoFit && window.innerWidth <= 850) {
        const availableWidth = Math.min(window.innerWidth - 24, 800)
        setZoomScale(availableWidth / 816)
      } else if (autoFit) {
        setZoomScale(1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [autoFit])

  // Dynamic sheet height calculation
  useEffect(() => {
    if (resumeRef.current) {
      const actualHeight = resumeRef.current.scrollHeight
      setSheetHeight(Math.max(actualHeight, 1056))
    }
  }, [data, template, zoomScale])

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return
    setIsExporting(true)

    try {
      const originalElement = resumeRef.current

      // Create a clean clone without CSS transforms or zoom offsets
      const clone = originalElement.cloneNode(true)
      clone.style.transform = 'none'
      clone.style.position = 'fixed'
      clone.style.top = '0'
      clone.style.left = '-9999px'
      clone.style.width = '816px'
      clone.style.minWidth = '816px'
      clone.style.maxWidth = '816px'
      clone.style.minHeight = '1056px'
      clone.style.boxShadow = 'none'
      clone.style.margin = '0'
      clone.style.background = '#ffffff'
      clone.style.color = '#000000'

      document.body.appendChild(clone)

      const fileName = `${(data?.personal_info?.name || 'Curriculum').trim().replace(/\s+/g, '_')}_ATS.pdf`

      const opt = {
        margin: 0,
        filename: fileName,
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

      await html2pdf().set(opt).from(clone).save()

      if (document.body.contains(clone)) {
        document.body.removeChild(clone)
      }
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="preview-container">
      {/* Control Bar */}
      <div className="preview-toolbar">
        <div className="template-selector">
          <Layout size={18} className="template-icon" />
          <select
            className="template-dropdown"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <option value="harvard">{t?.templateHarvard || '🇺🇸 🇨🇦 EE.UU. & Canadá (Harvard)'}</option>
            <option value="modern">{t?.templateModern || '🌎 América Latina (Modern)'}</option>
            <option value="europass">{t?.templateEuropass || '🇪🇺 Unión Europea (Europass ATS)'}</option>
            <option value="executive-photo">{t?.templateExecutive || '💼 Ejecutivo Internacional'}</option>
          </select>
        </div>

        <div className="zoom-controls-bar">
          <button
            type="button"
            className={`zoom-btn ${autoFit ? 'active' : ''}`}
            onClick={() => setAutoFit(true)}
            title="Ajustar hoja completa a la pantalla"
          >
            <Maximize2 size={14} />
            <span>{t?.fitPage || 'Ajustar Hoja'}</span>
          </button>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => { setAutoFit(false); setZoomScale((prev) => Math.min(prev + 0.1, 1.5)) }}
            title="Acercar"
          >
            <ZoomIn size={14} />
          </button>
          <span className="zoom-level">{Math.round(zoomScale * 100)}%</span>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => { setAutoFit(false); setZoomScale((prev) => Math.max(prev - 0.1, 0.2)) }}
            title="Alejar"
          >
            <ZoomOut size={14} />
          </button>
        </div>

        <div className="export-actions">
          <button
            className="btn-primary btn-export"
            onClick={handleDownloadPDF}
            disabled={isExporting}
          >
            <Download size={18} />
            <span>{isExporting ? (t?.generatingPdf || 'Generando PDF...') : (t?.downloadPdf || 'Descargar PDF ATS')}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="preview-sheet-wrapper">
        <div
          className="mobile-sheet-scaler"
          style={{
            width: `${Math.round(816 * zoomScale)}px`,
            height: `${Math.round(sheetHeight * zoomScale)}px`,
            overflow: 'hidden',
            margin: '0 auto',
            position: 'relative',
            display: 'block'
          }}
        >
          <div
            className="preview-sheet"
            ref={resumeRef}
            id="printable-resume"
            style={{
              width: '816px',
              minWidth: '816px',
              maxWidth: '816px',
              minHeight: '1056px',
              position: 'absolute',
              top: 0,
              left: 0,
              transformOrigin: 'top left',
              transform: `scale(${zoomScale})`
            }}
          >
            {template === 'harvard' && <HarvardTemplate data={data} />}
            {template === 'modern' && <ModernTemplate data={data} />}
            {template === 'europass' && <EuropassTemplate data={data} />}
            {template === 'executive-photo' && <ExecutivePhotoTemplate data={data} />}
            {template === 'modern-photo' && <ModernPhotoTemplate data={data} />}
          </div>
        </div>
      </div>
    </div>
  )
}
