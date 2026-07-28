import React, { useRef, useState } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import { Download, Printer, Layout, Sparkles } from 'lucide-react'
import html2pdf from 'html2pdf.js'

export default function ResumePreview({ data }) {
  const [template, setTemplate] = useState('harvard') // 'harvard' | 'modern'
  const [isExporting, setIsExporting] = useState(false)
  const resumeRef = useRef(null)

  const handleDownloadPDF = () => {
    if (!resumeRef.current) return
    setIsExporting(true)

    const element = resumeRef.current
    const opt = {
      margin: 0, // Mapeo 1:1 en tamaño Carta
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
      pagebreak: { mode: 'css' }
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

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="preview-container">
      {/* Control Bar */}
      <div className="preview-toolbar">
        <div className="template-selector">
          <Layout size={18} />
          <span>Plantilla ATS:</span>
          <button
            className={`template-btn ${template === 'harvard' ? 'active' : ''}`}
            onClick={() => setTemplate('harvard')}
          >
            Harvard Classic
          </button>
          <button
            className={`template-btn ${template === 'modern' ? 'active' : ''}`}
            onClick={() => setTemplate('modern')}
          >
            Modern Clean
          </button>
        </div>

        <div className="export-actions">
          <button className="btn-secondary" onClick={handlePrint} title="Imprimir / Guardar en PDF con navegador">
            <Printer size={16} />
            <span>Imprimir</span>
          </button>
          <button className="btn-primary" onClick={handleDownloadPDF} disabled={isExporting}>
            <Download size={16} />
            <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF ATS'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="preview-sheet-wrapper">
        <div className="preview-sheet" ref={resumeRef} id="printable-resume">
          {template === 'harvard' && <HarvardTemplate data={data} />}
          {template === 'modern' && <ModernTemplate data={data} />}
        </div>
      </div>
    </div>
  )
}
