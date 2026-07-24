# MADAR Platform - AI Career Guidance

<div dir="rtl">

# منصة مدار - دليل التشغيل الشامل

</div>

## Overview | نظرة عامة

MADAR is an AI-powered career guidance and academic intelligence platform connecting **students**, **universities**, and **companies** in Saudi Arabia. Built with NestJS backend, Python FastAPI AI engine, React frontend, MongoDB database, and Redis cache.

---

## Quick Start | البدء السريع

### Prerequisites | المتطلبات الأساسية

- **Docker** 24.0+ & **Docker Compose** v2.0+
- **Node.js** 20+ (for local development)
- **Python** 3.11+ (for AI engine local development)
- **Git**

### Option 1: Docker Compose (Recommended) | الخيار 1: دوكر كومبوز (موصى به)

```bash
# 1. Clone the project
# استنساخ المشروع
cd /mnt/agents/output

# 2. Start all services (5 containers)
# تشغيل جميع الخدمات (5 حاويات)
docker-compose up -d --build

# 3. Seed the database with sample data
# ملء قاعدة البيانات بالبيانات التجريبية
cd scripts && npm install mongodb bcryptjs
node seed-data.js

# 4. Access the application
# الوصول للتطبيق
echo "Frontend:  http://localhost"
echo "Backend:   http://localhost/api"
echo "Swagger:   http://localhost/api/docs"
echo "AI Engine: http://localhost/api/ai/docs"
```

### Option 2: Local Development | الخيار 2: التطوير المحلي

#### Backend | الخلفية

```bash
cd madar-backend

# Install dependencies
npm install

# Set environment variables (or copy .env)
cp ../.env .env

# Start development server
npm run start:dev
# API runs on http://localhost:3001
```

#### AI Engine | محرك الذكاء الاصطناعي

```bash
cd madar-ai

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# API runs on http://localhost:8000
```

#### Frontend | الواجهة الأمامية

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev
# App runs on http://localhost:5173
```

---

## Project Structure | هيكل المشروع

```
madar/
├── docker-compose.yml          # Docker orchestration | تنسيق دوكر
├── .env                        # Environment variables | متغيرات البيئة
├── nginx/
│   └── nginx.conf              # Reverse proxy config | إعدادات البروكسي
├── scripts/
│   ├── mongo-init.js           # DB initialization | تهيئة القاعدة
│   └── seed-data.js            # Sample data seeding | ملء البيانات
├── madar-backend/              # NestJS Backend | الخلفية
│   ├── Dockerfile
│   ├── src/
│   │   ├── auth/               # JWT + RBAC Authentication
│   │   ├── students/           # Student management
│   │   ├── companies/          # Company portal APIs
│   │   ├── universities/       # University analytics APIs
│   │   ├── jobs/               # Job postings
│   │   ├── applications/       # Job applications
│   │   ├── matching/           # AI matching processor
│   │   ├── analytics/          # Analytics & reports
│   │   └── common/             # Shared utilities
│   └── package.json
├── madar-ai/                   # Python AI Engine | محرك الذكاء الاصطناعي
│   ├── Dockerfile
│   ├── main.py                 # FastAPI entry point
│   ├── config.py               # Configuration settings
│   ├── models/                 # NLP models (CV parser, matcher, embeddings)
│   ├── routers/                # API endpoints
│   ├── services/               # Business logic
│   └── utils/                  # Helpers
└── app/                        # React Frontend | الواجهة الأمامية
    ├── dist/                   # Production build
    ├── src/
    └── package.json
