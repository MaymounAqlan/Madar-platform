# تقرير مراجعة Core Schemas مقابل تصميم قاعدة البيانات (PDF)

---

## ملخص تنفيذي

تم مراجعة 6 ملفات Schemas أساسية مقابل تصميم قاعدة البيانات المحدد في PDF. النتائج:

| الملف | الحقول المطابقة | الحقول الناقصة | الحقول الإضافية |
|-------|----------------|----------------|-----------------|
| `user.schema.ts` | ~85% | 2 | 6 |
| `student.schema.ts` | ~90% | 4 | 1 |
| `company.schema.ts` | ~65% | 11 | 10 |
| `university.schema.ts` | ~60% | 18 | 13 |
| `college.schema.ts` | ~30% | 12 | 6 |
| `department.schema.ts` | ~50% | 4 | 5 |

**الملاحظة العامة:** هناك نمط واضح لإضافة حقول عربية (`nameAr`, `descriptionAr`) وحقول `metadata` مرنة، وهو أمر جيد للتعريب والتوسعية.

---

## 1. User Schema (`users/schemas/user.schema.ts`)

### ✅ الحقول المطابقة (15 حقل)
| الحقل | الملاحظة |
|-------|----------|
| `_id` | تلقائي MongoDB |
| `email` | مطابق تماماً |
| `roleId` | مطابق مع Reference لـ 'Role' |
| `profileId` | مطابق كـ Polymorphic |
| `userType` | Enum مطابق |
| `isVerified` | مطابق |
| `lastLoginAt` | مطابق |
| `loginAttempts` | مطابق |
| `lockUntil` | مطابق |
| `twoFactorEnabled` | مطابق |
| `twoFactorSecret` | مطابق |
| `refreshTokens` | مطابق مع deviceInfo مفصّل أكثر |
| `preferences` | مطابق (language, theme, notifications) |
| `createdAt` | timestamps: true |
| `updatedAt` | timestamps: true |

### ❌ الحقول الناقصة (2 حقل)
| الحقل | الوصف |
|-------|-------|
| `isActive` | غير موجود - يستخدم `status` Enum بدلاً منه (بديل منطقي) |
| `passwordHash` | يستخدم `password` بدلاً منه - **يجب توحيد الاسم** |

### ⚠️ الحقول الإضافية (6 حقول)
| الحقل | الوصف |
|-------|-------|
| `firstName` | غير موجود في PDF - يُفترض أنه في Profile |
| `firstNameAr` | غير موجود في PDF |
| `lastName` | غير موجود في PDF - يُفترض أنه في Profile |
| `lastNameAr` | غير موجود في PDF |
| `status` | Enum ['active','inactive','suspended','banned','pending_verification'] - بديل لـ `isActive` |
| `isEmailVerified` | غير موجود في PDF |
| `avatar` | غير موجود في PDF |
| `phone` | غير موجود في PDF - يُفترض أنه في Profile |

### 🔗 العلاقات
| العلاقة | الحالة | الملاحظة |
|---------|--------|----------|
| `roleId -> roles` | ✅ صحيحة | `ref: 'Role'` |
| `profileId (polymorphic)` | ✅ صحيحة | تعليق واضح |

---

## 2. Student Schema (`students/schemas/student.schema.ts`)

### ✅ الحقول المطابقة (~40 حقل)
| الحقل | الملاحظة |
|-------|----------|
| `userId` | ✅ Reference لـ 'User' |
| `academicInfo` | ✅ كل الحقول مطابقة (universityId, collegeId, departmentId, studentId, enrollmentYear, expectedGraduation, academicLevel, gpa, academicStanding) |
| `personalInfo.firstName/lastName/dateOfBirth/gender/phone/bio/avatarUrl` | ✅ مطابقة |
| `personalInfo.address{city,country,coordinates}` | ✅ مطابقة |
| `professionalProfile` | ✅ كل الحقول مطابقة |
| `skills` | ✅ كل الحقول مطابقة (skillId, name, category, proficiency, source, verified, acquiredAt, lastUsed) |
| `projects` | ✅ كل الحقول مطابقة |
| `certifications` | ✅ كل الحقول مطابقة |
| `experiences` | ✅ كل الحقول مطابقة |
| `aiMetrics` | ✅ كل الحقول مطابقة |
| `embeddings` | ✅ كل الحقول مطابقة |
| `privacySettings` | ✅ كل الحقول مطابقة |
| `engagement` | ✅ كل الحقول مطابقة |
| `cvData.fileUrl/fileName/fileType/fileSize/uploadedAt` | ✅ مطابقة |
| `createdAt/updatedAt` | ✅ timestamps |

