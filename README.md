# ATS Resume Generator

Crea, optimiza y descarga currículums en formatos que pasan los filtros ATS (Applicant Tracking System). Puedes partir de un CV en PDF o de una foto de tu currículum y la IA se encarga de extraer y estructurar los datos, o crear uno desde cero con plantillas limpias.

**Demo:** https://cv.smart507.com

---

## Funcionalidades

- **Importar CV existente**: sube un PDF o una foto (JPG, PNG, WEBP) y la IA extrae la información en campos estructurados. Las fotos se comprimen en el navegador antes de enviarse.
- **Crear desde cero**: editor por secciones (datos personales, resumen, experiencia, educación, habilidades, idiomas, proyectos, certificaciones) con vista previa en vivo.
- **5 plantillas**: Harvard, Modern, Europass, Executive (con foto) y Modern Photo.
- **Exportación a PDF vectorial**: texto seleccionable y peso reducido, con tipografía Merriweather incluida en el proyecto (sin depender de servicios externos). El PDF guarda además los datos del CV para poder reimportarlo.
- **Análisis de compatibilidad ATS**: compara tu CV con una oferta de trabajo concreta y devuelve puntuación y palabras clave faltantes.
- **Asistentes de IA**:
  - Carta de presentación (a partir de texto de la oferta o de una URL).
  - Optimización automática del CV para una vacante.
  - Mejora de viñetas de experiencia.
  - Mensaje de contacto para reclutadores (LinkedIn/email).
  - Preguntas de entrevista y preparación.
  - Optimización de perfil de LinkedIn.
  - Estimación salarial.
  - Ruta de certificaciones recomendadas.
  - Corrección gramatical y palabras clave por industria.
- **Traducción del CV** completo entre idiomas.
- **Interfaz en 5 idiomas**: español, inglés, portugués, francés y alemán.
- **Privacidad**: el CV se guarda en el `localStorage` del navegador; no hay cuentas ni base de datos de usuarios.

## Stack

| Parte | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite 8, CSS propio, `lucide-react`, `jsPDF` para el PDF vectorial |
| Backend | FastAPI + Uvicorn |
| IA | Google Gemini y Groq (fallback), con claves configurables |
| Extracción de PDF | `pdfplumber` |
| Imágenes | `Pillow` |
| Lint | `oxlint` |

## Estructura del repositorio

```
backend/
  main.py            # API FastAPI (extracción, IA, generación de contenido)
  requirements.txt   # dependencias de Python
  .env.example       # variables de entorno del backend
  Procfile           # comando de arranque para Render
frontend/
  index.html
  .env.example      # variable VITE_API_URL
  vercel.json        # cabeceras de seguridad y CSP para Vercel
  public/fonts/      # Merriweather (TTF) usada por el PDF y previsualizaciones
  src/
    App.jsx          # flujo principal: subir → editar → previsualizar
    config.js        # resolución de la URL de la API y sanitización de datos
    i18n.js          # traducciones (es, en, pt, fr, de)
    components/       # editor, vistas previas, plantillas y asistentes de IA
    utils/           # generación de PDF, helpers de red e imágenes
```

## Requisitos

- **Node.js 22 LTS** (o 20.19+) y npm.
- **Python 3.11+**.

## Puesta en marcha local

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env      # y rellena tus claves
uvicorn main:app --reload --port 8000
```

La API queda en `http://localhost:8000`; `GET /health` responde para comprobar que está viva.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # en Windows: copy .env.example .env.local
npm run dev
```

`frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

Abre `http://localhost:5173`.

### Scripts del frontend

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila a `frontend/dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | Ejecuta `oxlint` |

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sí | Clave de Google AI Studio (https://aistudio.google.com/). |
| `GEMINI_API_KEY_2` … `_4` | No | Claves extra para repartir carga cuando hay mucha demanda. |
| `GROQ_API_KEY` | No | Clave de Groq (https://console.groq.com/). Se usa como vía rápida y como respaldo si Gemini falla. |
| `ALLOWED_ORIGINS` | No | Lista separada por comas de orígenes permitidos por CORS. Por defecto incluye `https://cv.smart507.com` y los puertos locales de Vite (`5173`, `4173`). |
| `RATE_LIMIT_MAX_REQUESTS` | No | Peticiones por minuto y por IP antes de responder `429`. Por defecto `40`. |

### Frontend (`frontend/.env.local`)

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base del backend. Si no se define, se usa `http://localhost:8000`. |

## API

Todas las rutas aceptan también la variante con barra final.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/` , `/health` | Estado del servicio |
| POST | `/upload-pdf` | Extraer datos de un CV en PDF |
| POST | `/upload-file` | Extraer datos de una foto de CV |
| POST | `/extract-job-image-text` | Leer el texto de una oferta en imagen |
| POST | `/analyze-job-match` | Puntuación ATS frente a una vacante |
| POST | `/auto-optimize-resume` | Optimizar el CV para una vacante |
| POST | `/enhance-bullet` | Reescribir una viñeta de experiencia |
| POST | `/generate-cover-letter` | Generar carta de presentación |
| POST | `/translate-resume` | Traducir el CV completo |
| POST | `/generate-outreach-message` | Mensaje para reclutadores |
| POST | `/generate-interview-questions` | Preguntas de entrevista |
| POST | `/generate-linkedin-profile` | Optimizar perfil de LinkedIn |
| POST | `/estimate-salary` | Estimación salarial |
| POST | `/recommend-certifications` | Certificaciones recomendadas |
| POST | `/check-grammar` | Corrección gramatical |
| POST | `/get-industry-keywords` | Palabras clave por industria |

El backend aplica límites de tamaño de petición, límite de peticiones por IP, restricciones de CORS y bloqueo de peticiones a hosts privados/internos al leer ofertas desde una URL.

## Despliegue

### Frontend en Vercel

- Directorio raíz del proyecto: `frontend`.
- Build: `npm run build`, salida en `dist`.
- Define `VITE_API_URL` con la URL pública del backend.
- `frontend/vercel.json` aplica cabeceras de seguridad (CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`). **Si añades un servicio externo** (fuentes, analítica, imágenes), amplía la CSP o el navegador lo bloqueará en silencio.
- `font-src` permite `fonts.gstatic.com` y `style-src` permite `fonts.googleapis.com` porque la interfaz usa DM Sans y Merriweather desde Google Fonts.

### Backend en Render

- Directorio raíz: `backend`.
- El `Procfile` ya define el arranque: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Configura `GEMINI_API_KEY` (y opcionalmente `GROQ_API_KEY`) en el panel de Render.
- Ajusta `ALLOWED_ORIGINS` si el dominio del frontend cambia.

> Si cambias la URL del backend, actualízala en dos lugares: `VITE_API_URL` en Vercel y `connect-src` dentro de la CSP de `frontend/vercel.json`.

## Notas técnicas

- **Fuentes del PDF**: los TTF de Merriweather viven en `frontend/public/fonts/`; el generador de PDF los descarga desde el mismo origen y los embebe. Si fallan, cae a Helvetica en lugar de romperse.
- **Datos del usuario**: todo el CV vive en el `localStorage` del navegador. Borrar los datos del sitio elimina el CV guardado.
- **Foto en el PDF**: la imagen se valida y comprime en el cliente (máx. 500 px, JPEG) y se inserta respetando su formato real (JPEG, PNG o WebP).
- **Calidad de código**: `npm run lint` (oxlint) debe reportar 0 errores; `npm run build` debe compilar sin fallos antes de desplegar.
