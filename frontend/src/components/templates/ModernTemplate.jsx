import React from 'react'

export default function ModernTemplate({ data }) {
  if (!data) return null

  const { personal_info = {}, experience = [], education = [], skills = [] } = data

  const isEnglish = (data.language && data.language.toLowerCase() === 'en') ||
    (personal_info.summary && /\b(experience|skills|support|management|professional|pursuing|focused|degree)\b/i.test(personal_info.summary))

  const labels = {
    summary: isEnglish ? 'PROFESSIONAL PROFILE' : 'PERFIL PROFESIONAL',
    experience: isEnglish ? 'WORK EXPERIENCE' : 'EXPERIENCIA LABORAL',
    education: isEnglish ? 'EDUCATION' : 'EDUCACIÓN',
    skills: isEnglish ? 'SKILLS & TOOLS' : 'HABILIDADES & HERRAMIENTAS',
  }

  return (
    <div className="ats-template modern-template">
      {/* HEADER */}
      <header className="modern-header">
        {personal_info.photo && (
          <div className="template-photo-wrapper">
            <img src={personal_info.photo} alt={personal_info.name} className="template-photo" />
          </div>
        )}
        <div>
          <h1 className="modern-name">{personal_info.name || 'NOMBRE COMPLETO'}</h1>
          <div className="modern-contact">
            {personal_info.location && <span>📍 {personal_info.location}</span>}
            {personal_info.phone && <span>📞 {personal_info.phone}</span>}
            {personal_info.email && <span>✉️ {personal_info.email}</span>}
            {personal_info.linkedin && <span>🔗 {personal_info.linkedin}</span>}
          </div>
        </div>
      </header>

      {/* SUMMARY */}
      {personal_info.summary && (
        <section className="modern-section">
          <h2 className="modern-section-title">{labels.summary}</h2>
          <p className="modern-summary">{personal_info.summary}</p>
        </section>
      )}

      {/* EXPERIENCE */}
      {experience.length > 0 && (
        <section className="modern-section">
          <h2 className="modern-section-title">{labels.experience}</h2>
          {experience.map((exp, idx) => (
            <div className="modern-item" key={idx}>
              <div className="modern-item-header">
                <div>
                  <h3 className="modern-position">{exp.position}</h3>
                  <div className="modern-company">{exp.company}</div>
                </div>
                <span className="modern-badge">
                  {exp.start_date} {exp.start_date && exp.end_date ? '–' : ''} {exp.end_date}
                </span>
              </div>
              {Array.isArray(exp.description) && exp.description.length > 0 && (
                <ul className="modern-bullets">
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
        <section className="modern-section">
          <h2 className="modern-section-title">{labels.education}</h2>
          {education.map((edu, idx) => (
            <div className="modern-item" key={idx}>
              <div className="modern-item-header">
                <div>
                  <h3 className="modern-degree">{edu.degree}</h3>
                  <div className="modern-institution">{edu.institution}</div>
                </div>
                <span className="modern-badge">
                  {edu.start_date} {edu.start_date && edu.end_date ? '–' : ''} {edu.end_date}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <section className="modern-section">
          <h2 className="modern-section-title">{labels.skills}</h2>
          <div className="modern-skills-grid">
            {skills.map((skill, sIdx) => (
              <span className="modern-skill-pill" key={sIdx}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