### ❌ الحقول الناقصة (4 مجموعات)
| الحقل/المجموعة | الوصف | الخطورة |
|----------------|-------|---------|
| `cvData.aiAnalysis` | في PDF: `aiAnalysis` حقل منفصل من المستوى الأول - في الكود: مدموج داخل `cvData` | 🔴 **عالية** |
| `cvData.parsedData.extractedExperience[]` | في PDF: Array of Objects `{title,company,duration,description}` - في الكود: `string[]` | 🔴 **عالية** |
| `cvData.parsedData.extractedEducation[]` | في PDF: Array of Objects `{degree,institution,year}` - في الكود: `string[]` | 🔴 **عالية** |
| `cvData.parsedData.extractedProjects[]` | في PDF: Array of Objects `{name,description,technologies}` - في الكود: `string[]` | 🔴 **عالية** |

### ⚠️ الحقول الإضافية (1 حقل)
| الحقل | الوصف |
|-------|-------|
| `personalInfo.languages` | في الكود: `string[]` - في PDF: `[{language,proficiency}]` | 🟡 **اختلاف في الهيكل** |

### 🔗 العلاقات
| العلاقة | الحالة | الملاحظة |
|---------|--------|----------|
| `userId -> users` | ✅ صحيحة | `ref: 'User'` + required + unique |
| `academicInfo.universityId -> universities` | ✅ صحيحة | `ref: 'University'` |
| `academicInfo.collegeId -> colleges` | ✅ صحيحة | `ref: 'College'` |
| `academicInfo.departmentId -> departments` | ✅ صحيحة | `ref: 'Department'` |
| `skills[].skillId -> skills` | ✅ صحيحة | `ref: 'Skill'` |

---

## 3. Company Schema (`companies/schemas/company.schema.ts`)

### ✅ الحقول المطابقة (~20 حقل)
| الحقل | الملاحظة |
|-------|----------|
| `userId` | ✅ Reference لـ 'User' |
| `profile{name,legalName,description,industry,subIndustries,companySize,foundedYear,website,logoUrl,coverImageUrl,verified,verificationStatus}` | ✅ مطابقة |
| `headquarters{city,country,coordinates}` | ✅ مطابقة (مع address إضافي) |
| `locations[{city,country}]` | ✅ جزئي |
| `contactInfo{email,phone,hrEmail}` | ✅ مطابقة |
| `culture{values,benefits,workEnvironment}` | ✅ مطابقة |
| `analytics{totalJobsPosted,totalApplications,acceptanceRate}` | ✅ مطابقة |
| `status` | ✅ مطابقة |
| `createdAt/updatedAt` | ✅ timestamps |

### ❌ الحقول الناقصة (11 حقل)
| الحقل | الوصف | الخطورة |
|-------|-------|---------|
| `locations[].isRemote` | في PDF: boolean `isRemote` - في الكود: `isHeadquarters` | 🟡 متوسطة |
| `contactInfo.linkedInUrl` | في PDF: اسم الحقل `linkedInUrl` - في الكود: `linkedIn` | 🟢 منخفضة |
| `culture.dressCode` | غير موجود في الكود | 🟡 متوسطة |
| `recruitment.preferredUniversities` | **غير موجود على الإطلاق** | 🔴 عالية |
| `recruitment.preferredColleges` | **غير موجود على الإطلاق** | 🔴 عالية |
| `recruitment.preferredDepartments` | **غير موجود على الإطلاق** | 🔴 عالية |
| `recruitment.minimumGpa` | **غير موجود على الإطلاق** | 🔴 عالية |
| `recruitment.requiredLanguages[{language,level}]` | **غير موجود على الإطلاق** | 🔴 عالية |
| `recruitment.hiringGoals{interns,freshGraduates,experienced}` | **غير موجود على الإطلاق** | 🔴 عالية |
| `analytics.averageMatchScore` | **غير موجود** | 🟡 متوسطة |
| `analytics.timeToHire` | **غير موجود** - في الكود: `averageTimeToHire` | 🟢 منخفضة |
| `analytics.topSkillsSought[{skillId,demandCount}]` | في الكود: `topHiredSkills: string[]` | 🔴 عالية |
| `analytics.topUniversities[{universityId,hireCount}]` | **غير موجود** | 🔴 عالية |
| `analytics.lastAnalyzedAt` | **غير موجود** | 🟡 متوسطة |

