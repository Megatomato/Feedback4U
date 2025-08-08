import os
import sys
import json
import logging
import requests
from dotenv import load_dotenv
from openai import OpenAI
import google.generativeai as genai
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from rag_db import topk_rubric, topk_reference_chunks, Feedback

load_dotenv()
logging.basicConfig(level=logging.INFO)

DB_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
GITEE_API_KEY = os.getenv("GITEE_API_KEY")


class LLM:
    """Factory that hides vendor differences. Call .generate(messages: list[dict])."""

    def __init__(self, provider: str):
        provider = provider.lower()
        self.provider = provider
        if provider == "openai":
            self.client = OpenAI(api_key=OPENAI_API_KEY)
            self.model = "gpt-4.1"
        elif provider == "gemini":
            genai.configure(api_key=GEMINI_API_KEY)
            # Use Gemini 2.5 Pro (reasoning-capable)
            self.model = genai.GenerativeModel("gemini-2.5-pro")
        elif provider == "gitee":
            self.model = "Qwen3-235B-A22B"
            self.api_url = "https://ai.gitee.com/api/v1/chat/completions"
        elif provider == "deepseek":
            self.client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com/v1")
            self.model = "deepseek-reasoner"
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    def generate(self, messages: list[dict]) -> str:
        if self.provider == "openai" or self.provider == "deepseek":
            resp = self.client.chat.completions.create(
                model=self.model, messages=messages, temperature=0.2
            )
            return resp.choices[0].message.content
        elif self.provider == "gemini":
            # Gemini has a different message format
            gemini_messages = []
            system_prompt = ""
            for msg in messages:
                if msg["role"] == "system":
                    system_prompt = msg["content"]
                elif msg["role"] == "assistant":
                    gemini_messages.append({"role": "model", "parts": [msg["content"]]})
                else:
                    # Map non-assistant messages to user role per Gemini SDK expectations
                    gemini_messages.append({"role": "user", "parts": [msg["content"]]})

            generation_config = genai.types.GenerationConfig(temperature=0.2)

            # Older versions of google-generativeai do not support system_instruction.
            # Inline the system prompt as the first user message to preserve behavior.
            if system_prompt:
                gemini_messages = (
                    [{"role": "user", "parts": [system_prompt]}] + gemini_messages
                )

            response = self.model.generate_content(
                gemini_messages, generation_config=generation_config
            )
            return response.text
        elif self.provider == "gitee":
            headers = {
                "Authorization": f"Bearer {GITEE_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {"model": self.model, "messages": messages, "temperature": 0.2}
            resp = requests.post(self.api_url, json=payload, headers=headers, timeout=60)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]


def generate_and_store_feedback(
    student_id: str,
    assignment_id: str,
    course_id: str,
    qvec: list[float],
    essay_text: str,
    provider: str = "openai",
):
    engine = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)

    with Session.begin() as session:
        # quick retrieval for instant feedback
        rubric_ctx = topk_rubric(session, assignment_id, qvec, k=4)
        exemplar_ctx = topk_reference_chunks(session, assignment_id, qvec, k=6)

    prompt_file_path = os.path.join(os.path.dirname(__file__), "SYSTEM_PROMPT.txt")
    with open(prompt_file_path, "r") as f:
        SYSTEM_PROMPT = f.read().strip()

    ctx_block = (
        "[RUBRIC]\\n"
        + "\\n".join(rubric_ctx)
        + "\\n\\n[EXEMPLAR]\\n"
        + "\\n".join(exemplar_ctx)
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "assistant", "content": ctx_block},
        {
            "role": "user",
            "content": f"Provide holistic feedback and a mark out of 20 for the following essay:\\n\\n{essay_text}",
        },
    ]

    llm = LLM(provider)
    feedback_json = llm.generate(messages)

    with Session.begin() as session:
        session.add(
            Feedback(
                student_id=student_id,
                assignment_id=assignment_id,
                course_id=course_id,
                data=feedback_json,
            )
        )
    logging.info("Feedback stored successfully → %s", feedback_json[:80] + "…")

    return feedback_json
