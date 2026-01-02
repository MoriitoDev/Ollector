from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from Wiku import Wiku
import PyPDF2
import io
 
app = FastAPI()

# Initialize Wiku instance
chat = Wiku(chat_id=12345)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def process_text(text: str = Form(...), file: UploadFile = File(None)):
    print(f"Received from the frontend: {text}")
    pdf_text = ""
    
    if file:
        print("Reading the pdf file.")
        pdf_bytes = await file.read()
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            pdf_text += page.extract_text()
    
    return StreamingResponse(
        chat.get_ai_response(text, pdf_text), 
        media_type="text/plain"
    )