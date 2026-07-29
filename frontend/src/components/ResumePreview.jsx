import React, { useRef, useState } from 'react'
import HarvardTemplate from './templates/HarvardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutivePhotoTemplate from './templates/ExecutivePhotoTemplate'
import { Download, Printer, Layout, FileSpreadsheet } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx'
import { saveAs } from 'file-saver'

function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64.split(',')[1] || base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export default function ResumePreview({ data }) {
  const [template, setTemplate] = useState('harvard') // 'harvard' | 'modern' | 'executive-photo'
  const [isExporting, setIsExporting] = useState(false)
  const resumeRef = useRef(null)

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

  const handleDownloadDocx = async () => {
    if (!data) return
    const { personal_info = {}, experience = [], education = [], skills = [] } = data

    const isModern = template === 'modern'
    const isExecPhoto = template === 'executive-photo'
    const fontName = isHarvard ? 'Georgia' : isModern ? 'Arial' : 'Calibri'
    const primaryColor = isExecPhoto ? '1E3A8A' : isModern ? '2563EB' : '000000'

    const docChildren = []

    // Executive Photo Template Header with Photo
    if (isExecPhoto && personal_info.photo) {
      try {
        const photoBytes = base64ToUint8Array(personal_info.photo)
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: photoBytes,
                transformation: { width: 75, height: 75 }
              })
            ]
          })
        )
      } catch (e) {
        console.error('Error embedding photo in docx:', e)
      }
    }

    // Name
    docChildren.push(
      new Paragraph({
        alignment: isModern ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [
          new TextRun({
            text: (personal_info.name || 'NOMBRE COMPLETO').toUpperCase(),
            bold: true,
            size: 32,
            font: fontName,
            color: primaryColor
          })
        ]
      })
    )

    // Contact Info
    docChildren.push(
      new Paragraph({
        alignment: isModern ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [
          new TextRun({
            text: [personal_info.location, personal_info.phone, personal_info.email, personal_info.linkedin]
              .filter(Boolean)
              .join('  •  '),
            size: 19,
            font: fontName,
            color: isModern ? '475569' : '333333'
          })
        ]
      }),
      new Paragraph({ text: '' })
    )

    // Summary Section
    if (personal_info.summary) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'RESUMEN PROFESIONAL',
              bold: true,
              size: 22,
              font: fontName,
              color: primaryColor
            })
          ]
        }),
        new Paragraph({
          children: [new TextRun({ text: personal_info.summary, size: 20, font: fontName })]
        }),
        new Paragraph({ text: '' })
      )
    }

    // Experience Section
    if (experience.length > 0) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EXPERIENCIA LABORAL',
              bold: true,
              size: 22,
              font: fontName,
              color: primaryColor
            })
          ]
        })
      )
      experience.forEach((exp) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.company || '', bold: true, size: 20, font: fontName }),
              new TextRun({
                text: exp.position ? `  —  ${exp.position}` : '',
                size: 20,
                font: fontName,
                color: isModern ? '2563EB' : '000000'
              }),
              new TextRun({ text: `   (${exp.start_date || ''} - ${exp.end_date || ''})`, italic: true, size: 18, font: fontName })
            ]
          })
        )
        if (Array.isArray(exp.description)) {
          exp.description.forEach((bullet) => {
            docChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun({ text: bullet, size: 19, font: fontName })]
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
          children: [
            new TextRun({
              text: 'EDUCACIÓN',
              bold: true,
              size: 22,
              font: fontName,
              color: primaryColor
            })
          ]
        })
      )
      education.forEach((edu) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.institution || '', bold: true, size: 20, font: fontName }),
              new TextRun({ text: edu.degree ? `  —  ${edu.degree}` : '', size: 20, font: fontName }),
              new TextRun({ text: `   (${edu.start_date || ''} - ${edu.end_date || ''})`, italic: true, size: 18, font: fontName })
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
          children: [
            new TextRun({
              text: 'HABILIDADES CLAVE',
              bold: true,
              size: 22,
              font: fontName,
              color: primaryColor
            })
          ]
        }),
        new Paragraph({
          children: [new TextRun({ text: `Habilidades: ${skills.join('  •  ')}`, size: 20, font: fontName })]
        })
      )
    }

    const isHarvard = template === 'harvard'

    const doc = new Document({
      sections: [{ properties: {}, children: docChildren }]
    })

    const blob = await Packer.toBlob(doc)
    const templateName = isExecPhoto ? 'Ejecutivo_Foto' : isModern ? 'Modern_Clean' : 'Harvard_Classic'
    saveAs(blob, `CV_ATS_${templateName}_${personal_info.name || 'Resume'}.docx`)
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
          {template === 'executive-photo' && <ExecutivePhotoTemplate data={data} />}
        </div>
      </div>
    </div>
  )
}
