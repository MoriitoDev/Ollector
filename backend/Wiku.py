from llama_cpp import Llama

class Wiku:
    def __init__(self, chat_id: int) -> None:
        self.chat_id = chat_id
        self.messages = []
        self.first_message = True

        self.llm = Llama.from_pretrained(
            repo_id="bartowski/Qwen2.5-3B-Instruct-GGUF",
            filename="Qwen2.5-3B-Instruct-Q4_K_M.gguf",
            verbose=False, # Change to True for debugging
            n_ctx=8192,
            chat_format="chatml"
        )

    def get_ai_response(self, prompt, pdf_content=""):
        if self.first_message:
            if pdf_content:
                system = (
                    "You are a patient and professional teacher helping a student with their homework. "
                    "You have been provided with a specific study document (PDF). "
                    "STRICT RULE: Answer the student's questions using ONLY the information found in the provided text. "
                    "STRICT RULE: Respond the student in the language they used to ask the question. "
                    "If the answer is not in the text, politely tell the student that the document does not contain that information. "
                    "Maintain an encouraging, educational, and clear tone. "
                    f"\n\n--- START OF STUDY MATERIAL ---\n{pdf_content}\n--- END OF STUDY MATERIAL ---"
                )
                print("PDF Detected and System Prompt set.")
            else:
                system = (
                    "You are an inspiring and knowledgeable teacher. Your goal is to explain complex "
                    "concepts in a way that is easy for students to understand. Use examples, analogies, "
                    "and a supportive tone to help them learn."
                )
                print("No PDF detected, Generic System Prompt set.")
            
            self.messages.append({"role": "system", "content": system})
            self.first_message = False

        #  Add the input from the user
        self.messages.append({"role": "user", "content": prompt})

        response = self.llm.create_chat_completion(
            messages=self.messages,
            max_tokens=512,
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

        # Add history of messages to the conversation
        self.messages.append({"role": "assistant", "content": full_response})
