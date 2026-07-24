import { IsArray, IsIn, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCourseDto {
  @IsMongoId() studyPlanId: string;
  @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(2000) descriptionAr?: string;
  @IsOptional() @IsString() @MaxLength(2000) descriptionEn?: string;
  @IsInt() @Min(1) @Max(12) creditHours: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) lectureHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) tutorialHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) practicalHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) laboratoryHours?: number;
  @IsInt() @Min(1) @Max(20) level: number;
  @IsInt() @Min(1) @Max(6) semester: number;
  @IsIn(['required', 'elective', 'practical', 'laboratory', 'project', 'internship']) type: string;
  @IsOptional() @IsArray() @IsMongoId({ each: true }) prerequisites?: string[];
  @IsOptional() @IsArray() @IsMongoId({ each: true }) corequisites?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) learningOutcomes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) learningOutcomesAr?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) learningOutcomesEn?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) eligibilityRules?: string[];
  @IsOptional() @IsString() @MaxLength(100) electiveGroup?: string;
}

export class UpdateCourseDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(30) code?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(2000) descriptionAr?: string;
  @IsOptional() @IsString() @MaxLength(2000) descriptionEn?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) creditHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) lectureHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) tutorialHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) practicalHours?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(40) laboratoryHours?: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) level?: number;
  @IsOptional() @IsInt() @Min(1) @Max(6) semester?: number;
  @IsOptional() @IsIn(['required', 'elective', 'practical', 'laboratory', 'project', 'internship']) type?: string;
  @IsOptional() @IsArray() @IsMongoId({ each: true }) prerequisites?: string[];
  @IsOptional() @IsArray() @IsMongoId({ each: true }) corequisites?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) learningOutcomes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) learningOutcomesAr?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) learningOutcomesEn?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) eligibilityRules?: string[];
  @IsOptional() @IsString() @MaxLength(100) electiveGroup?: string;
}

export class MapCourseSkillDto {
  @IsMongoId() skillId: string;
  @IsInt() @Min(1) @Max(5) coverageLevel: number;
  @IsIn(['theoretical', 'practical', 'mixed']) coverageType: string;
  @IsString() @IsNotEmpty() @MaxLength(200) assessmentMethod: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
