import os
import sys
import logging
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.RAG.database import topk_rubric, topk_assignment, Feedback

load_dotenv()
logging.basicConfig(level=logging.INFO)

DB_URL = os.getenv("DATABASE_URL")

def generate_and_store_feedback(student_id: str, assignment_id: str, course_id: str, qvec: list[float]):
    engine = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)

    with Session.begin() as session:
        # quick retrieval for instant feedback
        rubric_ctx = topk_rubric(session, course_id, qvec, k=4)
        assign_ctx = topk_assignment(session, assignment_id, qvec, k=6)

    # ----- build prompt ------------------------------------------------
    SYSTEM_PROMPT = (
        "You are an AI marker. Use [RUBRIC] strictly to grade [ASSIGNMENT]. "
        "Return JSON: {'mark': int, 'strengths': str, 'weaknesses': str, 'advice': str}."
    )
    ctx_block = "[RUBRIC]\n" + "\n".join(rubric_ctx) + "\n\n[ASSIGNMENT]\n" + "\n".join(assign_ctx)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "assistant", "content": ctx_block},
        {"role": "user", "content": "Provide holistic feedback and a mark out of 20."},
    ]

    # ----- call LLM ----------------------------------------------------
    client = OpenAI()
    resp = client.chat.completions.create(model="gpt-4o-mini", messages=messages, temperature=0.2)
    feedback_json = resp.choices[0].message.content

    with Session.begin() as session:
        session.add(
            Feedback(student_id=student_id, assignment_id=assignment_id, course_id=course_id, data=feedback_json)
        )
    logging.info("Feedback stored successfully → %s", feedback_json[:80] + "…")

    return feedback_json 