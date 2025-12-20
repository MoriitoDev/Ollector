from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import ollama

app = FastAPI()

# Functions
def get_ai_response(prompt):
    try:
        response = ollama.chat(
            model="llama3.2",
            messages=[
                {"role": "system", "content": f"Eres un modelo de IA, responde a las preguntas que te van a ir haciendo."},
                {"role": "user", "content": prompt}
            ],
            options={"temperature": 0.5}
        )   

        return response['message']['content']
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
async def process_text(input_data: UserInput):
    print(f"Reciebed from the frontend: {input_data.text}")
    
    respuesta = f"Message processed: {input_data.text.upper()}"
    response = f"Ollama response: {get_ai_response(input_data.text)}"
    
    return {"status": "success", "response": response}