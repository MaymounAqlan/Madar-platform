import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { StudyPlanImport, StudyPlanImportDocument, ParsedImportResult } from './schemas/study-plan-import.schema';
import { StudyPlan, StudyPlanDocument } from './schemas/study-plan.schema';
import { postProcessAiResult, buildFallbackResult } from './pdf-import.helpers';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { University, UniversityDocument } from '../schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorDocument } from '../college-coordinators/schemas/college-coordinator.schema';
import { Department, DepartmentDocument } from '../departments/schemas/department.schema';
import { Skill, SkillDocument } from '../../skills/schemas/skill.schema';
import { AuditLog, AuditLogDocument } from '../../common/audit-logs/schemas/audit-log.schema';
import { ConfirmImportDto } from './dto/study-plan-import.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

@Injectable()
export class PdfImportService {
  private readonly logger = new Logger(PdfImportService.name);

  constructor(
    @InjectModel(StudyPlanImport.name) private readonly imports: Model<StudyPlanImportDocument>,
    @InjectModel(StudyPlan.name) private readonly plans: Model<StudyPlanDocument>,
    @InjectModel(Course.name) private readonly courses: Model<CourseDocument>,
    @InjectModel(University.name) private readonly universities: Model<UniversityDocument>,
    @InjectModel(CollegeCoordinator.name) private readonly staff: Model<CollegeCoordinatorDocument>,
    @InjectModel(Department.name) private readonly departments: Model<DepartmentDocument>,
    @InjectModel(Skill.name) private readonly skills: Model<SkillDocument>,
    @InjectModel(AuditLog.name) private readonly audits: Model<AuditLogDocument>,
  ) {}

  private async access(userId: string) {
    const owner: any = await this.universities.findOne({ userId: new Types.ObjectId(userId), status: 'active' }).lean();
    if (owner) return { university: owner, role: 'university', collegeId: null, permissions: ['*'] };
    const member: any = await this.staff.findOne({ userId: new Types.ObjectId(userId), status: 'active', invitationStatus: 'accepted' }).lean();
    if (!member) throw new ForbiddenException('Institutional access unavailable');
    const university: any = await this.universities.findOne({ _id: member.universityId, status: 'active' }).lean();
    if (!university) throw new ForbiddenException('University inactive');
    return { university, role: member.role, collegeId: member.role === 'coordinator' ? member.collegeId : null, permissions: member.permissions || [] };
  }

  private scope(access: any) {
    return { universityId: access.university._id, ...(access.collegeId ? { collegeId: access.collegeId } : {}) };
  }

  async uploadAndParse(userId: string, departmentId: string, file: Express.Multer.File) {
    const access = await this.access(userId);
    if (!access.permissions.includes('study-plans:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to study plans');
    }

    const department: any = await this.departments.findOne({
      _id: new Types.ObjectId(departmentId),
      ...this.scope(access),
      'metadata.status': { $ne: 'deleted' },
    }).lean();
    if (!department) throw new NotFoundException('Department not found in permitted scope');

    if (!file) throw new BadRequestException('PDF file is required');
    if (!file.mimetype || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are accepted');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const job = await this.imports.create({
      universityId: access.university._id,
      collegeId: department.collegeId,
      departmentId: department._id,
      createdBy: new Types.ObjectId(userId),
      status: 'extracting',
      originalFilename: file.originalname,
      fileSize: file.size,
    });

