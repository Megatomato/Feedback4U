import os
import sys
import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from rag_db import ingest_file, ingest_reference_file
from llm import generate_and_store_feedback
from statistics_api import router as statistics_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Feedback RAG API",
    description="API for interacting with the RAG backend for student feedback.",
    version="0.1.0",
)

app.include_router(statistics_router)


@app.post("/upload-reference/", summary="Upload a reference document")
async def upload_reference(
    file: UploadFile = File(..., description="The reference PDF file (e.g., rubric, exemplar)."),
    course_id: str = Form(..., description="Course ID, e.g. 'MATH101'."),
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

        logging.info(f"Processing reference file: {file.filename} for course {course_id}")
        ingest_reference_file(
            file_path=tmp_path,
            course_id=course_id,
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
        "message": f"Reference document '{file.filename}' uploaded successfully for course '{course_id}'."
    }


@app.post("/get-feedback/", summary="Get feedback for an assignment")
async def get_feedback(
    file: UploadFile = File(..., description="The assignment PDF file to get feedback on."),
    student_id: str = Form(..., description="Student ID."),
    assignment_id: str = Form(..., description="Assignment ID or name."),
    course_id: str = Form(..., description="Course ID, e.g. 'MATH101'."),
    chunker: str = Form(
        "recursive", enum=["recursive", "semantic"], description="Chunking strategy."
    ),
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

        logging.info(f"Ingesting assignment: {file.filename} for student {student_id}")
        qvec = ingest_file(
            file_path=tmp_path,
            student_id=student_id,
            assignment_id=assignment_id,
            course_id=course_id,
            chunker=chunker,
            embedder_name=embedder,
        )

        if not qvec:
            raise HTTPException(
                status_code=500, detail="Failed to ingest file and get query vector."
            )

        logging.info("Ingestion complete. Generating feedback...")
        feedback_json = generate_and_store_feedback(
            student_id=student_id,
            assignment_id=assignment_id,
            course_id=course_id,
            qvec=qvec,
            provider=provider,
        )

        # The feedback is stored as a JSON string in the DB, so we return it as such.
        # For a cleaner API, it might be better to parse and return a JSON object.
        return JSONResponse(content={"feedback": feedback_json})

    except Exception as e:
        logging.error(f"Error getting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)
