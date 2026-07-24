import {
  IsArray,
  IsEmail,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SkillDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  level?: number;
}

class ProjectDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsString()
  link?: string;
}

class CertificationDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  issuer?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  credentialId?: string;
}

class CourseDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  completionDate?: string;
}

class SocialLinksDto {
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'LinkedIn must be a valid URL' }) linkedin?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'GitHub must be a valid URL' }) github?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'Portfolio must be a valid URL' }) portfolio?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'Website must be a valid URL' }) website?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'Facebook must be a valid URL' }) facebook?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'X/Twitter must be a valid URL' }) twitter?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'Instagram must be a valid URL' }) instagram?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'YouTube must be a valid URL' }) youtube?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'Behance must be a valid URL' }) behance?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'Dribbble must be a valid URL' }) dribbble?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'Stack Overflow must be a valid URL' }) stackOverflow?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'ResearchGate must be a valid URL' }) researchGate?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(/^(|https?:\/\/[^\s]+)$/i, { message: 'ORCID must be a valid URL' }) orcid?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  universityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  majorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^(|\+?[0-9]{7,15})$/, { message: 'Invalid WhatsApp number format' })
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Formatted postal or map address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ type: SocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['freshman', 'sophomore', 'junior', 'senior', 'graduate'])
  academicLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  gpa?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  graduationYear?: number;

  @ApiPropertyOptional({ type: [SkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ type: [ProjectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];

  @ApiPropertyOptional({ type: [CertificationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiPropertyOptional({ type: [CourseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseDto)
  courses?: CourseDto[];
}
