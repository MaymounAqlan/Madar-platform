# دليل تشغيل منصة MADAR على Windows باستخدام Docker Desktop
# خطوة بخطوة مع الأوامر

---

## المتطلبات المسبقة

### 1. تثبيت Docker Desktop على Windows

#### الخطوة 1.1: تحميل Docker Desktop
- افتح المتصفح واذهب إلى: **https://www.docker.com/products/docker-desktop**
- اضغط على **"Download for Windows"**
- سيتم تحميل ملف التثبيت (~500 MB)

#### الخطوة 1.2: تثبيت Docker Desktop
1. شغّل ملف `Docker Desktop Installer.exe`
2. اضغط **Yes** عند ظهور نافذة UAC
3. اضغط **OK** لتثبيت WSL 2 (مطلوب)
4. انتظر انتهاء التثبيت
5. اضغط **Close and Restart** لإعادة تشغيل الجهاز

#### الخطوة 1.3: تفعيل WSL 2 (إذا لم يتم تفعيله تلقائياً)
افتح **PowerShell كمسؤول** (Administrator):

```powershell
# تفعيل WSL
wsl --install

# تحديث WSL
wsl --update

# إعادة تشغيل الجهاز
Restart-Computer
```

#### الخطوة 1.4: التحقق من التثبيت
افتح **Command Prompt** أو **PowerShell**:

```cmd
docker --version
docker-compose --version
```

يجب أن ترى:
```
Docker version 24.0.x
docker-compose version 2.20.x
```

> ✅ **Docker Desktop جاهز الآن!**

---

## الخطوة 2: نسخ ملفات المشروع

### 2.1: إنشاء مجلد للمشروع

افتح **Command Prompt** ونفّذ:

```cmd
# الذهاب للقرص C
cd C:\

# إنشاء مجلد المشاريع
mkdir projects

# الذهاب للمجلد
cd projects

# نسخ ملفات MADAR
# (انسخ ملفات المشروع من المجلد المُخرج إلى هذا المسار)
```

### 2.2: التحقق من هيكل الملفات

```cmd
cd C:\projects\madar
dir
```

يجب أن ترى هذه الملفات:
```
docker-compose.yml
.env
nginx/
madar-backend/
madar-ai/
madar-frontend/
```

تحقق من وجود كل مجلد:

```cmd
dir madar-backend\package.json
dir madar-ai\requirements.txt
dir madar-frontend\package.json
dir nginx\nginx.conf
```

---

## الخطوة 3: تشغيل MongoDB (قاعدة البيانات)

### 3.1: تشغيل MongoDB Container

```cmd
docker run -d --name madar-mongodb ^
  -p 27017:27017 ^
  -e MONGO_INITDB_ROOT_USERNAME=admin ^
  -e MONGO_INITDB_ROOT_PASSWORD=madar_secure_2024 ^
  -v mongodb_data:/data/db ^
  mongo:7.0
```

> **الرمز `^`** في Windows يعني استمرار الأمر في السطر التالي.

### 3.2: التحقق من تشغيل MongoDB

```cmd
docker ps
```

يجب أن ترى `madar-mongodb` مع حالة **Up**.

### 3.3: اختبار الاتصال بـ MongoDB

```cmd
docker exec madar-mongodb mongosh ^
  "mongodb://admin:madar_secure_2024@localhost:27017/madar?authSource=admin" ^
  --eval "db.adminCommand('ping')"
```

يجب أن ترى:
```json
{ "ok": 1 }
```

✅ **MongoDB تعمل!**

---

## الخطوة 4: تشغيل Redis (التخزين المؤقت + Queue)

### 4.1: تشغيل Redis Container

```cmd
docker run -d --name madar-redis ^
  -p 6379:6379 ^
  redis:7-alpine
```

### 4.2: التحقق من Redis

```cmd
docker exec madar-redis redis-cli ping
```

يجب أن ترى: **PONG**

✅ **Redis تعمل!**

---

## الخطوة 5: تشغيل Backend (NestJS)

### 5.1: بناء صورة Backend

```cmd
cd C:\projects\madar\madar-backend

# بناء Docker image
docker build -t madar-backend .
```

> ⏱️ هذه الخطوة تستغرق 3-5 دقائق (أول مرة)

### 5.2: تشغيل Backend Container

