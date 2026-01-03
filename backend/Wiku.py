from llama_cpp import Llama
import math

class Wiku:
    def __init__(self, chat_id: int) -> None:
        self.chat_id = chat_id
        self.messages = []
        self.current_pdf_content = None
        self.pdf_chunks = []
        self.pdf_embeddings = []

        self.llm = Llama.from_pretrained(
            repo_id="bartowski/Qwen2.5-3B-Instruct-GGUF",
            filename="Qwen2.5-3B-Instruct-Q4_K_M.gguf",
            verbose=False, # Change to True for debugging
            n_ctx=8192,
            chat_format="chatml",
            embedding=True
        )

    def _chunk_text(self, text: str, size: int = 1200, overlap: int = 200):
        chunks = []
        start = 0
        length = len(text)
        while start < length:
            end = min(start + size, length)
            chunks.append(text[start:end])
            if end == length:
                break
            start = max(0, end - overlap)
        return [c.strip() for c in chunks if c.strip()]

    def set_pdf(self, pdf_text: str):
        self.current_pdf_content = pdf_text
        self.pdf_chunks = self._chunk_text(pdf_text)
        self.pdf_embeddings = []
        try:
            for c in self.pdf_chunks:
                emb = self.llm.create_embedding(input=c)
                vec = emb["data"][0]["embedding"] if isinstance(emb, dict) else emb
                self.pdf_embeddings.append(vec)
        except Exception as e:
            print(f"Embedding error, falling back to non-RAG: {e}")
            self.pdf_embeddings = []

    def _cosine(self, a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        return dot / (na * nb + 1e-9)

    def get_ai_response(self, prompt):
        should_update_system = False
        
        if not self.messages:
            should_update_system = True

        if should_update_system:
            system_msg_content = (
                "You are an inspiring and knowledgeable teacher. Your goal is to explain complex "
                "concepts in a way that is easy for students to understand. Use examples, analogies, "
                "and a supportive tone to help them learn. "
                "STRICT RULE: You MUST respond in the SAME LANGUAGE as the user's question. If the user asks in Spanish, you answer in Spanish. "
                "If context excerpts are provided, use only that information to answer."
            )
            
            if self.messages and self.messages[0]['role'] == 'system':
                self.messages[0]['content'] = system_msg_content
            else:
                self.messages.insert(0, {"role": "system", "content": system_msg_content})

        user_prompt = prompt
        if self.pdf_chunks and self.pdf_embeddings:
            qemb = self.llm.create_embedding(input=prompt)
            qvec = qemb["data"][0]["embedding"] if isinstance(qemb, dict) else qemb
            sims = [(self._cosine(qvec, vec), idx) for idx, vec in enumerate(self.pdf_embeddings)]
            sims.sort(reverse=True)
            top = [self.pdf_chunks[i] for _, i in sims[:4]]
            ctx = "\n\n".join(top)
            user_prompt = (
                "Usa exclusivamente el siguiente contexto para responder. Si el contexto no contiene la respuesta, dilo de forma educada.\n\n"
                f"{ctx}\n\nPregunta: {prompt}"
            )

        self.messages.append({"role": "user", "content": user_prompt})

        response = self.llm.create_chat_completion(
            messages=self.messages,
            max_tokens=2048,
            stop=None,
            temperature=0.7,
            stream=True
        )

        full_response = ""
        for chunk in response:
            choices = chunk.get("choices", [])
            if choices:
                delta = choices[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    yield content 
                    full_response += content

        self.messages.append({"role": "assistant", "content": full_response})

    def reset_chat(self):
        self.messages = []
        self.current_pdf_content = None
        self.pdf_chunks = []
        self.pdf_embeddings = []
        self.first_message = True
        print("Chat history reset.")
