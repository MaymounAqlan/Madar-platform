import { IsArray, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class CreateStudyPlanDto {
  @IsMongoId() departmentId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(200) nameAr?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsString() @IsNotEmpty() academicYear: string;
  @IsInt() @Min(1) @Max(400) totalCreditHours: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) levelsCount?: number;
  @IsOptional() @IsInt() @Min(1) @Max(4) semestersCount?: number;
  @IsOptional() @IsArray() levels?: any[];
}
export class UpdateStudyPlanDto { @IsOptional() @IsString() @MaxLength(200) name?: string; @IsOptional() @IsString() @MaxLength(200) nameAr?: string; @IsOptional() @IsString() @MaxLength(2000) description?: string; @IsOptional() @IsInt() @Min(1) @Max(400) totalCreditHours?: number; @IsOptional() @IsInt() @Min(1) @Max(20) levelsCount?: number; @IsOptional() @IsInt() @Min(1) @Max(4) semestersCount?: number; @IsOptional() @IsArray() levels?: any[]; }
export class ReviewStudyPlanDto { @IsIn(['approved', 'rejected', 'changes_requested', 'under_review']) status: string; @IsOptional() @IsString() @MaxLength(1000) reason?: string; }
