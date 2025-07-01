from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain.text_splitter import (
    CharacterTextSplitter,
    TokenTextSplitter,
    RecursiveCharacterTextSplitter,
)

file_path = '../../ragdb/training-data/feedback-data/[TEST] PSMT.pdf'
loader = PyPDFLoader(file_path)

pages = loader.load()

print(len(pages))
print(pages[0].page_content)
print(pages[0].metadata)


recursive_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=20,
    separators=["\n\n", "\n", ".", " ", ""]
)


chunks = recursive_splitter.split_documents(pages)
with open('log.txt', 'w') as f:
    f.write(str(chunks))