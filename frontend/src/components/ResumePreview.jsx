import React, { useRef, useState, useEffect } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutivePhotoTemplate from './templates/ExecutivePhotoTemplate'
import ModernPhotoTemplate from './templates/ModernPhotoTemplate'
import { Download, Layout, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import html2pdf from 'html2pdf.js'

export default function ResumePreview({ data }) {
  const [template, setTemplate] = useState('harvard') // 'harvard' | 'modern' | 'executive-photo' | 'modern-photo'
  const [isExporting, setIsExporting] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [autoFit, setAutoFit] = useState(true)
  const [sheetHeight, setSheetHeight] = useState(1056)
  const resumeRef = useRef(null)

  // Auto-switch to a photo template when a photo is added/uploaded
  useEffect(() => {
    if (data?.personal_info?.photo) {
      if (template === 'harvard' || template === 'modern') {
        setTemplate('executive-photo')
      }
    }
  }, [data?.personal_info?.photo])

  // Automatically fit the exact 816px Letter paper sheet to the mobile screen width
  useEffect(() => {
    const handleResize = () => {
      if (autoFit && window.innerWidth <= 850) {
        const availableWidth = Math.min(window.innerWidth - 24, 800)
        const calculatedScale = availableWidth / 816
        setZoomScale(calculatedScale > 0.15 ? calculatedScale : 0.4)
      } else if (autoFit) {
        setZoomScale(1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [autoFit])

  // Measure actual rendered DOM height of the sheet whenever data or template changes
  useEffect(() => {
    if (resumeRef.current) {
      const actualHeight = resumeRef.current.scrollHeight
      if (actualHeight > 0) {
        setSheetHeight(actualHeight)
      }
    }
  }, [data, template, zoomScale])

  const handleDownloadPDF = () => {
    if (!resumeRef.current) return
    setIsExporting(true)

    const element = resumeRef.current
    const opt = {
      margin: [0.35, 0, 0.35, 0],
      filename: `CV_ATS_${data?.personal_info?.name || 'Resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.exec-exp-item', '.exec-edu-item', '.exec-skill-badge', '.exec-section', '.modern-exp-item', '.modern-section', '.harvard-item', '.harvard-section', '.bullet-row']
      }
    }

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => setIsExporting(false))
      .catch((err) => {
        console.error('Error generating PDF:', err)
        setIsExporting(false)
      })
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
            <option value="harvard">🇺🇸 🇨🇦 EE.UU. & Canadá (Harvard Classic)</option>
            <option value="modern">🌎 América Latina (Modern Clean)</option>
            <option value="executive-photo">💼 Internacional (Executive Photo 🖼️)</option>
            <option value="modern-photo">🇪🇺 Europa (Modern Photo 🖼️)</option>
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
            <span>Ajustar Hoja</span>
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
          <button className="btn-primary" onClick={handleDownloadPDF} disabled={isExporting}>
            <Download size={16} />
            <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF ATS'}</span>
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
            {template === 'executive-photo' && <ExecutivePhotoTemplate data={data} />}
            {template === 'modern-photo' && <ModernPhotoTemplate data={data} />}
          </div>
        </div>
      </div>
    </div>
  )
}
