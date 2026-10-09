import React, { useRef, useState, useEffect } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutivePhotoTemplate from './templates/ExecutivePhotoTemplate'
import ModernPhotoTemplate from './templates/ModernPhotoTemplate'
import EuropassTemplate from './templates/EuropassTemplate'
import { Download, Layout, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { generatePureVectorPdf } from '../utils/pureVectorPdf'

const PAGE_HEIGHT_PX = 1056 // US Letter at 96dpi

export default function ResumePreview({ data, t }) {
  const [template, setTemplate] = useState('harvard')
  const [isExporting, setIsExporting] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [autoFit, setAutoFit] = useState(true)
  const [sheetHeight, setSheetHeight] = useState(PAGE_HEIGHT_PX)
  const resumeRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!autoFit) return

    const applyScale = (containerWidth) => {
      if (containerWidth > 0 && containerWidth < 850) {
        const usableWidth = containerWidth - 32
        setZoomScale(Math.min(usableWidth / 816, 1))
      } else {
        setZoomScale(1)
      }
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        applyScale(entry.contentRect.width)
      }
    })

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current)
      applyScale(wrapperRef.current.getBoundingClientRect().width)
    }

    return () => observer.disconnect()
  }, [autoFit])

  useEffect(() => {
    if (resumeRef.current) {
      const actualHeight = resumeRef.current.scrollHeight
      setSheetHeight(Math.max(actualHeight, PAGE_HEIGHT_PX))
    }
  }, [data, template, zoomScale])

  const handleDownloadPDF = async () => {
    if (!data) return
    setIsExporting(true)
    try {
      const lang = data?.language || 'es'
      await generatePureVectorPdf(data, template, lang)
    } catch (err) {
      console.error('Error generating vector PDF:', err)
      alert('Error al generar PDF: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate page break positions (only when content overflows page 1)
  const pageBreakLines = []
  const totalPages = Math.ceil(sheetHeight / PAGE_HEIGHT_PX)
  for (let page = 2; page <= totalPages; page++) {
    pageBreakLines.push({
      page,
      topPx: (page - 1) * PAGE_HEIGHT_PX * zoomScale,
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
      <div className="preview-sheet-wrapper" ref={wrapperRef}>
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
          {/* Resume content */}
          <div
            className="preview-sheet"
            ref={resumeRef}
            id="printable-resume"
            style={{
              width: '816px',
              minWidth: '816px',
              maxWidth: '816px',
              minHeight: `${PAGE_HEIGHT_PX}px`,
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

          {/* Page break indicator lines (visual only, not in PDF) */}
          {pageBreakLines.map(({ page, topPx }) => (
            <div
              key={page}
              className="page-break-indicator"
              style={{ top: `${topPx}px` }}
              aria-hidden="true"
            >
              <span className="page-break-label">
                — Página {page} —
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

