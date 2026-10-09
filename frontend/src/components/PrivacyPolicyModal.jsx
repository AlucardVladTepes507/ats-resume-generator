import React from 'react'
import { X, Shield } from 'lucide-react'

export default function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal-header">
          <div className="legal-modal-title">
            <Shield size={20} />
            <h2>Política de Privacidad</h2>
          </div>
          <button className="legal-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="legal-modal-body">
          <p className="legal-effective-date">Última actualización: Octubre 2024</p>

          <section className="legal-section">
            <h3>1. Quiénes Somos</h3>
            <p>
              <strong>ATS Resume Generator</strong> es una herramienta gratuita operada por{' '}
              <a href="https://smart507.com" target="_blank" rel="noopener noreferrer">smart507.com</a>{' '}
              que ayuda a los usuarios a crear, optimizar y analizar currículums vitae (CVs) para sistemas
              de selección ATS (Applicant Tracking System) mediante Inteligencia Artificial.
            </p>
          </section>

          <section className="legal-section">
            <h3>2. Qué Datos Procesamos</h3>
            <p>Para brindar el servicio, la aplicación puede procesar los siguientes datos personales que
              <strong> usted mismo introduce o sube voluntariamente</strong>:</p>
            <ul>
              <li>Nombre completo, correo electrónico, teléfono y ubicación</li>
              <li>Historial laboral (empresas, cargos, fechas, logros)</li>
              <li>Información académica (instituciones, títulos, fechas)</li>
              <li>Habilidades profesionales</li>
              <li>Fotografía de perfil (opcional)</li>
              <li>Descripción de ofertas de empleo que usted analice</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>3. Cómo Usamos Sus Datos</h3>
            <p>Sus datos se utilizan <strong>exclusivamente</strong> para:</p>
            <ul>
              <li>Generar y formatear su currículum en la herramienta</li>
              <li>Analizar la compatibilidad de su CV con ofertas de empleo</li>
              <li>Generar cartas de presentación, sugerencias de mejora y herramientas afines</li>
            </ul>
            <p><strong>No utilizamos sus datos con fines publicitarios, de marketing ni los vendemos a terceros.</strong></p>
          </section>

          <section className="legal-section">
            <h3>4. Almacenamiento de Datos</h3>
            <p>
              <strong>No almacenamos su CV ni datos personales en nuestros servidores de forma permanente.</strong>{' '}
              El procesamiento ocurre en tiempo real y los datos del CV se guardan únicamente en el
              almacenamiento local de su navegador (<code>localStorage</code>), dentro de su propio dispositivo.
              Usted puede eliminarlos en cualquier momento limpiando los datos del sitio en su navegador.
            </p>
          </section>

          <section className="legal-section">
            <h3>5. Servicios de Inteligencia Artificial de Terceros</h3>
            <p>
              Esta herramienta utiliza APIs de terceros para el procesamiento con Inteligencia Artificial.
              Al usar la aplicación, sus datos pueden ser enviados a:
            </p>
            <ul>
              <li>
                <strong>Google Gemini AI</strong> — para análisis de imágenes y generación de texto.{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Ver política de privacidad de Google
                </a>
              </li>
              <li>
                <strong>Groq API</strong> — para generación rápida de texto.{' '}
                <a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer">
                  Ver política de privacidad de Groq
                </a>
              </li>
            </ul>
            <p>
              Le recomendamos revisar las políticas de privacidad de dichos proveedores. No tenemos control
              sobre cómo estos terceros procesan los datos una vez recibidos.
            </p>
          </section>

          <section className="legal-section">
            <h3>6. Cookies y Almacenamiento Local</h3>
            <p>
              Esta aplicación <strong>no utiliza cookies de rastreo</strong>. Sí utiliza{' '}
              <code>localStorage</code> del navegador para:
            </p>
            <ul>
              <li>Guardar temporalmente los datos de su CV mientras trabaja</li>
              <li>Recordar su preferencia de idioma y tema visual</li>
              <li>Registrar su aceptación de esta política</li>
            </ul>
            <p>Estos datos nunca se transmiten a terceros con fines comerciales.</p>
          </section>

          <section className="legal-section">
            <h3>7. Sus Derechos</h3>
            <p>Usted tiene derecho a:</p>
            <ul>
              <li><strong>Acceder</strong> a sus datos: están visibles directamente en la interfaz de la aplicación</li>
              <li><strong>Rectificarlos</strong>: puede editar cualquier dato en el formulario</li>
              <li><strong>Eliminarlos</strong>: use el botón "Subir o crear otro CV" para limpiar todos los datos, o borre el almacenamiento local de su navegador</li>
              <li><strong>No proporcionar datos</strong>: la herramienta es de uso completamente voluntario</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>8. Menores de Edad</h3>
            <p>
              Este servicio no está dirigido a menores de 16 años. Si usted tiene menos de 16 años,
              por favor no utilice esta herramienta sin supervisión de un adulto responsable.
            </p>
          </section>

          <section className="legal-section">
            <h3>9. Cambios a Esta Política</h3>
            <p>
              Podemos actualizar esta política en cualquier momento. Los cambios entrarán en vigor
              al publicarse en esta página. Le recomendamos revisarla periódicamente.
            </p>
          </section>

          <section className="legal-section">
            <h3>10. Contacto</h3>
            <p>
              Si tiene preguntas sobre esta política de privacidad, puede contactarnos a través de{' '}
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
