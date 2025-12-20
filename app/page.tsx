"use client";

//npm install -D tailwind-scrollbar-hide
import { useRef, ChangeEvent, useState } from "react";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [resp, setResp] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const sendToPython = async () => {
    if (!inputValue) return alert("Escribe algo primero");

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputValue }), 
      });

      const data = await response.json();
      //alert("Respuesta de servidor: " + data.response);
      setResp(data.response);
      setInputValue(""); 
    } catch (error) {
      console.error("Error conectando con Python:", error);
    }
  };

  return (
    <main style={{ backgroundColor: '#161616' }} className="flex h-screen w-screen flex-col justify-center items-center">
      <img src="/Ollama-Teacher.svg" alt="Logo" className="bg-white size-24 rounded-full mb-8" />

      <p className="w-11/12 h-auto text-center">
        {resp}
        </p>

      <div className="flex items-center m-5 w-9/12 h-28 rounded-3xl bg-[#272727] px-4">
        <input 
          type="text" 
          placeholder="Write something..." 
          className="bg-transparent text-white text-left px-3 w-full outline-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />

        <button onClick={handleButtonClick} type="button" className="shrink-0 size-10 bg-[#414040] rounded-full flex justify-center items-center hover:bg-white transition-all m-2">
          <img src="/add.svg" alt="Plus" className="size-5" />
        </button>

        <button 
          onClick={sendToPython}
          type="button" 
          className="shrink-0 size-10 bg-[#414040] rounded-full flex justify-center items-center hover:bg-white transition-all m-2"
        >
          <img src="/arrow.svg" alt="Enviar" className="size-5" />
        </button>
      </div>
      <p className="text-gray-400 text-xs">{fileName ? `Archivo: ${fileName}` : "No files uploaded..."}</p>
    </main>
  );
}