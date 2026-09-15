import React, { useRef, useState, useEffect } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutivePhotoTemplate from './templates/ExecutivePhotoTemplate'
import ModernPhotoTemplate from './templates/ModernPhotoTemplate'
import EuropassTemplate from './templates/EuropassTemplate'
import { Download, Layout, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { generatePureVectorPdf } from '../utils/pureVectorPdf'

export default function ResumePreview({ data, t }) {
  const [template, setTemplate] = useState('harvard') // 'harvard' | 'modern' | 'europass' | 'executive-photo'
  const [isExporting, setIsExporting] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [autoFit, setAutoFit] = useState(true)
  const [sheetHeight, setSheetHeight] = useState(1056)
  const resumeRef = useRef(null)
  const wrapperRef = useRef(null)

  // FIX 1: Use ResizeObserver on the actual wrapper element for correct scaling on mobile.
  // Previously used window.innerWidth which didn't account for the real container width.
  useEffect(() => {
    if (!autoFit) return

    const applyScale = (containerWidth) => {
      if (containerWidth > 0 && containerWidth < 850) {
        // Subtract padding (16px each side) from the real container width
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
      // Run immediately on mount
      applyScale(wrapperRef.current.getBoundingClientRect().width)
    }

    return () => observer.disconnect()
  }, [autoFit])

  // Dynamic sheet height calculation
  useEffect(() => {
    if (resumeRef.current) {
      const actualHeight = resumeRef.current.scrollHeight
      setSheetHeight(Math.max(actualHeight, 1056))
    }
  }, [data, template, zoomScale])

  const handleDownloadPDF = async () => {
    if (!data) return
    setIsExporting(true)
    try {
      // Detect the active language: data.language field if set, otherwise fallback to 'es'
      const lang = data?.language || 'es'
      await generatePureVectorPdf(data, template, lang)
    } catch (err) {
      console.error('Error generating vector PDF:', err)
      alert('Error al generar PDF: ' + err.message)
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
