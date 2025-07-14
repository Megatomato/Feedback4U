import os, sys
import logging
import fitz  # PyMuPDF
from dotenv import load_dotenv
from typing import List
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import ProgrammingError
import pgvector.sqlalchemy
from sqlalchemy import (
    create_engine,
    Column,
    BigInteger,
    Integer,
    Text,
    MetaData,
    select,
    insert,
    DECIMAL,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
import pgvector.sqlalchemy
from .preprocessing.preprocessing import run as recursive_chunker
from sqlalchemy import text as sqltext


# # Embedding providers
# Always import the OpenAI implementation – tests patch the *origin* library path.
from langchain_openai import OpenAIEmbeddings
from .gitee_embeddings import GiteeAIEmbeddings
# from langchain_google_genai import GoogleGenerativeAIEmbeddings  # gemini

# Import the HuggingFace implementation **only if** it has not been monkey-patched already.
# This allows pytest mocks like `@patch('backend.RAG.database.HuggingFaceEmbeddings')` to
# survive an `importlib.reload(database)` that the test suite performs. Without the guard
# the reload would overwrite the mock with the real class, leading to network calls when
# the model initialises and ultimately to the failing OSError observed in the tests.
if "HuggingFaceEmbeddings" not in globals():
    from langchain_huggingface import HuggingFaceEmbeddings

# ---------------------------------------------------------------------
load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
GITEE_API_KEY = os.getenv("GITEE_API_KEY")


Base = declarative_base(metadata=MetaData())


class ReferenceChunk(Base):
    __tablename__ = "reference_chunks"
    id = Column(BigInteger, primary_key=True)
    assignment_id = Column(Text, nullable=False)
    doc_type = Column(Text, nullable=False)
    heading_path = Column(Text)
    content = Column(Text, nullable=False)
    embedding = Column(pgvector.sqlalchemy.Vector(), nullable=False)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(BigInteger, primary_key=True)
    student_id = Column(Text, nullable=False)
    assignment_id = Column(Text, nullable=False)
    course_id = Column(Text, nullable=False)
    data = Column(Text, nullable=False)


# New Statistics Schema Models
class StudentStatistic(Base):
    __tablename__ = "student_statistics"
    student_id = Column(Integer, primary_key=True)
    total_submissions = Column(Integer, default=0)
    average_grade_overall = Column(DECIMAL(5, 2))
    last_updated = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())


class SubjectGrade(Base):
    __tablename__ = "subject_grades"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("student_statistics.student_id", ondelete="CASCADE"))
    course_name = Column(String(255), nullable=False)
    grade = Column(DECIMAL(5, 2))
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint("student_id", "course_name", name="_student_course_uc"),)


class SubjectFeedback(Base):
    __tablename__ = "subject_feedback"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("student_statistics.student_id", ondelete="CASCADE"))
    course_name = Column(String(255), nullable=False)
    last_feedback = Column(Text)
    last_feedback_date = Column(DateTime(timezone=True))
    __table_args__ = (
        UniqueConstraint("student_id", "course_name", name="_student_course_feedback_uc"),
    )


class TeacherAnalytic(Base):
    __tablename__ = "teacher_analytics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    teacher_id = Column(Integer, nullable=False)
    course_name = Column(String(255), nullable=False)
    worst_marked_criteria = Column(JSONB)
    student_grade_distribution = Column(JSONB)
    last_updated = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint("teacher_id", "course_name", name="_teacher_course_uc"),)


def get_db_session():
    engine = create_engine(DB_URL)
    from sqlalchemy import text

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()


