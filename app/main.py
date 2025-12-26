#pip install python-multipart
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import ollama
import PyPDF2
import io

app = FastAPI()

# Functions
def get_ai_response(prompt, pdf_content):

    content = ""

    if pdf_content:
            content = (
            "You are a patient and professional teacher helping a student with their homework. "
            "You have been provided with a specific study document (PDF). "
            "STRICT RULE: Answer the student's questions using ONLY the information found in the provided text. "
            "If the answer is not in the text, politely tell the student that the document does not contain that information. "
            "Maintain an encouraging, educational, and clear tone. "
            f"\n\n--- START OF STUDY MATERIAL ---\n{pdf_content}\n--- END OF STUDY MATERIAL ---")
            print("PDF Detected")
            print(pdf_content)
    else:
            content = (
            "You are an inspiring and knowledgeable teacher. Your goal is to explain complex "
            "concepts in a way that is easy for students to understand. Use examples, analogies, "
            "and a supportive tone to help them learn."
        )
            print("No PDF detected...")


    try:
        response = ollama.chat(
            model="llama3.2",
            messages=[
                {"role": "system", "content": content},
                {"role": "user", "content": prompt}
            ],
            options={"temperature": 0.5}, # From 0 to 1, the higher the more creative
            stream=True,
        )   

        print("Ollama response started...")
        for chunk in response:
             yield chunk['message']['content']
             print(chunk['message']['content'])

    except Exception as e:
        return f"Error with Ollama: {str(e)}"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    text: str

@app.post("/api/chat")
async def process_text(text: str = Form(...), file: UploadFile = File(None)):
    print(f"Reciebed from the frontend: {text}")
    pdf_text = ""
    
    if file:
        #Read the file to convert it to bits and read it later with pypdf2
        print("Reading the pdf file.")
        pdf_bytes = await file.read()

        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)

        for page in reader.pages:
            pdf_text += page.extract_text();
    
    else:
         file = "";

    return StreamingResponse(
        get_ai_response(text, pdf_text), 
        media_type="text/event-stream"
    )