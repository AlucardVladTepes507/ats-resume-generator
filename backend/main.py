from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uvicorn
import pdfplumber
import io
import os
import json
import time
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

from PIL import Image

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

def compress_image_for_ai(image_bytes: bytes, max_dim: int = 1200, quality: int = 75) -> bytes:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert('RGB')
        
        w, h = img.size
        if w > max_dim or h > max_dim:
            if w > h:
                new_w = max_dim
                new_h = int(h * (max_dim / w))
            else:
                new_h = max_dim
                new_w = int(w * (max_dim / h))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=82, optimize=True)
        img.save(output, format='JPEG', quality=quality, optimize=True)
        return output.getvalue()
    except Exception as err:
        print("Image compression skipped:", err)
        return image_bytes

def get_all_gemini_clients():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    keys = []
    for key_name in ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEY_4"]:
        k = os.environ.get(key_name)
        if k and k not in keys:
            keys.append(k)
            
    clients = []
    for k in keys:
        try:
            clients.append(genai.Client(api_key=k))
        except Exception:
            pass
    return clients

def safe_generate_content(primary_client, contents):
    clients = get_all_gemini_clients()
    if not clients and primary_client:
        clients = [primary_client]
    elif not clients:
        clients = [primary_client] if primary_client else []

    models_to_try = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash']
    last_error = None

    for client_inst in clients:
        for model in models_to_try:
            try:
                response = client_inst.models.generate_content(
                    model=model,
                    contents=contents
                )
                return response
            except Exception as e:
                err_str = str(e)
                last_error = e
                print(f"Gemini model {model} notice:", err_str[:150])
                continue

    if last_error:
        err_msg = str(last_error)
        if any(k in err_msg for k in ["429", "RESOURCE_EXHAUSTED", "quota", "Quota"]):
            raise HTTPException(
                status_code=429,
                detail="Se ha alcanzado temporalmente el límite de velocidad por minuto de la IA. Por favor, espera unos segundos y vuelve a intentar."
            )
        elif any(k in err_msg for k in ["503", "UNAVAILABLE"]):
            raise HTTPException(
                status_code=503,
                detail="La Inteligencia Artificial está experimentando alta demanda. Por favor, reintenta en unos segundos."
            )
        raise HTTPException(status_code=400, detail="No se pudo procesar el documento con la IA. Por favor, reintenta en unos momentos.")

import requests