def update_student_submission_stats(student_id: int, course_name: str, grade: float):
    session = get_db_session()
    try:
        # Check if student exists, if not create one
        student_stat = session.query(StudentStatistic).filter_by(student_id=student_id).first()
        if not student_stat:
            student_stat = StudentStatistic(student_id=student_id, total_submissions=0)
            session.add(student_stat)
            session.flush()  # to get the id

        # Increment submissions
        student_stat.total_submissions += 1

        # Update subject grade
        subject_grade = (
            session.query(SubjectGrade)
            .filter_by(student_id=student_id, course_name=course_name)
            .first()
        )
        if not subject_grade:
            subject_grade = SubjectGrade(student_id=student_id, course_name=course_name)
            session.add(subject_grade)
        subject_grade.grade = grade

        session.commit()

        # Recalculate average grade
        grades = session.query(SubjectGrade.grade).filter_by(student_id=student_id).all()
        if grades:
            average = sum(g[0] for g in grades) / len(grades)
            student_stat.average_grade_overall = average

        session.commit()
    except Exception as e:
        session.rollback()
        logging.error(f"Error updating student stats: {e}")
        raise
    finally:
        session.close()


def update_subject_feedback(student_id: int, course_name: str, feedback: str):
    session = get_db_session()
    try:
        feedback_record = (
            session.query(SubjectFeedback)
            .filter_by(student_id=student_id, course_name=course_name)
            .first()
        )
        if not feedback_record:
            # Also ensure the student exists in student_statistics
            student_stat = session.query(StudentStatistic).filter_by(student_id=student_id).first()
            if not student_stat:
                student_stat = StudentStatistic(student_id=student_id)
                session.add(student_stat)

            feedback_record = SubjectFeedback(student_id=student_id, course_name=course_name)
            session.add(feedback_record)

        feedback_record.last_feedback = feedback
        feedback_record.last_feedback_date = func.now()
        session.commit()
    except Exception as e:
        session.rollback()
        logging.error(f"Error updating subject feedback: {e}")
        raise
    finally:
        session.close()


def update_teacher_analytics(
    teacher_id: int, course_name: str, worst_criteria: dict, grade_distribution: dict
):
    session = get_db_session()
    try:
        analytic_record = (
            session.query(TeacherAnalytic)
            .filter_by(teacher_id=teacher_id, course_name=course_name)
            .first()
        )
        if not analytic_record:
            analytic_record = TeacherAnalytic(teacher_id=teacher_id, course_name=course_name)
            session.add(analytic_record)

        analytic_record.worst_marked_criteria = worst_criteria
        analytic_record.student_grade_distribution = grade_distribution
        session.commit()
    except Exception as e:
        session.rollback()
        logging.error(f"Error updating teacher analytics: {e}")
        raise
    finally:
        session.close()


def get_student_statistics(student_id: int):
    session = get_db_session()
    try:
        stats = session.query(StudentStatistic).filter_by(student_id=student_id).first()
        if not stats:
            return None

        grades = session.query(SubjectGrade).filter_by(student_id=student_id).all()
        feedback = session.query(SubjectFeedback).filter_by(student_id=student_id).all()

        return {"statistics": stats, "grades": grades, "feedback": feedback}
    finally:
        session.close()


def get_teacher_analytics(teacher_id: int):
    session = get_db_session()
    try:
        analytics = session.query(TeacherAnalytic).filter_by(teacher_id=teacher_id).all()
        return analytics
    finally:
        session.close()


class EmbeddingModel:
    """Factory that hides vendor differences. Call .embed(texts: list[str])."""

    def __init__(self, provider: str):
        provider = provider.lower()
        self.provider = provider
        if provider == "openai":
            self.model = OpenAIEmbeddings(api_key=OPENAI_API_KEY, model="text-embedding-3-small")
            self.dimensions = 1536
        elif provider == "gemini":
            # self.model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY)
            raise NotImplementedError("No Gemini API key yet")
        elif provider == "gitee":
            self.model = GiteeAIEmbeddings()
        else:
            self.model = HuggingFaceEmbeddings(
                model_name="Qwen/Qwen3-Embedding-0.6B",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"batch_size": 8},
            )
            self.dimensions = 1024

    # unified API ------------------------------------------------------
    def embed(self, texts: List[str]) -> List[List[float]]:
        if hasattr(self.model, "embed_documents"):
            return self.model.embed_documents(texts)
        elif hasattr(self.model, "embed"):
            return self.model.embed(texts)
        else:
            return [self.model.embed_query(t) for t in texts]