```cmd
docker run -d --name madar-backend ^
  -p 3001:3001 ^
  -e PORT=3001 ^
  -e MONGODB_URI=mongodb://admin:madar_secure_2024@host.docker.internal:27017/madar?authSource=admin ^
  -e REDIS_URL=redis://host.docker.internal:6379 ^
  -e JWT_SECRET=madar_super_secret_key_2024_change_in_production ^
  -e JWT_REFRESH_SECRET=madar_refresh_secret_key_2024_change ^
  -e FRONTEND_URL=http://localhost ^
  -e AI_SERVICE_URL=http://host.docker.internal:8000 ^
  madar-backend
```

### 5.3: التحقق من Backend

```cmd
# عرض السجلات
docker logs madar-backend

# اختبار API
curl http://localhost:3001/api/health
```

يجب أن ترى:
```json
{"status":"ok","timestamp":"..."}
```

✅ **Backend يعمل على المنفذ 3001!**

---

## الخطوة 6: تشغيل AI Engine (Python)

### 6.1: بناء صورة AI Engine

```cmd
cd C:\projects\madar\madar-ai

# بناء Docker image
docker build -t madar-ai .
```

> ⏱️ هذه الخطوة تستغرق 5-8 دقائق (تحميل النموذج ~80 ميجا)

### 6.2: تشغيل AI Engine Container

```cmd
docker run -d --name madar-ai ^
  -p 8000:8000 ^
  -e REDIS_URL=redis://host.docker.internal:6379 ^
  -e EMBEDDING_MODEL=all-MiniLM-L6-v2 ^
  madar-ai
```

### 6.3: التحقق من AI Engine

```cmd
# عرض السجلات (انتظر حتى يكتمل تحميل النموذج)
docker logs -f madar-ai
```

عند اكتمال التحميل ستظهر:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 6.4: اختبار AI Engine

```cmd
curl http://localhost:8000/api/ai/health
```

يجب أن ترى:
```json
{"status":"healthy","models_loaded":true,"version":"1.0.0"}
```

✅ **AI Engine يعمل على المنفذ 8000!**

---

## الخطوة 7: تشغيل Frontend (React)

### 7.1: بناء صورة Frontend

```cmd
cd C:\projects\madar\madar-frontend

# بناء Docker image
docker build -t madar-frontend .
```

### 7.2: تشغيل Frontend Container

```cmd
docker run -d --name madar-frontend ^
  -p 80:80 ^
  madar-frontend
```

> ⚠️ إذا كان المنفذ 80 مشغولاً (IIS أو Apache)، استخدم منفذاً آخر:
> ```cmd
> docker run -d --name madar-frontend -p 8080:80 madar-frontend
> ```
> ثم افتح: http://localhost:8080

✅ **Frontend يعمل!**

---

## الخطوة 8: تشغيل Nginx (البوابة الأمامية)

### 8.1: بناء وتشغيل Nginx

```cmd
cd C:\projects\madar

# تشغيل Nginx container
docker run -d --name madar-nginx ^
  -p 80:80 ^
  -v %cd%\nginx\nginx.conf:/etc/nginx/nginx.conf:ro ^
  -v mongodb_data:/tmp ^
  nginx:alpine
```

> `%cd%` في Windows CMD يعني المسار الحالي.

---

## الخطوة 9: التشغيل الكامل بأمر واحد (Docker Compose)

بدلاً من تشغيل كل خدمة على حدة، يمكنك تشغيل الكل بأمر واحد:

### 9.1: التشغيل السريع

```cmd
cd C:\projects\madar

# تشغيل كل الخدمات
docker-compose up -d --build
```

> ⏱️ أول مرة تستغرق 10-15 دقيقة

### 9.2: التحقد من تشغيل جميع الخدمات

```cmd
docker-compose ps
```

يجب أن ترى:
```
NAME              STATUS          PORTS
madar-mongodb     Up              0.0.0.0:27017->27017/tcp
madar-redis       Up              0.0.0.0:6379->6379/tcp
madar-backend     Up              0.0.0.0:3001->3001/tcp
madar-ai          Up              0.0.0.0:8000->8000/tcp
madar-frontend    Up              0.0.0.0:80->80/tcp
```

✅ **جميع الخدمات تعمل!**

---

## الخطوة 10: فتح المنصة في المتصفح

### 10.1: فتح الصفحة الرئيسية

افتح المتصفح واذهب إلى:
```
http://localhost
```

### 10.2: فتح وثائق API

```
http://localhost/api/docs
```

