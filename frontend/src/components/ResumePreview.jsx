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
  const resumeRef = useRef(null)

  // Auto-switch to a photo template when a photo is added/uploaded
  useEffect(() => {
    if (data?.personal_info?.photo) {
      if (template === 'harvard' || template === 'modern') {
        setTemplate('executive-photo')
      }
    }
  }, [data?.personal_info?.photo])

  // Automatically fit the entire paper sheet (width AND height) on screen
  useEffect(() => {
    const handleResize = () => {
      if (autoFit && window.innerWidth <= 850) {
        const scaleX = (window.innerWidth - 32) / 816
        const scaleY = (window.innerHeight - 200) / 1056
        const calculatedScale = Math.min(scaleX, scaleY)
        setZoomScale(calculatedScale > 0.15 ? calculatedScale : 0.38)
      } else if (autoFit) {
        setZoomScale(1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [autoFit])

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
          <Layout size={18} />
          <span>Plantilla:</span>
          <button
            className={`template-btn ${template === 'harvard' ? 'active' : ''}`}
            onClick={() => setTemplate('harvard')}
          >
            Harvard
          </button>
          <button
            className={`template-btn ${template === 'modern' ? 'active' : ''}`}
            onClick={() => setTemplate('modern')}
          >
            Modern
          </button>
          <button
            className={`template-btn ${template === 'executive-photo' ? 'active' : ''}`}
            onClick={() => setTemplate('executive-photo')}
          >
            Executive 🖼️
          </button>
          <button
            className={`template-btn ${template === 'modern-photo' ? 'active' : ''}`}
            onClick={() => setTemplate('modern-photo')}
          >
            Modern 🖼️
          </button>
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
            height: `${Math.round(1056 * zoomScale)}px`,
            overflow: 'hidden',
            margin: '0 auto',
            position: 'relative'
          }}
        >
          <div
            className="preview-sheet"
            ref={resumeRef}
            id="printable-resume"
            style={{
              width: '816px',
              minHeight: '1056px',
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
