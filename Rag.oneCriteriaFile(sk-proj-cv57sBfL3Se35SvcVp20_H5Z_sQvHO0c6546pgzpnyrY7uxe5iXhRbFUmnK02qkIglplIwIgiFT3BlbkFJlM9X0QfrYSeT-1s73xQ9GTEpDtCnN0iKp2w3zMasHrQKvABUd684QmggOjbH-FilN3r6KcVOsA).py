import pyopencl as cl
import torch
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai.embeddings import OpenAIEmbeddings
import fitz 
from langchain.text_splitter import CharacterTextSplitter

# Open only PDF file( no Word)
pdf_file = "BGG - Y10 - 2024 T4.pdf"
doc = fitz.open(pdf_file)

text = ""
for page_num in range(doc.page_count):
    page = doc.load_page(page_num)
    text += page.get_text()


api_key = "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"

# Use API key
embeddings = OpenAIEmbeddings(openai_api_key=api_key)

# Make object SemanticChunker
text_splitter = SemanticChunker(
    embeddings,
    breakpoint_threshold_type="gradient", 
)

docs = text_splitter.create_documents([text])
print(docs[0].page_content)
