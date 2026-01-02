"use client";

import { useRef, ChangeEvent, useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { twilight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([]);

  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

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

    setIsLoading(true);
    const userQuestion = inputValue;
    setInputValue("");
    
    setChatHistory(prev => [...prev, 
      { role: 'user', content: userQuestion }, 
      { role: 'assistant', content: '' }
    ]);

    const formData = new FormData();
    formData.append("text", userQuestion);
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
        
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastIndex = newHistory.length - 1;
          newHistory[lastIndex] = { ...newHistory[lastIndex], content: newHistory[lastIndex].content + chunkValue };
          return newHistory;
        });
      }

    } catch (error) {
      console.error("Error conectando con Python:", error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error al conectar con el servidor." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-[#161616] text-white">

      <div className="flex flex-col items-center pt-12 pb-8 w-full max-w-3xl">
        <img src="/Wiku-logo.png" alt="Logo" className="bg-white size-20 rounded-full mb-4 shadow-xl" />
        <h1 className="text-xl font-semibold text-zinc-200">Wiku</h1>
      </div>

      <div className="w-full max-w-3xl px-6 pb-44 flex-1">
        {chatHistory.length > 0 ? (
          <div className="flex flex-col gap-10">
            {chatHistory.map((msg, index) => (
              msg.role === 'user' ? (
                <div key={index} className="flex justify-end">
                  <div className="bg-zinc-900 text-base p-3 rounded-lg border border-zinc-700 max-w-[80%]">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex justify-start animate-in fade-in duration-700">
                  <div className="prose prose-invert prose-zinc max-w-none w-full">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={twilight}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ background: '#0d0d0d', border: '1px solid #272727', borderRadius: '0.5rem' }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-zinc-500 italic">
            <p>Here you'll see the responses from the AI model.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center from-[#161616] via-[#161616]/95 to-transparent pt-10 pb-0">
        <div className="flex ">
          {fileName ? (
            <span className="flex bg-zinc-700 p-1.5 rounded-xl shadow-xl mb-2 w-fit items-center gap-2 mr-4 ">
              <img src="./doc.svg" alt="Document SVG" className="shrink-0 size-6 invert" /> {fileName}
            </span>
          ) : null}
        </div>

        <div className="w-full flex bg-[#161616] pb-3 pt-2 items-center justify-center">
          <div className="flex items-center w-11/12 max-w-3xl h-20 rounded-3xl bg-[#272727] px-4 shadow-2xl border border-zinc-800 focus-within:border-zinc-700 transition-all m-12 mt-0">
            <input
              type="text"
              placeholder="Write something"
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
        </div>
      </div>
    </main>
  );
}