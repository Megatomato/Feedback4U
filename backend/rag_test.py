#!/usr/bin/env python
"""
rag_test.py
------------
Quick smoke-test for the RAG (Retrieval-Augmented Generation) text pipeline.

This script demonstrates:
  • Creating a Postgres table that stores raw text and its vector embedding.
  • Inserting a few sample documents (only if the table is empty).
  • Computing text embeddings with OpenAI (if an API key is available) or a deterministic fallback.
  • Performing a similarity search with pgvector using SQLAlchemy ORM.

Usage
-----
    python backend/rag_test.py [optional query string]

Environment variables expected
------------------------------
    DATABASE_URL     Postgres connection URL.
                     Defaults to "postgresql://postgres:postgres@localhost:5432/postgres".
    OPENAI_API_KEY   Your OpenAI key (optional – script falls back to pseudo-embeddings).

Dependencies
------------
    pip install sqlalchemy pgvector psycopg2-binary openai
"""

from __future__ import annotations

import os
import random
import sys
from typing import List

from sqlalchemy import Column, Integer, Text, create_engine, select
from sqlalchemy.orm import declarative_base, sessionmaker

# pgvector provides a custom Vector column type and distance helpers for SQLAlchemy
from pgvector.sqlalchemy import Vector

try:
    import openai  # type: ignore

    _OPENAI_AVAILABLE = True
except ImportError:  # pragma: no cover – fall back when "openai" isn't installed
    _OPENAI_AVAILABLE = False

# ---------------------------------------------------------------------------
# ORM model setup
# ---------------------------------------------------------------------------

Base = declarative_base()
EMBED_DIM = 1536  # Default dimensionality for OpenAI text-embedding-3-* models


class Document(Base):
    """A single text document with a pgvector embedding."""

    __tablename__ = "documents"

    id: int = Column(Integer, primary_key=True)
    content: str = Column(Text, nullable=False)
    embedding: List[float] = Column(Vector(EMBED_DIM))


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def get_embedding(text: str) -> List[float]:
    """Return an embedding for *text*.

    If the *openai* package is available **and** OPENAI_API_KEY is set, use
    ``text-embedding-3-small``. Otherwise, generate a deterministic pseudo-
    embedding so the rest of the pipeline can still be tested without hitting
    the API.
    """

    if _OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        response = openai.Embedding.create(
            input=[text],
            model="text-embedding-3-small",
        )
        return response["data"][0]["embedding"]  # type: ignore[index]

    # Fallback – deterministic but *not* meaningful.
    random.seed(hash(text) & 0xFFFFFFFF)
    return [random.random() for _ in range(EMBED_DIM)]


# ---------------------------------------------------------------------------
# Main workflow
# ---------------------------------------------------------------------------

def main() -> None:
    database_url = os.getenv(
        "DATABASE_URL", "postgresql+psycopg://rag_user:super_secure_pw@localhost:5432/rag_db"
    )

    engine = create_engine(database_url)
    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed with example documents if none exist yet.
    if session.query(Document).count() == 0:
        demo_texts = [
            "The quick brown fox jumps over the lazy dog.",
            "Retrieval-augmented generation combines language models with vector search.",
            "PostgreSQL with pgvector supports efficient similarity search.",
        ]
        for txt in demo_texts:
            session.add(Document(content=txt, embedding=get_embedding(txt)))
        session.commit()
        print("Inserted demo documents.\n")

    # Build query text from command-line arguments or use a default prompt.
    query_text = (
        " ".join(sys.argv[1:])
        if len(sys.argv) > 1
        else "How do language models retrieve similar documents?"
    )
    query_embedding = get_embedding(query_text)

    # Construct a similarity search using the cosine distance operator
    distance_expr = Document.embedding.cosine_distance(query_embedding)
    stmt = (
        select(Document, distance_expr.label("distance"))
        .order_by(distance_expr)
        .limit(5)
    )

    print(f"Query: {query_text}\nTop matches:\n")
    for doc, dist in session.execute(stmt):
        print(f"  • ({dist:.4f}) {doc.content}")


if __name__ == "__main__":
    main() 