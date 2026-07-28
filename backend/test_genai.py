# pyrefly: ignore [missing-import]
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

client = genai.Client(api_key=api_key) if api_key else None

if client:
    try:
        models = client.models.list()
        for m in models:
            print("Model:", m.name)
    except Exception as e:
        print("Error:", e)