### ⚠️ الحقول الإضافية (10 حقول)
| الحقل | الوصف |
|-------|-------|
| `profile.descriptionAr` | تعريب |
| `headquarters.address` | إضافي |
| `locations[].isHeadquarters` | بديل لـ `isRemote` |
| `contactInfo.twitter` | إضافي |
| `culture.diversityStatement` | إضافي |
| `recruitmentPreferences` | كائن كامل مختلف عن PDF |
| `recruitmentPreferences.targetUniversities` | إضافي |
| `recruitmentPreferences.targetMajors` | إضافي |
| `recruitmentPreferences.hiringSeasons` | إضافي |
| `recruitmentPreferences.maxApplicationsPerStudent` | إضافي |
| `recruitmentPreferences.autoScreenEnabled` | إضافي |
| `analytics.averageTimeToHire` | إضافي (اسم مختلف) |
| `analytics.topHiredSkills` | إضافي (بدون skillId) |
| `analytics.candidateQualityScore` | إضافي |
| `analytics.universityPartnerships` | إضافي |

### 🔗 العلاقات
| العلاقة | الحالة | الملاحظة |
|---------|--------|----------|
| `userId -> users` | ✅ صحيحة | `ref: 'User'` + required + unique |
| `recruitmentPreferences.targetUniversities -> universities` | ⚠️ موجود | لكن الهيكل مختلف عن PDF |

---

## 4. University Schema (`universities/schemas/university.schema.ts`)

### ✅ الحقول المطابقة (~15 حقل)
| الحقل | الملاحظة |
|-------|----------|
| `userId` | ✅ Reference لـ 'User' |
| `name` | ✅ مطابقة |
| `shortName` | ✅ مطابقة |
| `description` | ✅ مطابقة |
| `foundedYear` | ✅ مطابقة |
| `location{city,country,coordinates}` | ✅ مطابقة (مع address إضافي) |
| `status` | ✅ مطابقة |
| `createdAt/updatedAt` | ✅ timestamps |

### ❌ الحقول الناقصة (18 حقل)
| الحقل | الوصف | الخطورة |
|-------|-------|---------|
| `type: 'international'` | في PDF: Enum يتضمن 'international' - في الكود: ['public','private','non_profit','research'] | 🟡 متوسطة |
| `branding.coverImageUrl` | **غير موجود** | 🟢 منخفضة |
| `contactInfo.socialMedia{linkedIn,twitter,facebook}` | **غير موجود كامل** | 🔴 عالية |
| `colleges[].coordinatorId` | **غير موجود** | 🔴 عالية |
| `colleges[].departmentCount` | **غير موجود** | 🟡 متوسطة |
| `colleges[].studentCount` | **غير موجود** | 🟡 متوسطة |
| `analytics.averageReadinessScore` | **غير موجود** | 🔴 عالية |
| `analytics.averageMatchScore` | **غير موجود** | 🔴 عالية |
| `analytics.topSkills[{skillId,name,studentCount}]` | في الكود: `topHiredSkills: string[]` | 🔴 عالية |
| `analytics.topEmployers[{companyId,name,hireCount}]` | **غير موجود** | 🔴 عالية |
| `analytics.skillGapSummary{criticalGaps,moderateGaps,improvementRate}` | **غير موجود** | 🔴 عالية |
| `analytics.lastAnalyzedAt` | **غير موجود** | 🟡 متوسطة |
| `rankings.overall` | في الكود: `national` بدلاً منه | 🟡 متوسطة |
| `rankings.employability` | في الكود: `regional` بدلاً منه | 🟡 متوسطة |
| `rankings.industryReadiness` | في الكود: `subject` بدلاً منه | 🟡 متوسطة |
| `rankings.lastUpdated` | **غير موجود** | 🟢 منخفضة |
| `settings.allowPublicAnalytics` | في الكود: `allowPublicProfile` | 🟡 متوسطة |
| `settings.allowComparisons` | **غير موجود** | 🟡 متوسطة |
| `settings.dataRetentionDays` | في الكود: `dataRetentionMonths` | 🟢 منخفضة |

