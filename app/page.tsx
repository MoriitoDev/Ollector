"use client";

import { useRef, ChangeEvent, useState } from "react";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resp, setResp] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  // Function to send data to the Python backend
  const sendToPython = async () => {
    if (!inputValue) return alert("Write some input...");

    setResp(""); 
    const formData = new FormData();
    formData.append("text", inputValue);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.body) throw new Error("No hay cuerpo en la respuesta");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const chunkValue = decoder.decode(value);

        setResp((prev) => prev + chunkValue);
      }
      
      setInputValue("");
    } catch (error) {
      console.error("Error conectando con Python:", error);
      setResp("Error al conectar con el servidor.");
    }
  };

  return (
    <main style={{ backgroundColor: '#161616' }} className="flex h-screen w-screen flex-col justify-center items-center text-white">
      <img src="/Ollama-Teacher.svg" alt="Logo" className="bg-white size-24 rounded-full mb-8" />

      <div className="w-11/12 h-fit mb-4 px-4">
        <p className="text-center whitespace-pre-wrap leading-relaxed">
          {resp}
        </p>
      </div>

      <div className="flex items-center m-5 w-9/12 h-28 rounded-3xl bg-[#272727] px-4 shadow-lg">
        <input 
          type="text" 
          placeholder="Write something..." 
          className="bg-transparent text-white text-left px-3 w-full outline-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendToPython()}
        />

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />

        <button onClick={handleButtonClick} type="button" className="shrink-0 size-10 bg-[#414040] rounded-full flex justify-center items-center hover:bg-white hover:text-black transition-all m-2">
          <img src="/add.svg" alt="Plus" className="size-5" />
        </button>

        <button 
          onClick={sendToPython}
          type="button" 
          className="shrink-0 size-10 bg-[#414040] rounded-full flex justify-center items-center hover:bg-white hover:text-black transition-all m-2"
        >
          <img src="/arrow.svg" alt="Enviar" className="size-5" />
        </button>
      </div>
      <p className="text-gray-400 text-xs">{fileName ? `Archivo cargado: ${fileName}` : "No files uploaded..."}</p>
    </main>
  );
}