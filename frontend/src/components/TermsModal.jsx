import React from 'react'
import { X, FileText } from 'lucide-react'

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal-header">
          <div className="legal-modal-title">
            <FileText size={20} />
            <h2>Términos de Uso</h2>
          </div>
          <button className="legal-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="legal-modal-body">
          <p className="legal-effective-date">Última actualización: Octubre 2024</p>

          <section className="legal-section">
            <h3>1. Aceptación de los Términos</h3>
            <p>
              Al acceder y utilizar <strong>ATS Resume Generator</strong> (en adelante "la Herramienta"),
              operada por <a href="https://smart507.com" target="_blank" rel="noopener noreferrer">smart507.com</a>,
              usted acepta estar sujeto a estos Términos de Uso. Si no está de acuerdo con alguno de ellos,
              por favor no utilice la Herramienta.
            </p>
          </section>

          <section className="legal-section">
            <h3>2. Descripción del Servicio</h3>
            <p>
              ATS Resume Generator es una herramienta gratuita en línea que permite a los usuarios:
            </p>
            <ul>
              <li>Crear y editar currículums vitae (CVs) optimizados para sistemas ATS</li>
              <li>Analizar la compatibilidad de su CV con ofertas de empleo</li>
              <li>Generar cartas de presentación y materiales de búsqueda de empleo</li>
              <li>Obtener sugerencias de mejora mediante Inteligencia Artificial</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>3. Uso Permitido</h3>
            <p>Usted se compromete a utilizar la Herramienta únicamente para fines lícitos y a:</p>
            <ul>
              <li>Subir únicamente información verídica y de su propia autoría</li>
              <li>No subir contenido de terceros sin su consentimiento</li>
              <li>No utilizar la herramienta para actividades fraudulentas o ilegales</li>
              <li>No intentar acceder, modificar o dañar los sistemas de la Herramienta</li>
              <li>No hacer uso automatizado o masivo del servicio sin autorización</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>4. Responsabilidad del Contenido</h3>
            <p>
              <strong>Usted es el único responsable</strong> de la información que introduce en la Herramienta.
              ATS Resume Generator actúa como procesador técnico y no verifica la exactitud, veracidad o
              legalidad del contenido proporcionado. La Herramienta no se hace responsable por:
            </p>
            <ul>
              <li>Información falsa o incorrecta proporcionada por el usuario</li>
              <li>El uso que el usuario haga del CV o carta de presentación generados</li>
              <li>Resultados de procesos de selección laboral</li>
              <li>Decisiones tomadas con base en las sugerencias de la IA</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>5. Limitación de Garantías</h3>
            <p>
              La Herramienta se proporciona <strong>"tal como está"</strong>, sin garantías de ningún tipo,
              ya sean expresas o implícitas. No garantizamos que:
            </p>
            <ul>
              <li>El servicio sea ininterrumpido o libre de errores</li>
              <li>Los resultados generados por la IA sean perfectos o adecuados para cada caso</li>
              <li>El CV generado garantice resultados en procesos de selección</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>6. Propiedad Intelectual</h3>
            <p>
              El diseño, código fuente y contenido original de ATS Resume Generator son propiedad de
              smart507.com. El contenido del CV generado a partir de la información que usted proporciona
              es de su propiedad. La IA puede sugerir redacciones, pero usted mantiene la autoría final
              del documento.
            </p>
          </section>

          <section className="legal-section">
            <h3>7. Servicios de Terceros</h3>
            <p>
              Esta Herramienta utiliza servicios de Inteligencia Artificial de terceros (Google Gemini y Groq).
              Su uso implica la aceptación de las condiciones de uso de dichos proveedores. No somos responsables
              por el funcionamiento, disponibilidad o políticas de esos servicios externos.
            </p>
          </section>

          <section className="legal-section">
            <h3>8. Modificaciones al Servicio</h3>
            <p>
              Nos reservamos el derecho de modificar, suspender o discontinuar la Herramienta en cualquier
              momento, con o sin previo aviso. También podemos actualizar estos Términos de Uso; los cambios
              serán efectivos al publicarse en esta página.
            </p>
          </section>

          <section className="legal-section">
            <h3>9. Jurisdicción</h3>
            <p>
              Estos términos se rigen por las leyes aplicables de la República de Panamá. Cualquier
              disputa será sometida a los tribunales competentes de dicha jurisdicción.
            </p>
          </section>

          <section className="legal-section">
            <h3>10. Contacto</h3>
            <p>
              Para consultas sobre estos términos, contáctenos a través de{' '}
              <a href="https://smart507.com" target="_blank" rel="noopener noreferrer">smart507.com</a>.
            </p>
          </section>
        </div>

        <div className="legal-modal-footer">
          <button className="btn-primary" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  )
}
