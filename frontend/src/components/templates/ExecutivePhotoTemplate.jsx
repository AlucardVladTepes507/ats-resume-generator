import React from 'react'
import { Mail, Phone, MapPin, Globe, User } from 'lucide-react'

export default function ExecutivePhotoTemplate({ data }) {
  if (!data) return null

  const { personal_info = {}, experience = [], education = [], skills = [] } = data

  return (
    <div className="executive-template">
      {/* Top Header with Photo */}
      <div className="exec-header">
        <div className="exec-photo-box">
          {personal_info.photo ? (
            <img src={personal_info.photo} alt={personal_info.name} className="exec-photo" />
          ) : (
            <div className="exec-photo-placeholder">
              <User size={48} color="#94a3b8" />
            </div>
          )}
        </div>

        <div className="exec-header-info">
          <h1 className="exec-name">{personal_info.name || 'TU NOMBRE COMPLETO'}</h1>
          <div className="exec-contact-grid">
            {personal_info.email && (
              <span className="exec-contact-item">
                <Mail size={13} /> {personal_info.email}
              </span>
            )}
            {personal_info.phone && (
              <span className="exec-contact-item">
                <Phone size={13} /> {personal_info.phone}
              </span>
            )}
            {personal_info.location && (
              <span className="exec-contact-item">
                <MapPin size={13} /> {personal_info.location}
              </span>
            )}
            {personal_info.linkedin && (
              <span className="exec-contact-item">
                <Globe size={13} /> {personal_info.linkedin}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="exec-divider"></div>

      {/* Summary Section */}
      {personal_info.summary && (
        <div className="exec-section">
          <h3 className="exec-title">PERFIL PROFESIONAL</h3>
          <p className="exec-summary">{personal_info.summary}</p>
        </div>
      )}

      {/* Experience Section */}
      {experience.length > 0 && (
        <div className="exec-section">
          <h3 className="exec-title">EXPERIENCIA LABORAL</h3>
          {experience.map((exp, idx) => (
            <div className="exec-exp-item" key={idx}>
              <div className="exec-exp-header">
                <div>
                  <strong className="exec-role">{exp.position}</strong>
                  <span className="exec-company"> — {exp.company}</span>
                </div>
                <span className="exec-dates">
                  {exp.start_date} – {exp.end_date}
                </span>
              </div>
              {Array.isArray(exp.description) && (
                <ul className="exec-bullets">
                  {exp.description.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education Section */}
      {education.length > 0 && (
        <div className="exec-section">
          <h3 className="exec-title">EDUCACIÓN</h3>
          {education.map((edu, idx) => (
            <div className="exec-edu-item" key={idx}>
              <div className="exec-exp-header">
                <div>
                  <strong className="exec-role">{edu.degree}</strong>
                  <span className="exec-company"> — {edu.institution}</span>
                </div>
                <span className="exec-dates">{edu.start_date} – {edu.end_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills Section */}
      {skills.length > 0 && (
        <div className="exec-section">
          <h3 className="exec-title">HABILIDADES CLAVE</h3>
          <div className="exec-skills-grid">
            {skills.map((skill, idx) => (
              <span className="exec-skill-badge" key={idx}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
