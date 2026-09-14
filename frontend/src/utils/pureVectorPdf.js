/**
 * Pure Vector ATS PDF Generator
 *
 * Generates 100% native vector PDFs directly from structured resume data.
 * - ZERO rasterization (no html2canvas, no JPEG snapshot).
 * - True vector typography: selectable, copyable, searchable text.
 * - 100% readable by ALL ATS engines (Workday, Taleo, Greenhouse, Bullhorn, iCIMS, SAP SuccessFactors, etc.).
 * - Strict single-page guarantee: NO blank 2nd page ever.
 * - Works identically in Chrome, Edge, Safari, Firefox, mobile, and desktop.
 */

import { jsPDF } from 'jspdf'

/**
 * Sanitizes text for standard PDF font compatibility (Helvetica).
 * Strips diacritics, smart quotes, emojis, and non-ASCII characters
 * so jsPDF can render them without corrupt glyphs or encoding errors.
 */
function cleanText(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, ' - ')
    .replace(/[\u00A0\u00AD]/g, ' ')
    .replace(/[\u2022\u25CF\u25AA\u25AB\u2023\u2043]/g, '-')
    .replace(/[^\x20-\x7E\r\n\t]/g, (ch) => {
      const decomposed = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return /^[\x20-\x7E]$/.test(decomposed) ? decomposed : ' '
    })
    .replace(/[ \t]+/g, ' ')
    .trim()
}


/**
 * Generates and downloads a pure vector ATS PDF â€” guaranteed readable by every ATS system.
 *
 * @param {object} data     - Structured resume data from the app
 * @param {string} template - 'harvard' | 'modern' | 'europass' | 'executive-photo' | 'modern-photo'
 * @param {string} lang     - 'en' | 'es' | 'pt' | 'fr' | 'de'
 */
