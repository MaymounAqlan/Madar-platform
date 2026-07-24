# MADAR Platform - Complete Run Guide
# دليل تشغيل منصة مدار الشامل

---

## Table of Contents
1. [Quick Start (Docker)](#quick-start-docker)
2. [Manual Setup](#manual-setup)
3. [Environment Variables](#environment-variables)
4. [API Documentation](#api-documentation)
5. [Architecture Overview](#architecture-overview)

---

## Quick Start (Docker)

The fastest way to run the full MADAR platform is using Docker Compose.

### Prerequisites
- Docker Engine 24.0+ and Docker Compose 2.20+
- 4GB RAM minimum (8GB recommended)
- 10GB free disk space

### Step 1: Start All Services

```bash
# Clone or navigate to the project directory
cd /path/to/madar

# Start all services (MongoDB, Redis, Backend, AI Engine, Nginx)
docker compose up -d

# Wait for services to be healthy (AI Engine takes ~2 min on first run)
docker compose ps
```

Services will be available at:
| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost | Main MADAR web app |
| Backend API | http://localhost/api | NestJS REST API |
| API Docs | http://localhost/api/docs | Swagger documentation |
| AI Engine | http://localhost/api/ai | Python FastAPI AI service |

### Step 2: Seed Initial Data

```bash
# Run database seed script inside the backend container
docker compose exec backend npm run seed

# This creates:
# - Default admin user (admin@madar.sa / Admin123!)
# - Skill taxonomy (200+ skills)
# - Sample companies, jobs, and students
```

### Step 3: Access the Platform

Open your browser and go to **http://localhost**

Default accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@madar.sa | Admin123! |
| Student | student@example.com | Student123! |
| Company | company@techsol.sa | Company123! |
| University | uni@ksu.edu.sa | Uni123! |

### Useful Docker Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f ai-engine
docker compose logs -f mongodb

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove all data (volumes)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Shell into a container
docker compose exec backend sh
docker compose exec mongodb mongosh
```

---

## Manual Setup

If you prefer to run services individually for development.

### 1. MongoDB

```bash
# Using Docker
docker run -d --name madar-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=madar_secure_2024 \
  -v mongo_data:/data/db \
  mongo:7.0

# Or install MongoDB locally and start:
# mongod --dbpath /var/lib/mongodb
```

### 2. Redis

```bash
# Using Docker
docker run -d --name madar-redis \
  -p 6379:6379 \
  redis:7-alpine

# Or install Redis locally:
# redis-server
```

### 3. NestJS Backend

```bash
cd madar-backend

# Install dependencies
npm install

# Set environment variables (or copy .env)
export MONGODB_URI="mongodb://admin:madar_secure_2024@localhost:27017/madar?authSource=admin"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="your-secret-key-here"
export JWT_REFRESH_SECRET="your-refresh-secret-here"
export PORT=3001
export FRONTEND_URL="http://localhost:3000"
export AI_SERVICE_URL="http://localhost:8000"

# Run in development mode
npm run start:dev

# Or build and run production
npm run build
npm run start:prod

# Backend will be at: http://localhost:3001
# API Docs at: http://localhost:3001/api/docs
```

### 4. Python AI Engine

```bash
cd madar-ai

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (takes ~5 min on first run for model download)
pip install -r requirements.txt

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# AI Engine will be at: http://localhost:8000
# Health check: http://localhost:8000/api/ai/health
```

### 5. Frontend

```bash
cd madar-frontend

# Install dependencies
npm install

# Set API URL environment variable
echo "VITE_API_URL=http://localhost:3001" > .env

# Run development server
npm run dev

# Or build for production
npm run build

# Frontend will be at: http://localhost:3000
```

---

## Environment Variables

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3001` | Server port |
| `MONGODB_URI` | - | MongoDB connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `JWT_SECRET` | - | JWT signing secret (change in production!) |
| `JWT_REFRESH_SECRET` | - | JWT refresh token secret |
| `JWT_ACCESS_EXPIRATION` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token expiry |
| `BCRYPT_SALT_ROUNDS` | `10` | Password hashing rounds |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend CORS origin |
| `AI_SERVICE_URL` | `http://ai-engine:8000` | AI engine URL |
| `SWAGGER_ENABLED` | `true` | Enable API docs |

### AI Engine

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://redis:6379` | Redis cache URL |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `MATCH_SKILLS_WEIGHT` | `0.6` | Skills match weight (60%) |
| `MATCH_EXPERIENCE_WEIGHT` | `0.2` | Experience match weight (20%) |
| `MATCH_PROJECTS_WEIGHT` | `0.1` | Projects match weight (10%) |
| `MATCH_SEMANTIC_WEIGHT` | `0.1` | Semantic match weight (10%) |
| `LOG_LEVEL` | `INFO` | Logging level |

### Frontend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base URL |

---

## API Documentation

### Swagger UI
Once the backend is running, open:
- **Development**: http://localhost:3001/api/docs
- **Production (via Nginx)**: http://localhost/api/docs

### Key Endpoints

#### Authentication
```
POST /api/auth/register          - Register new user
POST /api/auth/login             - Login (returns JWT tokens)
POST /api/auth/refresh           - Refresh access token
POST /api/auth/logout            - Logout
GET  /api/auth/me                - Current user profile
```

#### Students
```
GET  /api/students/profile           - Get profile
PUT  /api/students/profile           - Update profile
POST /api/students/cv-upload         - Upload CV (multipart)
GET  /api/students/recommended-jobs  - AI job recommendations
GET  /api/students/skill-gaps        - Skill gap analysis
GET  /api/students/applications      - My applications
GET  /api/students/insights          - AI insights
```

#### Companies
```
GET    /api/companies/dashboard        - Dashboard metrics
POST   /api/companies/jobs             - Create job
GET    /api/companies/jobs             - List company jobs
PUT    /api/companies/jobs/:id         - Update job
GET    /api/companies/candidates       - Search candidates
GET    /api/companies/applications     - View applications
PUT    /api/companies/applications/:id - Update application status
GET    /api/companies/analytics        - Recruitment analytics
```

#### Jobs (Public)
```
GET  /api/jobs            - List jobs (paginated, filterable)
GET  /api/jobs/:id        - Job details
POST /api/jobs/:id/apply  - Apply to job (auth required)
GET  /api/jobs/:id/similar - Similar jobs
```

#### AI Engine
```
POST /api/ai/cv/parse              - Parse CV (multipart PDF/DOCX)
POST /api/ai/skills/extract        - Extract skills from text
POST /api/ai/skills/gap-analysis   - Analyze skill gaps
POST /api/ai/matching/calculate    - Calculate match score
POST /api/ai/matching/batch        - Batch matching
POST /api/ai/recommendations/jobs  - Job recommendations
GET  /api/ai/health                - Health check
```

---

## Architecture Overview

```
                    +------------------+
                    |     Nginx        |
                    |  (Port 80/443)   |
                    +--------+---------+
                             |
              +--------------+---------------+
              |              |               |
       +------v------+ +-----v-----+ +------v-------+
       |  Frontend   | |  Backend  | |  AI Engine   |
       |  (Static)   | | (NestJS)  | |  (FastAPI)   |
       |  Port 3000  | | Port 3001 | |  Port 8000   |
       +-------------+ +-----+-----+ +------+-------+
                           |               |
                    +------v-----+   +-----v-----+
                    |  MongoDB   |   |   Redis   |
                    |  Port      |   |  Port     |
                    |  27017     |   |  6379     |
                    +------------+   +-----------+
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite | 19.0 |
| UI Library | Tailwind CSS + shadcn/ui | v3.4 |
| Animations | Framer Motion | 11.x |
| Charts | Recharts | 2.15 |
| Backend | NestJS + TypeScript | 10.x |
| Database | MongoDB + Mongoose | 7.0 / 8.x |
| Cache | Redis | 7.x |
| Auth | JWT + bcrypt + Passport | - |
| AI Engine | Python + FastAPI | 3.11 |
| ML | sentence-transformers | 2.x |
| Reverse Proxy | Nginx | alpine |
| Container | Docker + Compose | 24.0+ |

---

## Troubleshooting

### Port Conflicts
If ports 80, 3001, or 8000 are already in use, edit `docker-compose.yml` or `.env` to change them.

### AI Engine Slow Startup
The AI Engine downloads the `all-MiniLM-L6-v2` model (~80MB) on first run. This may take 2-5 minutes depending on your internet speed. The model is cached in the `ai_models_cache` Docker volume.

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker compose ps mongodb

# Check logs
docker compose logs mongodb

# Reset MongoDB (WARNING: deletes all data)
docker compose down -v mongodb
```

### Frontend Blank Page
Ensure the `VITE_API_URL` environment variable is set correctly in the frontend `.env` file.

### CORS Errors
The backend CORS is configured via `FRONTEND_URL` env var. Make sure it matches your frontend URL exactly (including port).

---

## Production Deployment

### SSL Certificates
Place your SSL certificates in `nginx/ssl/`:
```
nginx/ssl/
  cert.pem    # Your certificate
  key.pem     # Your private key
```

Then uncomment the SSL section in `nginx/nginx.conf`.

### Environment Security
1. Change all default passwords in `.env`
2. Use strong JWT secrets (64+ random characters)
3. Enable MongoDB authentication
4. Use a firewall to restrict port access
5. Set `NODE_ENV=production`

### Scaling
```bash
# Scale backend to 3 instances
docker compose up -d --scale backend=3

# Add a MongoDB replica set for production
# See MongoDB documentation for replica set setup
```

---

**For support, contact: support@madar.sa**
