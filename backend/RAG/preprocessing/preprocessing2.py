import os
import fitz
from dotenv import load_dotenv
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai.embeddings import OpenAIEmbeddings
from typing import List

def run(file_path: str) -> List[str]:
    """
    Extracts text from a PDF, chunks it semantically, and returns the chunks.
    """
    load_dotenv()
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not found in environment variables.")

    try:
        doc = fitz.open(file_path)
    except Exception as e:
        print(f"Error opening file {file_path}: {e}")
        return []
        
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()

    embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

    text_splitter = SemanticChunker(
        embeddings,
        breakpoint_threshold_type="gradient",
    )

    docs = text_splitter.create_documents([text])
    
    return [d.page_content for d in docs]

if __name__ == '__main__':
    pdf_file = "../../../ragdb/training-data/feedback-data/[TEST] PSMT.pdf"
    
    
    try:
        chunks = run(pdf_file)
        if chunks:
            print(f"Successfully created {len(chunks)} chunks.")
            print("First chunk:", chunks[0])
        
            # Write chunks to log2.txt
            with open('log2.txt', 'w') as f:
                f.write(str(chunks))
            print("Chunks written to log2.txt")

    except Exception as e:
        print(f"An error occurred: {e}")
