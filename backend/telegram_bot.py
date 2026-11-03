import os
import sys
import json
import time
import subprocess
import urllib.request
import ssl
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Verified TLS context: the previous `ssl._create_unverified_context()` disabled
# certificate validation for every Telegram and Groq call.
SSL_CTX = ssl.create_default_context()


def get_allowed_chat_ids() -> set:
    """Allowlist of Telegram chat IDs allowed to use the bot.

    Without it, ANY Telegram user who found the bot could issue commands and
    spend the owner's AI credits. Configure TELEGRAM_ALLOWED_CHAT_IDS as a
    comma-separated list of numeric chat IDs; an empty list denies everyone.
    """
    raw = os.environ.get("TELEGRAM_ALLOWED_CHAT_IDS", "")
    allowed = set()
    for chunk in raw.split(","):
        chunk = chunk.strip()
        if chunk.lstrip("-").isdigit():
            allowed.add(int(chunk))
    return allowed


def is_allowed_chat(chat_id) -> bool:
    return int(chat_id) in get_allowed_chat_ids()

def telegram_api(method: str, params: dict = None) -> dict:
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{token}/{method}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(params or {}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Telegram API Error ({method}):", e)
        return {"ok": False, "error": str(e)}

def send_telegram_message(chat_id: int, text: str):
    return telegram_api("sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    })

def call_ai(prompt: str) -> str:
    groq_key = os.environ.get("GROQ_API_KEY") or GROQ_API_KEY
    if not groq_key:
        return "Error: GROQ_API_KEY no encontrada."

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "Eres el Asistente Admin IA de smart507 ATS Resume Generator. Responde de forma clara, ejecutiva y concisa en español con emojis."},
            {"role": "user", "content": prompt}
        ]
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=20) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error al procesar con IA: {e}"

def get_git_status() -> str:
    try:
        output = subprocess.check_output(["git", "log", "-1", "--oneline"], cwd=os.path.dirname(BASE_DIR)).decode("utf-8").strip()
        return output
    except Exception as e:
        return "No disponible"

def process_command(chat_id: int, user_text: str):
    text_lower = user_text.strip().lower()

    if text_lower in ["/start", "/help", "hola"]:
        msg = (
            "🤖 *Bienvenido al Panel de Control Admin en Telegram*\n\n"
            "Soy tu asistente IA para administrar *ATS Resume Generator* (smart507.com).\n\n"
            "📌 *Comandos Disponibles:*\n"
            "• `/status` : Ver estado de salud de la plataforma y último commit.\n"
            "• `/help` : Ver esta ayuda.\n"
            "• *Cualquier mensaje*: Escríbeme cualquier instrucción o consulta en texto y la procesaré al instante."
        )
        send_telegram_message(chat_id, msg)
        return

    if text_lower in ["/status", "/estado"]:
        last_commit = get_git_status()
        msg = (
            "🟢 *Estado del Sistema ATS Resume Generator*\n\n"
            "🌐 *Sitio Web:* https://cv.smart507.com/\n"
            "⚙️ *Backend:* Render (FastAPI + Groq Llama 3.3 70B)\n"
            "📦 *Último Despliegue:* `" + last_commit + "`\n"
            "⚡ *Estado Motor IA:* Groq (14,400 RPD Activo)"
        )
        send_telegram_message(chat_id, msg)
        return

    # Process natural language request via AI Assistant
    send_telegram_message(chat_id, "⏳ *Procesando tu instrucción con IA...*")
    ai_response = call_ai(user_text)
    send_telegram_message(chat_id, ai_response)

def start_bot_polling():
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    if not token:
        print("Telegram bot no iniciado: falta TELEGRAM_BOT_TOKEN.")
        return
    if not get_allowed_chat_ids():
        print("Telegram bot no iniciado: define TELEGRAM_ALLOWED_CHAT_IDS para autorizar tu chat.")
        return

    print("Telegram Bot Polling iniciado...")
    offset = 0
    while True:
        try:
            res = telegram_api("getUpdates", {"offset": offset, "timeout": 20})
            if res.get("ok"):
                for update in res.get("result", []):
                    offset = update["update_id"] + 1
                    message = update.get("message")
                    if message and "text" in message:
                        chat_id = message["chat"]["id"]
                        if not is_allowed_chat(chat_id):
                            print(f"Mensaje ignorado de chat no autorizado: {chat_id}")
                            continue
                        user_text = message["text"]
                        print(f"Mensaje recibido de {chat_id}: {user_text}")
                        process_command(chat_id, user_text)
        except Exception as e:
            err_str = str(e)
            if "409" in err_str:
                time.sleep(5)
            else:
                print("Notice en Polling loop:", err_str)
                time.sleep(3)

if __name__ == "__main__":
    start_bot_polling()
