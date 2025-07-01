import os, sys
import logging
import fitz  # PyMuPDF
from dotenv import load_dotenv
from typing import List
from sqlalchemy import (
    create_engine, Column, BigInteger, Integer, Text, MetaData, select, insert
)
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import ProgrammingError
import pgvector.sqlalchemy
from backend.RAG.preprocessing.preprocessing2 import run as semantic_chunker
from backend.RAG.preprocessing.preprocessing import run as recursive_chunker
from sqlalchemy import text as sqltext


# Embedding providers
from langchain_openai import OpenAIEmbeddings
# from langchain_google_genai import GoogleGenerativeAIEmbeddings  # gemini
# from langchain_community.embeddings import DeepInfraEmbeddings    # deepseek (HF on DeepInfra)
from langchain.text_splitter import RecursiveCharacterTextSplitter

# ---------------------------------------------------------------------
load_dotenv()

DB_URL          = os.getenv("DATABASE_URL")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
DEEPSEEK_API_KEY= os.getenv("DEEPSEEK_API_KEY")


Base = declarative_base(metadata=MetaData())

class AssignmentChunk(Base):
    __tablename__ = "assignment_chunks"
    id            = Column(BigInteger, primary_key=True)
    student_id    = Column(Text,  nullable=False)
    assignment_id = Column(Text,  nullable=False)
    course_id     = Column(Text,  nullable=False)
    chunk_no      = Column(Integer, nullable=False)
    content       = Column(Text, nullable=False)
    embedding     = Column(pgvector.sqlalchemy.Vector(1536), nullable=False)

class ReferenceChunk(Base):
    __tablename__ = "reference_chunks"          
    id            = Column(BigInteger, primary_key=True)
    course_id     = Column(Text,  nullable=False)
    doc_type      = Column(Text,  nullable=False)  
    heading_path  = Column(Text)
    content       = Column(Text, nullable=False)
    embedding     = Column(pgvector.sqlalchemy.Vector(1536), nullable=False)

class Feedback(Base):
    __tablename__ = "feedback"
    id            = Column(BigInteger, primary_key=True)
    student_id    = Column(Text, nullable=False)
    assignment_id = Column(Text, nullable=False)
    course_id     = Column(Text, nullable=False)
    data          = Column(Text, nullable=False)   

# ---------------------------------------------------------------------
# 2. Embedding back‑end abstraction
# ---------------------------------------------------------------------
class EmbeddingModel:
    """Factory that hides vendor differences. Call .embed(texts: list[str])."""

    def __init__(self, provider: str):
        provider = provider.lower()
        self.provider = provider
        if provider == "openai":
            self.model      = OpenAIEmbeddings(api_key=OPENAI_API_KEY, model="text-embedding-3-small")
            self.dimensions = 1536
        elif provider == "gemini":
            # self.model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY)
            raise NotImplementedError("Gemini embeddings stubbed - install langchain-google-genai")
        elif provider == "deepseek":
            # Example model; adjust to your DeepSeek HF repo
            # self.model = DeepInfraEmbeddings(model_id="sentence-transformers/all-MiniLM-L6-v2", api_key=DEEPSEEK_API_KEY)
            raise NotImplementedError("DeepSeek embeddings stubbed - install deepinfra client")
        else:
            raise ValueError(f"Unknown embedder provider: {provider}")

    # unified API ------------------------------------------------------
    def embed(self, texts: List[str]) -> List[List[float]]:
        """Return list of vectors (batch‑friendly)."""
        if hasattr(self.model, "embed_documents"):
            return self.model.embed_documents(texts)
        elif hasattr(self.model, "embed"):
            return self.model.embed(texts)  # type: ignore
        else:  # fallback – embed one by one (slow)
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

# ---------------------------------------------------------------------
# 5.  Helper: fetch top‑k with pgvector HNSW via text SQL
# ---------------------------------------------------------------------



def topk_assignment(session, assignment_id: str, query_vec: List[float], k: int = 4):
    stmt = sqltext(
        """
        SELECT content
        FROM   assignment_chunks
        WHERE  assignment_id = :aid
        ORDER  BY embedding <-> CAST(:qvec AS VECTOR)
        LIMIT  :limit;
        """
    )
    rows = session.execute(stmt, {"aid": assignment_id, "qvec": str(query_vec), "limit": k}).fetchall()
    return [r[0] for r in rows]


def topk_rubric(session, course_id: str, query_vec: List[float], k: int = 4):
    stmt = sqltext(
        """
        SELECT content
        FROM   reference_chunks
        WHERE  course_id = :cid AND doc_type = 'rubric'
        ORDER  BY embedding <-> CAST(:qvec AS VECTOR)
        LIMIT  :limit;
        """
    )
    rows = session.execute(stmt, {"cid": course_id, "qvec": str(query_vec), "limit": k}).fetchall()
    return [r[0] for r in rows]

# ---------------------------------------------------------------------
# 6.  Main ingestion routine
# ---------------------------------------------------------------------

def ingest_file(file_path: str, student_id: str, assignment_id: str, course_id: str,
                        chunker: str, embedder_name: str):
    # -- setup DB session
    engine  = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)
    with Session.begin() as session:
        # ensure pgvector extension
        try:
            session.execute(sqltext('CREATE EXTENSION IF NOT EXISTS vector'))
        except ProgrammingError:
            session.rollback()
        Base.metadata.create_all(engine)

    embedder = EmbeddingModel(embedder_name)
    splitter_texts: List[str] = run_chunker(file_path, chunker)
    if isinstance(splitter_texts, list) and isinstance(splitter_texts[0], str):
        chunks = splitter_texts
    else:  # preprocessing scripts might return list[dict]
        chunks = [c["content"] if isinstance(c, dict) else str(c) for c in splitter_texts]

    vectors = embedder.embed(chunks)  # batch embedding

    objects = [
        AssignmentChunk(student_id=student_id,
                        assignment_id=assignment_id,
                        course_id=course_id,
                        chunk_no=i + 1,
                        content=txt,
                        embedding=vec)
        for i, (txt, vec) in enumerate(zip(chunks, vectors))
    ]

    with Session.begin() as session:
        session.bulk_save_objects(objects)

    logging.info("Ingestion complete for %s", file_path)
    return vectors[0] if vectors else None
