import os
import sys
import argparse
import logging

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from rag_db import ingest_reference_file
from llm import generate_and_store_feedback

logging.basicConfig(level=logging.INFO)


def handle_upload_reference(args):
    """Handler for the 'upload-reference' command."""
    logging.info("Starting reference file ingestion...")
    ingest_reference_file(
        file_path=args.file,
        assignment_id=args.assignment,
        doc_type=args.doctype,
        chunker=args.chunker,
        embedder_name=args.embedder,
    )
    logging.info("Reference file ingestion complete.")


def main():
    parser = argparse.ArgumentParser(description="RAG system test script.")
    subparsers = parser.add_subparsers(dest="command", required=True, help="Available commands")

    # --- Sub-parser for uploading reference material ---
    parser_upload = subparsers.add_parser(
        "upload-reference", help="Upload a reference document (e.g., rubric, exemplar)."
    )
    parser_upload.add_argument("--file", required=True, help="Path to the reference PDF file.")
    parser_upload.add_argument("--assignment", required=True, help="Assignment ID, e.g. 'A1'.")
    parser_upload.add_argument(
        "--doctype", required=True, help="Type of document (e.g., 'rubric', 'exemplar')."
    )
    parser_upload.add_argument(
        "--chunker",
        choices=["recursive", "semantic"],
        default="recursive",
        help="Chunking strategy.",
    )
    parser_upload.add_argument(
        "--embedder",
        choices=["openai", "gemini", "gitee"],
        default="gitee",
        help="Embedding model.",
    )
    parser_upload.set_defaults(func=handle_upload_reference)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
