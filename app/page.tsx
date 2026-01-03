"use client";

import { useRef, ChangeEvent, useState, useEffect, type ReactNode } from "react";
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
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Array<{
    id: string,
    title: string,
    created_at: string,
    updated_at: string,
    messages: { role: string, content: string }[],
    pdf_attached: boolean
  }>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

  // Load chat list on mount and when sidebar opens
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/chats");
        const data = await res.json();
        setChats(data.chats || []);
      } catch (e) {
        console.error("Error loading chats:", e);
      }
    };
    fetchChats();
  }, []);

  const refreshChats = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/chats");
      const data = await res.json();
      setChats(data.chats || []);
    } catch (e) {
      console.error("Error refreshing chats:", e);
    }
  };

  const openChat = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/chats/${id}`);
      if (!res.ok) throw new Error("Chat not found");
      const meta = await res.json();
      setCurrentChatId(id);
      setChatHistory(meta.messages || []);
      setIsSidebarOpen(false);
      setFileName(null);
      setSelectedFile(null);
      setInputValue("");
    } catch (e) {
      console.error("Error opening chat:", e);
    }
  };

  const handleSpeak = async (text: string, index: number) => {
    if (speakingIndex === index) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setSpeakingIndex(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      setSpeakingIndex(index);

      try {
        const formData = new FormData();
        formData.append("text", text);
        
        const response = await fetch("http://localhost:8000/api/tts", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("TTS request failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.onended = () => {
          setSpeakingIndex(null);
          URL.revokeObjectURL(url);
        };
        
        await audio.play();
      } catch (error) {
        console.error("TTS Error:", error);
        setSpeakingIndex(null);
      }
    }
  };

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

    // Ensure a chat session exists
    let chatId = currentChatId;
    try {
      if (!chatId) {
        const createRes = await fetch("http://localhost:8000/api/chats", { method: "POST" });
        const meta = await createRes.json();
        chatId = meta.id;
        setCurrentChatId(chatId);
        // Refresh sidebar list
        refreshChats();
      }
    } catch (e) {
      console.error("Error creating chat:", e);
    }

    const formData = new FormData();
    formData.append("text", userQuestion);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      const response = await fetch(`http://localhost:8000/api/chats/${chatId}/message`, {
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
      // After completion refresh chat list to update title/updated_at
      refreshChats();

    } catch (error) {
      console.error("Error conectando con Python:", error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error al conectar con el servidor." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/chats", { method: "POST" });
      const meta = await res.json();
      setCurrentChatId(meta.id);
      setChatHistory([]);
      setFileName(null);
      setSelectedFile(null);
      setInputValue("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      refreshChats();
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-[#09090b] z-[70] border-r border-white/10 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-lg font-semibold text-zinc-200">History</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-zinc-800/50 mb-3 text-zinc-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </div>
                <p className="text-sm text-zinc-500">No chat history available</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {chats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openChat(c.id)}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg border border-white/10 hover:bg-zinc-800/50 transition-colors ${currentChatId === c.id ? "bg-zinc-800/40" : ""}`}
                    title={c.title}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
                      <span className="truncate text-sm text-zinc-300">{c.title}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">{new Date(c.updated_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="flex items-center justify-between py-4 px-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <img src="/sidebar.svg" alt="Sidebar" className="size-5 invert opacity-80" />
            </button>
            <div className="relative group cursor-default">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-700 to-zinc-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <img src="/Wiku-logo.png" alt="Logo" className="relative bg-black size-10 rounded-full shadow-lg border border-white/10" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-200">Wiku</h1>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 transition-all text-xs font-medium text-zinc-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            New Chat
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="w-full max-w-3xl px-4 pt-24 pb-48 flex-1">
        {chatHistory.length > 0 ? (
          <div className="flex flex-col gap-6">
            {chatHistory.map((msg, index) => (
              msg.role === 'user' ? (
                <div key={index} className="flex justify-end pl-12 animate-in slide-in-from-bottom-2 duration-300 fade-in">
                  <div className="bg-zinc-100 text-zinc-900 px-5 py-3.5 rounded-[20px] rounded-tr-sm shadow-sm max-w-full text-[15px] leading-relaxed font-medium">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex gap-4 justify-start animate-in fade-in duration-500 pr-8">
                  <div className="shrink-0 mt-1 flex flex-col gap-3 items-center">
                     <div className="size-8 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/10">
                        <img src="/Wiku-logo.png" className="size-5 opacity-90" alt="Bot" />
                     </div>
                     <button
                        onClick={() => handleSpeak(msg.content, index)}
                        className={`p-1.5 rounded-full transition-all duration-300 ${
                          speakingIndex === index 
                            ? "bg-zinc-700 text-white shadow-lg ring-1 ring-white/20" 
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                        title={speakingIndex === index ? "Stop speaking" : "Read aloud"}
                     >
                       {speakingIndex === index ? (
                         <div className="flex gap-0.5 items-end h-3 w-3 justify-center pb-0.5">
                           <div className="w-0.5 bg-current rounded-full animate-[music-bar_1s_ease-in-out_infinite] h-2"></div>
                           <div className="w-0.5 bg-current rounded-full animate-[music-bar_1s_ease-in-out_infinite_0.2s] h-3"></div>
                           <div className="w-0.5 bg-current rounded-full animate-[music-bar_1s_ease-in-out_infinite_0.4s] h-1.5"></div>
                         </div>
                       ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                       )}
                     </button>
                  </div>
                  <div className="prose prose-invert prose-zinc max-w-none w-full prose-p:leading-relaxed prose-pre:p-0 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={twilight}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ background: '#09090b', margin: 0, borderRadius: '0.75rem', fontSize: '0.875rem' }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-zinc-800/50 text-zinc-300 px-1.5 py-0.5 rounded-md font-mono text-sm border border-white/5" {...props}>
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
            {isLoading && (
              <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                  <div className="shrink-0 mt-1">
                     <div className="size-8 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/10">
                        <img src="/Wiku-logo.png" className="size-5 opacity-90 animate-pulse" alt="Bot" />
                     </div>
                  </div>
                  <div className="flex items-center gap-1 h-8">
                    <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                  </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
             <div className="relative mb-8">
                <div className="absolute -inset-4 bg-gradient-to-t from-zinc-800 to-zinc-900 rounded-full blur-xl opacity-20"></div>
                <img src="/Wiku-logo.png" alt="Logo" className="relative size-20 opacity-90 grayscale-[0.3]" />
             </div>
             <p className="text-lg font-medium text-zinc-400">How can I help you today?</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-20 pb-6 px-4 pointer-events-none">
        <div className="w-full max-w-3xl pointer-events-auto">
          
          {/* File Indicator */}
          {fileName && (
            <div className="flex justify-start mb-3 pl-2 animate-in slide-in-from-bottom-2 fade-in">
                <div className="flex items-center gap-2 bg-zinc-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 shadow-lg text-sm text-zinc-300">
                    <img src="./doc.svg" alt="File" className="size-4 invert opacity-70" />
                    <span className="max-w-[200px] truncate font-medium">{fileName}</span>
                    <button 
                        onClick={() => { 
                          setFileName(null); 
                          setSelectedFile(null); 
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }} 
                        className="ml-1 p-0.5 hover:bg-zinc-700 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 hover:opacity-100"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            </div>
          )}

          <div className="relative flex items-center gap-2 bg-[#121214] p-2 rounded-[2rem] shadow-2xl border border-white/5 ring-1 ring-white/5 focus-within:ring-zinc-600/50 focus-within:border-zinc-700 transition-all duration-300">
            <button
              onClick={handleButtonClick}
              disabled={isLoading}
              type="button"
              className="shrink-0 size-10 rounded-full flex justify-center items-center text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-200"
            >
              <img src="/add.svg" alt="Plus" className="size-5 opacity-50 hover:opacity-100 transition-opacity invert" />
            </button>
            
            <input
              type="text"
              placeholder="Message Wiku..."
              className="flex-1 bg-transparent text-white px-2 py-3 outline-none placeholder:text-zinc-600 text-[15px]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendToPython()}
            />
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
            
            <button
              onClick={sendToPython}
              disabled={isLoading || !inputValue}
              type="button"
              className="shrink-0 size-10 bg-white rounded-full flex justify-center items-center shadow-md hover:bg-zinc-200 transition-all duration-200 disabled:opacity-30 disabled:hover:bg-white disabled:shadow-none"
            >
               <img src="/arrow.svg" alt="Send" className="size-5" />
            </button>
          </div>
          
          <div className="text-center mt-3">
             <p className="text-[11px] text-zinc-600 font-medium">Wiku can make mistakes. Check important info.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