### ⚠️ الحقول الإضافية (13 حقل)
| الحقل | الوصف |
|-------|-------|
| `descriptionAr` | تعريب |
| `accreditation` | في الكود: `[{body, grade}]` - في PDF: string |
| `branding{primaryColor,secondaryColor}` | مطابق لكن مع coverImageUrl مفقود |
| `contactInfo.hrEmail` | إضافي |
| `colleges[].departments[]` | مدموج مباشرة في College |
| `colleges[].nameAr` | تعريب |
| `analytics.totalFaculty` | إضافي |
| `analytics.averageGpa` | إضافي |
| `analytics.averageTimeToEmployment` | إضافي |
| `analytics.industryPartnerships` | إضافي |
| `rankings.national/regional/subject` | هيكل مختلف |
| `settings{allowPublicProfile,allowCompanyAccess,dataRetentionMonths,customFields}` | هيكل مختلف |

### 🔗 العلاقات
| العلاقة | الحالة | الملاحظة |
|---------|--------|----------|
| `userId -> users` | ✅ صحيحة | `ref: 'User'` + required + unique |
| `colleges[].collegeId` | ⚠️ ليس Reference | مجرد ObjectId بدون `ref` |
| `colleges[].departments[].departmentId` | ⚠️ ليس Reference | مجرد ObjectId بدون `ref` |

---

## 5. College Schema (`universities/colleges/schemas/college.schema.ts`)

### ✅ الحقول المطابقة (7 حقول)
| الحقل | الملاحظة |
|-------|----------|
| `_id` | تلقائي |
| `universityId` | ✅ Reference لـ 'University' |
| `name` | ✅ مطابقة |
| `description` | ✅ مطابقة |
| `createdAt` | ✅ timestamps |
| `updatedAt` | ✅ timestamps |

### ❌ الحقول الناقصة (12 حقل)
| الحقل | الوصف | الخطورة |
|-------|-------|---------|
| `establishedYear` | في الكود: `established` - **يجب توحيد الاسم** | 🟢 منخفضة |
| `coordinator{userId,name,email,phone,assignedAt}` | **غير موجود كامل** | 🔴 عالية |
| `departments[{departmentId,name,code,studentCount,facultyCount}]` | **غير موجود كامل** | 🔴 عالية |
| `studyPlans[{studyPlanId,name,departmentId,degreeType,totalCredits,durationYears}]` | **غير موجود كامل** | 🔴 عالية |
| `analytics.totalStudents` | **غير موجود** | 🟡 متوسطة |
| `analytics.totalGraduates` | **غير موجود** | 🟡 متوسطة |
| `analytics.averageReadinessScore` | **غير موجود** | 🔴 عالية |
| `analytics.averageGpa` | **غير موجود** | 🟡 متوسطة |
| `analytics.topSkills[{skillId,name,proficiency}]` | **غير موجود** | 🔴 عالية |
| `analytics.skillGaps[{skillId,name,gapSeverity,affectedStudents}]` | **غير موجود** | 🔴 عالية |
| `analytics.lastAnalyzedAt` | **غير موجود** | 🟡 متوسطة |

### ⚠️ الحقول الإضافية (6 حقول)
| الحقل | الوصف |
|-------|-------|
| `nameAr` | تعريب |
| `code` | إضافي |
| `dean` | إضافي |
| `studentCount` | إضافي (لكن موجود في PDF ضمن analytics) |
| `employmentRate` | إضافي (لكن موجود في PDF ضمن analytics) |
| `analytics{skillAlignmentScore,employmentRate}` | هيكل مبسّط مختلف |
| `metadata` | حقل مرن للتوسع |

### 🔗 العلاقات
| العلاقة | الحالة | الملاحظة |
|---------|--------|----------|
| `universityId -> universities` | ✅ صحيحة | `ref: 'University'` + required |

---

## 6. Department Schema (`universities/departments/schemas/department.schema.ts`)

