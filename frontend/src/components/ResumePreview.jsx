import React, { useRef, useState } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import { Download, Printer, Layout, FileSpreadsheet } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

export default function ResumePreview({ data }) {
  const [template, setTemplate] = useState('harvard') // 'harvard' | 'modern'
  const [isExporting, setIsExporting] = useState(false)
  const resumeRef = useRef(null)

  const handleDownloadPDF = () => {
    if (!resumeRef.current) return
    setIsExporting(true)

    const element = resumeRef.current
    const opt = {
      margin: 0,
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

  const handleDownloadDocx = async () => {
    if (!data) return
    const { personal_info = {}, experience = [], education = [], skills = [] } = data

    const docChildren = [
      // Name
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: (personal_info.name || 'NOMBRE COMPLETO').toUpperCase(),
            bold: true,
            size: 32,
            font: 'Georgia'
          })
        ]
      }),
      // Contact Info
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: [personal_info.location, personal_info.phone, personal_info.email, personal_info.linkedin]
              .filter(Boolean)
              .join(' | '),
            size: 20,
            font: 'Georgia'
          })
        ]
      }),
      new Paragraph({ text: '' })
    ]

    // Summary Section
    if (personal_info.summary) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'RESUMEN PROFESIONAL', bold: true, size: 22, font: 'Georgia' })
          ]
        }),
        new Paragraph({
          children: [new TextRun({ text: personal_info.summary, size: 20, font: 'Georgia' })]
        }),
        new Paragraph({ text: '' })
      )
    }

    // Experience Section
    if (experience.length > 0) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'EXPERIENCIA LABORAL', bold: true, size: 22, font: 'Georgia' })]
        })
      )
      experience.forEach((exp) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.company || '', bold: true, size: 20, font: 'Georgia' }),
              new TextRun({ text: exp.position ? ` — ${exp.position}` : '', size: 20, font: 'Georgia' }),
              new TextRun({ text: `   (${exp.start_date || ''} - ${exp.end_date || ''})`, italic: true, size: 18, font: 'Georgia' })
            ]
          })
        )
        if (Array.isArray(exp.description)) {
          exp.description.forEach((bullet) => {
            docChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun({ text: bullet, size: 19, font: 'Georgia' })]
              })
            )
          })
        }
      })
      docChildren.push(new Paragraph({ text: '' }))
    }

    // Education Section
    if (education.length > 0) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'EDUCACIÓN', bold: true, size: 22, font: 'Georgia' })]
        })
      )
      education.forEach((edu) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.institution || '', bold: true, size: 20, font: 'Georgia' }),
              new TextRun({ text: edu.degree ? ` — ${edu.degree}` : '', size: 20, font: 'Georgia' }),
              new TextRun({ text: `   (${edu.start_date || ''} - ${edu.end_date || ''})`, italic: true, size: 18, font: 'Georgia' })
            ]
          })
        )
      })
      docChildren.push(new Paragraph({ text: '' }))
    }

    // Skills Section
    if (skills.length > 0) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: 'HABILIDADES TÉCNICAS Y COMPETENCIAS', bold: true, size: 22, font: 'Georgia' })]
        }),
        new Paragraph({
          children: [new TextRun({ text: `Habilidades: ${skills.join(' • ')}`, size: 20, font: 'Georgia' })]
        })
      )
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docChildren }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `CV_ATS_${personal_info.name || 'Resume'}.docx`)
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
          <button className="btn-secondary" onClick={handleDownloadDocx} title="Descargar en formato Microsoft Word editable">
            <FileSpreadsheet size={16} />
            <span>Word (.docx)</span>
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
