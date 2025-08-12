## Overview
**Feedback4U** is a full‑stack platform for AI‑assisted, rubric‑aligned feedback between students and teachers. It ships with:
- A **FastAPI** backend (authentication, courses, assignments, submissions, feedback)
- A **React (CRA)** frontend (admin dashboard, auth, course/assignment views)
- An optional **RAG service** for chunking/embedding reference material and tracking analytics
- **Docker Compose** for one‑command local setup

## Repository Layout
```
Feedback4U/
├─ assets/                     # Static assets
├─ backend/                    # Python API + RAG support
│  ├─ app.py                   # FastAPI app (auth, CRUD, uploads, health)
│  ├─ database.py              # SQLAlchemy models + Pydantic schemas
│  ├─ schema.sql               # User/course/assignment/submission schema
│  ├─ requirements.txt         # Backend dependencies
│  ├─ docker-compose.yml       # (backend-local) Postgres + Adminer
│  ├─ start.sh                 # uvicorn entry
│  └─ RAG/                     # RAG microservice
│     ├─ rag_db.py             # pgvector + embedding pipeline + stats
│     ├─ rag_api.py            # (served by uvicorn in RAG/Dockerfile)
│     ├─ requirements.txt      # RAG dependencies
│     └─ Dockerfile            # RAG container
├─ feedback/                   # React client (Create React App)
│  ├─ src/                     # routes, pages, context, components
│  └─ package.json
├─ docker-compose.yml          # Full stack: DBs, backend, frontend, rag_api
├─ flake.nix / flake.lock      # (optional) Nix development environment
└─ start.sh                    # compose up
```

## Features
- Admin / Teacher / Student **auth** (JWT) and **role‑based** access
- Course and assignment management; student enrollments
- Submission upload with optional **RAG‑augmented** feedback
- Stats/analytics scaffolding (student averages, distributions, worst‑criteria)
- **Adminer** DB UI for quick inspection

## Architecture (High Level)
```
+-----------------+        HTTP/JSON         +-----------------+
|  Frontend (CRA) | <----------------------> |  FastAPI API    |
|  port 3000      |                          |  port 8000      |
+-----------------+                          +-----------------+
                                                     |
                                                     | SQL (users/courses/etc.)
                                                     v
                                              +---------------+
                                              | Postgres user |
                                              | port 8081->5432
                                              +---------------+

                     (Optional, for embeddings/analytics)
+------------------+         HTTP/JSON        +------------------+
|  Frontend/API    | <----------------------> |  RAG API (8082)  |
+------------------+                          +------------------+
                                                     |
                                                     v
                                              +---------------+
                                              | Postgres RAG  |
                                              | port 5432     |
                                              +---------------+
```

## Tech Stack
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, `python-jose`, `passlib`
- **DB:** PostgreSQL; pgvector (RAG DB)
- **Frontend:** React (Create React App), react‑bootstrap / MUI, react‑router
- **RAG:** LangChain (OpenAI/HF/Gemini embeddings), PyMuPDF, pgvector
- **Infra:** Docker Compose, Adminer (DB UI)

## Prerequisites
- **Docker & Docker Compose** (recommended)
- Or, **Python 3.10+** and **Node 18+** for manual setup

---

## Quick Start (Docker Compose)

1) Clone and enter the repo:
```bash
git clone https://github.com/Megatomato/Feedback4U.git
cd Feedback4U
```

2) Start the full stack:
```bash
./start.sh             # or: docker compose up --build -d
```

3) Access services:
- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000> (FastAPI docs at `/docs`)
- Adminer (DB UI): <http://localhost:8080>
- RAG API (optional): <http://localhost:8082>

> The root `docker-compose.yml` brings up:
> - `postgres-user` (user/course/assignment DB, auto‑seeded by `backend/schema.sql`)
> - `postgres-rag` (pgvector DB for embeddings/analytics)
> - `backend` (FastAPI, port 8000)
> - `frontend` (CRA dev server, port 3000)
> - `rag_api` (RAG microservice, port 8082)