### ✅ الحقول المطابقة (7 حقول)
| الحقل | الملاحظة |
|-------|----------|
| `_id` | تلقائي |
| `universityId` | ✅ Reference لـ 'University' |
| `collegeId` | ✅ Reference لـ 'College'` |
| `name` | ✅ مطابقة |
| `code` | ✅ مطابقة |
| `description` | ✅ مطابقة |
| `createdAt/updatedAt` | ✅ timestamps |

### ❌ الحقول الناقصة (4 مجموعات)
| الحقل | الوصف | الخطورة |
|-------|-------|---------|
| `degreeTypes` | **غير موجود** | 🔴 عالية |
| `specializations` | **غير موجود** | 🟡 متوسطة |
| `activeStudyPlanId` | **غير موجود** | 🟡 متوسطة |
| `faculty[{name,title,email,specialization}]` | **غير موجود كامل** | 🔴 عالية |

### ⚠️ الحقول الإضافية (5 حقول)
| الحقل | الوصف |
|-------|-------|
| `nameAr` | تعريب |
| `head` | إضافي |
| `studentCount` | إضافي |
| `marketAlignment{alignmentScore,topRelatedJobs,marketDemandTrend,missingSkills}` | إضافي - تحليل السوق |
| `metadata` | حقل مرن للتوسع |

### 🔗 العلاقات
| العلاقة | الحالة | الملاحظة |
|---------|--------|----------|
| `universityId -> universities` | ✅ صحيحة | `ref: 'University'` + required |
| `collegeId -> colleges` | ✅ صحيحة | `ref: 'College'` + required |

---

## التوصيات حسب الأولوية

### 🔴 أولوية عالية (يجب إصلاحها فوراً)
1. **Student.cvData.aiAnalysis** - يجب فصل `aiAnalysis` كحقل منفصل من المستوى الأول وليس داخل `cvData`
2. **Student.cvData.parsedData** - `extractedExperience`, `extractedEducation`, `extractedProjects` يجب أن تكون Objects مفصّلة وليس `string[]`
3. **Company.recruitment** - مفقود كامل: `preferredUniversities`, `preferredColleges`, `preferredDepartments`, `minimumGpa`, `requiredLanguages`, `hiringGoals`
4. **Company.analytics** - `topSkillsSought` يجب أن يحتوي على `skillId` و `demandCount`؛ `topUniversities` مفقود
5. **University.contactInfo.socialMedia** - مفقود كامل
6. **University.analytics** - `topSkills` يجب أن يحتوي على `skillId`؛ `topEmployers` و `skillGapSummary` مفقودون
7. **College** - `coordinator`، `departments[]`، `studyPlans[]`، `analytics` المفصّلة - مفقودة كاملة
8. **Department** - `degreeTypes`، `specializations`، `faculty[]` - مفقودة

### 🟡 أولوية متوسطة (يُنصح بإصلاحها)
1. **User.password** → يُفضّل `passwordHash` للتوافق مع PDF
2. **User.isActive** → يُفضّل إضافته أو توثيق أن `status` يغطي الحاجة
3. **Company.culture.dressCode** - مفقود
4. **Company.locations.isRemote** → في الكود `isHeadquarters`
5. **University.type** - يجب إضافة 'international' للـ Enum
6. **University.rankings** - هيكل مختلف (national/regional/subject vs overall/employability/industryReadiness)
7. **University.settings** - أسماء مختلفة (allowPublicProfile vs allowPublicAnalytics)
8. **College.established** → يُفضّل `establishedYear`

### 🟢 أولوية منخفضة (تحسينات)
1. توحيد التسميات (`linkedIn` vs `linkedInUrl`)
2. `dataRetentionMonths` vs `dataRetentionDays`
3. إضافة `coverImageUrl` لـ University branding
4. توثيق الحقول الإضافية (nameAr, descriptionAr, metadata) كـ "intentional additions"

---

## ملاحظات على جودة التنفيذ

### الإيجابيات ✅
1. **Indexes** - جميع الـ Schemas تحتوي على indexes مناسبة
2. **Validation** - استخدام `enum` و `min/max` و `required` بشكل جيد
3. **Timestamps** - `timestamps: true` مستخدم في جميع الـ Schemas
4. **Arabic Support** - إضافة حقول `nameAr` و `descriptionAr` للتعريب
5. **Metadata Fields** - حقل `metadata` مرن في College و Department للتوسع المستقبلي
6. **Student Schema** - الأكثر اكتمالاً وتطابقاً مع التصميم

### السلبيات ⚠️
1. **Company Schema** - الأبعد عن التصميم، خاصة في `recruitment` و `analytics`
2. **College Schema** - الأقل اكتمالاً (30% فقط)
3. **University Schema** - `colleges` مدمج كـ sub-document بدلاً من Reference
4. **References** - بعض الـ ObjectIds لا تحتوي على `ref` (مثل `collegeId` في University)

---

*تم إعداد هذا التقرير بتاريخ: 2025-01-XX*
*الملفات المراجعة: 6 ملفات Schema*
