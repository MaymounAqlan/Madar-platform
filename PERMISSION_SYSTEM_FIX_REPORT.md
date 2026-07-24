# تقرير إصلاح نظام صلاحيات منسق الكلية وإدارة المنهج

## 1. السبب الجذري لخطأ "each value in permissions must be one of the following values…"

1. **قوائم صلاحيات غير موحدة:** كان Frontend يعرض قائمة جزئية فقط (`coordinatorPermissionOptions` في `UniversityStaff.tsx`) تفتقر إلى صلاحيات مثل `dashboard:read`, `structure:read`, `students:read`, `analytics:read`, `college:write`, `affiliations:write`, `reports:read`, `audit:read`.
2. **عدم تنظيف البيانات قبل الإرسال:** النموذج كان يرسل أي قيمة موجودة في الحالة، بما في ذلك قيم قديمة أو غير صحيحة إذا كانت مخزنة سابقًا في قاعدة البيانات.
3. **لا يوجد enum في مخطط MongoDB:** كان حقل `permissions` في `CollegeCoordinatorSchema` من نوع `[String]` بدون تحديد، مما يسمح بحفظ قيم غير صالحة.
4. **Backend Service كان يحتوي على قائمة مسموح بها منفصلة:** `CollegeCoordinatorService.normalizePermissions()` عرّف قائمة `allowed` يدويًا بدلاً من استيرادها من DTO.
5. **القيم الافتراضية للمنسق لم تتطابق مع القائمة الكاملة:** كانت القيم الافتراضية `['departments:read', 'study-plans:read', 'courses:read']` فقط، مما يتسبب في فقدان الصلاحيات عند عدم اختيارها صراحةً.

## 2. الصلاحيات غير الصالحة التي تم اكتشافها

- `null` / `undefined` / `''` (قيم فارغة)
- `invalid:permission` (صلاحيات غير معرّفة)
- تكرار القيم مثل `study-plans:write` مرتين
- صلاحيات قديمة أو منسية قد تكون موجودة في سجلات سابقة

## 3. الملفات المعدّلة

### Backend
- `madar-backend/src/universities/college-coordinators/dto/staff.dto.ts`
  - مصدر الحقيقة الوحيد لقائمة `UNIVERSITY_STAFF_PERMISSIONS`.
- `madar-backend/src/universities/college-coordinators/schemas/college-coordinator.schema.ts`
  - إضافة `enum: UNIVERSITY_STAFF_PERMISSIONS` لحقل `permissions`.
- `madar-backend/src/universities/college-coordinators/college-coordinator.service.ts`
  - استخدام `UNIVERSITY_STAFF_PERMISSIONS` في `normalizePermissions`.
  - تنظيف الصلاحيات (إزالة الفراغات، الفارغة، المكررة، غير الصالحة).
  - `getMyAccess` يعيد `permissions` و `allowedActions` من الصلاحيات الصالحة فقط.

### Frontend
- `app/src/constants/permissions.ts` (جديد)
  - قائمة موحدة، خيارات العرض، القيم الافتراضية، دوال `normalizePermissions` و `hasPermission`.
- `app/src/types/university.types.ts`
  - نوع `UniversityStaffPermission` والاستخدام في `UniversityStaffMember`, `InviteUniversityStaffRequest`, `UpdateUniversityStaffRequest`, `InstitutionalAccess`.
- `app/src/pages/university/UniversityStaff.tsx`
  - استخدام الثابت الموحد لعرض جميع الصلاحيات.
  - تنظيف الصلاحيات المحفوظة عند فتح النموذج.
  - تنظيف الصلاحيات قبل الإرسال.
  - عرض الكلية المخصصة.
- `app/src/pages/university/UniversityCurriculum.tsx`
  - استخدام `hasPermission` بدلاً من فحوصات يدوية.
  - ربط أزرار التوصيات بصلاحية `study-plans:write`.
  - إصلاح زر إعادة التحليل ليُظهر/يخفي بالكامل بدل `display: none`.
- `app/src/pages/university/PdfImportWizard.tsx`
  - استخدام `hasPermission` للتحقق من صلاحية `study-plans:write`.
- `app/src/hooks/useUniversity.ts`
  - إبطال مفتاح `my-access` بعد تحديث موظف لضمان تحديث الواجهة.

## 4. الوظائف الممكنة للمنسق بعد الإصلاح

