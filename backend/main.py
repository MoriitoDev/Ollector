from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from Wiku import Wiku
import PyPDF2
import io
import edge_tts
import os
import json
import uuid
from datetime import datetime

app = FastAPI()

# ---- Simple JSON persistence for chat sessions ----
DATA_PATH = os.path.join(os.path.dirname(__file__), "chats.json")
sessions: dict[str, Wiku] = {}

def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"

def _load_store() -> dict:
    if not os.path.exists(DATA_PATH):
        return {"chats": []}
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"chats": []}

def _save_store(store: dict) -> None:
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(store, f, ensure_ascii=False, indent=2)

store = _load_store()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/chats")
async def list_chats():
    return JSONResponse({"chats": store.get("chats", [])})

@app.post("/api/chats")
async def create_chat():
    chat_id = str(uuid.uuid4())
    # Create Wiku runtime session
    sessions[chat_id] = Wiku(chat_id=chat_id)
    # Persist metadata
    meta = {
        "id": chat_id,
        "title": "New Chat",
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "messages": [],
        "pdf_attached": False
    }
    store["chats"].insert(0, meta)
    _save_store(store)
    return JSONResponse(meta)

@app.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str):
    meta = next((c for c in store.get("chats", []) if c["id"] == chat_id), None)
    if not meta:
        return JSONResponse({"error": "Chat not found"}, status_code=404)
    # If session not loaded yet, initialize it with persisted messages
    if chat_id not in sessions:
        w = Wiku(chat_id=chat_id)
        w.messages = meta.get("messages", [])
        sessions[chat_id] = w
    return JSONResponse(meta)

@app.post("/api/tts")
async def tts_endpoint(text: str = Form(...)):
    voice = "en-GB-SoniaNeural"
    # Simple heuristic to detect Spanish
    if any(char in text.lower() for char in ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿']):
        voice = "es-ES-XimenaNeural"
        
    communicate = edge_tts.Communicate(text, voice)
    
    async def audio_generator():
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]
                
    return StreamingResponse(audio_generator(), media_type="audio/mpeg")

@app.post("/api/reset")
async def reset_chat():
    # Resets are per-session in the new model; keep a global reset for compatibility
    sessions.clear()
    for c in store.get("chats", []):
        c["messages"] = []
        c["title"] = "New Chat"
        c["updated_at"] = _now_iso()
    _save_store(store)
    return {"message": "All chats reset successfully"}

@app.post("/api/chats/{chat_id}/message")
async def process_text(chat_id: str, text: str = Form(...), file: UploadFile = File(None)):
    print(f"[{chat_id}] Received from the frontend: {text}")
    pdf_text = ""

    # Ensure session exists
    w = sessions.get(chat_id)
    if not w:
        # Try to hydrate from store or create fresh
        w = Wiku(chat_id=chat_id)
        meta = next((c for c in store.get("chats", []) if c["id"] == chat_id), None)
        if meta:
            w.messages = meta.get("messages", [])
        sessions[chat_id] = w

    if file:
        print("Reading the pdf file.")
        pdf_bytes = await file.read()
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            pdf_text += page.extract_text()
        w.set_pdf(pdf_text)

    async def stream_and_persist():
        full_resp = ""
        # Pre-persist user message to store
        meta = next((c for c in store.get("chats", []) if c["id"] == chat_id), None)
        if meta:
            meta["messages"].append({"role": "user", "content": text})
            meta["updated_at"] = _now_iso()
            if file:
                meta["pdf_attached"] = True
            # Title: first user message snippet
            if meta["title"] == "New Chat":
                meta["title"] = (text[:50] + ("…" if len(text) > 50 else ""))
            _save_store(store)

        for chunk in w.get_ai_response(text):
            full_resp += chunk
            yield chunk

        # After streaming completes, persist assistant message and runtime state
        if meta:
            # Ensure runtime messages reflect persisted
            meta["messages"] = w.messages
            meta["updated_at"] = _now_iso()
            _save_store(store)

    return StreamingResponse(stream_and_persist(), media_type="text/plain")
