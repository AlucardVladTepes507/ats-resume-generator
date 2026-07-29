import React, { useState } from 'react'
import { Plus, Trash2, User, Briefcase, GraduationCap, Wrench, Sparkles, Globe, Check, Loader2 } from 'lucide-react'
import { getApiUrl } from '../config'

export default function ResumeEditor({ data, onChange }) {
  const [activeTab, setActiveTab] = useState('personal')
  const [enhancingIndex, setEnhancingIndex] = useState(null) // `${expIdx}-${bIdx}`
  const [suggestions, setSuggestions] = useState([])
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

  // AI Bullet Enhancement Handler
  const handleEnhanceBullet = async (expIdx, bIdx, bulletText, position) => {
    if (!bulletText.trim()) return
    const key = `${expIdx}-${bIdx}`
    setEnhancingIndex(key)
    setSuggestions([])

    const API_BASE = getApiUrl()

    try {
      const response = await fetch(`${API_BASE}/enhance-bullet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: bulletText,
          position: position || 'Profesional'
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.detail)
      setSuggestions(result.suggestions || [])
    } catch (err) {
      alert(`Error al mejorar la viñeta: ${err.message}`)
      setEnhancingIndex(null)
    }
  }

  const applySuggestion = (expIdx, bIdx, newText) => {
    handleBulletChange(expIdx, bIdx, newText)
    setEnhancingIndex(null)
    setSuggestions([])
  }

  // Personal Info handlers
  const handlePersonalInfoChange = (field, value) => {
    onChange({
      ...data,
      personal_info: {
        ...data.personal_info,
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

  const handleAddExperience = () => {
    const newExp = [
      ...(data.experience || []),
      {
        company: 'Nombre de Empresa',
        position: 'Cargo / Puesto',
        start_date: 'Mes Año',
        end_date: 'Presente',
        description: ['Logro o responsabilidad clave 1']
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
    const newDesc = [...(newExp[expIndex].description || [])]
    newDesc[bulletIndex] = value
    newExp[expIndex].description = newDesc
    onChange({ ...data, experience: newExp })
  }

  const handleAddBullet = (expIndex) => {
    const newExp = [...(data.experience || [])]
    const newDesc = [...(newExp[expIndex].description || []), 'Nuevo logro o responsabilidad']
    newExp[expIndex].description = newDesc
    onChange({ ...data, experience: newExp })
  }

  const handleRemoveBullet = (expIndex, bulletIndex) => {
    const newExp = [...(data.experience || [])]
    const newDesc = newExp[expIndex].description.filter((_, i) => i !== bulletIndex)
    newExp[expIndex].description = newDesc
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
        institution: 'Universidad / Instituto',
        degree: 'Título u Operación',
        start_date: 'Año',
        end_date: 'Año'
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



  const [targetMarket, setTargetMarket] = useState('latam') // 'latam' | 'us-canada'

  const handleMarketChange = (market) => {
    setTargetMarket(market)
    if (market === 'us-canada' && data.personal_info?.photo) {
      alert('⚠️ Normativa Anti-Discriminación de EE.UU./Canadá: La foto se ha desactivado para este mercado.')
    }
  }

  return (
    <div className="editor-container">
      {/* Top Translation Toolbar */}
      <div className="editor-ai-toolbar">
        <div className="translate-group">
          <Globe size={16} />
          <span>Traducir CV:</span>
          <button
            type="button"
            className="btn-secondary sm"
            onClick={() => handleTranslate('en')}
            disabled={isTranslating}
          >
            🇺🇸 Inglés
          </button>
          <button
            type="button"
            className="btn-secondary sm"
            onClick={() => handleTranslate('es')}
            disabled={isTranslating}
          >
            🇪🇸 Español
          </button>
          {isTranslating && <Loader2 size={16} className="spin-icon" />}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="editor-tabs">
        <button
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={15} />
          <span>Personal</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          <Briefcase size={15} />
          <span>Experiencia</span>
          {data.experience?.length > 0 && <span className="tab-badge">{data.experience.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <GraduationCap size={15} />
          <span>Educación</span>
          {data.education?.length > 0 && <span className="tab-badge">{data.education.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Wrench size={15} />
          <span>Habilidades</span>
          {data.skills?.length > 0 && <span className="tab-badge">{data.skills.length}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div className="form-section">
            <h3>Información Personal</h3>

            {/* Photo Upload Section */}
            <div className="photo-section-box">
              <label>Foto de Perfil Profesional (Opcional):</label>
                <div className="photo-controls">
                  <div className="photo-preview-box">
                    {data.personal_info?.photo ? (
                      <img src={data.personal_info.photo} alt="Perfil" className="photo-img-preview" />
                    ) : (
                      <div className="photo-placeholder-box">
                        <User size={32} color="#64748b" />
                        <span>Sin Foto</span>
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
                      Subir Foto
                    </label>
                    {data.personal_info?.photo && (
                      <button
                        className="btn-text danger sm"
                        onClick={() => handlePersonalInfoChange('photo', '')}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={data.personal_info?.name || ''}
                  onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                  placeholder="Ej. Cesar Perez"
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={data.personal_info?.email || ''}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={data.personal_info?.phone || ''}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  placeholder="+507 6000-0000"
                />
              </div>
              <div className="form-group">
                <label>Ubicación</label>
                <input
                  type="text"
                  value={data.personal_info?.location || ''}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                  placeholder="Ciudad, País"
                />
              </div>
              <div className="form-group full-width">
                <label>LinkedIn / Perfil Web</label>
                <input
                  type="text"
                  value={data.personal_info?.linkedin || ''}
                  onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/perfil"
                />
              </div>
              <div className="form-group full-width">
                <label>Resumen / Perfil Profesional</label>
                <textarea
                  rows={4}
                  value={data.personal_info?.summary || ''}
                  onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                  placeholder="Escribe un breve resumen de tus fortalezas y trayectoria profesional..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="form-section">
            <div className="section-header">
              <h3>Experiencia Laboral</h3>
              <button className="btn-secondary" onClick={handleAddExperience}>
                <Plus size={16} /> Añadir Empleo
              </button>
            </div>

            {(data.experience || []).map((exp, expIdx) => (
              <div className="card-item" key={expIdx}>
                <div className="card-header">
                  <h4>{exp.position || 'Nueva Posición'} en {exp.company || 'Empresa'}</h4>
                  <button className="btn-icon danger" onClick={() => handleRemoveExperience(expIdx)}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Empresa</label>
                    <input
                      type="text"
                      value={exp.company || ''}
                      onChange={(e) => handleExperienceChange(expIdx, 'company', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo / Puesto</label>
                    <input
                      type="text"
                      value={exp.position || ''}
                      onChange={(e) => handleExperienceChange(expIdx, 'position', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Inicio</label>
                    <input
                      type="text"
                      value={exp.start_date || ''}
                      onChange={(e) => handleExperienceChange(expIdx, 'start_date', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Fin</label>
                    <input
                      type="text"
                      value={exp.end_date || ''}
                      onChange={(e) => handleExperienceChange(expIdx, 'end_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bullets-section">
                  <label>Logros y Responsabilidades (Viñetas ATS)</label>
                  {(exp.description || []).map((bullet, bIdx) => {
                    const isCurrentEnhancing = enhancingIndex === `${expIdx}-${bIdx}`
                    return (
                      <div className="bullet-container-wrapper" key={bIdx}>
                        <div className="bullet-row">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => handleBulletChange(expIdx, bIdx, e.target.value)}
                          />
                          <button
                            className="btn-ai-sparkle"
                            title="Mejorar esta viñeta con IA"
                            onClick={() => handleEnhanceBullet(expIdx, bIdx, bullet, exp.position)}
                          >
                            <Sparkles size={14} />
                            <span>Mejorar</span>
                          </button>
                          <button className="btn-icon danger" onClick={() => handleRemoveBullet(expIdx, bIdx)}>
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Suggestions Modal/Popover */}
                        {isCurrentEnhancing && (
                          <div className="ai-suggestions-popover">
                            <h5>✨ Sugerencias de alto impacto con IA (Elige una para aplicar):</h5>
                            {suggestions.length === 0 ? (
                              <div className="loading-inline">
                                <Loader2 size={16} className="spin-icon" /> Redactando alternativas cuantitativas ATS...
                              </div>
                            ) : (
                              <div className="suggestions-list">
                                {suggestions.map((sug, sIdx) => (
                                  <button
                                    key={sIdx}
                                    className="suggestion-item-btn"
                                    onClick={() => applySuggestion(expIdx, bIdx, sug)}
                                  >
                                    <span>{sug}</span>
                                    <Check size={14} className="apply-icon" />
                                  </button>
                                ))}
                                <button className="btn-text cancel" onClick={() => setEnhancingIndex(null)}>
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <button className="btn-text" onClick={() => handleAddBullet(expIdx)}>
                    + Añadir Viñeta
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
              <h3>Educación y Certificaciones</h3>
              <button className="btn-secondary" onClick={handleAddEducation}>
                <Plus size={16} /> Añadir Educación
              </button>
            </div>

            {(data.education || []).map((edu, eduIdx) => (
              <div className="card-item" key={eduIdx}>
                <div className="card-header">
                  <h4>{edu.degree || 'Grado / Título'}</h4>
                  <button className="btn-icon danger" onClick={() => handleRemoveEducation(eduIdx)}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Institución</label>
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Título / Grado / Carrera</label>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'degree', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Año Inicio</label>
                    <input
                      type="text"
                      value={edu.start_date || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'start_date', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Año Fin</label>
                    <input
                      type="text"
                      value={edu.end_date || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'end_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="form-section">
            <h3>Habilidades Clave</h3>

            <div className="add-skill-bar">
              <input
                type="text"
                placeholder="Ej. Python, Liderazgo, SQL, NinjaRMM..."
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
                Añadir
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

