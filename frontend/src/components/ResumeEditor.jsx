import React, { useState } from 'react'
import { Plus, Trash2, User, Briefcase, GraduationCap, Wrench, Globe, Loader2 } from 'lucide-react'
import { getApiUrl } from '../config'

export default function ResumeEditor({ data, onChange, t }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [isTranslating, setIsTranslating] = useState(false)
  const [newSkillInput, setNewSkillInput] = useState('')

  // Translation Handler
  const handleTranslate = async (targetLang) => {
    setIsTranslating(true)
    const API_BASE = getApiUrl()

    try {
      const response = await fetch(`${API_BASE}/translate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: data,
          target_language: targetLang
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.detail || 'Error al traducir el CV')
      }

      onChange(result)
    } catch (err) {
      alert(`Error traduciendo: ${err.message}`)
    } finally {
      setIsTranslating(false)
    }
  }


  // Personal Info handlers

  const handlePersonalInfoChange = (field, value) => {
    onChange({
      ...data,
      personal_info: {
        ...(data.personal_info || {}),
        [field]: value
      }
    })
  }

  // Experience handlers
  const handleExperienceChange = (index, field, value) => {
    const newExp = [...(data.experience || [])]
    newExp[index] = { ...newExp[index], [field]: value }
    onChange({ ...data, experience: newExp })
  }

  const isCurrentlyStudying = (val) => {
    if (!val) return false
    const lower = String(val).toLowerCase().trim()
    return ['presente', 'present', 'actualidad', 'en curso', 'actuel', 'heute', 'cursando', 'studying'].some(term => lower.includes(term))
  }

  const isCurrentJob = (val) => {
    if (!val) return false
    const lower = String(val).toLowerCase().trim()
    return ['presente', 'present', 'actualidad', 'en curso', 'actuel', 'heute'].some(term => lower.includes(term))
  }

  const handleAddExperience = () => {
    const newExp = [
      ...(data.experience || []),
      {
        company: '',
        position: '',
        location: '',
        start_date: '',
        end_date: t?.presentText || 'Presente',
        bullets: ['']
      }
    ]
    onChange({ ...data, experience: newExp })
  }

  const handleRemoveExperience = (index) => {
    const newExp = data.experience.filter((_, i) => i !== index)
    onChange({ ...data, experience: newExp })
  }

  const handleBulletChange = (expIndex, bulletIndex, value) => {
    const newExp = [...(data.experience || [])]
    const currentBullets = [...(newExp[expIndex].bullets || newExp[expIndex].description || [])]
    currentBullets[bulletIndex] = value
    newExp[expIndex] = {
      ...newExp[expIndex],
      bullets: currentBullets,
      description: currentBullets
    }
    onChange({ ...data, experience: newExp })
  }

  const handleAddBullet = (expIndex) => {
    const newExp = [...(data.experience || [])]
    const currentBullets = [...(newExp[expIndex].bullets || newExp[expIndex].description || []), '']
    newExp[expIndex] = {
      ...newExp[expIndex],
      bullets: currentBullets,
      description: currentBullets
    }
    onChange({ ...data, experience: newExp })
  }

  const handleRemoveBullet = (expIndex, bulletIndex) => {
    const newExp = [...(data.experience || [])]
    const currentBullets = (newExp[expIndex].bullets || newExp[expIndex].description || []).filter((_, i) => i !== bulletIndex)
    newExp[expIndex] = {
      ...newExp[expIndex],
      bullets: currentBullets,
      description: currentBullets
    }
    onChange({ ...data, experience: newExp })
  }

  // Education handlers
  const handleEducationChange = (index, field, value) => {
    const newEdu = [...(data.education || [])]
    newEdu[index] = { ...newEdu[index], [field]: value }
    onChange({ ...data, education: newEdu })
  }

  const handleAddEducation = () => {
    const newEdu = [
      ...(data.education || []),
      {
        institution: '',
        degree: '',
        start_date: '',
        end_date: ''
      }
    ]
    onChange({ ...data, education: newEdu })
  }

  const handleRemoveEducation = (index) => {
    const newEdu = data.education.filter((_, i) => i !== index)
    onChange({ ...data, education: newEdu })
  }

  // Skills handlers
  const handleAddSkill = (skillText) => {
    if (!skillText.trim()) return
    const newSkills = [...(data.skills || []), skillText.trim()]
    onChange({ ...data, skills: newSkills })
  }

  const handleRemoveSkill = (index) => {
    const newSkills = data.skills.filter((_, i) => i !== index)
    onChange({ ...data, skills: newSkills })
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      handlePersonalInfoChange('photo', uploadEvent.target.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="editor-container">
      {/* Top Translation Toolbar */}
      <div className="editor-ai-toolbar">
        <div className="translate-group">
          <div className="translate-label">
            <Globe size={16} />
            <span>{t?.translateCvLabel || 'Traducir CV:'}</span>
          </div>
          <div className="translate-buttons">
            <button
              type="button"
              className="translate-btn"
              onClick={() => handleTranslate('en')}
              disabled={isTranslating}
            >
              🇺🇸 English
            </button>
            <button
              type="button"
              className="translate-btn"
              onClick={() => handleTranslate('es')}
              disabled={isTranslating}
            >
              🇪🇸 Español
            </button>
            <button
              type="button"
              className="translate-btn"
              onClick={() => handleTranslate('pt')}
              disabled={isTranslating}
            >
              🇵🇹 Português
            </button>
            <button
              type="button"
              className="translate-btn"
              onClick={() => handleTranslate('fr')}
              disabled={isTranslating}
            >
              🇫🇷 Français
            </button>
            <button
              type="button"
              className="translate-btn"
              onClick={() => handleTranslate('de')}
              disabled={isTranslating}
            >
              🇩🇪 Deutsch
            </button>
            {isTranslating && <Loader2 size={16} className="spin-icon" />}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="editor-tabs">
        <button
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={15} />
          <span className="tab-label">{t?.tabPersonal || 'Personal'}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          <Briefcase size={15} />
          <span className="tab-label">{t?.tabExperience || 'Experiencia'}</span>
          {data.experience?.length > 0 && <span className="tab-badge">{data.experience.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <GraduationCap size={15} />
          <span className="tab-label">{t?.tabEducation || 'Educación'}</span>
          {data.education?.length > 0 && <span className="tab-badge">{data.education.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Wrench size={15} />
          <span className="tab-label">{t?.tabSkills || 'Habilidades'}</span>
          {data.skills?.length > 0 && <span className="tab-badge">{data.skills.length}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="form-section">
            <h3>{t?.personalInfoTitle || 'Información Personal'}</h3>

            {/* Photo Upload Section */}
            <div className="photo-section-box">
              <label>{t?.photoLabel || 'Foto de Perfil Profesional (Opcional):'}</label>
              <div className="photo-controls">
                <div className="photo-preview-box">
                  {data.personal_info?.photo ? (
                    <img src={data.personal_info.photo} alt="Perfil" className="photo-img-preview" />
                  ) : (
                    <div className="photo-placeholder-box">
                      <User size={32} color="#64748b" />
                      <span>{t?.noPhoto || 'Sin Foto'}</span>
                    </div>
                  )}
                </div>
                <div className="photo-actions">
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-photo-input"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-photo-input" className="btn-secondary sm">
                    {t?.uploadPhotoBtn || 'Subir Foto'}
                  </label>
                  {data.personal_info?.photo && (
                    <button
                      className="btn-text danger sm"
                      onClick={() => handlePersonalInfoChange('photo', '')}
                    >
                      {t?.removePhotoBtn || 'Quitar'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>{t?.fullNameLabel || 'Nombre Completo'}</label>
                <input
                  type="text"
                  value={data.personal_info?.name || ''}
                  onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                  placeholder={t?.namePlaceholder || 'Ej. Carlos Mendoza'}
                />
              </div>
              <div className="form-group">
                <label>{t?.emailLabel || 'Correo Electrónico'}</label>
                <input
                  type="email"
                  value={data.personal_info?.email || ''}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  placeholder={t?.emailPlaceholder || 'ejemplo@correo.com'}
                />
              </div>
              <div className="form-group">
                <label>{t?.phoneLabel || 'Teléfono'}</label>
                <input
                  type="text"
                  value={data.personal_info?.phone || ''}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  placeholder={t?.phonePlaceholder || '+507 6000-0000'}
                />
              </div>
              <div className="form-group">
                <label>{t?.locationLabel || 'Ubicación'}</label>
                <input
                  type="text"
                  value={data.personal_info?.location || ''}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                  placeholder={t?.locationPlaceholder || 'Ciudad, País'}
                />
              </div>
              <div className="form-group full-width">
                <label>{t?.linkedinLabel || 'LinkedIn / Perfil Web'}</label>
                <input
                  type="text"
                  value={data.personal_info?.linkedin || ''}
                  onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                  placeholder={t?.linkedinPlaceholder || 'linkedin.com/in/perfil'}
                />
              </div>
              <div className="form-group full-width">
                <label>{t?.summaryLabel || 'Resumen / Perfil Profesional'}</label>
                <textarea
                  rows={4}
                  value={data.personal_info?.summary || ''}
                  onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                  placeholder={t?.summaryPlaceholder || 'Escribe un breve resumen de tus fortalezas y trayectoria profesional...'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="form-section">
            <div className="section-header">
              <h3>{t?.expSectionTitle || 'Experiencia Laboral'}</h3>
              <button className="btn-secondary" onClick={handleAddExperience}>
                <Plus size={16} /> {t?.addExpBtn || 'Añadir Empleo'}
              </button>
            </div>

            {(data.experience || []).map((exp, expIdx) => (
              <div className="card-item" key={expIdx}>
                <div className="card-header">
                  <h4>
                    {exp.position || t?.newPositionDefault || 'Nueva Posición'}{' '}
                    {t?.atCompanyText || 'en'}{' '}
                    {exp.company || t?.companyLabel || 'Empresa'}
                  </h4>
                  <button className="btn-icon danger" onClick={() => handleRemoveExperience(expIdx)}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>{t?.companyLabel || 'Empresa'}</label>
                    <input
                      type="text"
                      value={exp.company || ''}
                      onChange={(e) => handleExperienceChange(expIdx, 'company', e.target.value)}
                      placeholder={t?.companyPlaceholder || 'Nombre de la empresa'}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t?.positionLabel || 'Cargo / Puesto'}</label>
                    <input
                      type="text"
                      value={exp.position || ''}
                      onChange={(e) => handleExperienceChange(expIdx, 'position', e.target.value)}
                      placeholder={t?.positionPlaceholder || 'Cargo / Puesto'}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t?.startDateLabel || 'Fecha de Inicio'}</label>
                    <input
                      type="text"
                      value={exp.start_date || ''}
                      onChange={(e) => handleExperienceChange(expIdx, 'start_date', e.target.value)}
                      placeholder={t?.datePlaceholder || 'Mes Año'}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t?.endDateLabel || 'Fecha de Fin'}</label>
                    <div className="date-input-with-action">
                      <input
                        type="text"
                        value={exp.end_date || ''}
                        onChange={(e) => handleExperienceChange(expIdx, 'end_date', e.target.value)}
                        placeholder={t?.datePlaceholder || 'Mes Año'}
                      />
                      <button
                        type="button"
                        className={`btn-current-toggle ${isCurrentJob(exp.end_date) ? 'active' : ''}`}
                        onClick={() => {
                          const isCurrent = isCurrentJob(exp.end_date)
                          handleExperienceChange(expIdx, 'end_date', isCurrent ? '' : (t?.presentText || 'Presente'))
                        }}
                        title={t?.currentJobBtn || 'Trabajo actual'}
                      >
                        <Briefcase size={13} />
                        <span>{t?.presentText || 'Presente'}</span>
                        {isCurrentJob(exp.end_date) && <Check size={13} className="check-badge" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bullets-section">
                  <label>{t?.bulletsLabel || 'Achievements & Responsibilities (ATS Bullets)'}</label>
                  {(exp.bullets || exp.description || []).map((bullet, bIdx) => (
                    <div className="bullet-row" key={bIdx}>
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => handleBulletChange(expIdx, bIdx, e.target.value)}
                        placeholder={t?.bulletPlaceholder || 'Measurable achievement or responsibility...'}
                        style={{ resize: 'vertical', minHeight: '2.5rem' }}
                      />
                      <button className="btn-icon danger" onClick={() => handleRemoveBullet(expIdx, bIdx)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button className="btn-text" onClick={() => handleAddBullet(expIdx)}>
                    {t?.addBulletBtn || '+ Add Bullet'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="form-section">
            <div className="section-header">
              <h3>{t?.eduSectionTitle || 'Educación y Certificaciones'}</h3>
              <button className="btn-secondary" onClick={handleAddEducation}>
                <Plus size={16} /> {t?.addEduBtn || 'Añadir Educación'}
              </button>
            </div>

            {(data.education || []).map((edu, eduIdx) => (
              <div className="card-item" key={eduIdx}>
                <div className="card-header">
                  <h4>{edu.degree || t?.newEduDefault || 'Grado / Título'}</h4>
                  <button className="btn-icon danger" onClick={() => handleRemoveEducation(eduIdx)}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>{t?.institutionLabel || 'Institución'}</label>
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                      placeholder={t?.institutionPlaceholder || 'Universidad o Centro Educativo'}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>{t?.degreeLabel || 'Título / Grado / Carrera'}</label>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'degree', e.target.value)}
                      placeholder={t?.degreePlaceholder || 'Licenciatura, Maestría, Bachiller...'}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t?.startYearLabel || 'Año Inicio'}</label>
                    <input
                      type="text"
                      value={edu.start_date || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'start_date', e.target.value)}
                      placeholder={t?.yearPlaceholder || 'Año'}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t?.endYearLabel || 'Año Fin'}</label>
                    <div className="date-input-with-action">
                      <input
                        type="text"
                        value={edu.end_date || ''}
                        onChange={(e) => handleEducationChange(eduIdx, 'end_date', e.target.value)}
                        placeholder={t?.yearPlaceholder || 'Año'}
                      />
                      <button
                        type="button"
                        className={`btn-current-toggle ${isCurrentlyStudying(edu.end_date) ? 'active' : ''}`}
                        onClick={() => {
                          const isCurrent = isCurrentlyStudying(edu.end_date)
                          handleEducationChange(eduIdx, 'end_date', isCurrent ? '' : (t?.presentText || 'Presente'))
                        }}
                        title={t?.currentStudyBtn || 'Actualmente cursando'}
                      >
                        <GraduationCap size={13} />
                        <span>{t?.currentStudyBtn || 'Actualmente cursando'}</span>
                        {isCurrentlyStudying(edu.end_date) && <Check size={13} className="check-badge" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="form-section">
            <h3>{t?.skillsSectionTitle || 'Habilidades Clave'}</h3>

            <div className="add-skill-bar">
              <input
                type="text"
                placeholder={t?.skillsPlaceholder || 'Ej. Python, Liderazgo, SQL...'}
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill(newSkillInput)
                    setNewSkillInput('')
                  }
                }}
              />
              <button
                className="btn-secondary"
                onClick={() => {
                  handleAddSkill(newSkillInput)
                  setNewSkillInput('')
                }}
              >
                {t?.addSkillBtn || 'Añadir'}
              </button>
            </div>

            <div className="skills-tag-cloud">
              {(data.skills || []).map((skill, sIdx) => (
                <div className="skill-tag" key={sIdx}>
                  <span>{skill}</span>
                  <button onClick={() => handleRemoveSkill(sIdx)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

