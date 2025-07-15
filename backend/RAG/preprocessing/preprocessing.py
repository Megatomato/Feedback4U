import re
import json
import logging
from typing import List

from langchain_community.document_loaders import PyPDFLoader

# Configure logging
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

MAX_PARAGRAPH_SIZE = 400
MIN_PARAGRAPH_SIZE = 20

def clean_text(text: str) -> str:
    """
    Cleans text by removing noise, extra spaces, and non-printable characters.
    """
    text = text.replace("\xa0", " ").replace("\u2028", " ").replace("\u2029", " ")
    text = re.sub(r'Error! Bookmark not defined\.', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[.*?\]', '', text)  # Remove references like [TC1], [123], etc.
    text = re.sub(r'�', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = ''.join(c for c in text if c.isprintable())
    return text.strip()

def run(file_path: str) -> List[str]:
    """
    Loads a PDF, splits it into paragraphs, cleans them, and returns a list of valid paragraphs.
    """
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    processed_paragraphs = []

    for page_num, page in enumerate(pages):
        raw_text = clean_text(page.page_content)
        paragraphs = re.split(r'\n{2,}', raw_text)

        for i, para in enumerate(paragraphs):
            para = para.strip()

            if len(para) < MIN_PARAGRAPH_SIZE:
                logging.debug(f"Page {page_num}, Paragraph {i} skipped: too short ({len(para)} chars).")
                continue

            if len(para) > MAX_PARAGRAPH_SIZE:
                logging.debug(f"Page {page_num}, Paragraph {i} truncated from {len(para)} to {MAX_PARAGRAPH_SIZE} chars.")
                para = para[:MAX_PARAGRAPH_SIZE]

            try:
                para.encode("utf-8")
                json.dumps(para)
            except Exception as e:
                logging.warning(f"Page {page_num}, Paragraph {i} skipped: encoding/JSON error: {e}")
                continue

            processed_paragraphs.append(para)

    logging.info(f"Successfully created {len(processed_paragraphs)} clean paragraphs from {file_path}.")
    return processed_paragraphs

if __name__ == "__main__":
    # For testing purposes
    pdf_file = "../../../ragdb/training-data/feedback-data/[TEST] PSMT.pdf"

    try:
        paragraphs = run(pdf_file)
        if paragraphs:
            print(f"Successfully created {len(paragraphs)} paragraphs.")
            print("First paragraph:", paragraphs[0])

            with open("log.txt", "w", encoding="utf-8") as f:
                json.dump(paragraphs, f, ensure_ascii=False, indent=2)

            print("Paragraphs written to log.txt")
        else:
            print("No valid paragraphs were extracted.")

    except Exception as e:
        logging.error(f"An error occurred: {e}")