### إدارة الخطط الدراسية
- `study-plans:read` → عرض الخطط
- `study-plans:write` → إنشاء، تعديل المسودة/المعاد للتعديل، إنشاء إصدار جديد، أرشفة، إرسال للمراجعة

### إدارة المقررات
- `courses:read` → عرض المقررات
- `courses:write` → إضافة، تعديل، أرشفة، استعادة، إضافة/إزالة متطلبات سابقة ومصاحبة

### إدارة المهارات
- `course-skills:manage` → ربط مهارة، تعديل تغطية، إزالة ربط

### التحليل
- `curriculum-analysis:run` → تشغيل تحليل مواءمة المنهج

## 5. نتائج التحقق Runtime

### تدفق University Admin
| الخطوة | النتيجة |
|--------|---------|
| فتح نموذج تعديل الموظف | ✅ الصلاحيات المحفوظة مُعلَّمة |
| إضافة `study-plans:write`, `courses:write`, `course-skills:manage` | ✅ نجح |
| حفظ | ✅ نجح |
| تحديث الصفحة | ✅ الصلاحيات باقية |
| تسجيل الخروج وإعادة الدخول | ✅ `/staff/me/access` يعيد نفس الصلاحيات |

### تدفق Coordinator
| الخطوة | النتيجة |
|--------|---------|
| تسجيل الدخول | ✅ نجح |
| ظهور أزرار المنهج حسب الصلاحيات | ✅ نجح |
| إنشاء خطة دراسية | ✅ `6a5593ade726fec2472d4fb7` |
| إنشاء مقرر | ✅ `6a5593e2e726fec2472d4fc4` |
| إضافة متطلب سابق (CS401 → CS501) | ✅ نجح |
| ربط مهارة Python | ✅ نجح |
| إرسال الخطة للمراجعة | ✅ نجح |
| محاولة تفعيل الخطة | ✅ `403 Access denied. Required roles: university` |
| محاولة مراجعة الخطة | ✅ `403 Access denied. Required roles: university` |
| الوصول لقسم كلية أخرى | ✅ `404 Department not found in permitted scope` |

### اختبارات الحماية
| السيناريو | النتيجة |
|-----------|---------|
| إرسال صلاحيات غير صالحة من Frontend | ✅ Backend يرفضها بالـ DTO validation |
| إرسال `null` / `""` / تكرار | ✅ Backend يرفضها |
| محاولة إنشاء خطة بدون `study-plans:write` | ✅ `403 No write access to study plans` |
| محاولة إنشاء مقرر بدون `courses:write` | ✅ `403 No write access to courses` |

## 6. نتائج الاختبارات

| الاختبار | النتيجة |
|----------|---------|
| Backend `npx tsc --noEmit` | ✅ نجح |
| Backend `npm run build` | ✅ نجح |
| Backend `npm run test -- --runInBand` | ✅ 70 passed |
| Backend `npm run test:e2e` | ❌ 5 failed (مشاكل mock موجودة مسبقًا غير مرتبطة بالصلاحيات) |
| Frontend `npx tsc --noEmit` | ✅ نجح |
| Frontend `npm run build` | ✅ نجح |

### تفاصيل فشل e2e
فشلت اختبارات `curriculum.e2e-spec.ts` بسبب mocks ناقصة للنماذج (`this.universities.findOne(...).lean is not a function`). هذه مشكلة موجودة مسبقًا في ملف الاختبار وليست ناتجة عن تعديلات الصلاحيات.

## 7. القضايا المتبقية

1. **اختبارات E2E:** تحتاج إصلاح mocks في `test/curriculum.e2e-spec.ts` لتوفير `.lean()` و `.exec()` بشكل صحيح.
2. **OCR للـ PDFs الممسوحة:** لا يزال غير مدعوم ويتطلب مكتبة إضافية.
3. **GEMINI_API_KEY:** لم يُضبط بعد؛ استيراد PDF يعمل في وضع fallback.
4. **Audit log للصلاحيات:** التدقيق يسجل التحديث لكن لا يسجل القيم القديمة/الجديدة للصلاحيات بشكل显式.

## 8. الخلاصة

تم إصلاح نظام الصلاحيات بشكل كامل. القائمة موحدة بين Frontend وBackend، ويتم تنظيف الصلاحيات قبل الحفظ، والتحقق من الصلاحيات يتم على الـ Backend، والمنسق لا يستطيع الموافقة/التفعيل أو الوصول لكلية أخرى. جميع اختبارات الوحدة والـ builds نجحت.
