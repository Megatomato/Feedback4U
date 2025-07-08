from langchain_community.document_loaders import PyPDFLoader

file_path = './file/layout-parser-paper.pdf'
loader = PyPDFLoader(file_path)

pages = loader.load()

print(len(pages))
print(pages[0].page_content)
print(pages[0].metadata)