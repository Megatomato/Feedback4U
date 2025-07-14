import os
import sys
import tempfile
import logging
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import uvicorn
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from rag_db import (
    ingest_reference_file,
    extract_text,
    EmbeddingModel,
    get_db_session as get_db,
)
from llm import generate_and_store_feedback
from statistics_api import router as statistics_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Feedback RAG API",
    description="API for interacting with the RAG backend for student feedback.",
    version="0.1.0",
)

app.include_router(statistics_router)

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Try to execute a simple query to check DB connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.post("/upload-reference/", summary="Upload a reference document")
async def upload_reference(
    file: UploadFile = File(..., description="The reference PDF file (e.g., rubric, exemplar)."),
    assignment_id: str = Form(..., description="Assignment ID, e.g. 'A1'."),
    doc_type: str = Form(..., description="Type of document (e.g., 'rubric', 'exemplar')."),
    chunker: str = Form(
        "recursive", enum=["recursive", "semantic"], description="Chunking strategy."
    ),
    embedder: str = Form(
        "gitee", enum=["openai", "gemini", "gitee"], description="Embedding model."
    ),
):
    """
    Uploads a reference document, processes it, and stores it in the vector database.
    This is used to provide context (like rubrics or exemplars) for feedback generation.
    """
    try:
        # Save uploaded file to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        logging.info(f"Processing reference file: {file.filename} for assignment {assignment_id}")
        ingest_reference_file(
            file_path=tmp_path,
            assignment_id=assignment_id,
            doc_type=doc_type,
            chunker=chunker,
            embedder_name=embedder,
        )

    except Exception as e:
        logging.error(f"Error processing reference file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if "tmp_path" in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {
        "message": f"Reference document '{file.filename}' uploaded successfully for assignment '{assignment_id}'."
    }


@app.post("/get-feedback/", summary="Get feedback for an assignment")
async def get_feedback(
    file: UploadFile = File(..., description="The assignment PDF file to get feedback on."),
    student_id: str = Form(..., description="Student ID."),
    assignment_id: str = Form(..., description="Assignment ID or name."),
    course_id: str = Form(..., description="Course ID, e.g. 'MATH101'."),
    embedder: str = Form(
        "gitee",
        enum=["openai", "gemini", "gitee"],
        description="Embedding model for document ingestion.",
    ),
    provider: str = Form(
        "gitee",
        enum=["openai", "gemini", "gitee", "deepseek"],
        description="LLM provider for feedback generation.",
    ),
):
    """
    Uploads a student's assignment, processes it, retrieves relevant context,
    generates feedback using an LLM, and stores it.
    """
    tmp_path = None
    try:
        # Save uploaded file to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # 1. Extract text from the assignment
        logging.info(f"Extracting text from assignment: {file.filename}")
        essay_text = extract_text(tmp_path)
        if not essay_text.strip():
            raise HTTPException(status_code=400, detail="The submitted document is empty.")

        # 2. Get a query vector for the whole essay
        logging.info("Creating a query vector for the essay.")
        embedder_model = EmbeddingModel(embedder)
        qvec = embedder_model.embed([essay_text])[0]

        if not qvec:
            raise HTTPException(
                status_code=500, detail="Failed to create a query vector for the essay."
            )

        # 3. Generate feedback
        logging.info("Generating feedback...")
        feedback_raw = generate_and_store_feedback(
            student_id=student_id,
            assignment_id=assignment_id,
            course_id=course_id,
            qvec=qvec,
            essay_text=essay_text,
            provider=provider,
        )

        # The feedback is stored as a JSON string in the DB, so we return it as such.
        # For a cleaner API, it might be better to parse and return a JSON object.
        # backend/RAG/rag_api.py

        try:
            feedback_dict = json.loads(feedback_raw)
        except json.JSONDecodeError:
            # fall back if the model produced plain text
            feedback_dict = {"feedback": feedback_raw, "grades": []}

        return JSONResponse(content=feedback_dict)

    except Exception as e:
        logging.error(f"Error getting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)
