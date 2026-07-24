import { IsArray, IsIn, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmImportCourseSkillDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) @Max(1) confidence: number;
  @IsOptional() @IsIn(['theoretical', 'practical', 'mixed']) coverageType?: string;
  @IsOptional() @IsString() matchedSkillId?: string;
  @IsOptional() isSuggestion?: boolean;
}

export class ConfirmImportPlanDto {
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(200) universityName?: string;
  @IsOptional() @IsString() @MaxLength(200) collegeName?: string;
  @IsOptional() @IsString() @MaxLength(200) departmentName?: string;
  @IsOptional() @IsString() @MaxLength(200) programNameAr?: string;
  @IsOptional() @IsString() @MaxLength(200) programNameEn?: string;
  @IsOptional() @IsString() @MaxLength(100) degreeType?: string;
  @IsOptional() @IsString() @MaxLength(50) academicYear?: string;
  @IsOptional() @IsInt() @Min(1) version?: number;
  @IsOptional() @IsInt() @Min(1) totalCredits?: number;
  @IsOptional() @IsInt() @Min(1) yearsCount?: number;
  @IsOptional() @IsInt() @Min(1) semestersCount?: number;
}

export class ConfirmImportCourseDto {
  @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(40) lectureHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) tutorialHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) practicalHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) laboratoryHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(30) creditHours?: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) year?: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) level?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) semester?: number;
  @IsOptional() @IsIn(['required', 'elective', 'practical', 'laboratory', 'project', 'internship']) courseType?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) prerequisites?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) corequisites?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) eligibilityRules?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) learningOutcomes?: string[];
  @IsOptional() @IsString() @MaxLength(100) electiveGroup?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmImportCourseSkillDto) extractedSkills?: ConfirmImportCourseSkillDto[];
  @IsOptional() @IsNumber() @Min(0) @Max(1) confidence?: number;
}

export class ConfirmImportElectiveGroupDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsNumber() @Min(0) minCredits?: number;
  @IsOptional() @IsNumber() @Min(0) maxCredits?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) courseCodes?: string[];
}

export class ConfirmImportSectionDto {
  @IsOptional() @IsInt() @Min(1) year?: number;
  @IsOptional() @IsInt() @Min(1) level?: number;
  @IsOptional() @IsInt() @Min(0) semester?: number;
  @IsOptional() @IsString() @MaxLength(50) sectionType?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmImportCourseDto) courses?: ConfirmImportCourseDto[];
}

export class ConfirmImportDto {
  @IsOptional() @ValidateNested() @Type(() => ConfirmImportPlanDto) plan?: ConfirmImportPlanDto;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmImportSectionDto) sections?: ConfirmImportSectionDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmImportCourseDto) courses?: ConfirmImportCourseDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmImportElectiveGroupDto) electiveGroups?: ConfirmImportElectiveGroupDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) warnings?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) unmatchedSkills?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) unmatchedFields?: string[];
  @IsOptional() @IsNumber() @Min(0) @Max(1) confidenceScore?: number;
}

export class UploadPdfQueryDto {
  @IsMongoId() departmentId: string;
}
