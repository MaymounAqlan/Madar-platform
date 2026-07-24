# خطة إصلاح شاملة - جعل المشروع حقيقي 100%

## الحالة الحالية
- Backend: بنية جيدة لكن `node_modules` مفقودة + TypeScript errors
- Frontend: صفحات موجودة لكن static (import mock data)
- Hooks/Services: موجودة وجاهزة لكن غير مستخدمة
- AI Engine: موجود لكن لا أحد يستدعيه
- Auth: Backend OAuth strategies مفقودة، Frontend لا يستدعي API
- CV Upload: Backend يدعمه لكن Frontend لا يعرض input

## المرحلة 1: Backend - npm install + TypeScript Fix
- npm install
- إصلاح كل TypeScript errors
- إضافة Google OAuth Strategy
- إضافة LinkedIn OAuth Strategy
- إضافة Nodemailer Email Service
- إكمال CRUD: createStudent, deleteStudent, deleteJob, etc.
- إصلاح handleCvUploadWithParsing

## المرحلة 2: Frontend - ربط API
- Login.tsx: استدعاء API حقيقي
- Register.tsx: استدعاء API حقيقي
- ForgotPassword.tsx: استدعاء API حقيقي
- StudentDashboard.tsx: استبدال mock data بالـ API
- StudentProfile.tsx: حفظ يتصل بالـ API + CV Upload
- StudentJobs.tsx: تقديم يتصل بالـ API
- StudentApplications.tsx: استبدال mock بالـ API
- StudentInsights.tsx: استبدال mock بالـ API
- CompanyDashboard.tsx: استبدال mock بالـ API
- CompanyJobs.tsx: نشر/حذف يتصل بالـ API
- CompanyCandidates.tsx: استبدال mock بالـ API
- CompanyAnalytics.tsx: استبدال mock بالـ API
- UniversityDashboard.tsx: استبدال mock بالـ API
- UniversityStructure.tsx: حفظ يتصل بالـ API
- UniversityStudents.tsx: استبدال mock بالـ API

## المرحلة 3: Integration + Test
- Docker Compose build
- Seed data
- Test all endpoints