def call_groq_api(prompt: str, json_mode: bool = True) -> str:
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise Exception("GROQ_API_KEY not configured")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }

    models_to_try = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "groq/compound"]
    last_err = None

    for mod in models_to_try:
        payload = {
            "model": mod,
            "messages": [
                {"role": "system", "content": "You are an expert ATS resume generator and career assistant. Always output clean valid JSON when requested."},
                {"role": "user", "content": prompt}
            ]
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"]
            else:
                last_err = Exception(f"Groq {mod} status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            last_err = e
            continue

    raise last_err or Exception("All Groq models failed")

def safe_generate_text(prompt: str, json_mode: bool = True) -> str:
    # 1. Try Groq API first (Llama 3.3 70B - Lightning Fast, 14,400 RPD Free)
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            return call_groq_api(prompt, json_mode=json_mode)
        except Exception as groq_err:
            print("Groq API notice, falling back to Gemini:", groq_err)

    # 2. Fallback to Gemini AI if Groq fails or is not available
    primary_client = get_gemini_client()
    response = safe_generate_content(primary_client, [prompt])
    return response.text

def get_gemini_client():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
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

import threading
from telegram_bot import start_bot_polling

@app.on_event("startup")
def start_telegram_bot():
    try:
        threading.Thread(target=start_bot_polling, daemon=True).start()
        print("Telegram bot background thread launched successfully!")
    except Exception as e:
        print("Failed to launch Telegram bot thread:", e)

import base64

class JobImageExtractRequest(BaseModel):
    image_base64: str

class JobMatchRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: Optional[str] = ""
    image_base64: Optional[str] = None

class AutoOptimizeResumeRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: Optional[str] = ""
    missing_keywords: Optional[List[str]] = []

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
1. EXTRACCIÓN ESTRICTA Y PRIVACIDAD TOTAL: Extrae ÚNICAMENTE la información verídica y exacta que aparezca en el documento provisto (nombre, contacto, enlaces, experiencia, educación, habilidades). JAMÁS inventes nombres, correos ni datos de contacto o experiencia que no estén en el documento. Si un campo no existe en el documento del candidato, déjalo como string vacío ("") o lista vacía ([]).
2. CORRECCIÓN AUTOMÁTICA DE ORTOGRAFÍA Y GRAMÁTICA: Revisa y corrige minuciosamente la redacción, tildes y gramática de todos los campos extraídos del documento en su idioma original (Español o Inglés).
3. GENERACIÓN AUTOMÁTICA DE PERFIL LINKEDIN: Basado ÚNICAMENTE en la experiencia laboral y habilidades reales detectadas del candidato en su documento, genera automáticamente un Titular optimizado con palabras clave y una sección "Acerca de" narrativa profesional en primera persona en el objeto `linkedin_profile`.
4. TRANSCRIBIR CON PRECISIÓN: Si el documento es una foto o escaneo, extrae con máxima exactitud los nombres, empresas, cargos, logros y fechas reales.

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
        "headline": "Titular de LinkedIn optimizado con palabras clave del candidato",
        "about": "Sección 'Acerca de' narrativa en primera persona basada en el perfil del candidato"
    },
    "experience": [
        {
            "company": "",
            "position": "",
            "start_date": "",
            "end_date": "",
            "description": ["bullet 1 mejorado", "bullet 2 mejorado"]
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

def is_date_only_line(line_str: str) -> bool:
    cleaned = re.sub(r'^\s*([•\*\-\–\—\u2022\u25cf\u25cb\u25aa\u25ab]|\d+[\.\)])\s*', '', line_str).strip()
    date_tokens = r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Ene(?:ro)?|Feb(?:rero)?|Mar(?:zo)?|Abr(?:il)?|Mayo?|Jun(?:io)?|Jul(?:io)?|Ago(?:sto)?|Sep(?:tiembre)?|Oct(?:ubre)?|Nov(?:iembre)?|Dic(?:iembre)?|\d{1,2}/\d{2,4}|\d{4}|Presente|Present|Current|Actualidad|En curso|–|-|to|a|al|—|\s|,)'
    remainder = re.sub(date_tokens, '', cleaned, flags=re.IGNORECASE)
    return len(remainder.strip()) <= 3

def parse_extracted_text_fallback(text: str) -> Dict[str, Any]:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return {
            "personal_info": {"name": "", "email": "", "phone": "", "location": "", "linkedin": "", "summary": ""},
            "linkedin_profile": {"headline": "", "about": ""},
            "experience": [],
            "education": [],
            "skills": []
        }

    # 1. Candidate Name: first line that isn't a generic document title or contact
    name = ""
    for line in lines[:5]:
        clean_l = line.strip()
        upper_l = clean_l.upper()
        if upper_l in ["CURRICULUM VITAE", "CURRICULUM", "CV", "HOJA DE VIDA", "RESUME", "RESUMÉ"]:
            continue
        if "@" in clean_l or "HTTP" in upper_l or "LINKEDIN" in upper_l:
            continue
        if len(clean_l) > 2 and len(clean_l) < 50 and not re.search(r'\d{5,}', clean_l):
            name = clean_l
            break
    if not name and lines:
        name = lines[0]

    # 2. Candidate Email
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    email = email_match.group(0) if email_match else ""

    # 3. Candidate Phone
    phone_match = re.search(r'(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}', text)
    phone = phone_match.group(0) if phone_match else ""

    # 4. Candidate LinkedIn (Strictly candidate's own - NEVER hardcoded)
    linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)', text, re.IGNORECASE)
    linkedin = f"linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else ""

    # 5. Candidate Location (Strict: must not match sentences, job titles, or objectives)
    location = ""
    loc_labeled = re.search(r'(?:Ubicaci[oó]n|Location|Direcci[oó]n|Address|Ciudad|City)\s*[:\-]\s*([^\n|,]{2,35})', text, re.IGNORECASE)
    if loc_labeled:
        cand_loc = loc_labeled.group(1).strip()
        if len(cand_loc) < 35 and not any(w in cand_loc.lower() for w in ["looking", "seeking", "experience", "position", "analyst", "manager", "support", "trabajo", "puesto"]):
            location = cand_loc

    if not location:
        loc_match = re.search(r'\b(Ciudad de Panamá|Panamá|Panama|San José|Bogotá|Medellín|Lima|Santiago|Buenos Aires|Ciudad de México|Madrid|Barcelona|Miami,?\s*FL|New York,?\s*NY)\b', text, re.IGNORECASE)
        if loc_match:
            m_start = loc_match.start()
            prefix = text[max(0, m_start - 15):m_start].lower()
            if not any(w in prefix for w in ["hotel", "universidad", "banco", "empresa", "de "]):
                location = loc_match.group(0).strip()

    # 6. Objective / Professional Statement detection from top lines (e.g. "Looking for a job position in...")
    detected_objective = ""
    for line in lines[1:5]:
        lower_l = line.lower()
        if any(lower_l.startswith(w) for w in ["looking for", "seeking", "buscando", "objetivo:", "objective:", "profesional con", "professional with"]):
            clean_obj = re.sub(r'\|.*$', '', line).strip()
            clean_obj = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '', clean_obj).strip()
            clean_obj = re.sub(r'\+?[0-9\s\-\.\(\)]{8,20}', '', clean_obj).strip()
            clean_obj = clean_obj.strip(' |-,')
            if len(clean_obj) > 15:
                detected_objective = clean_obj
                break

    # Section Headers Mapping
    def get_section_type(line_str: str):
        u = line_str.strip().upper()
        u = re.sub(r'^[\s#\*\-—–:]+|[\s:\-—–]+$', '', u)
        if u in ["RESUMEN", "RESUMEN PROFESIONAL", "PERFIL", "PERFIL PROFESIONAL", "OBJETIVO", "OBJETIVO PROFESIONAL", "SUMMARY", "PROFESSIONAL SUMMARY", "EXECUTIVE SUMMARY", "PROFILE", "ABOUT ME", "CAREER OBJECTIVE"]:
            return "summary"
        if u in ["EXPERIENCIA", "EXPERIENCIA LABORAL", "EXPERIENCIA PROFESIONAL", "HISTORIAL LABORAL", "TRAYECTORIA LABORAL", "TRAYECTORIA PROFESIONAL", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT HISTORY", "WORK HISTORY", "CAREER HISTORY", "RELEVANT EXPERIENCE", "EXPERIENCE"]:
            return "experience"
        if u in ["EDUCACIÓN", "EDUCACION", "FORMACIÓN", "FORMACION", "FORMACIÓN ACADÉMICA", "FORMACION ACADEMICA", "ESTUDIOS", "ESTUDIOS REALIZADOS", "EDUCATION", "ACADEMIC BACKGROUND", "EDUCATIONAL BACKGROUND", "DEGREES"]:
            return "education"
        if u in ["HABILIDADES", "COMPETENCIAS", "HABILIDADES TÉCNICAS", "HABILIDADES TECNICAS", "CONOCIMIENTOS", "SKILLS", "KEY SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "AREAS OF EXPERTISE", "TOOLS", "HERRAMIENTAS"]:
            return "skills"
        if u in ["CERTIFICACIONES", "CERTIFICATIONS", "IDIOMAS", "LANGUAGES", "CURSOS", "COURSES", "REFERENCIAS", "REFERENCES"]:
            return "other"
        return None

    current_section = None
    sec_summary_lines = []
    experience_raw_blocks = []
    current_exp_block = []
    education_raw_blocks = []
    current_edu_block = []
    skills_lines = []

    for line in lines[1:]:
        clean_l = line.strip()
        if not clean_l:
            continue

        sec = get_section_type(clean_l)
        if sec:
            if current_exp_block:
                experience_raw_blocks.append(current_exp_block)
                current_exp_block = []
            if current_edu_block:
                education_raw_blocks.append(current_edu_block)
                current_edu_block = []
            current_section = sec
            continue

        if current_section == "summary":
            sec_summary_lines.append(clean_l)
        elif current_section == "experience":
            is_bullet = bool(re.match(r'^\s*([•\*\-\–\—\u2022\u25cf\u25cb\u25aa\u25ab]|\d+[\.\)])\s+', clean_l))
            date_only = is_date_only_line(clean_l)
            has_job_delimiter = bool(re.search(r'\s+[—–\|\-]\s+', clean_l)) and not is_bullet and not date_only

            if not is_bullet and not date_only and (has_job_delimiter or (clean_l.isupper() and len(clean_l) > 3)):
                if current_exp_block:
                    experience_raw_blocks.append(current_exp_block)
                    current_exp_block = []
            current_exp_block.append(clean_l)

        elif current_section == "education":
            date_only = is_date_only_line(clean_l)
            has_edu_delimiter = bool(re.search(r'\s+[—–\|\-]\s+', clean_l)) and not date_only
            if not date_only and (has_edu_delimiter or (clean_l.isupper() and len(clean_l) > 3)):
                if current_edu_block:
                    education_raw_blocks.append(current_edu_block)
                    current_edu_block = []
            current_edu_block.append(clean_l)

        elif current_section == "skills":
            skills_lines.append(clean_l)

    if current_exp_block:
        experience_raw_blocks.append(current_exp_block)
    if current_edu_block:
        education_raw_blocks.append(current_edu_block)

    summary_text = " ".join(sec_summary_lines).strip() or detected_objective

    # Parse Experience Blocks
    parsed_experiences = []
    for block in experience_raw_blocks:
        if not block:
            continue
        first_line = block[0]
        all_block_text = " ".join(block)

        date_pattern = r'\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)[a-z]*\.?\s*\d{4}|\d{4})\s*(?:–|-|to|a|al|—)\s*(Presente|Present|Current|Actualidad|En curso|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)[a-z]*\.?\s*\d{4}|\d{4})'
        date_match = re.search(date_pattern, all_block_text, re.IGNORECASE)

        start_date = ""
        end_date = ""
        if date_match:
            start_date = date_match.group(1).strip()
            end_date = date_match.group(2).strip()
        else:
            years = re.findall(r'\b(19\d\d|20\d\d)\b', all_block_text)
            if len(years) >= 2:
                start_date = years[0]
                end_date = years[1]
            elif len(years) == 1:
                start_date = years[0]
                end_date = "Presente" if any(w in all_block_text.lower() for w in ["present", "presente", "actualidad", "current"]) else years[0]

        clean_header = re.sub(date_pattern, '', first_line, flags=re.IGNORECASE).strip()
        clean_header = re.sub(r'[\(\[\{].*?[\)\]\}]', '', clean_header).strip()

        header_parts = re.split(r'\s+[—–\|\-]\s+', clean_header, maxsplit=1)
        if len(header_parts) == 2:
            company = header_parts[0].strip()
            position = header_parts[1].strip()
        else:
            at_parts = re.split(r'\s+(?:at|en)\s+', clean_header, flags=re.IGNORECASE, maxsplit=1)
            if len(at_parts) == 2:
                position = at_parts[0].strip()
                company = at_parts[1].strip()
            else:
                company = clean_header or "Empresa"
                position = block[1].strip() if len(block) > 1 and not is_date_only_line(block[1]) and not re.match(r'^\s*[•\*\-\–\—]', block[1]) else "Puesto"

        bullet_lines = []
        for l in block[1:]:
            if is_date_only_line(l):
                continue
            if l.strip() == position:
                continue
            cleaned_bullet = re.sub(r'^\s*([•\*\-\–\—\u2022\u25cf\u25cb\u25aa\u25ab]|\d+[\.\)])\s*', '', l).strip()
            if cleaned_bullet and len(cleaned_bullet) > 3:
                bullet_lines.append(cleaned_bullet)

        if not bullet_lines:
            bullet_lines = ["Responsabilidades y logros principales en el cargo."]

        parsed_experiences.append({
            "company": company,
            "position": position,
            "start_date": start_date or "Año",
            "end_date": end_date or "Presente",
            "description": bullet_lines,
            "bullets": bullet_lines
        })

    # Parse Education Blocks
    parsed_education = []
    for block in education_raw_blocks:
        if not block:
            continue
        first_line = block[0]
        all_block_text = " ".join(block)

        ed_years = re.findall(r'\b(19\d\d|20\d\d)\b', all_block_text)
        start_ed = ed_years[0] if len(ed_years) > 1 else ""
        end_ed = ed_years[-1] if ed_years else ""

        clean_header = re.sub(r'\b\d{4}\b', '', first_line).strip(' –-—,|')
        parts = re.split(r'\s+[—–\|\-]\s+', clean_header, maxsplit=1)
        inst = parts[0].strip() if len(parts) > 0 and parts[0].strip() else "Institución Educativa"
        deg = parts[1].strip() if len(parts) > 1 and parts[1].strip() else ""

        if not deg and len(block) > 1:
            for l in block[1:]:
                if not is_date_only_line(l):
                    deg = l.strip()
                    break

        parsed_education.append({
            "institution": inst,
            "degree": deg or "Título / Carrera",
            "start_date": start_ed,
            "end_date": end_ed
        })

    # Parse Skills
    raw_skills = " ".join(skills_lines).replace('•', ',').replace(';', ',').replace('|', ',')
    parsed_skills = [s.strip() for s in raw_skills.split(',') if len(s.strip()) > 1]
    seen = set()
    deduped_skills = [x for x in parsed_skills if not (x.lower() in seen or seen.add(x.lower()))]

    first_pos = parsed_experiences[0]["position"] if parsed_experiences else ""
    headline = f"{name} | {first_pos}" if name and first_pos else (name or "Profesional")

    return {
        "personal_info": {
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "linkedin": linkedin,
            "summary": summary_text
        },
        "linkedin_profile": {
            "headline": headline,
            "about": summary_text
        },
        "experience": parsed_experiences,
        "education": parsed_education,
        "skills": deduped_skills
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
        
    try:
        content = await file.read()
        
        is_pdf_file = (
            content.startswith(b'%PDF-') or 
            filename.endswith('.pdf') or 
            (file.content_type and 'pdf' in file.content_type.lower())
        )

        is_image_file = not is_pdf_file
        extracted_text = ""
        structured_data = None

        if is_pdf_file:
            try:
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    # 0. Check if this PDF was generated directly by our ATS Resume Generator app!
                    meta = getattr(pdf, 'metadata', None) or {}
                    creator_info = str(meta.get('Creator', '')) + str(meta.get('Author', ''))
                    if 'ATS Resume Generator' in creator_info or 'smart507' in creator_info:
                        subject = meta.get('Subject', '')
                        if subject:
                            try:
                                embedded_data = json.loads(subject)
                                if isinstance(embedded_data, dict) and 'personal_info' in embedded_data:
                                    if "experience" in embedded_data and isinstance(embedded_data["experience"], list):
                                        for exp in embedded_data["experience"]:
                                            desc = exp.get("description") or exp.get("bullets") or []
                                            if isinstance(desc, str):
                                                desc = [desc]
                                            exp["description"] = desc
                                            exp["bullets"] = desc
                                    return {
                                        "status": "success",
                                        "filename": file.filename,
                                        "is_image": False,
                                        "data": embedded_data
                                    }
                            except Exception as json_err:
                                print("Notice: Error parsing embedded app CV JSON:", json_err)

                    for page in pdf.pages:
                        text = page.extract_text()
                        if text and text.strip():
                            extracted_text += text + "\n"
                        else:
                            words = page.extract_words()
                            if words:
                                extracted_text += " ".join([w.get('text', '') for w in words if w.get('text')]) + "\n"
            except Exception as pdf_err:
                print("Error extracting text with pdfplumber:", pdf_err)

        if is_pdf_file and extracted_text.strip():
            # 1. High-speed extraction with Groq (ultra-fast, ~1-2s)
            groq_key = os.environ.get("GROQ_API_KEY")
            if groq_key:
                try:
                    groq_resp = call_groq_api(f"{PROMPT_SCHEMA}\n\nTEXTO DEL CURRÍCULUM:\n{extracted_text}", json_mode=True)
                    structured_data = json.loads(clean_json_response(groq_resp))
                except Exception as groq_err:
                    print("Groq fast parser notice, falling back to Gemini:", groq_err)

            # 2. Fallback to Gemini if Groq is unavailable or errored
            if not structured_data:
                client = get_gemini_client()
                if client:
                    try:
                        contents_payload = [f"{PROMPT_SCHEMA}\n\nTEXTO DEL CURRÍCULUM:\n{extracted_text}"]
                        response = safe_generate_content(client, contents_payload)
                        response_text = clean_json_response(response.text)
                        structured_data = json.loads(response_text)
                    except Exception as gemini_err:
                        print("Gemini PDF parsing notice, activating clean regex parser:", gemini_err)

            # 3. Final fallback for PDF text: clean regex parsing (strictly without hardcoded personal data)
            if not structured_data:
                structured_data = parse_extracted_text_fallback(extracted_text)

        else:
            # Scanned PDF or Image file: requires Vision AI
            # Keep is_image_file False for PDFs (only True for actual image uploads: .png, .jpg, .webp)
            is_image_file = not is_pdf_file
            client = get_gemini_client()
            if not client:
                raise HTTPException(
                    status_code=500, 
                    detail="GEMINI_API_KEY no está configurada en el servidor para analizar imágenes/fotos."
                )

            mime_map = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp'
            }
            mime_type = mime_map.get(ext, 'image/jpeg') if not is_pdf_file else 'application/pdf'
            compressed_bytes = compress_image_for_ai(content, max_dim=1200, quality=75)
            contents_payload = [
                types.Part.from_bytes(data=compressed_bytes, mime_type=mime_type),
                PROMPT_SCHEMA
            ]

            try:
                response = safe_generate_content(client, contents_payload)
                response_text = clean_json_response(response.text)
                structured_data = json.loads(response_text)
            except Exception as vision_err:
                print("Gemini Vision processing error:", vision_err)
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo procesar la imagen del currículum con la Inteligencia Artificial. Por favor, asegúrate de que la foto sea nítida y legible, o sube tu currículum en formato PDF."
                )

        # Ensure experience items have both 'bullets' and 'description' synchronized
        if structured_data and "experience" in structured_data and isinstance(structured_data["experience"], list):
            for exp in structured_data["experience"]:
                desc = exp.get("description") or exp.get("bullets") or []
                if isinstance(desc, str):
                    desc = [desc]
                exp["description"] = desc
                exp["bullets"] = desc

        return {
            "status": "success",
            "filename": file.filename,
            "is_image": is_image_file,
            "data": structured_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")


@app.post("/extract-job-image-text")
@app.post("/extract-job-image-text/")
async def extract_job_image_text(payload: JobImageExtractRequest):
    client = get_gemini_client()
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")
    
    try:
        encoded = payload.image_base64.split(",", 1)[-1] if "," in payload.image_base64 else payload.image_base64
        img_bytes = base64.b64decode(encoded)
        compressed_bytes = compress_image_for_ai(img_bytes)

        prompt = "Analiza la imagen provista con atención. ¿Esta foto o captura representa una oferta de trabajo, anuncio laboral, descripción de puesto o vacante de empleo? Si la imagen es la foto de una persona, niño, cara, paisaje, vehículo, factura, meme u objeto no relacionado con un anuncio de trabajo, responde ÚNICAMENTE con el código: ERROR_NOT_JOB_VACANCY. Si SÍ contiene una vacante de empleo, transcribe de forma limpia y exacta todo el texto visible (requisitos, funciones y competencias)."

        contents_payload = [
            types.Part.from_bytes(data=compressed_bytes, mime_type="image/jpeg"),
            prompt
        ]

        response = safe_generate_content(client, contents_payload)
        text_out = response.text.strip()

        if "ERROR_NOT_JOB_VACANCY" in text_out or len(text_out) < 20:
            raise HTTPException(
                status_code=400,
                detail="La imagen subida no parece ser una oferta de empleo válida (parece una foto personal u objeto). Por favor, sube una captura con los requisitos de un trabajo real."
            )

        return {"extracted_text": text_out}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al extraer texto de la imagen de vacante: {str(e)}")

@app.post("/analyze-job-match")
@app.post("/analyze-job-match/")
async def analyze_job_match(payload: JobMatchRequest):
    try:
        job_input = (payload.job_description or "").strip()

        # If an image base64 of job screenshot is provided, extract text via AI Vision
        if payload.image_base64:
            encoded = payload.image_base64.split(",", 1)[-1] if "," in payload.image_base64 else payload.image_base64
            img_bytes = base64.b64decode(encoded)
            compressed_bytes = compress_image_for_ai(img_bytes)
            ocr_prompt = "Analiza la imagen provista. Si es una foto personal, persona, objeto o NO es un anuncio de empleo, responde: ERROR_NOT_JOB_VACANCY. Si SÍ es una vacante, transcribe todo el texto de la oferta."
            client = get_gemini_client()
            if client:
                contents_payload = [
                    types.Part.from_bytes(data=compressed_bytes, mime_type="image/jpeg"),
                    ocr_prompt
                ]
                ocr_resp = safe_generate_content(client, contents_payload)
                ocr_text = ocr_resp.text.strip()
                if "ERROR_NOT_JOB_VACANCY" in ocr_text or len(ocr_text) < 20:
                    raise HTTPException(
                        status_code=400,
                        detail="La imagen subida no contiene una oferta de trabajo válida (parece una foto personal u objeto). Por favor, sube una foto con un anuncio de empleo real."
                    )
                if ocr_text:
                    job_input = (job_input + "\n\n" + ocr_text).strip()

        # If input looks like a URL, try fetching its content
        if job_input.startswith("http://") or job_input.startswith("https://"):
            try:
                import urllib.request
                req = urllib.request.Request(job_input, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='ignore')
                if BeautifulSoup:
                    soup = BeautifulSoup(html, 'html.parser')
                    for script_or_style in soup(["script", "style", "nav", "footer"]):
                        script_or_style.extract()
                    extracted_text = soup.get_text(separator=' ')
                else:
                    clean_text = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
                    clean_text = re.sub(r'<style.*?>.*?</style>', '', clean_text, flags=re.DOTALL | re.IGNORECASE)
                    extracted_text = re.sub(r'<[^>]+>', ' ', clean_text)
                lines = (line.strip() for line in extracted_text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                job_input = '\n'.join(chunk for chunk in chunks if chunk)[:4500]
            except Exception as url_err:
                print("URL fetch notice:", url_err)

        if not job_input or len(job_input.strip()) < 15:
            raise HTTPException(
                status_code=400,
                detail="El contenido o imagen ingresado no contiene suficiente información de una oferta de empleo. Por favor, ingresa los detalles de una vacante laboral real."
            )

        prompt = f"""
Eres un auditor estricto de reclutamiento ATS.
Paso 1: Evalúa si el 'Texto provisto para la Vacante' contiene una OFERTA DE EMPLEO O VACANTE LABORAL REAL (con descripción de puesto, requisitos o competencias).
Si el texto provisto es una foto personal, paisaje, documento aleatorio, receta, chat o no contiene requisitos laborales, establece `"is_valid_job": false` y `"match_score": 0`.

CV del candidato:
{json.dumps(payload.resume_data, ensure_ascii=False)}

Texto provisto para la Oferta de Empleo / Vacante:
{job_input}

Devuelve un JSON estricto:
{{
    "is_valid_job": true,
    "invalid_reason": "Si NO es una vacante laboral, explica amablemente qué contiene la foto/texto y por qué no es una oferta de trabajo.",
    "match_score": 85,
    "matching_keywords": ["habilidad 1", "habilidad 2"],
    "missing_keywords": ["habilidad faltante 1", "habilidad faltante 2"],
    "summary_feedback": "Resumen ejecutivo del ajuste del candidato",
    "recommendations": ["Recomendación 1", "Recomendación 2"]
}}
        """

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        parsed_res = json.loads(cleaned)

        if not parsed_res.get("is_valid_job", True) or parsed_res.get("match_score", 0) == 0:
            reason = parsed_res.get("invalid_reason") or "La imagen o texto ingresado no corresponde a una oferta de trabajo o vacante laboral válida."
            raise HTTPException(status_code=400, detail=reason)

        return parsed_res

    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Error al analizar vacante: {str(e)}")

@app.post("/auto-optimize-resume")
@app.post("/auto-optimize-resume/")
async def auto_optimize_resume(payload: AutoOptimizeResumeRequest):
    try:
        keywords_str = ", ".join(payload.missing_keywords or [])
        job_str = (payload.job_description or "")[:3000]

        prompt = f"""
Eres un redactor experto de CVs de alto nivel para sistemas de selección ATS.
Tu objetivo es optimizar el currículum provisto agregando de forma natural e inteligente las competencias y palabras clave faltantes de la vacante, sin inventar datos falsos de empresas o fechas.

Palabras clave faltantes a integrar prioritariamente:
{keywords_str}

Oferta laboral de referencia:
{job_str}

CV Actual en formato JSON:
{json.dumps(payload.resume_data, ensure_ascii=False)}

INSTRUCCIONES:
1. Mejora el perfil/resumen profesional (`personal_info.summary`) para alinearlo con el puesto y las palabras clave.
2. Añade las habilidades faltantes relevantes a la lista de `skills`.
3. Mejora las viñetas de `experience` integrando sutilmente palabras clave requeridas con verbos de acción fuertes.
4. Mantén intactos los nombres de personas, empresas, fechas y datos de contacto.
5. Devuelve ÚNICAMENTE la estructura JSON completa actualizada del CV con las mismas claves exactas: `personal_info`, `experience`, `education`, `skills`, `certifications`, `languages`, `projects`.

JSON Estricto del CV Optimizado:
"""

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        updated_resume = json.loads(cleaned)

        if "personal_info" not in updated_resume:
            updated_resume["personal_info"] = payload.resume_data.get("personal_info", {})
        if "experience" not in updated_resume:
            updated_resume["experience"] = payload.resume_data.get("experience", [])
        if "skills" not in updated_resume:
            updated_resume["skills"] = payload.resume_data.get("skills", [])

        return {"optimized_resume": updated_resume}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Error al auto-optimizar CV: {str(e)}")

@app.post("/enhance-bullet")
@app.post("/enhance-bullet/")
async def enhance_bullet(payload: EnhanceBulletRequest):
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al mejorar la viñeta: {str(e)}")

@app.post("/generate-cover-letter")
@app.post("/generate-cover-letter/")
async def generate_cover_letter(payload: CoverLetterRequest):
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar la carta de presentación: {str(e)}")

@app.post("/translate-resume")
@app.post("/translate-resume/")
async def translate_resume(payload: TranslateResumeRequest):
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar mensajes de contacto: {str(e)}")

@app.post("/generate-interview-questions")
@app.post("/generate-interview-questions/")
async def generate_interview_questions(payload: InterviewPrepRequest):
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar perfil de LinkedIn: {str(e)}")

@app.post("/estimate-salary")
@app.post("/estimate-salary/")
async def estimate_salary(payload: SalaryEstimateRequest):
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al estimar salario: {str(e)}")

@app.post("/recommend-certifications")
@app.post("/recommend-certifications/")
async def recommend_certifications(payload: CertificationsRequest):
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar ortografía: {str(e)}")

@app.post("/get-industry-keywords")
@app.post("/get-industry-keywords/")
async def get_industry_keywords(payload: IndustryKeywordsRequest):
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

        raw_text = safe_generate_text(prompt, json_mode=True)
        cleaned = clean_json_response(raw_text)
        return json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener palabras clave de industria: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
