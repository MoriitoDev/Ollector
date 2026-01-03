# Wiku: Your AI Study Companion 🐾

<p align="center">
  <img src="/public/Wiku-banner.jpg" alt="Wiku Banner" width="100%">
  <br>
</p>

---

## ✨ What is Wiku?

**Wiku** is an artificial intelligence designed to be your unconditional support while you study. Inspired by the **lo-fi and cozy** aesthetic, Wiku is not just a technical tool; it's a learning environment designed to reduce stress and foster deep concentration.

Where once there were cold processes, now there is an experience guided by our mascot: a Yorkshire terrier ready to help you break down the toughest topics.

---

## 🚀 Key Features

* **📚 Friendly Explanations:** Wiku translates complex concepts into simple, easy-to-digest language.
* **🗣️ Natural Text-to-Speech:** Listen to Wiku's responses with high-quality neural voices (supports English and Spanish).
* **💬 Multi-Language Support:** Wiku automatically detects your language and responds accordingly (English/Spanish).
* **📄 PDF Analysis:** Upload study documents, and Wiku will answer questions based strictly on the content provided.
* **🎧 Focus Mode:** Interface designed to minimize distractions and maximize workflow.
* **📝 Smart Summaries:** Ability to synthesize large volumes of information into clear outlines.
* **🌱 Priority Organization:** Helps you decide where to start when you feel overwhelmed.

---

## 🛠️ Installation & Setup

### 1. Prerequisites
* Install the required dependencies:
    ```bash
    pip install fastapi uvicorn llama-cpp-python PyPDF2 python-multipart edge-tts
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

## 🤝 Contributions

Do you want to help make Wiku smarter or cozier? We'd love your help!

* Fork the project.

* Create a new Branch.

* Submit a Pull Request explaining your changes.

## 🎨 Branding & Credits

* **Model used**:  [Qwen2.5-3B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-72B-Instruct)
* **Qwen 2.5**: [Qwen2.5-72B-Instruct](https://huggingface.co/Qwen/Qwen2.5-72B-Instruct)
* **Llama cpp python**: [Github repository](https://github.com/abetlen/llama-cpp-python)

---

<p align=center>
  <b>Made with 🤎 for the studens community.
 </p>