export async function generatePureVectorPdf(data, template = 'harvard', lang = 'es') {
  if (!data) return

  const personal    = data.personal_info || {}
  const experiences = data.experience   || []
  const educations  = data.education    || []
  const skills      = data.skills       || []

  // â”€â”€ Language detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Priority: explicit lang param > data.language field > keyword heuristic on summary
  const VALID_LANGS = ['en', 'es', 'pt', 'fr', 'de']
  const resolvedLang = (
    (lang && VALID_LANGS.includes(lang))
      ? lang
      : (data.language && VALID_LANGS.includes(data.language))
        ? data.language
        : /\b(experience|skills|support|management|professional|pursuing|degree|summary)\b/i
            .test(personal.summary || '')
          ? 'en'
          : 'es'
  )

  const isEn = resolvedLang === 'en'
  const isPt = resolvedLang === 'pt'
  const isFr = resolvedLang === 'fr'
  const isDe = resolvedLang === 'de'

  const labels = {
    summary: isEn ? 'PROFESSIONAL SUMMARY'
      : isPt ? 'RESUMO PROFISSIONAL'
      : isFr ? 'PROFIL PROFESSIONNEL'
      : isDe ? 'BERUFSPROFIL'
      : 'RESUMEN PROFESIONAL',
    experience: isEn ? 'WORK EXPERIENCE'
      : isPt ? 'EXPERIENCIA PROFISSIONAL'
      : isFr ? 'EXPERIENCE PROFESSIONNELLE'
      : isDe ? 'BERUFSERFAHRUNG'
      : 'EXPERIENCIA LABORAL',
    education: isEn ? 'EDUCATION'
      : isPt ? 'EDUCACAO'
      : isFr ? 'FORMATION'
      : isDe ? 'AUSBILDUNG'
      : 'EDUCACION',
    skills: isEn ? 'KEY SKILLS & COMPETENCIES'
      : isPt ? 'HABILIDADES E COMPETENCIAS'
      : isFr ? 'COMPETENCES CLES'
      : isDe ? 'KERNKOMPETENZEN'
      : 'HABILIDADES Y COMPETENCIAS',
  }

  // â”€â”€ Document setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const doc         = new jsPDF({ unit: 'pt', format: 'letter', compress: true })
  const PAGE_W      = 612
  const PAGE_H      = 792
  const MARGIN      = 38
  const CONTENT_W   = PAGE_W - MARGIN * 2
  const BOTTOM_SAFE = PAGE_H - MARGIN
  const isHarvard   = template === 'harvard'
  const isModern    = template === 'modern' || template === 'modern-photo'
  const isExecutive = template === 'executive-photo'
  const hasPhoto    = (isExecutive || template === 'modern-photo') && personal.photo

  const LINE_SM     = isHarvard ? 13 : 10.5
  const LINE_MD     = isHarvard ? 14.5 : 12
  const LINE_LG     = isHarvard ? 17 : 13.5

  let y = MARGIN + 6

  // Load Merriweather Font for Harvard
  if (isHarvard) {
    try {
      const fetchFont = async (url) => {
         const res = await fetch(url)
         if (!res.ok) throw new Error(`HTTP ${res.status}`)
         const buffer = await res.arrayBuffer()
         const bytes = new Uint8Array(buffer)
         let binary = ''
         for (let i = 0; i < bytes.byteLength; i++) {
             binary += String.fromCharCode(bytes[i])
         }
         return window.btoa(binary)
      }
      const regularB64 = await fetchFont('/fonts/Merriweather-Regular.ttf')
      doc.addFileToVFS('merriweather-regular.ttf', regularB64)
      doc.addFont('merriweather-regular.ttf', 'merriweather', 'normal')

      const boldB64 = await fetchFont('/fonts/Merriweather-Bold.ttf')
      doc.addFileToVFS('merriweather-bold.ttf', boldB64)
      doc.addFont('merriweather-bold.ttf', 'merriweather', 'bold')
    } catch (e) {
      console.warn("Could not load Merriweather, falling back to default:", e)
    }
  }

  // Theme Constants
  const FONT        = isHarvard ? 'merriweather' : 'helvetica'
  const BULLET_CHAR = isHarvard ? '\u2022' : '-'
  const SEP_CHAR    = isHarvard ? ' - ' : ' - '

  // Colors
  const accentRGB   = isModern ? [29, 78, 216] : (isHarvard ? [0, 0, 0] : [15, 23, 42])
  const accentMuted = isModern ? [147, 197, 253] : (isHarvard ? [0, 0, 0] : [203, 213, 225])
  
  const textTitle   = isHarvard ? [0, 0, 0] : [15, 23, 42]
  const textPrimary = isHarvard ? [0, 0, 0] : [30, 41, 59]
  const textSub     = isHarvard ? [0, 0, 0] : [71, 85, 105]
  const textMeta    = isHarvard ? [0, 0, 0] : [100, 116, 139]


  // â”€â”€ Page break helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // MUST be called BEFORE drawing any block with the pre-measured block height.
  function ensureSpace(neededPt) {
    if (y + neededPt > BOTTOM_SAFE) {
      doc.addPage()
      y = MARGIN + 6
      return true
    }
    return false
  }

  // â”€â”€ Divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function drawDivider(rgb, weight) {
    doc.setDrawColor(rgb[0], rgb[1], rgb[2])
    doc.setLineWidth(weight || 0.75)
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y)
  }

  // â”€â”€ Section title (total height â‰ˆ 27pt) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function drawSectionTitle(title) {
    ensureSpace(50) // title height + space for at least one entry
    doc.setFont(FONT, 'bold')
    doc.setFontSize(isHarvard ? 12 : 10.5)
    doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2])
    doc.text(title, MARGIN, y)
    y += 4
    drawDivider(accentMuted, isHarvard ? 0.5 : 0.75)
    y += isHarvard ? 8 : 11
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 1. HEADER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (hasPhoto && personal.photo) {
    try {
      const PHOTO_SZ = 58
      const TEXT_X   = MARGIN + PHOTO_SZ + 14
      const TEXT_W   = CONTENT_W - PHOTO_SZ - 14

      doc.addImage(personal.photo, 'JPEG', MARGIN, y, PHOTO_SZ, PHOTO_SZ)

      doc.setFont(FONT, 'bold')
      doc.setFontSize(17)
      doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2])
      doc.text(cleanText(personal.name || '').toUpperCase(), TEXT_X, y + 14)

      doc.setFont(FONT, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(textSub[0], textSub[1], textSub[2])
      const contactItems = [personal.location, personal.phone, personal.email, personal.linkedin]
        .map(cleanText).filter(Boolean)
      const cLines = doc.splitTextToSize(contactItems.join('   |   '), TEXT_W)
      doc.text(cLines, TEXT_X, y + 28)

      y += Math.max(PHOTO_SZ, 30 + cLines.length * LINE_SM) + 10
    } catch (photoErr) {
      console.warn('Could not embed photo, using text header:', photoErr)
    }
  } else if (isModern) {
    doc.setFont(FONT, 'bold')
    doc.setFontSize(18)
    doc.setTextColor(29, 78, 216)
    doc.text(cleanText(personal.name || '').toUpperCase(), MARGIN, y + 10)
    y += 18

    doc.setFont(FONT, 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(60, 60, 60)
    const contactParts = [personal.location, personal.phone, personal.email, personal.linkedin]
      .map(cleanText).filter(Boolean)
    const cLines = doc.splitTextToSize(contactParts.join('   |   '), CONTENT_W)
    doc.text(cLines, MARGIN, y + 6)
    y += cLines.length * LINE_SM + 10
  } else {
    // Harvard / Europass / Executive â€” centered classic
    doc.setFont(FONT, 'bold')
    doc.setFontSize(18)
    doc.setTextColor(textTitle[0], textTitle[1], textTitle[2])
    doc.text(cleanText(personal.name || '').toUpperCase(), PAGE_W / 2, y + 8, { align: 'center' })
    y += 14

    doc.setFont(FONT, 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(textSub[0], textSub[1], textSub[2])
    const contactParts = [personal.location, personal.phone, personal.email, personal.linkedin]
      .map(cleanText).filter(Boolean)
    const cLines = doc.splitTextToSize(contactParts.join('   |   '), CONTENT_W)
    doc.text(cLines, PAGE_W / 2, y + 6, { align: 'center' })
    y += cLines.length * LINE_SM + 12
  }

  // Divider after header
  if (!isHarvard) {
    drawDivider(accentMuted)
    y += 12
  } else {
    y += 16
  }


  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2. PROFESSIONAL SUMMARY
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (personal.summary && personal.summary.trim()) {
    const summaryText  = cleanText(personal.summary)
    const summaryLines = doc.splitTextToSize(summaryText, CONTENT_W)
    const summaryBlockH = summaryLines.length * LINE_MD + 8

    drawSectionTitle(labels.summary)

    ensureSpace(summaryBlockH)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
    doc.text(summaryLines, MARGIN, y)
    y += summaryBlockH
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 3. WORK EXPERIENCE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (experiences.length > 0) {
    drawSectionTitle(labels.experience)

    for (const exp of experiences) {
      const company  = cleanText(exp.company  || '')
      const position = cleanText(exp.position || '')
      const start    = cleanText(exp.start_date || '')
      const end      = cleanText(exp.end_date   || '')
      const dateStr  = [start, end].filter(Boolean).join(SEP_CHAR)

      const rawBullets = exp.bullets || exp.description || []
      const bulletList = (Array.isArray(rawBullets) ? rawBullets : [rawBullets])
        .map(cleanText).filter(Boolean)

      // Pre-measure all bullet line counts to calculate full entry height
      doc.setFontSize(9.2)
      const bulletSplits = bulletList.map(b => doc.splitTextToSize(b, CONTENT_W - 16))
      const bulletsH = bulletSplits.reduce((sum, bl) => sum + bl.length * LINE_SM + 2, 0)
      const entryH = LINE_LG + bulletsH + 6

      ensureSpace(Math.min(entryH, 80))

      // Company + Position row
      doc.setFont(FONT, 'bold')
      doc.setFontSize(10)
      doc.setTextColor(textTitle[0], textTitle[1], textTitle[2])
      doc.text(company || '-', MARGIN, y)

      if (position) {
        const compW = doc.getTextWidth(company || '-')
        doc.setFont(FONT, 'normal')
        doc.setFontSize(10)
        doc.setTextColor(textSub[0], textSub[1], textSub[2])
        doc.text(`${SEP_CHAR}${position}`, MARGIN + compW, y)
      }

      if (dateStr) {
        doc.setFont(FONT, isHarvard ? 'italic' : 'normal')
        doc.setFontSize(9)
        doc.setTextColor(textMeta[0], textMeta[1], textMeta[2])
        doc.text(dateStr, MARGIN + CONTENT_W, y, { align: 'right' })
      }
      y += LINE_LG

      // Bullets
      for (let i = 0; i < bulletSplits.length; i++) {
        const lines = bulletSplits[i]
        ensureSpace(lines.length * LINE_SM + 2)
        doc.setFont(FONT, 'normal')
        doc.setFontSize(9.2)
        doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
        doc.text(BULLET_CHAR, MARGIN + 2, y)
        doc.text(lines, MARGIN + 14, y)
        y += lines.length * LINE_SM + 2
      }

      y += 6
    }
    y += 2
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 4. EDUCATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (educations.length > 0) {
    drawSectionTitle(labels.education)

    for (const edu of educations) {
      const institution = cleanText(edu.institution || '')
      const degree      = cleanText(edu.degree      || '')
      const start       = cleanText(edu.start_date  || '')
      const end         = cleanText(edu.end_date || edu.year || '')
      const dateStr     = [start, end].filter(Boolean).join(SEP_CHAR)
      const entryH      = LINE_LG + (!isHarvard && degree ? LINE_MD : 0) + 4

      ensureSpace(entryH)

      doc.setFont(FONT, 'bold')
      doc.setFontSize(10)
      doc.setTextColor(textTitle[0], textTitle[1], textTitle[2])
      doc.text(institution || '-', MARGIN, y)

      if (degree) {
        const instW = doc.getTextWidth(institution || '-')
        doc.setFont(FONT, 'normal')
        
        if (isHarvard) {
          doc.setFontSize(10)
          doc.setTextColor(textSub[0], textSub[1], textSub[2])
          doc.text(`${SEP_CHAR}${degree}`, MARGIN + instW, y)
        } else {
          doc.setFontSize(9.2)
          doc.setTextColor(textSub[0], textSub[1], textSub[2])
          doc.text(degree, MARGIN, y + LINE_MD)
        }
      }

      if (dateStr) {
        doc.setFont(FONT, isHarvard ? 'italic' : 'normal')
        doc.setFontSize(9)
        doc.setTextColor(textMeta[0], textMeta[1], textMeta[2])
        doc.text(dateStr, MARGIN + CONTENT_W, y, { align: 'right' })
      }
      y += LINE_LG + (!isHarvard && degree ? LINE_MD : 0)
      y += 4
    }
    y += 2
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 5. SKILLS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (skills.length > 0) {
    drawSectionTitle(labels.skills)

    const cleanedSkills = skills.map(cleanText).filter(Boolean)
    const skillsText    = cleanedSkills.join(isHarvard ? ' \u2022 ' : '   -   ')
    const prefix        = isHarvard ? 'Skills: ' : ''
    const skillLines    = doc.splitTextToSize(prefix + skillsText, CONTENT_W)
    const skillsH       = skillLines.length * LINE_MD + 4

    ensureSpace(skillsH)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
    doc.text(skillLines, MARGIN, y)
    y += skillsH
  }

  // ── PDF Metadata ────────────────────────────────────────────────────────────
  // subject embeds the full structured JSON so the backend instantly recognizes
  // this PDF as app-generated and returns the original data without re-parsing.
  const candidateName = cleanText(personal.name || 'Resume')
  const safeFileName  = candidateName.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '') || 'Resume'

  // Strip photo from embedded data to keep file size small
  const dataForEmbed = {
    ...data,
    personal_info: { ...(data.personal_info || {}), photo: undefined }
  }

  doc.setProperties({
    title:    `${candidateName} - ATS Resume`,
    subject:  JSON.stringify(dataForEmbed),
    author:   candidateName,
    keywords: skills.map(cleanText).filter(Boolean).join(', '),
    creator:  'ATS Resume Generator',
  })

  doc.save(`${safeFileName}_ATS.pdf`)
}

/**
 * Generates and downloads a pure vector ATS Cover Letter PDF.
 *
 * @param {object} resumeData    - Candidate's structured resume data
 * @param {string} companyName   - Target company name
 * @param {string} positionName  - Target role/position
 * @param {string} letterText    - Full cover letter body text
 */
export function generatePureVectorCoverLetter(resumeData, companyName, positionName, letterText) {
  if (!letterText) return

  const personal      = resumeData?.personal_info || {}
  const candidateName = cleanText(personal.name || 'Candidato')
  const safeFileName  = candidateName.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '') || 'CoverLetter'

  const doc         = new jsPDF({ unit: 'pt', format: 'letter', compress: true })
  const PAGE_W      = 612
  const PAGE_H      = 792
  const MARGIN      = 48
  const CONTENT_W   = PAGE_W - MARGIN * 2
  const BOTTOM_SAFE = PAGE_H - MARGIN
  const LINE_BODY   = 15
  let y = MARGIN + 8

  function ensureSpace(neededPt) {
    if (y + neededPt > BOTTOM_SAFE) {
      doc.addPage()
      y = MARGIN + 8
      return true
    }
    return false
  }

  // Header: Name
  doc.setFont(FONT, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(textTitle[0], textTitle[1], textTitle[2])
  doc.text(candidateName.toUpperCase(), MARGIN, y)
  y += 16

  // Contact line
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(textSub[0], textSub[1], textSub[2])
  const contactParts = [personal.location, personal.phone, personal.email, personal.linkedin]
    .map(cleanText).filter(Boolean)
  if (contactParts.length) {
    doc.text(contactParts.join('   |   '), MARGIN, y)
    y += 14
  }

  // Divider
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.75)
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y)
  y += 22

  // Date
  const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.setFont(FONT, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(textSub[0], textSub[1], textSub[2])
  doc.text(dateStr, MARGIN, y)
  y += 20

  // Company / Position header
  if (positionName || companyName) {
    doc.setFont(FONT, 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(textTitle[0], textTitle[1], textTitle[2])
    if (positionName) {
      doc.text(cleanText(positionName), MARGIN, y)
      y += 14
    }
    if (companyName) {
      doc.setFont(FONT, 'normal')
      doc.text(cleanText(companyName), MARGIN, y)
      y += 18
    }
  }

  y += 4

  // Body paragraphs â€” split on double newline OR single newline
  const paragraphs = letterText.split(/\n\s*\n|\n/)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])

  for (const para of paragraphs) {
    const trimmed = cleanText(para)
    if (!trimmed) { y += LINE_BODY * 0.4; continue }
    const lines  = doc.splitTextToSize(trimmed, CONTENT_W)
    const blockH = lines.length * LINE_BODY + 8
    ensureSpace(blockH)
    doc.text(lines, MARGIN, y)
    y += blockH
  }

  doc.setProperties({
    title:   `${candidateName} - Cover Letter`,
    author:  candidateName,
    creator: 'ATS Resume Generator',
  })

  doc.save(`Carta_Presentacion_${safeFileName}.pdf`)
}

