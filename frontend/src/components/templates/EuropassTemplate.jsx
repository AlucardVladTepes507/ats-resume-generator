import React from 'react'

export default function EuropassTemplate({ data }) {
  if (!data) return null

  const { personal_info = {}, experience = [], education = [], skills = [] } = data

  const isEnglish = (data.language && data.language.toLowerCase() === 'en') ||
    (personal_info.summary && /\b(experience|skills|support|management|professional|pursuing|focused|degree)\b/i.test(personal_info.summary))

  const labels = {
    summary: isEnglish ? 'ABOUT ME & PROFILE' : 'PERFIL PROFESIONAL & SOBRE MÍ',
    experience: isEnglish ? 'WORK EXPERIENCE' : 'EXPERIENCIA LABORAL',
    education: isEnglish ? 'EDUCATION AND TRAINING' : 'EDUCACIÓN Y FORMACIÓN',
    skills: isEnglish ? 'DIGITAL & PERSONAL SKILLS' : 'COMPETENCIAS DIGITALES Y PERSONALES',
  }

  return (
    <div className="ats-template europass-template">
      {/* EUROPASS HEADER BAR */}
      <header className="europass-header">
        <h1 className="europass-name">{personal_info.name || 'NOMBRE COMPLETO'}</h1>
        <div className="europass-contact">
          {personal_info.location && <span>📍 {personal_info.location}</span>}
          {personal_info.phone && <span>📞 {personal_info.phone}</span>}
          {personal_info.email && <span>✉️ {personal_info.email}</span>}
          {personal_info.linkedin && <span>🔗 {personal_info.linkedin}</span>}
        </div>
      </header>

      {/* SUMMARY */}
      {personal_info.summary && (
        <section className="europass-section">
          <h2 className="europass-section-title">{labels.summary}</h2>
          <p className="europass-summary">{personal_info.summary}</p>
        </section>
      )}

      {/* WORK EXPERIENCE */}
      {experience.length > 0 && (
        <section className="europass-section">
          <h2 className="europass-section-title">{labels.experience}</h2>
          {experience.map((exp, idx) => (
            <div className="europass-item" key={idx}>
              <div className="europass-item-header">
                <div>
                  <h3 className="europass-position">{exp.position}</h3>
                  <div className="europass-company">{exp.company}</div>
                </div>
                <span className="europass-date-badge">
                  {exp.start_date} {exp.start_date && exp.end_date ? '–' : ''} {exp.end_date}
                </span>
              </div>
              {Array.isArray(exp.bullets || exp.description) && (exp.bullets || exp.description).length > 0 && (
                <ul className="europass-bullets">
                  {(exp.bullets || exp.description).map((bullet, bIdx) => (
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
        <section className="europass-section">
          <h2 className="europass-section-title">{labels.education}</h2>
          {education.map((edu, idx) => (
            <div className="europass-item" key={idx}>
              <div className="europass-item-header">
                <div>
                  <h3 className="europass-degree">{edu.degree}</h3>
                  <div className="europass-institution">{edu.institution}</div>
                </div>
                <span className="europass-date-badge">
                  {edu.year || `${edu.start_date || ''} ${edu.start_date && edu.end_date ? '–' : ''} ${edu.end_date || ''}`}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <section className="europass-section">
          <h2 className="europass-section-title">{labels.skills}</h2>
          <div className="europass-skills-grid">
            {skills.map((skill, sIdx) => (
              <span className="europass-skill-pill" key={sIdx}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