### 10.3: فحص API Backend

```cmd
curl http://localhost/api/health
```

### 10.4: فحص AI Engine

```cmd
curl http://localhost/api/ai/health
```

---

## الخطوة 11: تسجيل الدخول

### الحسابات الافتراضية:

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|-------------------|-------------|
| طالب | student@example.com | Student123! |
| شركة | company@techsol.sa | Company123! |
| جامعة | uni@ksu.edu.sa | Uni123! |
| مسؤول | admin@madar.sa | Admin123! |

### خطوات التسجيل:
1. افتح http://localhost/#/login
2. أدخل البريد وكلمة المرور
3. اضغط **تسجيل الدخول**
4. سيتم توجيهك للوحة التحكم

---

## الخطوة 12: إيقاف المشروع

### إيقاف مؤقت (المحافظة على البيانات):
```cmd
cd C:\projects\madar
docker-compose stop
```

### إعادة التشغيل:
```cmd
docker-compose start
```

### إيقاف نهائي + حذف الحاويات:
```cmd
docker-compose down
```

### إيقاف + حذف كل البيانات (⚠️):
```cmd
docker-compose down -v
```

---

## حل المشاكل الشائعة على Windows

### ❌ المشكلة 1: Docker Desktop لا يشتغل
**الحل:**
```powershell
# تفعيل Virtualization في BIOS
# تأكد من تفعيل Hyper-V
# فتح PowerShell كمسؤول:
dism.exe /Online /Enable-Feature:Microsoft-Hyper-V /All

# أو تفعيل WSL 2
wsl --install
wsl --set-default-version 2
```

### ❌ المشكلة 2: المنفذ 80 مشغول
**الحل:**
```cmd
# معرفة البرنامج المشغول للمنفذ 80
netstat -ano | findstr :80

# إيقاف IIS
iisreset /stop

# أو تغيير المنفذ في docker-compose.yml
# غيّر "80:80" إلى "8080:80"
```

### ❌ المشكلة 3: مشكلة في WSL 2
**الحل:**
```powershell
# تحديث WSL
wsl --update

# تعيين WSL 2 كافتراضي
wsl --set-default-version 2

# إذا استمرت المشكلة:
wsl --shutdown
wsl --unregister docker-desktop
# ثم أعد تشغيل Docker Desktop
```

### ❌ المشكلة 4: بطء في تحميل النموذج
**الحل:**
```cmd
# تحقق من سرعة الإنترنت
curl -o /dev/null http://speedtest.tele2.net/10MB.zip

# إذا كان بطيئاً، حمل النموذج يدوياً:
docker exec -it madar-ai bash
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### ❌ المشكلة 5: MongoDB connection refused
**الحل:**
```cmd
# تأكد من تشغيل MongoDB
docker ps | findstr mongodb

# إعادة تشغيل MongoDB
docker restart madar-mongodb

# فحص السجلات
docker logs madar-mongodb
```

### ❌ المشكلة 6: Backend build فاشل
**الحل:**
```cmd
# حذف node_modules وإعادة التثبيت
cd madar-backend
docker build --no-cache -t madar-backend .
```

---

## أوامر Docker الأساسية على Windows

```cmd
# عرض الحاويات المشغلة
docker ps

# عرض كل الحاويات (حتى المتوقفة)
docker ps -a

# عرض السجلات
docker logs madar-backend
docker logs -f madar-ai

# إعادة تشغيل خدمة
docker restart madar-backend

# إيقاف خدمة
docker stop madar-backend

# حذف خدمة
docker rm madar-backend

# دخول حاوية
docker exec -it madar-backend sh
docker exec -it madar-mongodb mongosh

# فحص استهلاك الموارد
docker stats

# حذف كل شيء وإعادة البناء
docker-compose down -v
docker-compose up -d --build
```

---

## ملخص سريع للأوامر (Copy & Paste)

### 🔥 التشغيل لأول مرة:
```cmd
cd C:\projects\madar
docker-compose up -d --build
```

### ✅ التحقق:
```cmd
docker-compose ps
curl http://localhost/api/health
curl http://localhost/api/ai/health
```

### 🌐 الفتح في المتصفح:
```
http://localhost
```

### ⏹️ الإيقاف:
```cmd
cd C:\projects\madar
docker-compose down
```

---

**آخر تحديث:** 2026-07-04  
**الإصدار:** MADAR Platform v1.0
