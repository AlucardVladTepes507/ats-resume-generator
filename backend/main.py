from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uvicorn
import pdfplumber
import io
import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

def get_gemini_client():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Also try default load_dotenv
        load_dotenv(override=True)
        api_key = os.environ.get("GEMINI_API_KEY")
        
    if api_key:
        try:
            return genai.Client(api_key=api_key)
        except Exception as err:
            print("Error initializing Gemini client:", err)
    else:
        print("GEMINI_API_KEY not found in environment or .env path:", ENV_PATH)
    return None

app = FastAPI(title="ATS Resume Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobMatchRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: str

class EnhanceBulletRequest(BaseModel):
    bullet: str
    position: Optional[str] = ""

class CoverLetterRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: Optional[str] = ""
    company_name: Optional[str] = ""
    position_name: Optional[str] = ""

class TranslateResumeRequest(BaseModel):
    resume_data: Dict[str, Any]
    target_language: str = "en"

PROMPT_SCHEMA = """
Eres un experto analizador, corrector ortográfico y transcriptor de currículums ATS de nivel ejecutivo. 
Analiza la información proporcionada (texto de PDF o foto/imagen de currículum impreso o manuscrito).

Instrucciones de Procesamiento:
1. CORRECCIÓN AUTOMÁTICA DE ORTOGRAFÍA Y GRAMÁTICA: Revisa y corrige minuciosamente la redacción, tildes y gramática de todos los campos (resumen, cargos, logros, habilidades) en su idioma nativo (Español o Inglés).
2. GENERACIÓN AUTOMÁTICA DE PERFIL LINKEDIN: Basado en la experiencia laboral detectada, genera automáticamente un Titular optimizado con palabras clave y una sección "Acerca de" narrativa profesional en primera persona en el objeto `linkedin_profile`.
3. TRANSCRIBIR CON PRECISIÓN: Si el documento es escrito a mano o una foto, extrae con máxima exactitud los nombres, empresas y fechas.

Devuelve ÚNICAMENTE el JSON estricto:
{
    "personal_info": {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "summary": ""
    },
    "linkedin_profile": {
        "headline": "Titular de LinkedIn optimizado con palabras clave (máx 220 caract.)",
        "about": "Sección 'Acerca de' narrativa en primera persona, perspicaz y profesional"
    },
    "experience": [
        {
            "company": "",
            "position": "",
            "start_date": "",
            "end_date": "",
            "description": ["bullet 1 mejorado", "bullet 2 mejorado"]
        }
    ],
    "education": [
        {
            "institution": "",
            "degree": "",
            "start_date": "",
            "end_date": ""
        }
    ],
    "skills": ["skill 1", "skill 2"]
}
"""

def clean_json_response(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:-3].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:-3].strip()
    return cleaned

