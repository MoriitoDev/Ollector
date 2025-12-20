import customtkinter as ctk
from tkinter import filedialog
import os
import ollama
from pypdf import PdfReader

# READ PDF AND GET AI RESPONSE

def read_pdf(file_path):
    if not os.path.exists(file_path):
        return None
    try:
        reader = PdfReader(file_path)
        text = [page.extract_text() for page in reader.pages if page.extract_text()]
        return "\n".join(text) if text else None
    except Exception as e:
        print(f"Error leyendo PDF: {e}")
        return None

def get_ai_response(prompt, pdf_content):
    """Envía una sola pregunta a Ollama y devuelve la respuesta"""
    try:
        response = ollama.chat(
            model="llama3.2",
            messages=[
                {"role": "system", "content": f"Eres un asistente experto. Responde basándote en este texto:\n{pdf_content}"},
                {"role": "user", "content": prompt}
            ],
            options={"temperature": 0.5}
        )   

        return response['message']['content']
    except Exception as e:
        return f"Error con Ollama: {str(e)}"

# INTERFACE

def select_file():
    file_path = filedialog.askopenfilename(
        title="Selecciona un archivo PDF",
        filetypes=[("PDF Files", "*.pdf")]
    )
    if file_path:
        show_file_path.configure(text=file_path, text_color="white")
        print(f"Archivo cargado: {file_path}")

def send_text():
    prompt = entry.get()
    file_path = show_file_path.cget("text")

    # Validaciones
    if not prompt or prompt == "Escribe tu duda aquí...":
        error_label.configure(text="Por favor, escribe una pregunta.")
        return
    
    if file_path == "No file selected" or not os.path.exists(file_path):
        error_label.configure(text="Primero selecciona un PDF válido.")
        return

    # Si todo está bien, procesamos
    error_label.configure(text="Ollama está pensando...", text_color="cyan")
    app.update_idletasks() # Actualiza la UI antes de la pausa de Ollama

    pdf_text = read_pdf(file_path)
    if pdf_text:
        response = get_ai_response(prompt, pdf_text)
        show_chat_response.configure(text=response)
        entry.delete(0, ctk.END)
        error_label.configure(text="Respuesta recibida", text_color="green")
    else:
        error_label.configure(text="No se pudo leer el PDF", text_color="red")

# UI

app = ctk.CTk()
app.geometry("900x900")
app.title("Notebook LM Local")
ctk.set_appearance_mode("dark")

# Título
title_label = ctk.CTkLabel(app, text="Notebook LM Local", font=("Arial", 20, "bold"))

# Respuesta del Chat (con Scroll para textos largos)
show_chat_response = ctk.CTkLabel(app, text="La respuesta aparecerá aquí...", 
                                  width=700, 
                                  height=500, wraplength=550, fg_color="#2b2b2b", corner_radius=10, font=("Arial", 20))



# Info del archivo
show_file_path = ctk.CTkLabel(app, text="No file selected", text_color="gray")


# Botón Selector
file_selector = ctk.CTkButton(app, text="📁 Seleccionar PDF", command=select_file, 
                              fg_color="#4CA0AF", hover_color="#4569a0")


# Entrada de texto
entry = ctk.CTkEntry(app, placeholder_text="Escribe tu duda aquí...", width=500, height=40)


# Botón Enviar
btn = ctk.CTkButton(app, text="Preguntar a la IA", command=send_text, width=200, height=40)


# Mensajes de estado/error
error_label = ctk.CTkLabel(app, text="", text_color="red")


# Packs
title_label.pack(pady=20)
show_chat_response.pack(pady=10, padx=20)
show_file_path.pack(pady=5)
entry.pack(pady=10)
file_selector.pack(pady=10)
btn.pack(pady=10)
error_label.pack(pady=10)

app.mainloop()