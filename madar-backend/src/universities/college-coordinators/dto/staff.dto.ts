import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export enum UniversityStaffRole {
  COORDINATOR = 'coordinator',
  UNIVERSITY_VIEWER = 'university_viewer',
  DATA_OFFICER = 'data_officer',
  QUALITY_OFFICER = 'quality_officer',
  ACADEMIC_DEVELOPMENT_OFFICER = 'academic_development_officer',
}

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export const UNIVERSITY_STAFF_PERMISSIONS = [
  'dashboard:read', 'structure:read', 'students:read', 'analytics:read',
  'departments:read', 'departments:write',
  'study-plans:read', 'study-plans:write',
  'courses:read', 'courses:write',
  'course-skills:manage', 'curriculum-analysis:run', 'college-reports:read',
  'college:write', 'affiliations:write', 'reports:read', 'audit:read'
] as const;

export class InviteUniversityStaffDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(160) name: string;
  @Transform(trim) @IsEmail() email: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsEnum(UniversityStaffRole) role: UniversityStaffRole;
  @ValidateIf((dto) => dto.role === UniversityStaffRole.COORDINATOR)
  @IsMongoId()
  collegeId?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(1000) message?: string;
  @IsOptional() @IsArray() @IsIn(UNIVERSITY_STAFF_PERMISSIONS, { each: true }) permissions?: string[];
}

export class UpdateUniversityStaffDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEnum(UniversityStaffRole) role?: UniversityStaffRole;
  @IsOptional() @IsMongoId() collegeId?: string;
  @IsOptional() @IsArray() @IsIn(UNIVERSITY_STAFF_PERMISSIONS, { each: true }) permissions?: string[];
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
}

export class UpdateUniversityStaffStatusDto {
  @IsIn(['active', 'inactive']) status: 'active' | 'inactive';
}

export class UpdateMyStaffProfileDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) firstName?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) lastName?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) firstNameAr?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) lastNameAr?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(200) jobTitle?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(2000) biography?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(500) avatar?: string;
  @IsOptional() @IsString() @IsIn(['ar', 'en']) language?: string;
}
