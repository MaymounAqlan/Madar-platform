# AI Engine Run Guide

Windows PowerShell commands from the repository root. Docker is not required.

## Prerequisites

- Node.js and npm compatible with the existing lockfiles
- Python 3.11 and `madar-ai/.venv`
- MongoDB listening on `27017`
- Redis or Memurai listening on `6379`
- Environment files derived from the checked-in `.env.example` files

Do not place production secrets in the example files.

## Start services

MongoDB and Memurai are installed as Windows services in the validated environment:

```powershell
Get-Service MongoDB, Memurai
Start-Service MongoDB
Start-Service Memurai
```

AI service:

```powershell
cd madar-ai
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

NestJS API and Bull workers:

```powershell
cd madar-backend
npm run start:dev
```

The Bull processors run with NestJS. The project does not define a separate worker script, so do not invent one.

Frontend:

```powershell
cd app
npm run dev -- --host 127.0.0.1 --port 3000
```

## Health checks

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/ai/health
Invoke-RestMethod http://127.0.0.1:3001/api/health
Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing
Get-NetTCPConnection -LocalPort 6379,27017 -State Listen
```

## Validation commands

AI:

```powershell
cd madar-ai
.\.venv\Scripts\python.exe -m compileall -q config.py main.py models routers services utils tests
.\.venv\Scripts\python.exe -m pytest -q
```

Backend:

```powershell
cd madar-backend
npx tsc --noEmit
npm run build
npm run test -- --runInBand
```

Frontend:

```powershell
cd app
npx tsc --noEmit
npm run build
```

## Relevant environment names

Backend: `AI_SERVICE_URL`, `AI_REQUEST_TIMEOUT`, `AI_MAX_RETRIES`, `AI_JOB_TIMEOUT`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `MATCH_SKILLS_WEIGHT`, `MATCH_EXPERIENCE_WEIGHT`, `MATCH_PROJECTS_WEIGHT`, `MATCH_SEMANTIC_WEIGHT`, `MATCH_THRESHOLD`, `HIGH_MATCH_THRESHOLD`.

AI: `EMBEDDING_MODEL`, `EMBEDDING_MODEL_VERSION`, `EMBEDDING_DIMENSION`, `MATCH_WEIGHT_*`, `REDIS_URL`, `CACHE_ENABLED`, `AI_REQUEST_TIMEOUT_SECONDS`, `AI_MAX_RETRIES`, `AI_JOB_TIMEOUT_SECONDS`, `AI_QUEUE_NAME`, `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`.

## Local endpoints

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:3001`
- Backend health: `http://127.0.0.1:3001/api/health`
- AI: `http://127.0.0.1:8000`
- AI docs: `http://127.0.0.1:8000/api/ai/docs`
- AI health: `http://127.0.0.1:8000/api/ai/health`
