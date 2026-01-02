# 🦙 Ollector: Your Personal AI Teacher

**Ollector** is an interactive learning platform that combines the local power of **Ollama** with a modern **Next.js** interface. It is designed to act as a patient, professional, and inspiring teacher that can analyze PDF documents and provide real-time explanations with a fluid typewriter effect.

<p align="center">
  <img src="/src-tauri/icons/Ollama-Teacher.ico" width="150" alt="Ollector Logo">
  <br>
  <i>"Inspired by Ollama, designed for scholars."</i>
</p>

---

## ✨ Key Features

* **Real-Time Streaming**: Responses are displayed word-by-word using *Server-Sent Events (SSE)*, creating a natural typewriter effect for a better user experience.
* **Document-Based Learning (RAG)**: Upload PDF study materials to transform Ollector into a specialized tutor that follows strict rules to answer using only the provided text.
* **Scholarly Identity**: The platform features a unique visual brand—a scholarly llama with glasses reading a book—to represent wisdom and academic support.
* **Educational Persona**: The AI maintains an encouraging, educational, and clear tone, symbolized by the studious character in the logo.
* **Privacy-First**: Powered by Ollama, all language processing happens locally on your machine.

---

## 🚀 Tech Stack

### Frontend
* **Next.js 15** (App Router)
* **Tailwind CSS** (Clean dark theme with hidden scrollbars)
* **TypeScript**

### Backend
* **Python 3.10+**
* **FastAPI** (High-performance streaming)
* **Ollama Python SDK** (Model: `llama3.2`)
* **PyPDF2** (PDF text extraction)

---

## 🛠️ Installation & Setup

### 1. Prerequisites
* Install [Ollama](https://ollama.com/) and download the model:
    ```bash
    ollama run llama3.2
    ```

* Install the required dependencies:
    ```bash
    pip install fastapi uvicorn ollama PyPDF2 python-multipart
    ```

### 2. Launching the app

1. Navigate to the ```/app``` folder.

1.  Start the FastAPI server:
    ```bash
    python -m uvicorn main:app --reload
    ```

2.  Install the packages:
    ```bash
    npm install
    ```
3.  Installing Rust (Required for Tauri)

    To run the Tauri development server, you need to have the Rust toolchain installed.

4.  Download Rust

    Visit the official installer page:

    ```bash
    https://rustup.rs
    ```
    Run the installer and accept the default options.

5.  Verify installation
    Restart your terminal and check that Rust is available:
    ```bash
    cargo --version
    ```

    If this command prints a version number (e.g. cargo 1.75.0), Rust is correctly installed.

6.  Run the development server:
    ```bash
    npx @tauri-apps/cli dev
    ```

---

## 📖 How to Use

1.  **General Chat**: Simply type your question in the input field. Ollector will explain concepts using analogies and a supportive tone.
2.  **Study Mode (PDF)**:
    * Click the **"+"** button to upload a PDF file.
    * Once uploaded, Ollector will use the document as its primary source of truth.
    * Ask questions about the specific content (e.g., "What are the main skills listed in this document?").

---

## 🎨 Branding & Credits

* **IA Engine**: Powered by [Ollama](https://ollama.com/).

---
