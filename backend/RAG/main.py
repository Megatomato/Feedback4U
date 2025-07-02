import os
import sys
import argparse
import logging

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.RAG.database import ingest_file
from backend.RAG.llm import generate_and_store_feedback

logging.basicConfig(level=logging.INFO)

def main():
    parser = argparse.ArgumentParser(description="Upload assignment and generate immediate feedback")
    parser.add_argument("--file", required=True, help="Path to PDF assignment")
    parser.add_argument("--student", required=True, help="Student ID")
    parser.add_argument("--assignment", required=True, help="Assignment ID / name")
    parser.add_argument("--course", required=True, help="Course ID, e.g. BIO101")
    parser.add_argument("--chunker", choices=["recursive", "semantic"], default="recursive")
    parser.add_argument("--embedder", choices=["openai", "gemini", "qwen"], default="qwen")
    args = parser.parse_args()

    logging.info("Starting ingestion...")
    qvec = ingest_file(
        file_path=args.file,
        student_id=args.student,
        assignment_id=args.assignment,
        course_id=args.course,
        chunker=args.chunker,
        embedder_name=args.embedder,
    )

    if qvec:
        logging.info("Ingestion complete. Generating feedback...")
        generate_and_store_feedback(
            student_id=args.student,
            assignment_id=args.assignment,
            course_id=args.course,
            qvec=qvec
        )
        logging.info("Feedback generation complete.")
    else:
        logging.error("Ingestion failed, skipping feedback generation.")

if __name__ == "__main__":
    main() 