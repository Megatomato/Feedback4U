# RAG service Dockerfile
FROM python:3.10-slim

# Install build dependencies
RUN apt-get update && apt-get install -y g++ && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy RAG requirements and install them
COPY RAG/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire RAG code into the container
COPY RAG/ .

# Command to run the RAG API
CMD ["uvicorn", "rag_api:app", "--host", "0.0.0.0", "--port", "8082"]