def run_chunker(file_path: str, strategy: str) -> List[str]:
    if strategy == "recursive" and recursive_chunker:
        return recursive_chunker(file_path)
    if strategy == "semantic" and semantic_chunker:
        return semantic_chunker(file_path)


# ---------------------------------------------------------------------
# 4. Text extraction util (PDF only for brevity)
# ---------------------------------------------------------------------


def extract_text(file_path: str) -> str:
    with fitz.open(file_path) as doc:
        return "".join(page.get_text() for page in doc)


def clean_chunks(chunks: List[str]) -> List[str]:
    """Removes junk chunks and page headers/footers."""
    cleaned = []
    for chunk in chunks:
        # 1. Strip whitespace
        chunk = chunk.strip()
        # 2. Filter out chunks that are empty or very short
        if len(chunk) < 10:
            continue
        # 3. Filter out repetitive headers/footers
        lines = chunk.split("\n")
        if "general mathematics 2019 v1.2" in lines[0].lower():
            continue
        if "queensland curriculum & assessment authority" in chunk.lower():
            continue
        # 4. Filter out chunks that seem to be just metadata
        if chunk.startswith("Table of contents") or chunk.startswith("7 Appendixes"):
            continue
        cleaned.append(chunk)
    return cleaned


# ---------------------------------------------------------------------
# 5.  Helper: fetch top‑k with pgvector HNSW via text SQL
# ---------------------------------------------------------------------


def topk_reference_chunks(session, assignment_id: str, query_vec: List[float], k: int = 6):
    stmt = sqltext(
        """
        SELECT content
        FROM   reference_chunks
        WHERE  assignment_id = :aid
        ORDER  BY embedding <-> CAST(:qvec AS VECTOR)
        LIMIT  :limit;
        """
    )
    rows = session.execute(
        stmt, {"aid": assignment_id, "qvec": str(query_vec), "limit": k}
    ).fetchall()
    return [r[0] for r in rows]


def topk_rubric(
    session, assignment_id: str, query_vec: List[float], k: int = 4, doc_type: str = "rubric"
):
    stmt = sqltext(
        """
        SELECT content
        FROM   reference_chunks
        WHERE  assignment_id = :aid AND doc_type = :dtype
        ORDER  BY embedding <-> CAST(:qvec AS VECTOR)
        LIMIT  :limit;
        """
    )
    rows = session.execute(
        stmt, {"aid": assignment_id, "qvec": str(query_vec), "limit": k, "dtype": doc_type}
    ).fetchall()
    return [r[0] for r in rows]


def ingest_reference_file(
    file_path: str, assignment_id: str, doc_type: str, chunker: str, embedder_name: str
):
    # -- setup DB session
    engine = create_engine(DB_URL)

    with engine.begin() as conn:
        try:
            conn.execute(sqltext("CREATE EXTENSION IF NOT EXISTS vector"))
        except ProgrammingError:
            raise

    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    embedder = EmbeddingModel(embedder_name)
    splitter_texts: List[str] = run_chunker(file_path, chunker)
    if isinstance(splitter_texts, list) and isinstance(splitter_texts[0], str):
        chunks = splitter_texts
    else:  # preprocessing scripts might return list[dict]
        chunks = [c["content"] if isinstance(c, dict) else str(c) for c in splitter_texts]

    chunks = [chunk.replace("\x00", "") for chunk in chunks]
    vectors = embedder.embed(chunks)

    objects = [
        ReferenceChunk(assignment_id=assignment_id, doc_type=doc_type, content=txt, embedding=vec)
        for txt, vec in zip(chunks, vectors)
    ]

    with Session.begin() as session:
        session.bulk_save_objects(objects)

    logging.info("Reference ingestion complete for %s", file_path)
