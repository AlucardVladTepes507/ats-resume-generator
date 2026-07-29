import React from 'react'
import { Mail, Phone, MapPin, Globe, User } from 'lucide-react'

export default function ModernPhotoTemplate({ data }) {
  if (!data) return null

  const { personal_info = {}, experience = [], education = [], skills = [] } = data

  return (
    <div className="modern-photo-template">
      {/* Modern Photo Header Banner */}
      <div className="mod-photo-header">
        <div className="mod-avatar-wrapper">
          {personal_info.photo ? (
            <img src={personal_info.photo} alt={personal_info.name} className="mod-avatar-img" />
          ) : (
            <div className="mod-avatar-placeholder">
              <User size={44} color="#94a3b8" />
            </div>
          )}
        </div>

        <div className="mod-header-details">
          <h1 className="mod-name-title">{personal_info.name || 'TU NOMBRE COMPLETO'}</h1>
          <div className="mod-contact-row">
            {personal_info.email && (
              <span className="mod-contact-tag"><Mail size={12} /> {personal_info.email}</span>
            )}
            {personal_info.phone && (
              <span className="mod-contact-tag"><Phone size={12} /> {personal_info.phone}</span>
            )}
            {personal_info.location && (
              <span className="mod-contact-tag"><MapPin size={12} /> {personal_info.location}</span>
            )}
            {personal_info.linkedin && (
              <span className="mod-contact-tag"><Globe size={12} /> {personal_info.linkedin}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mod-blue-accent-bar"></div>

      {/* Summary */}
      {personal_info.summary && (
        <div className="modern-section">
          <h3 className="mod-sec-heading">PERFIL PROFESIONAL</h3>
          <p className="mod-summary-text">{personal_info.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="modern-section">
          <h3 className="mod-sec-heading">EXPERIENCIA LABORAL</h3>
          {experience.map((exp, idx) => (
            <div className="modern-exp-item" key={idx}>
              <div className="mod-exp-top font-bold">
                <div>
                  <strong className="mod-job-title">{exp.position}</strong>
                  <span className="mod-company-name"> | {exp.company}</span>
                </div>
                <span className="mod-job-dates">{exp.start_date} – {exp.end_date}</span>
              </div>
              {Array.isArray(exp.description) && (
                <ul className="mod-bullet-list">
                  {exp.description.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="modern-section">
          <h3 className="mod-sec-heading">EDUCACIÓN</h3>
          {education.map((edu, idx) => (
            <div className="modern-edu-item" key={idx}>
              <div className="mod-exp-top">
                <div>
                  <strong className="mod-job-title">{edu.degree}</strong>
                  <span className="mod-company-name"> — {edu.institution}</span>
                </div>
                <span className="mod-job-dates">{edu.start_date} – {edu.end_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="modern-section">
          <h3 className="mod-sec-heading">HABILIDADES CLAVE</h3>
          <div className="mod-skills-flex">
            {skills.map((skill, idx) => (
              <span className="mod-skill-pill" key={idx}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
