import React from 'react'

export default function HarvardTemplate({ data }) {
  if (!data) return null

  const { personal_info = {}, experience = [], education = [], skills = [] } = data

  const isEnglish = (data.language && data.language.toLowerCase() === 'en') ||
    (personal_info.summary && /\b(experience|skills|support|management|professional|pursuing|focused|degree)\b/i.test(personal_info.summary))

  const labels = {
    summary: isEnglish ? 'PROFESSIONAL SUMMARY' : 'RESUMEN PROFESIONAL',
    experience: isEnglish ? 'WORK EXPERIENCE' : 'EXPERIENCIA LABORAL',
    education: isEnglish ? 'EDUCATION' : 'EDUCACIÓN',
    skills: isEnglish ? 'KEY SKILLS & COMPETENCIES' : 'HABILIDADES TÉCNICAS Y COMPETENCIAS',
    skillsPrefix: isEnglish ? 'Skills: ' : 'Habilidades: ',
  }

  return (
    <div className="ats-template harvard-template">
      {/* HEADER */}
      <header className="harvard-header">
        <h1 className="harvard-name">{personal_info.name || 'NOMBRE COMPLETO'}</h1>
        <div className="harvard-contact">
          {personal_info.location && <span>{personal_info.location}</span>}
          {personal_info.location && (personal_info.phone || personal_info.email) && <span> | </span>}
          {personal_info.phone && <span>{personal_info.phone}</span>}
          {personal_info.phone && personal_info.email && <span> | </span>}
          {personal_info.email && <span>{personal_info.email}</span>}
          {personal_info.linkedin && (personal_info.email || personal_info.phone) && <span> | </span>}
          {personal_info.linkedin && <span>{personal_info.linkedin}</span>}
        </div>
      </header>

      {/* SUMMARY */}
      {personal_info.summary && (
        <section className="harvard-section">
          <h2 className="harvard-section-title">{labels.summary}</h2>
          <div className="harvard-section-divider"></div>
          <p className="harvard-summary">{personal_info.summary}</p>
        </section>
      )}

      {/* EXPERIENCE */}
      {experience.length > 0 && (
        <section className="harvard-section">
          <h2 className="harvard-section-title">{labels.experience}</h2>
          <div className="harvard-section-divider"></div>
          {experience.map((exp, idx) => (
            <div className="harvard-item" key={idx}>
              <div className="harvard-item-header">
                <div>
                  <strong className="harvard-company">{exp.company}</strong>
                  {exp.position && <span className="harvard-position"> — {exp.position}</span>}
                </div>
                <div className="harvard-dates">
                  {exp.start_date} {exp.start_date && exp.end_date ? '–' : ''} {exp.end_date}
                </div>
              </div>
              {Array.isArray(exp.description) && exp.description.length > 0 && (
                <ul className="harvard-bullets">
                  {exp.description.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* EDUCATION */}
      {education.length > 0 && (
        <section className="harvard-section">
          <h2 className="harvard-section-title">{labels.education}</h2>
          <div className="harvard-section-divider"></div>
          {education.map((edu, idx) => (
            <div className="harvard-item" key={idx}>
              <div className="harvard-item-header">
                <div>
                  <strong className="harvard-institution">{edu.institution}</strong>
                  {edu.degree && <span className="harvard-degree"> — {edu.degree}</span>}
                </div>
                <div className="harvard-dates">
                  {edu.start_date} {edu.start_date && edu.end_date ? '–' : ''} {edu.end_date}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <section className="harvard-section">
          <h2 className="harvard-section-title">{labels.skills}</h2>
          <div className="harvard-section-divider"></div>
          <p className="harvard-skills-list">
            <strong>{labels.skillsPrefix}</strong>
            {skills.join(' • ')}
          </p>
        </section>
      )}
    </div>
  )
}
