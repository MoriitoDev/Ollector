"use client";

import { useRef, ChangeEvent, useState, useEffect } from "react";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resp, setResp] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, [resp]);

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  const sendToPython = async () => {
    if (!inputValue) return;

    setResp("");
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-[#161616] text-white">

      <div className="flex flex-col items-center pt-12 pb-8 w-full max-w-3xl">
        <img src="/Ollama-Teacher.svg" alt="Logo" className="bg-white size-20 rounded-full mb-4 shadow-xl" />
        <h1 className="text-xl font-semibold text-zinc-200">Ollector</h1>
      </div>

      <div className="w-full max-w-3xl px-6 pb-44 flex-1">
        {resp ? (
          <div className="animate-in fade-in duration-700">
            <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-lg md:text-xl">
              {resp}
              {isLoading && <span className="animate-pulse ml-1 text-zinc-500">▎</span>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-zinc-500 italic">
            <p>Sube un PDF o haz una pregunta para comenzar...</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center bg-gradient-to-t from-[#161616] via-[#161616]/95 to-transparent pt-10 pb-6">
        
        <p className="text-zinc-500 text-xs mb-3 transition-opacity">
          {fileName ? `📄 ${fileName}` : "No files uploaded..."}
        </p>

        <div className="flex items-center w-11/12 max-w-3xl h-20 rounded-3xl bg-[#272727] px-4 shadow-2xl border border-zinc-800 focus-within:border-zinc-700 transition-all">
          <input 
            type="text" 
            placeholder="Escribe algo..." 
            className="bg-transparent text-white text-left px-3 w-full outline-none placeholder-zinc-600"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendToPython()}
          />

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />

          <div className="flex gap-2">
            <button 
              onClick={handleButtonClick} 
              disabled={isLoading}
              type="button" 
              className="shrink-0 size-11 bg-[#3a3a3a] rounded-full flex justify-center items-center hover:bg-zinc-200 hover:invert transition-all duration-300 disabled:opacity-30 disabled:hover:bg-[#3a3a3a] disabled:hover:invert-0"
            >
              <img src="/add.svg" alt="Plus" className="size-5" />
            </button>

            <button 
              onClick={sendToPython}
              disabled={isLoading || !inputValue}
              type="button" 
              className="shrink-0 size-11 bg-[#3a3a3a] rounded-full flex justify-center items-center hover:bg-zinc-200 hover:invert transition-all duration-300 disabled:opacity-30 disabled:hover:bg-[#3a3a3a] disabled:hover:invert-0"
            >
              <img src="/arrow.svg" alt="Enviar" className="size-5" />
            </button>
          </div>
        </div>
        
        <p className="mt-4 text-[10px] text-zinc-600">
          Powered by Ollama 3.2
        </p>
      </div>
      
    </main>
  );
}