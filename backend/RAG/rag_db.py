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


# # Embedding providers
# Always import the OpenAI implementation – tests patch the *origin* library path.
from langchain_openai import OpenAIEmbeddings
from backend.RAG.gitee_embeddings import GiteeAIEmbeddings
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

DB_URL          = os.getenv("DATABASE_URL")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY")
# GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
DEEPSEEK_API_KEY= os.getenv("DEEPSEEK_API_KEY")
GITEE_API_KEY = os.getenv("GITEE_API_KEY") 



Base = declarative_base(metadata=MetaData())

class AssignmentChunk(Base):
    __tablename__ = "assignment_chunks"
    id            = Column(BigInteger, primary_key=True)
    student_id    = Column(Text,  nullable=False)
    assignment_id = Column(Text,  nullable=False)
    course_id     = Column(Text,  nullable=False)
    chunk_no      = Column(Integer, nullable=False)
    content       = Column(Text, nullable=False)
    embedding     = Column(pgvector.sqlalchemy.Vector(), nullable=False)   # no argument

class ReferenceChunk(Base):
    __tablename__ = "reference_chunks"          
    id            = Column(BigInteger, primary_key=True)
    course_id     = Column(Text,  nullable=False)
    doc_type      = Column(Text,  nullable=False)  
    heading_path  = Column(Text)
    content       = Column(Text, nullable=False)
    embedding     = Column(pgvector.sqlalchemy.Vector(), nullable=False)

class Feedback(Base):
    __tablename__ = "feedback"
    id            = Column(BigInteger, primary_key=True)
    student_id    = Column(Text, nullable=False)
    assignment_id = Column(Text, nullable=False)
    course_id     = Column(Text, nullable=False)
    data          = Column(Text, nullable=False)   


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

def ingest_file(file_path: str, student_id: str, assignment_id: str, course_id: str,
                        chunker: str, embedder_name: str):
    # -- setup DB session
    engine  = create_engine(DB_URL)

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

    chunks = [chunk.replace('\x00', '') for chunk in chunks]
    vectors = embedder.embed(chunks)

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


def ingest_reference_file(file_path: str, course_id: str, doc_type: str,
                          chunker: str, embedder_name: str):
    # -- setup DB session
    engine  = create_engine(DB_URL)

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

    chunks = [chunk.replace('\x00', '') for chunk in chunks]
    vectors = embedder.embed(chunks)

    objects = [
        ReferenceChunk(course_id=course_id,
                       doc_type=doc_type,
                       content=txt,
                       embedding=vec)
        for txt, vec in zip(chunks, vectors)
    ]

    with Session.begin() as session:
        session.bulk_save_objects(objects)

    logging.info("Reference ingestion complete for %s", file_path)
