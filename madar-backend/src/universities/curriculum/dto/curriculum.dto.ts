import { IsArray, IsIn, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateAcademicRecommendationDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsString() @IsNotEmpty() @MaxLength(3000) description: string;
  @IsIn(['add_course', 'update_course', 'add_lab', 'add_project', 'increase_practical_coverage', 'add_certificate', 'add_technology']) type: string;
  @IsMongoId() departmentId: string;
  @IsOptional() @IsMongoId() studyPlanId?: string;
  @IsOptional() @IsArray() @IsMongoId({ each: true }) affectedCourses?: string[];
  @IsOptional() @IsArray() @IsMongoId({ each: true }) affectedSkills?: string[];
  @IsArray() @IsString({ each: true }) evidence: string[];
  @IsNumber() @Min(0) @Max(100) marketDemand: number;
  @IsString() @IsNotEmpty() @MaxLength(1000) studentImpact: string;
  @IsIn(['low', 'medium', 'high', 'critical']) priority: string;
}

export class UpdateAcademicRecommendationDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(3000) description?: string;
  @IsOptional() @IsIn(['add_course', 'update_course', 'add_lab', 'add_project', 'increase_practical_coverage', 'add_certificate', 'add_technology']) type?: string;
  @IsOptional() @IsMongoId() studyPlanId?: string;
  @IsOptional() @IsArray() @IsMongoId({ each: true }) affectedCourses?: string[];
  @IsOptional() @IsArray() @IsMongoId({ each: true }) affectedSkills?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) evidence?: string[];
  @IsOptional() @IsNumber() @Min(0) @Max(100) marketDemand?: number;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(1000) studentImpact?: string;
  @IsOptional() @IsIn(['low', 'medium', 'high', 'critical']) priority?: string;
}

export class ReviewAcademicRecommendationDto {
  @IsIn(['under_review', 'approved', 'rejected', 'changes_requested']) status: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
