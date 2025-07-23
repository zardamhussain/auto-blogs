import uuid
from supabase import Client
from datetime import datetime
import pytz
import os
from openai import OpenAI
import google.generativeai as genai
from ..models.message import MessageIn, MessageOut
import re
from ..utils.timing import timing_decorator

def now_iso():
    return datetime.now(pytz.UTC).isoformat()

class CTAService:    
    def __init__(self, client: Client, user_id: uuid.UUID, chat_id: uuid.UUID | str | None = None):
        self.client = client

        res = client.table("users").select("*").eq("id", str(user_id)).execute()
        if not res.data:
            raise ValueError("User not found")
        self.user_id = user_id
        self.chat_id = chat_id if isinstance(chat_id, uuid.UUID) else (uuid.UUID(chat_id) if chat_id else self._create_new_chat())

        self.history: list[dict] = self._load_history(limit=1)

        self.openai_client = OpenAI(
            # This is the default and can be omitted
            api_key=os.environ.get("OPENAI_API_KEY"),
        )

        try:
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            if not gemini_api_key:
                raise ValueError("GEMINI_API_KEY must be set for Gemini API.")
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel("gemini-2.5-flash")
        except ValueError as e:
            print(f"Error initializing Gemini: {e}")
            self.gemini_model = None


        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(BASE_DIR, '..', 'prompt.txt')

        with open(prompt_path, 'r', encoding='utf-8') as f:
            self.prompt = f.read()

        

    def _create_new_chat(self) -> uuid.UUID:
        # Insert a new chat row; DB generates UUID via gen_random_uuid()
        res = self.client.table("chats") \
                   .insert({"user_id": str(self.user_id)}) \
                   .execute()
        new_id = uuid.UUID(res.data[0]["id"])
        return new_id

    @timing_decorator
    def add_message(self, sender: str, content: str, json_content = None):
        message = self.client.table("messages").insert({
            "chat_id": str(self.chat_id),
            "user_id": str(self.user_id),
            "sender": sender,
            "content": content,
            "json_content": json_content,
            "timestamp": now_iso()
        }).execute().data[0]

        if sender == "assistant":
            self.history = [message]

        return message


    def _load_history(self, limit: int = 5):
        res = (
            self.client.table("messages")
                .select("*")
                .eq("chat_id", str(self.chat_id))
                .eq("sender", "assistant")
                .order("timestamp", desc=True)
                .limit(1)
                .execute()
        )
        data = res.data or []

        # Reverse so they're oldest→newest
        return list(reversed(data))

    @timing_decorator
    def build_prompt(self, user_msg: str):

        messages = [{"role": "system", "content": self.prompt}]

        for m in self.history:
            role = "assistant" if m["sender"] != "user" else "user"
            messages.append({"role": role, "content": m["content"]})
        
        messages.append({"role": "user", "content": user_msg})
        
        return messages

    @timing_decorator
    def query_llm(self, prompt_messages: list[dict], model: str = "gpt-4o-mini") -> str:
        res = self.openai_client.chat.completions.create(model=model, messages=prompt_messages)
        return res.choices[0].message.content

    @timing_decorator
    def query_llm_gemini(self, prompt_messages: list[dict], model: str = "gemini-2.5-flash") -> str:
        if not self.gemini_model:
            raise ValueError("Gemini model not initialized.")
        # Convert messages to Gemini format (role mapping)
        gemini_messages = []
        for msg in prompt_messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_messages.append({"role": role, "parts": [msg["content"]]})

        response = self.gemini_model.generate_content(gemini_messages)
        return response.text

    @timing_decorator
    def _parse(self, bot_reply):
        html_match = re.search(r'```html\n(.*?)\n```', bot_reply, re.DOTALL)
        json_bot_reply = {}
        if html_match: 
            full_html_code = html_match.group(1)
            json_bot_reply['full_html'] = full_html_code
        return json_bot_reply

    @timing_decorator
    def handle_ai_chat(self, msg_in: MessageIn) -> MessageOut:
        self.add_message("user", msg_in.content)
        prompt = self.build_prompt(msg_in.content)

        # Use Gemini for faster response
        try:
            bot_reply = self.query_llm_gemini(prompt, model="gemini-2.5-flash")
        except ValueError as e:
            print(f"Gemini not available or error: {e}. Falling back to OpenAI.")
            bot_reply = self.query_llm(prompt)

        json_bot_reply = self._parse(bot_reply)

        bot = self.add_message("assistant", bot_reply, json_bot_reply)
        return MessageOut(**bot)

    