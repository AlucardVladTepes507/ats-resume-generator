from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pdfplumber
import io
import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

app = FastAPI(title="ATS Resume Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
                # If PDF text is empty (scanned PDF image), send PDF bytes to Gemini Vision directly
                is_image_file = True
                contents_payload = [
                    types.Part.from_bytes(data=content, mime_type="application/pdf"),
                    PROMPT_SCHEMA
                ]
        else:
            # Image file (JPG, PNG, WEBP)
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
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
