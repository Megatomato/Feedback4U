import os
import requests
from typing import List


class GiteeAIEmbeddings:
    """Minimal embeddings wrapper for Gitee AI Serverless API.

    The class purposefully mirrors the subset of the interface used by
    LangChain's embedding classes so that it can act as a drop-in replacement
    inside our `EmbeddingModel` factory.

    Assumptions (adjust if the official spec is different):
    ----------------------------------------------------------------------
    • POST https://ai.gitee.com/api/v1/embeddings
      Payload :: {"model": <str>, "input": List[str]}
      Response :: {
          "data": [
              {"embedding": List[float], "index": 0},
              ...
          ]
      }
    • Maximum batch size is not documented - we conservatively batch in 64-item
      chunks. You can tune the constant `MAX_BATCH` below if needed.
    • Default model name is assumed to be an embedding-capable model that
      returns a 1 024-dimensional vector - change `DEFAULT_MODEL` otherwise.
    """

    DEFAULT_MODEL = "Qwen/Qwen3-Embedding-4B"
    API_URL = "https://ai.gitee.com/api/v1/embeddings"
    MAX_BATCH = 64

    def __init__(self, api_key: str | None = None, model: str | None = None):
        api_key = api_key or os.getenv("GITEE_API_KEY")
        if not api_key:
            raise ValueError("GITEE_API_KEY not set and api_key parameter missing")
        self.api_key = api_key
        self.model = model or self.DEFAULT_MODEL

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents, batching under the hood."""
        outs: List[List[float]] = []
        for i in range(0, len(texts), self.MAX_BATCH):
            batch = texts[i : i + self.MAX_BATCH]
            outs.extend(self._embed_batch(batch))
        return outs

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query string."""
        return self._embed_batch([text])[0]

    def _embed_batch(self, texts: List[str]) -> List[List[float]]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {"model": self.model, "input": texts}
        resp = requests.post(self.API_URL, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        # Expecting data["data"] list of {"embedding": [...], "index": i}
        return [item["embedding"] for item in data["data"]] 