```

---

## Services Architecture | معمارية الخدمات

| Service | Port | Description |
|---------|------|-------------|
| **Nginx** | 80 | Reverse proxy, static files, rate limiting |
| **Backend** | 3001 | NestJS REST API (internal) |
| **AI Engine** | 8000 | Python FastAPI AI microservice (internal) |
| **MongoDB** | 27017 | Primary database (internal) |
| **Redis** | 6379 | Cache & message broker (internal) |

### API Endpoints

| Path | Target Service | Purpose |
|------|---------------|---------|
| `/` | Frontend static files | React SPA |
| `/api/*` | NestJS Backend | REST API |
| `/api/ai/*` | Python AI Engine | AI/ML services |

---

## Test Credentials | بيانات الاعتماد للاختبار

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@madar.sa` | `Madar@2024` |
| **Student 1** | `ahmed@student.ksu.edu.sa` | `Madar@2024` |
| **Student 2** | `sara@student.kau.edu.sa` | `Madar@2024` |
| **Student 3** | `khalid@student.kfupm.edu.sa` | `Madar@2024` |
| **Student 4** | `noura@student.imamu.edu.sa` | `Madar@2024` |
| **Student 5** | `fahad@student.ksu.edu.sa` | `Madar@2024` |
| **Company (Aramco)** | `hr@aramco.com` | `Madar@2024` |
| **Company (STC)** | `recruitment@stc.com.sa` | `Madar@2024` |
| **Company (SABIC)** | `careers@sabic.com` | `Madar@2024` |
| **Company (ACWA)** | `hr@acwa.com` | `Madar@2024` |
| **Company (NEOM)** | `jobs@neom.com` | `Madar@2024` |
| **University (KSU)** | `cs@ksu.edu.sa` | `Madar@2024` |
| **University (KFUPM)** | `it@kfupm.edu.sa` | `Madar@2024` |
| **University (KAU)** | `admin@kau.edu.sa` | `Madar@2024` |
| **Coordinator** | `coordinator@ksu.edu.sa` | `Madar@2024` |

---

## Seed Data Overview | نظرة عامة على بيانات البذور

The seed script (`scripts/seed-data.js`) populates the database with:

- **6 Roles** (super_admin, admin, student, company, university, coordinator)
- **18 Permissions** across 9 modules
- **15 Users** (1 admin + 5 students + 5 companies + 3 universities + 1 coordinator)
- **5 Students** with complete profiles, skills, projects, certifications
- **5 Companies** including Aramco, STC, SABIC, ACWA, NEOM
- **3 Universities** (KSU, KFUPM, KAU)
- **85 Skills** (technical, soft, language)
- **5 Colleges** with employment rates
- **12 Jobs** across various experience levels
- **7 Applications** with realistic timelines
- **3 Match Results** with detailed factor breakdowns
- **5 Notifications** (job matches, interview schedules, application updates)
- **5 Audit Logs** (logins, applications, role changes)
- **10 Market Data** entries for KSA job market
- **4 Messages** between users

---

## Troubleshooting | استكشاف الأخطاء

### Docker Issues

| Problem | Solution |
|---------|----------|
| Port 80 already in use | Change nginx port in `docker-compose.yml`: `"8080:80"` |
| MongoDB connection refused | Wait 30 seconds for health check, then retry |
| AI Engine memory error | Increase Docker memory limit in `.wslconfig` (Windows) or Docker Desktop settings |
| Backend build fails | Check `npm install` output; may need `npm install --legacy-peer-deps` |
| Nginx 502 Bad Gateway | Ensure backend/AI containers are healthy: `docker-compose ps` |
| Seed script fails | Verify MongoDB is running: `docker-compose logs mongodb` |

### Reset Everything

```bash
# Stop and remove all containers + volumes
# إيقاف وإزالة جميع الحاويات والمجلدات
docker-compose down -v

# Rebuild from scratch
# إعادة البناء من الصفر
docker-compose up -d --build

# Re-seed data
# إعادة ملء البيانات
cd scripts && node seed-data.js
```

### Logs

```bash
# All services
# جميع الخدمات
docker-compose logs -f

# Specific service
# خدمة محددة
docker-compose logs -f backend
docker-compose logs -f ai-engine
docker-compose logs -f mongodb
docker-compose logs -f nginx
```

---

## Environment Variables | متغيرات البيئة

All configuration is in `.env` file. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://admin:madar_secure_2024@mongodb:27017/madar?authSource=admin` | MongoDB connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `JWT_SECRET` | `madar_super_secret_key_2024_change_in_production` | JWT signing key |
| `JWT_ACCESS_EXPIRATION` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token lifetime |
| `AI_SERVICE_URL` | `http://ai-engine:8000` | AI Engine internal URL |
| `SWAGGER_ENABLED` | `true` | Enable API documentation |

---

## API Documentation | توثيق API

- **Swagger UI (Backend)**: `http://localhost/api/docs`
- **Swagger JSON (Backend)**: `http://localhost/api/docs-json`
- **AI Engine Docs**: `http://localhost/api/ai/docs` (FastAPI auto-generated)
- **Health Check**: `http://localhost/api/health`
- **AI Health**: `http://localhost/api/ai/health`

---

## Functional Requirements Coverage | تغطية المتطلبات الوظيفية

| Module | Requirements | Status |
|--------|-------------|--------|
| Student Portal (FR-STU) | FR-STU-001 to FR-STU-029 | 29/29 Complete |
| Company Portal (FR-COMP) | FR-COMP-001 to FR-COMP-020 | 20/20 Complete |
| University Portal (FR-UNI) | FR-UNI-001 to FR-UNI-025 | 25/25 Complete |
| Coordinator (FR-COORD) | FR-COORD-001 to FR-COORD-016 | 16/16 Complete |
| Admin (FR-ADMIN) | FR-ADMIN-001 to FR-ADMIN-020 | 19/20 Complete* |
| AI Engine (FR-AI) | FR-AI-001 to FR-AI-014 | 14/14 Complete |

*FR-ADMIN-018 marked as Future (external integrations management)

**Total: 123/124 (99%)**

---

## Tech Stack | المكدس التقني

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | NestJS 10 + TypeScript + MongoDB (Mongoose) |
| AI Engine | Python 3.11 + FastAPI + sentence-transformers + scikit-learn |
| Database | MongoDB 7.0 |
| Cache/Queue | Redis 7 + Bull |
| Proxy | Nginx (Alpine) |
| Auth | JWT + RBAC (6 roles) |
| ML Model | all-MiniLM-L6-v2 (384-dim embeddings) |

---

## License | الترخيص

MIT License - MADAR Team

---

<div dir="rtl">

## ملاحظات هامة

1. **لا تستخدم** بيانات الاعتماد الافتراضية في الإنتاج - قم بتغيير جميع كلمات المرور والمفاتيح السرية
2. **غيّر** `JWT_SECRET` و `JWT_REFRESH_SECRET` قبل النشر
3. **فعّل** HTTPS في الإنتاج (تحديث `nginx.conf` مع شهادات SSL)
4. **اطبع** `docker-compose logs` لمراقبة الأخطاء عند التشغيل الأول

</div>
