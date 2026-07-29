import React, { useRef, useState, useEffect } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutivePhotoTemplate from './templates/ExecutivePhotoTemplate'
import ModernPhotoTemplate from './templates/ModernPhotoTemplate'
import { Download, Layout } from 'lucide-react'
import html2pdf from 'html2pdf.js'

export default function ResumePreview({ data }) {
  const [template, setTemplate] = useState('harvard') // 'harvard' | 'modern' | 'executive-photo' | 'modern-photo'
  const [isExporting, setIsExporting] = useState(false)
  const resumeRef = useRef(null)

  // Auto-switch to a photo template when a photo is added/uploaded
  useEffect(() => {
    if (data?.personal_info?.photo) {
      if (template === 'harvard' || template === 'modern') {
        setTemplate('executive-photo')
      }
    }
  }, [data?.personal_info?.photo])

  const handleDownloadPDF = () => {
    if (!resumeRef.current) return
    setIsExporting(true)

    const element = resumeRef.current
    const opt = {
      margin: [0.35, 0, 0.35, 0], // Margen de seguridad superior e inferior para evitar pegar el contenido al borde al saltar de página
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
            Harvard Classic
          </button>
          <button
            className={`template-btn ${template === 'modern' ? 'active' : ''}`}
            onClick={() => setTemplate('modern')}
          >
            Modern Clean
          </button>
          <button
            className={`template-btn ${template === 'executive-photo' ? 'active' : ''}`}
            onClick={() => setTemplate('executive-photo')}
          >
            Executive Photo 🖼️
          </button>
          <button
            className={`template-btn ${template === 'modern-photo' ? 'active' : ''}`}
            onClick={() => setTemplate('modern-photo')}
          >
            Modern Photo 🖼️
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
        <div className="preview-sheet" ref={resumeRef} id="printable-resume">
          {template === 'harvard' && <HarvardTemplate data={data} />}
          {template === 'modern' && <ModernTemplate data={data} />}
          {template === 'executive-photo' && <ExecutivePhotoTemplate data={data} />}
          {template === 'modern-photo' && <ModernPhotoTemplate data={data} />}
        </div>
      </div>
    </div>
  )
}