def sanitize_resume_data_for_prompt(resume_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        cleaned = json.loads(json.dumps(resume_data))
        if isinstance(cleaned, dict) and "personal_info" in cleaned:
            if isinstance(cleaned["personal_info"], dict):
                cleaned["personal_info"].pop("photo", None)
        return cleaned
    except Exception:
        return resume_data

@app.get("/")
@app.get("/health")
def read_root():
    return {
        "status": "online",
        "message": "Bienvenido a la API del Generador de Currículums ATS",
        "endpoints": [
            "/upload-file", "/analyze-job-match", "/enhance-bullet",
            "/generate-cover-letter", "/translate-resume", "/generate-outreach-message",
            "/generate-interview-questions", "/generate-linkedin-profile", "/estimate-salary",
            "/recommend-certifications", "/check-grammar", "/get-industry-keywords"
        ]
    }

@app.post("/upload-pdf")
@app.post("/upload-pdf/")
@app.post("/upload-file")
@app.post("/upload-file/")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp']
    
    ext = os.path.splitext(filename)[1]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail="Formato no soportado. Por favor sube un PDF o una foto en formato JPG, PNG o WEBP."
        )
    
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no está configurada en el servidor.")
        
    try:
        content = await file.read()
        is_image_file = ext in ['.png', '.jpg', '.jpeg', '.webp']
        
        contents_payload = []

        if ext == '.pdf':
            extracted_text = ""
            try:
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    for page in pdf.pages:
                        text = page.extract_text()
                        if text:
                            extracted_text += text + "\n"
            except Exception as pdf_err:
                print("Error extracting text with pdfplumber:", pdf_err)
                
            if extracted_text.strip():
                contents_payload = [f"{PROMPT_SCHEMA}\n\nTEXTO DEL CURRÍCULUM:\n{extracted_text}"]
            else:
                is_image_file = True
                contents_payload = [
                    types.Part.from_bytes(data=content, mime_type="application/pdf"),
                    PROMPT_SCHEMA
                ]
        else:
            mime_map = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp'
            }
            mime_type = mime_map.get(ext, 'image/jpeg')
            contents_payload = [
                types.Part.from_bytes(data=content, mime_type=mime_type),
                PROMPT_SCHEMA
            ]

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=contents_payload
        )
        
        response_text = clean_json_response(response.text)
            
        try:
            structured_data = json.loads(response_text)
        except json.JSONDecodeError:
            print("Error parsing JSON from Gemini:", response_text)
            raise HTTPException(status_code=500, detail="Gemini no devolvió un JSON válido.")
            
        return {
            "status": "success",
            "filename": file.filename,
            "is_image": is_image_file,
            "data": structured_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")

@app.post("/analyze-job-match")
@app.post("/analyze-job-match/")
async def analyze_job_match(payload: JobMatchRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un reclutador experto y sistema de filtrado ATS.
Compara el siguiente currículum con la oferta de empleo provista.

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Oferta de Empleo:
{payload.job_description}

Devuelve un JSON estricto:
{{
    "match_score": 85,
    "matching_keywords": ["habilidad 1", "habilidad 2"],
    "missing_keywords": ["habilidad faltante 1", "habilidad faltante 2"],
    "summary_feedback": "Resumen ejecutivo del ajuste del candidato",
    "recommendations": ["Recomendación 1", "Recomendación 2"]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al analizar vacante: {str(e)}")

@app.post("/enhance-bullet")
@app.post("/enhance-bullet/")
async def enhance_bullet(payload: EnhanceBulletRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un experto redactor de CVs ejecutivos para sistemas ATS.
Mejora y optimiza la siguiente viñeta o logro laboral utilizando verbos de acción fuertes y cuantificación de resultados.
Puesto del usuario: {payload.position or "Profesional"}
Viñeta original: "{payload.bullet}"

Devuelve un JSON estricto con 3 opciones mejoradas (Corta/Directa, Basada en Logros Cuantificables, Redacción Ejecutiva):
{{
    "suggestions": [
        "Opción mejorada 1 con verbos de acción",
        "Opción mejorada 2 con énfasis en logros e impacto",
        "Opción mejorada 3 de estilo ejecutivo superior"
    ]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al mejorar la viñeta: {str(e)}")

@app.post("/generate-cover-letter")
@app.post("/generate-cover-letter/")
async def generate_cover_letter(payload: CoverLetterRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un redactor profesional de cartas de presentación ejecutivas en español.
Genera una carta de presentación altamente persuasiva, profesional y personalizada basada en el CV del candidato.

Empresa objetivo: {payload.company_name or "Empresa Reclutadora"}
Puesto objetivo: {payload.position_name or "la posición vacante"}
Descripción del empleo (si aplica): {payload.job_description or "General"}

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Devuelve un JSON estricto:
{{
    "cover_letter": "Texto completo de la carta de presentación profesional organizada en párrafos de Introducción, Valor Aportado, Logros Relevantes y Cierre con llamada a la acción para entrevista."
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar la carta de presentación: {str(e)}")

@app.post("/translate-resume")
@app.post("/translate-resume/")
async def translate_resume(payload: TranslateResumeRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    target_lang_name = "Inglés (English)" if payload.target_language == "en" else "Español"

    try:
        prompt = f"""
Eres un traductor profesional de currículums ejecutivos y perfil ATS.
Traduce el siguiente objeto JSON de CV al idioma: {target_lang_name}.

Requisitos:
- Traduce los cargos (position), descripciones (description/bullets), resumen (summary), grados académicos (degree) e instituciones si corresponde.
- Conserva exactamente los nombres propios de las empresas y las fechas.
- Conserva exactamente las claves del JSON (personal_info, experience, education, skills, name, email, etc.).
- Devuelve el JSON marcado explícitamente con `"language": "{payload.target_language}"`.

CV a traducir:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Devuelve ÚNICAMENTE el JSON traducido estricto.
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al traducir el CV: {str(e)}")

class OutreachMessageRequest(BaseModel):
    resume_data: Dict[str, Any]
    target_company: Optional[str] = ""
    contact_role: Optional[str] = "Reclutador / Gerente de Selección"

class InterviewPrepRequest(BaseModel):
    resume_data: Dict[str, Any]
    target_position: Optional[str] = ""

@app.post("/generate-outreach-message")
@app.post("/generate-outreach-message/")
async def generate_outreach_message(payload: OutreachMessageRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un especialista en Networking Ejecutivo y Reclutamiento Directo.
Genera 2 mensajes de contacto directo ultra-efectivos para el candidato:

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Empresa objetivo: {payload.target_company or "Empresa Destacada"}
Contacto: {payload.contact_role}

Devuelve un JSON estricto con un mensaje para LinkedIn InMail/DM (corto y directo, máx 300 caract.) y un correo electrónico frío (Cold Email profesional con Asunto atractivo):
{{
    "linkedin_dm": "Hola [Nombre], vi tu perfil en LinkedIn...",
    "email_subject": "Propuesta de Valor / Candidatura - [Puesto/Área]",
    "email_body": "Estimado/a [Nombre],\n\nLe escribo con entusiasmo..."
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar mensajes de contacto: {str(e)}")

@app.post("/generate-interview-questions")
@app.post("/generate-interview-questions/")
async def generate_interview_questions(payload: InterviewPrepRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un entrevistador de talento senior y coach de entrevista laboral.
Analiza el CV del candidato para el puesto de: {payload.target_position or "su área profesional"}.

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Devuelve un JSON estricto con 5 preguntas clave de entrevista (conductuales, técnicas y situacionales) con la mejor estrategia de respuesta (Método STAR: Situación, Tarea, Acción, Resultado):
{{
    "questions": [
        {{
            "question": "¿Pregunta de entrevista 1?",
            "why_asked": "Por qué el reclutador hace esta pregunta",
            "star_strategy": "Estrategia de respuesta con método STAR basada en el CV del candidato",
            "key_points_to_mention": ["Punto clave 1", "Punto clave 2"]
        }}
    ]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar preguntas de entrevista: {str(e)}")

class LinkedInProfileRequest(BaseModel):
    resume_data: Dict[str, Any]
    target_position: Optional[str] = ""

class SalaryEstimateRequest(BaseModel):
    resume_data: Dict[str, Any]
    target_country: Optional[str] = "Panamá"

class CertificationsRequest(BaseModel):
    resume_data: Dict[str, Any]
    target_position: Optional[str] = ""

@app.post("/generate-linkedin-profile")
@app.post("/generate-linkedin-profile/")
async def generate_linkedin_profile(payload: LinkedInProfileRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un experto estratega de posicionamiento en LinkedIn y personal branding.
Crea un perfil optimizado de LinkedIn para el candidato basado en su CV:

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Puesto objetivo: {payload.target_position or "Profesional en su área"}

Devuelve un JSON estricto:
{{
    "headline": "Titular de LinkedIn altamente optimizado con palabras clave y propuesta de valor (máx 220 caract.)",
    "about_summary": "Sección 'Acerca de' (About Bio) narrativa en primera persona, perspicaz y profesional dividida en párrafos atractivos con emojis sutiles.",
    "featured_skills": ["Palabra clave / Habilidad 1", "Habilidad 2", "Habilidad 3", "Habilidad 4", "Habilidad 5"]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar perfil de LinkedIn: {str(e)}")

@app.post("/estimate-salary")
@app.post("/estimate-salary/")
async def estimate_salary(payload: SalaryEstimateRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un analista de compensaciones y salarios en RRHH para el mercado laboral internacional.
Estima el rango salarial mensual aproximado (en USD o moneda local según corresponda) para el perfil del candidato en {payload.target_country}.

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Devuelve un JSON estricto:
{{
    "country": "{payload.target_country}",
    "min_salary": "$1,200",
    "avg_salary": "$1,800",
    "max_salary": "$2,500",
    "currency": "USD",
    "market_insights": "Resumen ejecutivo de la demanda laboral de este perfil en {payload.target_country}",
    "negotiation_tips": ["Consejo de negociación 1", "Consejo 2"]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al estimar salario: {str(e)}")

@app.post("/recommend-certifications")
@app.post("/recommend-certifications/")
async def recommend_certifications(payload: CertificationsRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un mentor de carrera y desarrollo profesional tecnológico/ejecutivo.
Recomienda las 3 certificaciones de mayor ROI (Retorno de Inversión y aumento salarial) para el perfil del candidato:

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Puesto/Área de interés: {payload.target_position or "Su industria actual"}

Devuelve un JSON estricto con 3 certificaciones reconocidas mundialmente:
{{
    "certifications": [
        {{
            "name": "Nombre de la Certificación 1",
            "provider": "Institución o Proveedor (ej. AWS, Scrum Alliance, Google, Microsoft, PMP...)",
            "prep_time": "Tiempo aproximado de preparación (ej. 1 a 2 meses)",
            "salary_impact": "Impacto salarial estimado (ej. +20% a +35%)",
            "why_recommended": "Explicación de por qué esta certificación disparará las entrevistas del candidato"
        }}
    ]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al recomendar certificaciones: {str(e)}")

class GrammarCheckRequest(BaseModel):
    resume_data: Dict[str, Any]

class IndustryKeywordsRequest(BaseModel):
    industry: str
    target_role: Optional[str] = ""

@app.post("/check-grammar")
@app.post("/check-grammar/")
async def check_grammar(payload: GrammarCheckRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un editor ortográfico y gramatical profesional en español e inglés.
Revisa exhaustivamente la redacción, ortografía, tildes y sintaxis del siguiente currículum:

CV a revisar:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Devuelve un JSON estricto:
{{
    "total_errors": 2,
    "issues": [
        {{
            "section": "Experiencia - Empresa X",
            "original": "Texto original con error",
            "suggestion": "Texto corregido profesionalmente",
            "explanation": "Explicación breve del error (ej. Falta de tilde o concordancia)"
        }}
    ],
    "corrected_resume_data": {{ ...objeto resume_data completo con todos los textos ya corregidos... }}
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar ortografía: {str(e)}")

@app.post("/get-industry-keywords")
@app.post("/get-industry-keywords/")
async def get_industry_keywords(payload: IndustryKeywordsRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un reclutador experto en optimización ATS para la industria: {payload.industry}.
Genera un paquete de las 20 palabras clave y competencias técnicas/blandas de mayor demanda para este sector:

Industria: {payload.industry}
Puesto objetivo (opcional): {payload.target_role or "General"}

Devuelve un JSON estricto:
{{
    "industry": "{payload.industry}",
    "technical_keywords": ["Habilidad Técnica 1", "Habilidad Técnica 2", "Habilidad Técnica 3", "Habilidad Técnica 4", "Habilidad Técnica 5", "Habilidad 6", "Habilidad 7", "Habilidad 8"],
    "soft_keywords": ["Competencia Blanda 1", "Competencia 2", "Competencia 3", "Competencia 4"],
    "tools_and_certifications": ["Herramienta/Cert 1", "Herramienta 2", "Herramienta 3", "Herramienta 4"]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener palabras clave de industria: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