    let extractedText: string;
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      extractedText = result.text || '';
      await parser.destroy?.();
      if (!extractedText.trim()) {
        await this.imports.updateOne({ _id: job._id }, { $set: { status: 'failed', error: 'PDF contains no extractable text. It may be a scanned image.' } });
        throw new BadRequestException('PDF contains no extractable text. It may be a scanned image. Please use manual entry instead.');
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`PDF text extraction failed: ${error?.message || error}`);
      await this.imports.updateOne({ _id: job._id }, { $set: { status: 'failed', error: `PDF parsing failed: ${error?.message || 'Unknown error'}` } });
      throw new BadRequestException('Failed to parse PDF file. Please ensure it is a valid PDF document.');
    }

    await this.imports.updateOne({ _id: job._id }, { $set: { extractedText, status: 'analyzing' } });

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      this.logger.warn('GEMINI_API_KEY not configured - falling back to text-only extraction');
      const fallbackResult = buildFallbackResult(extractedText);
      await this.imports.updateOne({ _id: job._id }, { $set: {
        status: 'ready_for_review',
        parsedResult: fallbackResult,
        rawAiResponse: { mode: 'fallback', reason: 'No GEMINI_API_KEY configured' },
      }});
      await this.audit(userId, 'IMPORT_PDF_FALLBACK', job._id, { departmentId, filename: file.originalname });
      return this.jobDto(await this.imports.findById(job._id).lean());
    }

    try {
      const aiResult = await this.callGeminiApi(geminiKey, extractedText);
      const processed = postProcessAiResult(aiResult);
      const matchedResult = await this.matchSkillsWithCatalog(processed);

      await this.imports.updateOne({ _id: job._id }, { $set: {
        status: 'ready_for_review',
        rawAiResponse: aiResult,
        parsedResult: matchedResult,
      }});
      await this.audit(userId, 'IMPORT_PDF_ANALYZED', job._id, { departmentId, filename: file.originalname, confidenceScore: matchedResult.confidenceScore });
    } catch (error: any) {
      this.logger.error(`AI analysis failed: ${error?.message || error}`);
      const fallbackResult = buildFallbackResult(extractedText);
      fallbackResult.warnings = [`AI analysis failed: ${error?.message || 'Unknown error'}. Showing raw text extraction only.`, ...fallbackResult.warnings];
      await this.imports.updateOne({ _id: job._id }, { $set: {
        status: 'ready_for_review',
        parsedResult: fallbackResult,
        rawAiResponse: { mode: 'fallback', error: error?.message },
        error: `AI analysis failed: ${error?.message}`,
      }});
      await this.audit(userId, 'IMPORT_PDF_AI_FAILED', job._id, { departmentId, error: error?.message });
    }

    return this.jobDto(await this.imports.findById(job._id).lean());
  }

  async getImportJob(userId: string, jobId: string) {
    const access = await this.access(userId);
    const job = await this.imports.findOne({ _id: new Types.ObjectId(jobId), ...this.scope(access) }).lean();
    if (!job) throw new NotFoundException('Import job not found');
    return this.jobDto(job);
  }

  async confirmImport(userId: string, jobId: string, dto?: ConfirmImportDto) {
    const access = await this.access(userId);
    if (!access.permissions.includes('study-plans:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to study plans');
    }

    const job: any = await this.imports.findOne({
      _id: new Types.ObjectId(jobId),
      ...this.scope(access),
      status: 'ready_for_review',
    }).lean();
    if (!job) throw new NotFoundException('Import job not found or not ready for confirmation');

    const parsed: ParsedImportResult = job.parsedResult;
    if (!parsed) throw new BadRequestException('No parsed data available');

    const planData = { ...(parsed.plan || {}), ...(dto?.plan || {}) };
    const coursesData = dto?.courses?.length ? dto.courses : parsed.courses || [];
    const electiveGroups = dto?.electiveGroups?.length ? dto.electiveGroups : parsed.electiveGroups || [];

    const latest: any = await this.plans.findOne({
      universityId: job.universityId,
      departmentId: job.departmentId,
      academicYear: planData.academicYear || '2026-2027',
    }).sort({ version: -1 }).lean();

    const planName = planData.programNameEn || planData.nameEn || planData.programNameAr || planData.nameAr || 'Imported Plan';

    const plan = await this.plans.create({
      universityId: job.universityId,
      collegeId: job.collegeId,
      departmentId: job.departmentId,
      name: planName,
      nameAr: planData.nameAr || planData.programNameAr || '',
      description: `Imported from PDF: ${job.originalFilename}`,
      academicYear: planData.academicYear || '2026-2027',
      totalCredits: planData.totalCredits || 0,
      durationYears: planData.yearsCount || planData.levels || null,
      version: (latest?.version || 0) + 1,
      previousVersionId: latest?._id,
      status: 'draft',
      courses: [],
      createdBy: new Types.ObjectId(userId),
      metadata: {
        importedFrom: 'pdf',
        importJobId: String(job._id),
        originalFilename: job.originalFilename,
        programNameEn: planData.programNameEn || null,
        programNameAr: planData.programNameAr || null,
        universityName: planData.universityName || null,
        collegeName: planData.collegeName || null,
        departmentName: planData.departmentName || null,
        degreeType: planData.degreeType || null,
        yearsCount: planData.yearsCount || null,
        semestersCount: planData.semestersCount || null,
        electiveGroups,
      },
    });

    const createdCourseIds: Types.ObjectId[] = [];
    const codeToIdMap = new Map<string, Types.ObjectId>();

    for (const courseData of coursesData) {
      if (!courseData.code) continue;
      const courseId = new Types.ObjectId();
      const normalizedCode = courseData.code.trim().toUpperCase();
      codeToIdMap.set(normalizedCode, courseId);

      const course = await this.courses.create({
        _id: courseId,
        universityId: job.universityId,
        collegeId: job.collegeId,
        departmentId: job.departmentId,
        studyPlanId: plan._id,
        code: normalizedCode,
        name: courseData.nameEn || courseData.nameAr || normalizedCode,
        nameAr: courseData.nameAr || '',
        nameEn: courseData.nameEn || '',
        description: '',
        credits: courseData.creditHours ?? 0,
        lectureHours: courseData.lectureHours ?? null,
        tutorialHours: courseData.tutorialHours ?? null,
        practicalHours: courseData.practicalHours ?? null,
        laboratoryHours: courseData.laboratoryHours ?? null,
        level: courseData.level ?? 1,
        semester: courseData.semester ?? 1,
        type: courseData.courseType || 'required',
        prerequisites: [],
        corequisites: [],
        learningOutcomes: courseData.learningOutcomes || [],
        eligibilityRules: courseData.eligibilityRules || [],
        electiveGroup: courseData.electiveGroup || undefined,
        skillMappings: await this.buildSkillMappings(courseData.extractedSkills || []),
        status: 'active',
        metadata: { importedFrom: 'pdf' },
      });
      createdCourseIds.push(course._id);
    }

    for (const courseData of coursesData) {
      if (!courseData.code) continue;
      const normalizedCode = courseData.code.trim().toUpperCase();
      const courseId = codeToIdMap.get(normalizedCode);
      if (!courseId) continue;
      const prereqIds = (courseData.prerequisites || [])
        .map((code) => codeToIdMap.get(code.trim().toUpperCase()))
        .filter(Boolean) as Types.ObjectId[];
      const coreqIds = (courseData.corequisites || [])
        .map((code) => codeToIdMap.get(code.trim().toUpperCase()))
        .filter(Boolean) as Types.ObjectId[];
      const update: any = {};
      if (prereqIds.length) update.prerequisites = prereqIds;
      if (coreqIds.length) update.corequisites = coreqIds;
      if (Object.keys(update).length) {
        await this.courses.updateOne({ _id: courseId }, { $set: update });
      }
    }

    await this.plans.updateOne({ _id: plan._id }, { $set: { courses: createdCourseIds } });
    await this.imports.updateOne({ _id: job._id }, { $set: { status: 'confirmed', confirmedPlanId: plan._id } });

    await this.audit(userId, 'CONFIRM_PDF_IMPORT', job._id, { planId: String(plan._id), coursesCount: createdCourseIds.length });

    return { planId: String(plan._id), coursesCreated: createdCourseIds.length, status: 'confirmed' };
  }

  async cancelImport(userId: string, jobId: string) {
    const access = await this.access(userId);
    const job = await this.imports.findOneAndUpdate(
      { _id: new Types.ObjectId(jobId), ...this.scope(access), status: { $in: ['ready_for_review', 'extracting', 'analyzing', 'uploading'] } },
      { $set: { status: 'cancelled' } },
      { new: true },
    ).lean();
    if (!job) throw new NotFoundException('Import job not found or already processed');
    await this.audit(userId, 'CANCEL_PDF_IMPORT', job._id, {});
    return { status: 'cancelled' };
  }

  // ==================== Private helpers ====================

  private async callGeminiApi(apiKey: string, text: string): Promise<any> {
    const systemInstruction = `You are an expert academic-curriculum analyst. Extract structured data from university study-plan PDF text. The PDF may be Arabic, English, bilingual, with any table layout, column order, merged cells, multiple pages, summer semesters, electives, training, or projects. Detect column meaning from headers. Do not invent missing data. Normalize Arabic labels. Convert dashes/empty cells to null.`;

    const prompt = `Analyze the following text extracted from a university study-plan PDF and return a single valid JSON object with this exact structure:

{
  "plan": {
    "universityName": string|null,
    "collegeName": string|null,
    "departmentName": string|null,
    "programNameAr": string|null,
    "programNameEn": string|null,
    "degreeType": string|null,
    "academicYear": string|null,
    "version": number|null,
    "totalCredits": number|null,
    "yearsCount": number|null,
    "semestersCount": number|null
  },
  "sections": [
    {
      "year": number|null,
      "level": number|null,
      "semester": number|null,
      "sectionType": "year"|"level"|"semester"|"summer"|"elective"|"training"|null,
      "courses": [ <course objects> ]
    }
  ],
  "courses": [ <course objects> ],
  "electiveGroups": [
    {
      "id": string|null,
      "nameAr": string|null,
      "nameEn": string|null,
      "minCredits": number|null,
      "maxCredits": number|null,
      "courseCodes": string[]
    }
  ],
  "warnings": string[],
  "unmatchedFields": string[],
  "confidenceScore": number|null
}

Course object:
{
  "code": string,
  "nameAr": string|null,
  "nameEn": string|null,
  "lectureHours": number|null,
  "tutorialHours": number|null,
  "practicalHours": number|null,
  "laboratoryHours": number|null,
  "creditHours": number|null,
  "year": number|null,
  "level": number|null,
  "semester": number|null,
  "courseType": "required"|"elective"|"practical"|"laboratory"|"project"|"internship"|null,
  "prerequisites": string[],
  "corequisites": string[],
  "eligibilityRules": string[],
  "extractedSkills": [{ "name": string, "confidence": 0.0-1.0, "coverageType": "theoretical"|"practical"|"mixed" }],
  "confidence": number|null,
  "electiveGroup": string|null
}

EXTRACTION RULES:
1. Only extract data explicitly present in the text. Use null for missing/unclear fields.
2. Detect column meaning from headers, not fixed positions. Common headers:
   - L/LEC/محاضرة = lectureHours
   - T/TUT/تمارين = tutorialHours
   - P/PRA/عملي = practicalHours
   - LAB/مختبر/معمل = laboratoryHours
   - C/CR/CH/SCH/ساعات معتمدة = creditHours
3. Convert "—", "-", "N/A", empty cells, and Arabic dashes to null.
4. Support multiple prerequisite codes in one cell separated by commas, slashes, "and", "و", "+", or newlines.
5. Placeholder codes such as "XX", "elective", "اختياري", "مقرر اختياري" are NOT real course codes. Preserve them only if no real code exists and add a warning.
6. Textual eligibility rules (e.g. "after completing 70% of total credit hours") go into eligibilityRules.
7. Summer training / internship courses should have courseType "internship". Graduation project courses should have courseType "project".
8. Do not invent plan-level data (university/college/department names) unless explicitly stated.
9. Set confidence 0.0-1.0 per course. Set overall confidenceScore as average course confidence or lower when uncertain.
10. Include warnings for unclear/missing data, duplicate codes, missing prerequisites, circular prerequisites, and unmatched fields.

TEXT FROM PDF:
${text.substring(0, 30000)}`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      },
      { timeout: 90000 },
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Empty response from Gemini API');

    try {
      return JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) return JSON.parse(jsonMatch[1]);
      throw new Error('Failed to parse Gemini API response as JSON');
    }
  }

  private async matchSkillsWithCatalog(result: ParsedImportResult): Promise<ParsedImportResult> {
    const allSkills: any[] = await this.skills.find({}).select('name nameAr category').lean();
    const skillNames = allSkills.map((s) => ({ id: String(s._id), name: (s.name || '').toLowerCase(), nameAr: s.nameAr || '' }));
    const unmatchedSkills: string[] = [];

    const courses = result.courses.map((course) => {
      const mappedSkills = (course.extractedSkills || []).map((extracted: any) => {
        const query = (extracted.name || '').toLowerCase();
        const match = skillNames.find((s) =>
          s.name === query ||
          s.nameAr === extracted.name ||
          s.name.includes(query) ||
          query.includes(s.name),
        );
        if (!match) unmatchedSkills.push(extracted.name);
        return { ...extracted, matchedSkillId: match?.id || null, isSuggestion: true };
      });
      return { ...course, extractedSkills: mappedSkills };
    });

    const warnings = [...result.warnings];
    const uniqueUnmatched = [...new Set(unmatchedSkills)];
    if (uniqueUnmatched.length) {
      warnings.push(`Unmatched skills requiring review: ${uniqueUnmatched.join(', ')}`);
    }

    return { ...result, courses, warnings };
  }

  private async buildSkillMappings(extractedSkills: any[]): Promise<any[]> {
    const mappings: any[] = [];
    for (const skill of extractedSkills || []) {
      if (!skill.matchedSkillId || skill.confidence < 0.5) continue;
      const exists = await this.skills.exists({ _id: new Types.ObjectId(skill.matchedSkillId) });
      if (!exists) continue;
      mappings.push({
        skillId: new Types.ObjectId(skill.matchedSkillId),
        coverageLevel: Math.max(1, Math.min(5, Math.round(skill.confidence * 5))),
        coverageType: skill.coverageType || 'mixed',
        assessmentMethod: 'imported',
        notes: `Auto-imported from PDF (confidence: ${skill.confidence})`,
      });
    }
    return mappings;
  }

  private jobDto(job: any) {
    return {
      id: String(job._id),
      status: job.status,
      originalFilename: job.originalFilename,
      fileSize: job.fileSize,
      parsedResult: job.parsedResult || null,
      confirmedPlanId: job.confirmedPlanId ? String(job.confirmedPlanId) : null,
      error: job.error || null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private audit(actorId: string, action: string, resourceId: any, details: any) {
    return this.audits.create({
      actorId: new Types.ObjectId(actorId),
      action,
      resource: 'study_plan_import',
      resourceId: String(resourceId),
      details,
      severity: 'info',
      timestamp: new Date(),
    });
  }
}
