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
Eres un experto analizador y transcriptor de currículums ATS. 
Analiza la información proporcionada (texto de PDF o foto/imagen de currículum impreso o manuscrito).
Tu trabajo es leerlo cuidadosamente y extraer la información en el siguiente formato JSON estricto.
Si el documento contiene texto escrito a mano o fotos de mala calidad, haz tu mejor esfuerzo por transcribir con precisión.
No devuelvas nada más que el JSON, sin bloques de código Markdown, solo el texto JSON puro.

Estructura JSON deseada:
{
    "personal_info": {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "summary": ""
    },
    "experience": [
        {
            "company": "",
            "position": "",
            "start_date": "",
            "end_date": "",
            "description": ["bullet 1", "bullet 2"]
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

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Generador de Currículums ATS"}

@app.post("/upload-pdf")
@app.post("/upload-file")
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

Oferta de empleo / Requisitos:
{payload.job_description}

Devuelve únicamente un objeto JSON estricto con el siguiente formato (sin markdown ni explicaciones fuera del json):
{{
    "score": 85,
    "matching_keywords": ["palabra o competencia 1", "palabra 2"],
    "missing_keywords": ["palabra relevante faltante 1", "palabra 2"],
    "recommendations": ["Recomendación específica 1 para adaptar el CV", "Recomendación 2"]
}}
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al analizar compatibilidad: {str(e)}")

@app.post("/enhance-bullet")
async def enhance_bullet(payload: EnhanceBulletRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un redactor experto en currículums ATS de alto impacto.
Mejora la siguiente viñeta de experiencia laboral para la posición "{payload.position}":
"{payload.bullet}"

Devuelve un JSON estricto con 3 alternativas mejoradas usando métricas y lenguaje potente:
{{
    "suggestions": [
        "Alternativa 1 cuantificable y orientada a logros",
        "Alternativa 2 enfocada en competencias técnicas",
        "Alternativa 3 clara y directa para ATS"
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
async def generate_cover_letter(payload: CoverLetterRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un redactor profesional de cartas de presentación para puestos ejecutivos y técnicos.
Genera una Carta de Presentación (Cover Letter) perspicaz y adaptada a la empresa y empleo especificados.

Datos del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Empresa: {payload.company_name or "la empresa"}
Puesto: {payload.position_name or "la vacante de interés"}
Descripción/Requisitos del Empleo: {payload.job_description or "Postulación general"}

Devuelve un JSON estricto:
{{
    "subject": "Asunto sugerido para la candidatura",
    "cover_letter": "Texto completo de la carta de presentación con párrafos bien estructurados (saludo formal, introducción motivadora, resaltado de logros relevantes del candidato y cierre invitando a una entrevista)."
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
async def translate_resume(payload: TranslateResumeRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    target_lang = "inglés" if payload.target_language == "en" else "español"
    try:
        prompt = f"""
Traduce profesionalmente la información del siguiente currículum al idioma {target_lang}.
Mantén la terminología técnica correcta, nombres de empresas y fechas sin alterar la estructura JSON.

Estructura JSON a traducir:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Devuelve únicamente el objeto JSON traducido estricto.
        """

        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt]
        )
        cleaned = clean_json_response(response.text)
        translated_data = json.loads(cleaned)
        translated_data["language"] = payload.target_lang
        return translated_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al traducir el CV: {str(e)}")

class OutreachRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: Optional[str] = ""
    company_name: Optional[str] = ""
    position_name: Optional[str] = ""
    recruiter_name: Optional[str] = ""

class InterviewPrepRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: str

@app.post("/generate-outreach-message")
async def generate_outreach_message(payload: OutreachRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un estratega de reclutamiento y marcas personales en LinkedIn.
Genera mensajes directos de contacto (Outreach Messages) para que el candidato le escriba al reclutador o líder del área.

Datos del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Empresa: {payload.company_name or "la empresa"}
Puesto: {payload.position_name or "la vacante de interés"}
Nombre del Reclutador/Contacto: {payload.recruiter_name or "Responsable de Selección"}
Descripción del Empleo: {payload.job_description or ""}

Devuelve un JSON estricto:
{{
    "linkedin_dm": "Mensaje ultra-efectivo para mensaje privado de LinkedIn (menos de 280 caracteres, directo, profesional y con gancho).",
    "cold_email_subject": "Asunto atractivo para correo directo",
    "cold_email_body": "Cuerpo del correo formal de 2 párrafos destacando las coincidencias clave del candidato."
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
async def generate_interview_questions(payload: InterviewPrepRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        prompt = f"""
Eres un reclutador sénior realizando una preparación de entrevista laboral.
Analiza la trayectoria del candidato y la vacante para generar las 5 preguntas más probables y difíciles de la entrevista.

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Descripción del Empleo:
{payload.job_description}

Devuelve un JSON estricto con 5 preguntas estructuradas:
{{
    "questions": [
        {{
            "question": "Pregunta de entrevista clave 1",
            "why_they_ask": "Explicación de qué busca evaluar el reclutador",
            "star_strategy": "Estrategia para responder usando el método STAR (Situación, Tarea, Acción, Resultado) basada en la experiencia del candidato",
            "key_points": ["Punto clave a mencionar 1", "Punto clave 2"]
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

País objetivo: {payload.target_country}

Devuelve un JSON estricto:
{{
    "min_salary": "$1,200 / mes",
    "avg_salary": "$1,800 / mes",
    "max_salary": "$2,500 / mes",
    "market_insights": "Análisis del mercado laboral en {payload.target_country} para este perfil",
    "negotiation_tips": ["Consejo práctico de negociación 1", "Consejo 2"],
    "salary_boosters": ["Factor que aumenta tu valor en la negociación 1", "Factor 2"]
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)



