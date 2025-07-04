import os
import sys
import argparse
import logging

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.RAG.database import ingest_file, ingest_reference_file
from backend.RAG.llm import generate_and_store_feedback

logging.basicConfig(level=logging.INFO)

def handle_upload_reference(args):
    """Handler for the 'upload-reference' command."""
    logging.info("Starting reference file ingestion...")
    ingest_reference_file(
        file_path=args.file,
        course_id=args.course,
        doc_type=args.doctype,
        chunker=args.chunker,
        embedder_name=args.embedder
    )
    logging.info("Reference file ingestion complete.")

def handle_get_feedback(args):
    """Handler for the 'get-feedback' command."""
    logging.info("Starting ingestion for feedback...")
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
        feedback = generate_and_store_feedback(
            student_id=args.student,
            assignment_id=args.assignment,
            course_id=args.course,
            qvec=qvec
        )
        logging.info("Feedback generation complete.")
        print("--- Generated Feedback ---")
        print(feedback)
        print("--------------------------")
    else:
        logging.error("Ingestion failed, skipping feedback generation.")


def main():
    parser = argparse.ArgumentParser(description="RAG system test script.")
    subparsers = parser.add_subparsers(dest="command", required=True, help="Available commands")

    # --- Sub-parser for uploading reference material ---
    parser_upload = subparsers.add_parser("upload-reference", help="Upload a reference document (e.g., rubric, exemplar).")
    parser_upload.add_argument("--file", required=True, help="Path to the reference PDF file.")
    parser_upload.add_argument("--course", required=True, help="Course ID, e.g. 'MATH101'.")
    parser_upload.add_argument("--doctype", required=True, help="Type of document (e.g., 'rubric', 'exemplar').")
    parser_upload.add_argument("--chunker", choices=["recursive", "semantic"], default="recursive", help="Chunking strategy.")
    parser_upload.add_argument("--embedder", choices=["openai", "gemini", "gitee"], default="gitee", help="Embedding model.")
    parser_upload.set_defaults(func=handle_upload_reference)

    # --- Sub-parser for getting feedback on an assignment ---
    parser_feedback = subparsers.add_parser("get-feedback", help="Upload an assignment and get feedback.")
    parser_feedback.add_argument("--file", required=True, help="Path to the assignment PDF file.")
    parser_feedback.add_argument("--student", required=True, help="Student ID.")
    parser_feedback.add_argument("--assignment", required=True, help="Assignment ID / name.")
    parser_feedback.add_argument("--course", required=True, help="Course ID, e.g. 'MATH101'.")
    parser_feedback.add_argument("--chunker", choices=["recursive", "semantic"], default="recursive", help="Chunking strategy.")
    parser_feedback.add_argument("--embedder", choices=["openai", "gemini", "gitee"], default="gitee", help="Embedding model.")
    parser_feedback.set_defaults(func=handle_get_feedback)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main() 