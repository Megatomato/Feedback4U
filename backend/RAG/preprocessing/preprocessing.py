from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List

def run(file_path: str) -> List[str]:
    """
    Loads a PDF, splits it into chunks using a recursive character splitter,
    and returns a list of the text content of those chunks.
    """
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    recursive_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=20,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    chunks = recursive_splitter.split_documents(pages)
    return [chunk.page_content for chunk in chunks]

if __name__ == '__main__':
    # For testing purposes
    # This path is relative to the `backend/RAG/preprocessing` directory.
    pdf_file = "../../../ragdb/training-data/feedback-data/[TEST] PSMT.pdf"
    
    try:
        chunks = run(pdf_file)
        if chunks:
            print(f"Successfully created {len(chunks)} chunks.")
            print("First chunk:", chunks[0])
        
            # Write chunks to log.txt
            with open('log.txt', 'w') as f:
                f.write(str(chunks))
            print("Chunks written to log.txt")

    except Exception as e:
        print(f"An error occurred: {e}")