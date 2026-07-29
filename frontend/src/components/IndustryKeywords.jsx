import React, { useState } from 'react'
import { Tag, Sparkles, Plus, Check } from 'lucide-react'

const INDUSTRIES = [
  { id: 'ti', name: '💻 Tecnología & TI (Soporte, Dev, Cloud, Datos)' },
  { id: 'banca', name: '🏦 Banca, Finanzas & Contabilidad' },
  { id: 'logistica', name: '📦 Logística, Cadena de Suministro & Operaciones' },
  { id: 'servicios', name: '🎧 Atención al Cliente, Call Center & Servicios' },
  { id: 'ventas', name: '📈 Ventas, Comercial & Marketing Digital' },
  { id: 'admin', name: '🏢 Administración, Recursos Humanos & Legal' },
  { id: 'salud', name: '🏥 Salud, Farmacia & Calidad' },
]

export default function IndustryKeywords({ resumeData, onUpdateResumeData }) {
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0].name)
  const [targetRole, setTargetRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [addedSkills, setAddedSkills] = useState([])
  const [error, setError] = useState(null)

  const handleFetchKeywords = async () => {
    setError(null)
    setIsLoading(true)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${API_URL}/get-industry-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: selectedIndustry,
          target_role: targetRole
        })
      })

      if (response.status === 404) {
        throw new Error('El servidor backend en la nube se está desplegando con las nuevas funciones. Por favor, espera 30 segundos y vuelve a presionar el botón.')
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Error al obtener palabras clave')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSkill = (skillText) => {
    if (!resumeData || !onUpdateResumeData) return
    const currentSkills = resumeData.skills || []
    if (currentSkills.includes(skillText)) return

    const updatedSkills = [...currentSkills, skillText]
    onUpdateResumeData({
      ...resumeData,
      skills: updatedSkills
    })

    setAddedSkills((prev) => [...prev, skillText])
  }

  return (
    <div className="industry-keywords-container">
      <div className="analyzer-header">
        <Tag size={22} className="analyzer-icon" />
        <div>
          <h3>Paquetes de Palabras Clave ATS por Industria</h3>
          <p>Selecciona tu industria y descubre las competencias de mayor demanda para agregarlas a tu CV con 1 clic.</p>
        </div>
      </div>

      <div className="analyzer-input-group">
        <div className="industry-selector-grid">
          <div className="form-group">
            <label>Selecciona tu Industria / Sector:</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.name}>{ind.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Puesto Específico (Opcional):</label>
            <input
              type="text"
              placeholder="Ej. Técnico en Soporte, Analista Financiero..."
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn-primary analyze-btn"
          onClick={handleFetchKeywords}
          disabled={isLoading}
        >
          <Sparkles size={16} />
          <span>{isLoading ? 'Cargando Palabras Clave...' : 'Cargar Paquete de Palabras Clave'}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div className="industry-keywords-results">
          {/* Technical Keywords */}
          {result.technical_keywords?.length > 0 && (
            <div className="kw-category-box">
              <h4>🛠️ Competencias Técnicas & Especializadas ({result.industry})</h4>
              <div className="kw-cloud">
                {result.technical_keywords.map((kw, idx) => {
                  const isAdded = (resumeData?.skills || []).includes(kw) || addedSkills.includes(kw)
                  return (
                    <button
                      key={idx}
                      className={`kw-add-pill ${isAdded ? 'added' : ''}`}
                      onClick={() => handleAddSkill(kw)}
                      disabled={isAdded}
                    >
                      {isAdded ? <Check size={12} /> : <Plus size={12} />}
                      <span>{kw}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Soft Keywords */}
          {result.soft_keywords?.length > 0 && (
            <div className="kw-category-box">
              <h4>🤝 Competencias Blandas & Gestión</h4>
              <div className="kw-cloud">
                {result.soft_keywords.map((kw, idx) => {
                  const isAdded = (resumeData?.skills || []).includes(kw) || addedSkills.includes(kw)
                  return (
                    <button
                      key={idx}
                      className={`kw-add-pill ${isAdded ? 'added' : ''}`}
                      onClick={() => handleAddSkill(kw)}
                      disabled={isAdded}
                    >
                      {isAdded ? <Check size={12} /> : <Plus size={12} />}
                      <span>{kw}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tools and Certifications */}
          {result.tools_and_certifications?.length > 0 && (
            <div className="kw-category-box">
              <h4>📜 Herramientas & Certificaciones Clave</h4>
              <div className="kw-cloud">
                {result.tools_and_certifications.map((kw, idx) => {
                  const isAdded = (resumeData?.skills || []).includes(kw) || addedSkills.includes(kw)
                  return (
                    <button
                      key={idx}
                      className={`kw-add-pill ${isAdded ? 'added' : ''}`}
                      onClick={() => handleAddSkill(kw)}
                      disabled={isAdded}
                    >
                      {isAdded ? <Check size={12} /> : <Plus size={12} />}
                      <span>{kw}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
