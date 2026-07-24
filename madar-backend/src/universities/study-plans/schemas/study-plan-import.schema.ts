import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudyPlanImportDocument = StudyPlanImport & Document;

export interface ExtractedSkill {
  name: string;
  confidence: number;
  coverageType?: 'theoretical' | 'practical' | 'mixed' | string;
  matchedSkillId?: string | null;
  isSuggestion?: boolean;
}

export interface ExtractedCourse {
  code: string;
  nameAr?: string | null;
  nameEn?: string | null;
  lectureHours?: number | null;
  tutorialHours?: number | null;
  practicalHours?: number | null;
  laboratoryHours?: number | null;
  creditHours?: number | null;
  year?: number | null;
  level?: number | null;
  semester?: number | null;
  courseType?: 'required' | 'elective' | 'practical' | 'laboratory' | 'project' | 'internship' | string;
  prerequisites?: string[];
  corequisites?: string[];
  eligibilityRules?: string[];
  learningOutcomes?: string[];
  extractedSkills?: ExtractedSkill[];
  confidence?: number | null;
  electiveGroup?: string | null;
}

export interface ExtractedSection {
  year?: number | null;
  level?: number | null;
  semester?: number | null;
  sectionType?: 'year' | 'level' | 'semester' | 'summer' | 'elective' | 'training' | string;
  courses?: ExtractedCourse[];
}

export interface ElectiveGroup {
  id?: string;
  nameAr?: string | null;
  nameEn?: string | null;
  minCredits?: number | null;
  maxCredits?: number | null;
  courseCodes?: string[];
}

export interface ParsedImportPlan {
  universityName?: string | null;
  collegeName?: string | null;
  departmentName?: string | null;
  programNameAr?: string | null;
  programNameEn?: string | null;
  degreeType?: string | null;
  academicYear?: string | null;
  version?: number | null;
  totalCredits?: number | null;
  yearsCount?: number | null;
  semestersCount?: number | null;
  levels?: number | null;
}

export interface ParsedImportResult {
  plan: ParsedImportPlan;
  sections?: ExtractedSection[];
  courses: ExtractedCourse[];
  electiveGroups?: ElectiveGroup[];
  warnings: string[];
  unmatchedSkills?: string[];
  unmatchedFields?: string[];
  confidenceScore: number | null;
}

@Schema({ timestamps: true })
export class StudyPlanImport {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', required: true })
  universityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College' })
  collegeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['uploading', 'extracting', 'analyzing', 'ready_for_review', 'confirmed', 'failed', 'cancelled'],
    default: 'uploading',
  })
  status: string;

  @Prop({ type: String })
  originalFilename: string;

  @Prop({ type: Number })
  fileSize: number;

  @Prop({ type: String })
  extractedText: string;

  @Prop({ type: Object })
  rawAiResponse: Record<string, any>;

  @Prop({ type: Object })
  parsedResult: ParsedImportResult;

  @Prop({ type: Types.ObjectId, ref: 'StudyPlan' })
  confirmedPlanId?: Types.ObjectId;

  @Prop({ type: String })
  error?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const StudyPlanImportSchema = SchemaFactory.createForClass(StudyPlanImport);
StudyPlanImportSchema.index({ universityId: 1, createdBy: 1, status: 1, createdAt: -1 });
